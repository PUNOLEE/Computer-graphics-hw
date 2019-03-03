// 
//  'Starter code' library to simplify WebGL drawing of transformed vertices,
//  For EECS 351-1, Northwestern University.  
//
//  lib1.js -- 2018.06 CREATED by Vincent Bommier & Jack Tumblin for 
//        EECS 399 Special Projects projects course to help with EECS 351-1.
//        Enables as-simple-as-possible WebGL drawings w/o 'housekeeping'.
//  lib1a.js -- 2019.02.23: added extensive comments, cleanly separated 'user'
//        functions from the 'private' functions.  'Private' functions help 
//        simplify the library's implementation and are not intended for users.
//        Renamed some vars for clarity, and renamed all 'Private' functions by
//        adding a leading underline, such _BufferSetup().
//  lib2a.js -- 2019.02.24: added user fcns appendNormals(),updateNormalMatrix()
//        as part of in-class exercise to aid with Proj C 'lights & materials'
 
// Vertex Shader source code (GLSL)
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +          // x,y,z,w for this vertex
  'attribute vec4 a_Color;\n' +             // r,g,b,a for this vertex
  'attribute vec4 a_Normal;\n' +  //surface normal vector
  'attribute float a_PointSize;\n' +        // size in pixels for this vertex
  'uniform vec4 u_Color;' +
  'uniform mat4 u_ModelMatrix;\n' +  
  'uniform mat4 u_NormalMatrix;\n' +  //transformation matrix of the normal vector       
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' + // OUTPUT: vertex screen position
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color + u_Color;\n' +
  '  gl_PointSize = a_PointSize;\n' +       // OUTPUT:  POINTS drawing prim size 
                                            // (in pixels) for this vertex
  '}\n';

// Fragment Shader source code (GLSL)
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +                   // (for compatibility with early WebGL hdwe)
  'precision mediump float;\n' +
  '#endif\n' +

  'uniform vec3 u_LightPosition;\n' +       //position of the light source

  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
 '  vec3 normal = normalize(v_Normal);\n' +
 '  vec3 lightDirection = normalize(u_LightPosition-v_Position);\n' +
 '  float light = max(dot(lightDirection, normal), 0.0);\n' +  //clamped value
 '  gl_FragColor = v_Color;\n' +
 '  gl_FragColor.rgb *= light;\n' +
  '}\n';
  
//=============================================================================
//global variables
var gl;                       // webGL rendering context
var numVertices = 1024;
var positionDimensions = 4;   // x,y,z,w
var colorDimensions = 4;      // r,g,b,a
var pointSizeDimensions = 1;  // 
var normalDimensions = 3;   // x,y,z direction vector

// Make local arrays in JS: we will transfer their contents to the GPU.
var positions = new Float32Array(numVertices*positionDimensions);
var colors = new Float32Array(numVertices*colorDimensions);
var pointSizes = new Float32Array(numVertices*pointSizeDimensions);
var normals = new Float32Array(numVertices*normalDimensions);
for(var i = 0; i < numVertices*pointSizeDimensions; i++) {
  pointSizes[i] = 10.0; //set  non-zero default point-size
  }
var FSIZE = positions.BYTES_PER_ELEMENT;    // size of 'float' in bytes
var ipos = 0;           // total # 'position' attributes we will send to GPU
var icolors = 0;        // total # of 'color' attributes we will send to GPU
var inormals = 0;
var ipointSizes = 0;    // total # of 'pointSize' attributes we will send to GPU
var u_ModelMatrixLoc;   // GPU location# for our 'modelMatrix' uniform var.
var modelMatrix = new Matrix4();  // Javascript 4x4 matrix; send contents to GPU.
var u_NormalMatrixLoc;
var u_ColorLoc;
//===============
//
//  USER FUNCTIONS -- call these!
//
//================

function init(){
//=============================================================================
// For users: Call this fcn at start of main().
 
//Retrieve <canvas> element from our webpage
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL inside this canvas element
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log("lib2a.js: init() failed to get WebGL rendering context 'gl'\n");
    console.log("from the HTML-5 Canvas object named 'canvas'!\n\n");
    return;
  }

  // transfer both shaders source code to the GPU, compile, link, and attach 
  // their executables as a GPU 'program' & confirm the GPU is ready for use.
  // (see cuon-utils.js for details).
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('lib2a.js: init() failed to intialize shaders.');
    return;
  }

  _BufferSetup(gl);  //  Reserve storage space (VBO) on GPU to hold vertices.

  // Set the background-clearing color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // black!
  gl.enable(gl.DEPTH_TEST);   // ensure that 'near' objects occlude 'far' ones.
  gl.enable(gl.CULL_FACE);   // Tell WebGL: DON'T draw back-side of triangles.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
  // Clear the on-screen color buffer and the depth buffer.

  // Get the GPU location for all 'uniform' variables we will update on GPU:
  u_ModelMatrixLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_NormalMatrixLoc = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightPositionLoc = gl.getUniformLocation(gl.program, 'u_LightPosition');
  u_ColorLoc = gl.getUniformLocation(gl.program, 'u_Color');
    
  if (!u_ModelMatrixLoc || !u_NormalMatrixLoc || !u_LightPositionLoc || !u_ColorLoc) {
    console.log('lib2a.js: init failed to get the storage location');
    return;
  }

  gl.uniform4f(u_ColorLoc, 1, 0.5, 0.5, 1);    //light 
  //set the light position --> "overhead" --> y=10.0
  gl.uniform3f(u_LightPositionLoc, 10.0, 10.0, -10.0); //modified for better visual effect

  return gl;
}

function appendPositions(arr){
//=============================================================================
// for users:  sends a Float32array of vertex POSITIONS to the GPU;
// e.g. use these commands in main() to draw a colorful triangle on-screen with
//      large square 'points' at each vertex. 
//      init();
//      appendPositions( [-0.5, -0.5, 0.0, 1.0,     // vertex 0: x,y,z,w 
//                         0.5, -0.5, 0.0, 1.0,     // vertex 1
//                         0.0,  0.5, 0.0, 1.0,]);  // vertex 2
//      appendColors(    [1.0, 0.5, 0.0, 1.0,       // vertex 0: R,G,B,A 
//                        0.2, 1.0, 0.2, 1.0,       // vertex 1
//                        0.2, 0.2, 1.0, 1.0, ]);   // vertex 2
//      appendPointSizes([ 5.0, 10.0, 15.0]);       //
//      gl.drawArrays(gl.TRIANGLES,0,3);            // draw triangle:
//                                       //(start at vertex 0, draw 3 vertices)
//      gl.drawArrays(gl.POINTS, 0, 3);             // draw points.
//
  positions = _Float32Edit(positions,arr,ipos);
  ipos += arr.length;
  if(ipos > numVertices*positionDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' positions to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib2a.js');
  }
  _BufferSetup(gl);
}

function appendColors(arr){
//=============================================================================
// for users:  sends a Float32array of vertex COLORS to the GPU;
  colors = _Float32Edit(colors,arr,icolors);
  icolors += arr.length;
  if(icolors > numVertices*colorDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' colors to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib2a.js');
  }
  _BufferSetup(gl);
}

function appendNormals(arr){
  normals = _Float32Edit(normals,arr,inormals);
  inormals += arr.length;
  if(icolors > numVertices*normalDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' normals to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
  _BufferSetup(gl);
}

function appendPointSizes(arr){
//=============================================================================
// for users:  sends a Float32array of vertex POINT_SIZEs to the GPU;
  pointSizes = _Float32Edit(pointSizes,arr,ipointSizes);
  ipointSizes += arr.length;
  if(ipointSizes > numVertices*pointSizeDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' point-sizes to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib2a.js');
  }
  _BufferSetup(gl);  
}
function updateModelMatrix(matrix){
//=============================================================================
// transfer Matrix4 'matrix' contents to GPU's u_ModelMatrix uniform.
  gl.uniformMatrix4fv(u_ModelMatrixLoc, false, matrix.elements);
}

function updateNormalMatrix(matrix){
  gl.uniformMatrix4fv(u_NormalMatrixLoc, false, matrix.elements);
}

function WipeVertices(){
//=============================================================================
// DISCARD all previously appended vertex attributes; clear all VBO contents.
  positions = new Float32Array(numVertices*positionDimensions);
  colors = new Float32Array(numVertices*colorDimensions);
  normals = new Float32Array(numVertices*normalDimensions);
  pointSizes = new Float32Array(numVertices*pointSizeDimensions);
  ipos = icolors = inormals = ipointSizes = 0;
  _BufferSetup(gl);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

//=======================
//
//  PRIVATE FUNCTIONS   (called only by other functions within this library)
//                      (all 'private' fcn names begin with underline)               
//
//========================
function _Float32Concat(first, second){ //------------------------------------- 
//concatenate two Float32Arrays
  var firstLength = first.length,
  result = new Float32Array(firstLength + second.length);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

function _Float32Edit(base, edit, startIdx) { //-------------------------------
//overwrite the base float32Array with a smaller 'edit' float32array, 
// offset by startIdx. 
  for(var i = 0; i < edit.length;i++){
    base[i+startIdx] = edit[i];
  }
  return base;
}

function _AssembleVBO(){ //------------------------------------------------------
//Concatenate all attributes into a single array that will fill VBO in the GPU.
  return _Float32Concat(positions,_Float32Concat(colors,_Float32Concat(normals,pointSizes)));
}

function _BufferSetup(gl) {//--------------------------------------------------
//  Create, bind, and fill a 'Vertex Buffer Object' (VBO) in the GPU memory  
// where we store all attributes of all vertices. 'Bind' this VBO object to
// hardware that reads vertex attributes, and assign correct memory locations
// to the corresponding 'attribute' vars in our GLSL shaders.

  var gpuBufferID = gl.createBuffer();   // create a storage object in GPU
  if (!gpuBufferID) {
    console.log('lib2.js: _BufferSetup() failed to create a buffer object on GPU');
    return -1;
  }
  // 'bind' that storage object to the 'target' (hardware) that reads vertex
  // attribute data (ARRAY_BUFFER) and NOT vertex indices (ELEMENT_ARRAY_BUFFER)
  gl.bindBuffer(gl.ARRAY_BUFFER, gpuBufferID);
  // Write date into the buffer object
  var VBOcontents = _AssembleVBO();     // combine all attribs into 1 array,
  gl.bufferData(gl.ARRAY_BUFFER, VBOcontents, gl.STATIC_DRAW);  // xfer to GPU
  // in the currently-bound storage object (set by gl.bindBuffer() call).
  
  // Find the GPU memory locations for our shader's attribute variables:
  var a_PositionLoc = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionLoc < 0) {
    console.log("Failed to find GPU location of our shader's a_Position var");
    return -1;
  }
  var a_ColorLoc = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_ColorLoc < 0) {
    console.log("Failed to find GPU location of our shader's a_Color var");
    return -1;
  }
  var a_NormalLoc = gl.getAttribLocation(gl.program, 'a_Normal');
  if(a_NormalLoc < 0)
  {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }
  var a_PointSizeLoc = gl.getAttribLocation(gl.program, 'a_PointSize');
  if(a_PointSizeLoc < 0) {
    console.log("Failed to find GPU location of our shader's a_PointSize var");
    return -1;
  }
  //The VBOcontents array holds attribute values arranged like this:
  //[x0,y0,z0,w0,...,x1023,y1023,z1023,w1023,    // position attribs for all verts
  // r0,g0,b0,a0,...,r1023,g1023,b1023,a1023,    // color attribs for all verts
  // sz0,sz1, ... ,sz1023, ]                // point-size attribs for all verts
  // and we will transfer its contents to GPU to to fill VBO at gpuBufferID

  // Specify where GPU can find each attribute for each vertex in the VBO:
  // 'a_position' attribute:---------------------------------------------------
  var offset = 0;           // # of bytes offset from start of VBOcontents to 
                            // the first value stored for a given attribute.
  var stride = FSIZE*positionDimensions;  // # bytes to skip to reach next vert.
  gl.vertexAttribPointer(         // Specify how attribute accesses VBO memory:
      a_PositionLoc, // location of this attribute in your GLSL shader program
      positionDimensions,         // # of values used by this attrib: 1,2,3,4?
      gl.FLOAT,                   // data type of each value in this attrib,
      false,                      // isNormalized; are these fixed-point values
                                  // GPU must normalize before use? true/false
      stride,     // #bytes we must skip in the VBO to move from the stored 
                  // attrib for this vertex to the same stored attrib for the 
                  // next vertex.  (If set to zero, the GPU gets attribute 
                  // values sequentially from VBO, starting at 'offset').
      offset);    // How many bytes from START of VBO to the first attribute
  								// value GPU will actually use.
  gl.enableVertexAttribArray(a_PositionLoc); // Enable access to the bound VBO.
  
  // 'a_color' attribute:------------------------------------------------------
  offset += FSIZE*numVertices*positionDimensions; // shift offset from start of 
        // 'position' values to the start of 'color' values stored in the VBO.
  stride = FSIZE*colorDimensions;     // # bytes to skip to reach next vertex.
  gl.vertexAttribPointer(             // Set how attribute accesses VBO memory:
      a_ColorLoc, colorDimensions, gl.FLOAT, false, stride, offset);
  gl.enableVertexAttribArray(a_ColorLoc);  // Enable access to the bound VBO.
    
  // 'a_normal' attribute:------------------------------------------------------
  offset += FSIZE*numVertices*colorDimensions;
  stride = FSIZE*normalDimensions; 
  gl.vertexAttribPointer(
      a_NormalLoc, normalDimensions, gl.FLOAT, false, stride, offset);
  gl.enableVertexAttribArray(a_NormalLoc);
  

  // 'a_pointSize' attribute:--------------------------------------------------
  offset += FSIZE*numVertices*normalDimensions;  // shift offset from start of
        // 'color' values to the start of 'pointSize' values stored in VBO.
  stride = FSIZE*pointSizeDimensions; // # bytes to skip to reach next vertex.
  gl.vertexAttribPointer(             // Set how attribute accesses VBO memory:
      a_PointSizeLoc, pointSizeDimensions, gl.FLOAT, false, stride, offset);
  gl.enableVertexAttribArray(a_PointSizeLoc);  // Enable access to the bound VBO.
}

