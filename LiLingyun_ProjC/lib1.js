var VSHADER_SOURCE =
	//-------------Set precision.
	// GLSL-ES 2.0 defaults (from spec; '4.5.3 Default Precision Qualifiers'):
	// DEFAULT for Vertex Shaders: 	precision highp float; precision highp int;
	//									precision lowp sampler2D; precision lowp samplerCube;
	// DEFAULT for Fragment Shaders:  UNDEFINED for float; precision mediump int;
	//									precision lowp sampler2D;	precision lowp samplerCube;
	//--------------- GLSL Struct Definitions:
  'precision highp float;\n' +
  'precision highp int;\n' +
  'struct LampT {\n' +    // Describes one point-like Phong light source
  '   vec3 pos;\n' +      // (x,y,z,w); w==1.0 for local light at x,y,z position
                          //       w==0.0 for distant light from x,y,z direction 
  '   vec3 ambi;\n' +     // Ia ==  ambient light source strength (r,g,b)
  '   vec3 diff;\n' +     // Id ==  diffuse light source strength (r,g,b)
  '   vec3 spec;\n' +     // Is == specular light source strength (r,g,b)
  '}; \n' +
	'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	'		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	'		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	'		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	'		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	'		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +
  //																
	//-------------ATTRIBUTES of each vertex, read from our Vertex Buffer Object
  'attribute vec4 a_Position; \n' +		// vertex position (model coord sys)
  'attribute vec4 a_Normal; \n' +			// vertex normal vector (model coord sys)
  'attribute vec4 a_Color;\n' +
	'attribute vec2 a_TexCoord;\n' +									
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
// 	'uniform vec3 u_Kd; \n' +						// Phong diffuse reflectance for the 
 																			// entire shape. Later: as vertex attrib.
                                       // first light source: (YOU write a second one...)
  'uniform LampT u_LampSet[1];\n' +   // Array of all light sources.
  'uniform LampT u_headLight[1];\n' + // Array of all light sources.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.

  'uniform vec3 u_eyePosWorld; \n' +  // Camera/eye location in world coords.
  'uniform int lightingMode;\n' +
  'uniform int shadingMode;\n' +

  'uniform mat4 u_MvpMatrix; \n' +
  'uniform mat4 u_ModelMatrix; \n' + 		// Model matrix
  'uniform mat4 u_NormalMatrix; \n' +  	// Inverse Transpose of ModelMatrix;
  																			// (won't distort normal vec directions
  																			// but it usually WILL change its length)
	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
																				// (I didn't make per-pixel Ke,Ka,Ks;
																				// we use 'uniform' values instead)
  'varying vec4 v_Position; \n' +				
  'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
  'varying vec4 v_Color;\n' +
	'varying vec2 v_TexCoord;\n' +
  //-----------------------------------------------------------------------------
  'void main() { \n' +
  'if(shadingMode == 0){\n' +
		// Compute CVV coordinate values from our given vertex. This 'built-in'
		// 'varying' value gets interpolated to set screen position for each pixel.
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
		// Calculate the vertex position & normal vec in the WORLD coordinate system
		// for use as a 'varying' variable: fragment shaders get per-pixel values
		// (interpolated between vertices for our drawing primitive (TRIANGLE)).
  '  v_Position = u_ModelMatrix * a_Position; \n' +
  '  v_Color = a_Color;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
		// 3D surface normal of our vertex, in world coords.  ('varying'--its value
		// gets interpolated (in world coords) for each pixel's fragment shader.
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
	'	 v_Kd = u_MatlSet[0].diff; \n' +		// find per-pixel diffuse reflectance from per-vertex
	'}\n' +												// (no per-pixel Ke,Ka, or Ks, but you can do it...)
//	'  v_Kd = vec3(1.0, 1.0, 0.0); \n'	+ // TEST; color fixed at green
  'if(shadingMode == 1){\n' +
  // Compute CVV coordinate values from our given vertex. This 'built-in'
    // 'varying' value gets interpolated to set screen position for each pixel.
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
    // Calculate the vertex position & normal vec in the WORLD coordinate system
    // for use as a 'varying' variable: fragment shaders get per-pixel values
    // (interpolated between vertices for our drawing primitive (TRIANGLE)).
  '  v_Position = u_ModelMatrix * a_Position; \n' +
  '  v_Color = a_Color;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
    // 3D surface normal of our vertex, in world coords.  ('varying'--its value
    // gets interpolated (in world coords) for each pixel's fragment shader.
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Kd = u_MatlSet[0].diff; \n' +    // find per-pixel diffuse reflectance from per-vertex
  '  vec3 normal = normalize(v_Normal); \n' +
//  '  vec3 normal = v_Normal; \n' +
      // Find the unit-length light dir vector 'L' (surface pt --> light):
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 lightDirection_2 = normalize(u_headLight[0].pos - v_Position.xyz);\n' +
      // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
      // The dot product of (unit-length) light direction and the normal vector
      // (use max() to discard any negatives from lights below the surface) 
      // (look in GLSL manual: what other functions would help?)
      // gives us the cosine-falloff factor needed for the diffuse lighting term:
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  '  float nDotL_2 = max(dot(lightDirection_2, normal), 0.0);\n' +
  '  float nDotH = 0.0; \n' +
  '  float nDotH_2 = 0.0; \n' +
      // The Blinn-Phong lighting model computes the specular term faster 
      // because it replaces the (V*R)^shiny weighting with (H*N)^shiny,
      // where 'halfway' vector H has a direction half-way between L and V
      // H = norm(norm(V) + norm(L)).  Note L & V already normalized above.
      // (see http://en.wikipedia.org/wiki/Blinn-Phong_shading_model)
  ' if(lightingMode == 0){\n' +    
  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  vec3 H_2 = normalize(lightDirection_2 + eyeDirection); \n' +
  '  nDotH = max(dot(H, normal), 0.0); \n' +
  '  nDotH_2 = max(dot(H_2, normal), 0.0); \n' +
  ' }\n' +

  ' if(lightingMode == 1){\n' +
  '  vec3 L = normalize(lightDirection); \n' +
  '  vec3 C = dot(normal, L)*normal; \n' +
  '  vec3 R = C + C - L; \n' +
  '  nDotH = max(dot(eyeDirection, R), 0.0); \n' +
  '  vec3 L_2 = normalize(lightDirection_2); \n' +
  '  vec3 C_2 = dot(normal, L_2)*normal; \n' +
  '  vec3 R_2 = C_2 + C_2 - L_2; \n' +
  '  nDotH_2 = max(dot(eyeDirection, R_2), 0.0); \n' +
  ' }\n' +
      // (use max() to discard any negatives from lights below the surface)
      // Apply the 'shininess' exponent K_e:
      // Try it two different ways:   The 'new hotness': pow() fcn in GLSL.
      // CAREFUL!  pow() won't accept integer exponents! Convert K_shiny!  
  '  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
  '  float e64_2 = pow(nDotH_2, float(u_MatlSet[0].shiny));\n' +
  // Calculate the final color from diffuse reflection and ambient reflection
//  '  vec3 emissive = u_Ke;' +
 '   vec3 emissive =                    u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi + u_headLight[0].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL + u_headLight[0].diff * v_Kd * nDotL_2;\n' +
  '  vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64 + u_headLight[0].spec * u_MatlSet[0].spec * e64_2;\n' +
  '  v_Color = vec4((emissive + ambient + diffuse + speculr)*a_Color.rgb , 1.0);\n' +
  '}\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
	//-------------Set precision.
	// GLSL-ES 2.0 defaults (from spec; '4.5.3 Default Precision Qualifiers'):
	// DEFAULT for Vertex Shaders: 	precision highp float; precision highp int;
	//									precision lowp sampler2D; precision lowp samplerCube;
	// DEFAULT for Fragment Shaders:  UNDEFINED for float; precision mediump int;
	//									precision lowp sampler2D;	precision lowp samplerCube;
	// MATCH the Vertex shader precision for float and int:
  'precision highp float;\n' +
  'precision highp int;\n' +
  //
	//--------------- GLSL Struct Definitions:
	'struct LampT {\n' +		// Describes one point-like Phong light source
	'		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
													//		   w==0.0 for distant light from x,y,z direction 
	' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
	' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
	'		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
	'}; \n' +
	//
	'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	'		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	'		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	'		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	'		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	'		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +
  //
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
  // first light source: (YOU write a second one...)
	'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
  'uniform LampT u_headLight[1];\n' + // Array of all light sources.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
	//
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
  'uniform int lightingMode;\n' +
  'uniform int shadingMode;\n' +

  'uniform int textureMode;\n' +
  'uniform sampler2D u_Sampler0;\n' +

 	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader: 
  'varying vec2 v_TexCoord;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  													// Ambient? Emissive? Specular? almost
  													// NEVER change per-vertex: I use 'uniform' values

  'void main() { \n' +
     	// Normalize! !!IMPORTANT!! TROUBLE if you don't! 
     	// normals interpolated for each pixel aren't 1.0 in length any more!
  'if(shadingMode == 1){\n' +
  'if(textureMode == 0){\n' +
  '  gl_FragColor = v_Color;\n' + 
  '};\n' +
  'if(textureMode == 1){\n' +
  '  vec3 normal = normalize(v_Normal); \n' +
//  '  vec3 normal = v_Normal; \n' +
      // Find the unit-length light dir vector 'L' (surface pt --> light):
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 lightDirection_2 = normalize(u_headLight[0].pos - v_Position.xyz);\n' +
      // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
      // The dot product of (unit-length) light direction and the normal vector
      // (use max() to discard any negatives from lights below the surface) 
      // (look in GLSL manual: what other functions would help?)
      // gives us the cosine-falloff factor needed for the diffuse lighting term:
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  '  float nDotL_2 = max(dot(lightDirection_2, normal), 0.0);\n' +
  '  vec4 color0 = texture2D(u_Sampler0, v_TexCoord);\n' +
	'  gl_FragColor = vec4(color0.rgb * nDotL * nDotL_2, color0.a);\n' +
  '};\n' +
  '};\n' +

  'if(shadingMode == 0){\n' +
  '  vec3 normal = normalize(v_Normal); \n' +
//  '  vec3 normal = v_Normal; \n' +
      // Find the unit-length light dir vector 'L' (surface pt --> light):
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 lightDirection_2 = normalize(u_headLight[0].pos - v_Position.xyz);\n' +
      // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
      // The dot product of (unit-length) light direction and the normal vector
      // (use max() to discard any negatives from lights below the surface) 
      // (look in GLSL manual: what other functions would help?)
      // gives us the cosine-falloff factor needed for the diffuse lighting term:
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  '  float nDotL_2 = max(dot(lightDirection_2, normal), 0.0);\n' +
  '  float nDotH = 0.0; \n' +
  '  float nDotH_2 = 0.0; \n' +

  // Bilnn-Phong lighting
  'if(lightingMode == 0){\n' +
  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  nDotH = max(dot(H, normal), 0.0); \n' +
  '  vec3 H_2 = normalize(lightDirection_2 + eyeDirection); \n' +
  '  nDotH_2 = max(dot(H_2, normal), 0.0); \n' +
  '}\n' +

  // Phong lighting
  'if(lightingMode == 1){\n' +
  '  vec3 L = normalize(lightDirection); \n' +
  '  vec3 C = dot(normal, L)*normal; \n' +
  '  vec3 R = C + C - L; \n' +
  '  nDotH = max(dot(eyeDirection, R), 0.0); \n' +
  '  vec3 L_2 = normalize(lightDirection_2); \n' +
  '  vec3 C_2 = dot(normal, L_2)*normal; \n' +
  '  vec3 R_2 = C_2 + C_2 - L_2; \n' +
  '  nDotH_2 = max(dot(eyeDirection, R_2), 0.0); \n' +
  '}\n' +


  '  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
  '  float e64_2 = pow(nDotH_2, float(u_MatlSet[0].shiny));\n' +
  '  vec3 emissive =  u_MatlSet[0].emit;\n' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi + u_headLight[0].ambi * u_MatlSet[0].ambi ;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL + u_headLight[0].diff * v_Kd * nDotL_2;\n' +
  '  vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64 + u_headLight[0].spec * u_MatlSet[0].spec * e64_2;\n' +
  'if(textureMode == 0){\n' +
  '  gl_FragColor = vec4((emissive + ambient + diffuse + speculr)*v_Color.rgb , 1.0);\n' +
  '};\n' +
  'if(textureMode == 1){\n' +
  '  vec4 color0 = texture2D(u_Sampler0, v_TexCoord);\n' +
  '  gl_FragColor = vec4((emissive + ambient + diffuse + speculr)*v_Color.rgb , 1.0) * color0;\n' +   
  '};\n' +

  '}\n' +
  '}\n';



//global variables
var gl;
var numVertices = 4024;
var positionDimensions = 4;
var colorDimensions = 4;
var normalDimensions = 3;
var pointSizeDimensions = 1;
var texCoordDimensions = 2;
var positions = new Float32Array(numVertices*positionDimensions);
var colors = new Float32Array(numVertices*colorDimensions);
var normals = new Float32Array(numVertices*normalDimensions);
var pointSizes = new Float32Array(numVertices*pointSizeDimensions);
var texCoords = new Float32Array(numVertices*texCoordDimensions);

for(var i = 0; i < numVertices; i++) pointSizes[i] = 10.0; //default point-size is 10
for(var i = 0; i < numVertices*normalDimensions; i++) {
normals[i] = .5; //set  non-zero default point-size
}
var FSIZE = positions.BYTES_PER_ELEMENT;
var ipos = icolors = inormals = ipointSizes = itexCoords = 0;
// global vars that contain the values we send thru those uniforms,
//  ... for our camera:
var	eyePosWorld = new Float32Array(3);	// x,y,z in world coords
//  ... for our transforms:
var modelMatrix = new Matrix4();  // Model matrix
var	mvpMatrix 	= new Matrix4();	// Model-view-projection matrix
var	normalMatrix= new Matrix4();	// Transformation matrix for normals

//  Global vars that hold GPU locations for 'uniform' variables.
//		-- For 3D camera and transforms:
var uLoc_eyePosWorld 	= false;
var uLoc_ModelMatrix 	= false;
var uLoc_MvpMatrix 		= false;
var uLoc_NormalMatrix = false;
var uLoc_lightingMode = false;
var uLoc_shadingMode = false;
var uLoc_textureMode = false;

var lightingMode = 0;
var shadingMode = 0;
var textureMode = 0;

var g_myShader;
var textureImg;
//	... for our first light source:   (stays false if never initialized)
var lamp0 = new LightsT();
var headLight = new LightsT();
	// ... for our first material:
var matlSel= MATL_RED_PLASTIC;				// see keypress(): 'm' key changes matlSel
var matl0 = new Material(matlSel);




function init(){
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log("lib1.js: init() failed to get WebGL rendering context 'gl'\n");
    console.log("from the HTML-5 Canvas object named 'canvas'!\n\n");
    return;
  }

  //var phongProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  //var blinnPhongProgram = createProgram(gl, B_VSHADER_SOURCE, B_FSHADER_SOURCE);
  // Initialize shaders
  g_myShader = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE)
  if (!g_myShader) {
    console.log('lib1.js: init() failed to intialize shaders.');
    return;
  }

  gl.useProgram(g_myShader);
  bufferSetup(gl);

  // Set the background-clearing color and enable the depth test
  gl.clearColor(0.4, 0.4, 0.4, 1.0);  // black!
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);   // draw the back side of triangles
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // Clear the color buffer and the depth buffer
  // Set texture
  textureImg = initTextures(gl)
  if (!textureImg) {
    console.log('Failed to intialize the texture.');
    return;
  }
  // Create, save the storage locations of uniform variables: ... for the scene
  // (Version 03: changed these to global vars (DANGER!) for use inside any func)
  uLoc_eyePosWorld  = gl.getUniformLocation(g_myShader, 'u_eyePosWorld');
  uLoc_ModelMatrix  = gl.getUniformLocation(g_myShader, 'u_ModelMatrix');
  uLoc_MvpMatrix    = gl.getUniformLocation(g_myShader, 'u_MvpMatrix');
  uLoc_NormalMatrix = gl.getUniformLocation(g_myShader, 'u_NormalMatrix');
  uLoc_lightingMode = gl.getUniformLocation(g_myShader, 'lightingMode');
  uLoc_shadingMode = gl.getUniformLocation(g_myShader, 'shadingMode');
  uLoc_textureMode = gl.getUniformLocation(g_myShader, 'textureMode');
  gl.uniform1i(uLoc_lightingMode, lightingMode);
  gl.uniform1i(uLoc_shadingMode, shadingMode);
  gl.uniform1i(uLoc_textureMode, textureMode);
  if (!uLoc_eyePosWorld ||
      !uLoc_ModelMatrix	|| !uLoc_MvpMatrix || !uLoc_NormalMatrix) {
  	console.log('Failed to get GPUs matrix storage locations');
  	return;
  	}
	//  ... for Phong light source:
	// NEW!  Note we're getting the location of a GLSL struct array member:

  lamp0.u_pos  = gl.getUniformLocation(g_myShader, 'u_LampSet[0].pos');	
  lamp0.u_ambi = gl.getUniformLocation(g_myShader, 'u_LampSet[0].ambi');
  lamp0.u_diff = gl.getUniformLocation(g_myShader, 'u_LampSet[0].diff');
  lamp0.u_spec = gl.getUniformLocation(g_myShader, 'u_LampSet[0].spec');
  if( !lamp0.u_pos || !lamp0.u_ambi	|| !lamp0.u_diff || !lamp0.u_spec	) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

  headLight.u_pos = gl.getUniformLocation(g_myShader, 'u_headLight[0].pos');
  headLight.u_ambi = gl.getUniformLocation(g_myShader, 'u_headLight[0].ambi');
  headLight.u_diff = gl.getUniformLocation(g_myShader, 'u_headLight[0].diff');
  headLight.u_spec = gl.getUniformLocation(g_myShader, 'u_headLight[0].spec');
  if (!headLight.u_pos || !headLight.u_ambi || !headLight.u_diff || !headLight.u_spec) {
        console.log('Failed to get GPUs headLight storage locations');
        return;
  }

	// ... for Phong material/reflectance:
	matl0.uLoc_Ke = gl.getUniformLocation(g_myShader, 'u_MatlSet[0].emit');
	matl0.uLoc_Ka = gl.getUniformLocation(g_myShader, 'u_MatlSet[0].ambi');
	matl0.uLoc_Kd = gl.getUniformLocation(g_myShader, 'u_MatlSet[0].diff');
	matl0.uLoc_Ks = gl.getUniformLocation(g_myShader, 'u_MatlSet[0].spec');
	matl0.uLoc_Kshiny = gl.getUniformLocation(g_myShader, 'u_MatlSet[0].shiny');
	if(!matl0.uLoc_Ke || !matl0.uLoc_Ka || !matl0.uLoc_Kd 
			  	  		    || !matl0.uLoc_Ks || !matl0.uLoc_Kshiny
		 ) {
		console.log('Failed to get GPUs Reflectance storage locations');
		return;
	}
	// Position the camera in world coordinates:
	// eyePosWorld.set([6.0, 0.0, 0.0]);
	// gl.uniform3fv(uLoc_eyePosWorld, eyePosWorld);// use it to set our uniform
	// (Note: uniform4fv() expects 4-element float32Array as its 2nd argument)
	
  // Init World-coord. position & colors of first light source in global vars;
  
  // lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  // lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  // lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);


  return gl;
}

function bufferSetup(gl) {
// Create
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  var VBO = CreateVBO();
  gl.bufferData(gl.ARRAY_BUFFER, VBO, gl.STATIC_DRAW);
  
  // Assign the buffer object to a_Position variable
  var a_Position = gl.getAttribLocation(g_myShader, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
    
  //Assign the buffer object to a_Color variable
  var a_Color = gl.getAttribLocation(g_myShader, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }

  var a_Normal = gl.getAttribLocation(g_myShader, 'a_Normal');
  if(a_Normal < 0)
  {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }

  var a_TexCoord = gl.getAttribLocation(g_myShader, 'a_TexCoord');
  if(a_TexCoord < 0)
  {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }
  

  //The VBO is setup so that it looks like:
  //[x1,y1,z1,w1,...,x1024,y1024,z1024,w1024,
  // r1,g1,b1,a1,...,r1024,g1024,b1024,a1024,
  // n1,n2,n3,...,n1024
  var offset = 0;

  gl.vertexAttribPointer(a_Position, positionDimensions, gl.FLOAT, false, FSIZE*positionDimensions, offset);//Specify the stride & offset 
  gl.enableVertexAttribArray(a_Position); // Enable the assignment of the buffer object
  offset += FSIZE*numVertices*positionDimensions; //increase the offset so that it starts at the end of the position array

  gl.vertexAttribPointer(a_Color, colorDimensions, gl.FLOAT, false, FSIZE*colorDimensions,offset);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object
  offset += FSIZE*numVertices*colorDimensions;

  gl.vertexAttribPointer(a_Normal, normalDimensions, gl.FLOAT, false, FSIZE * normalDimensions, offset);
  gl.enableVertexAttribArray(a_Normal);
  offset += FSIZE*numVertices*normalDimensions;
  
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * texCoordDimensions, offset);
  gl.enableVertexAttribArray(a_TexCoord);  // Enable the buffer assignment

}

function appendPositions(arr){
  positions = Float32Edit(positions,arr,ipos);
  ipos += arr.length;
  if(ipos > numVertices*positionDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' positions to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
  bufferSetup(gl);
}

function appendColors(arr){
  colors = Float32Edit(colors,arr,icolors);
  icolors += arr.length;
  if(icolors > numVertices*colorDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' colors to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
  bufferSetup(gl);
}

function appendNormals(arr){
  normals = Float32Edit(normals,arr,inormals);
  inormals += arr.length;
  if(inormals > numVertices*normalDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' normals to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
  bufferSetup(gl);
}

function appendTex(arr){
  texCoords = Float32Edit(texCoords,arr,itexCoords);
  itexCoords += arr.length;
  if(itexCoords > numVertices*texCoordDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' texCoords to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
  bufferSetup(gl);
}

function appendPointSizes(arr){
  pointSizes = Float32Edit(pointSizes,arr,ipointSizes);
  ipointSizes += arr.length;
  if(ipointSizes > numVertices*pointSizeDimensions){
    console.log('Warning! Appending more than ' + numVertices + ' point-sizes to the VBO will overwrite existing data');
    console.log('Hint: look at changing numVertices in lib.js');
  }
  bufferSetup(gl);  
}

//concatenate two Float32Arrays
function Float32Concat(first, second)
{
  var firstLength = first.length,
  result = new Float32Array(firstLength + second.length);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

//overwrite the base float32Array with a smaller 'edit' float32array starting at some index
function Float32Edit(base,edit,startIdx){
  for(var i = 0; i < edit.length;i++){
    base[i+startIdx] = edit[i];
  }
  return base;
}

function updateModelMatrix(matrix){
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, matrix.elements);
}

function updateNormalMatrix(matrix){
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, matrix.elements);
}

function updateMvpMatrix(matrix){
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, matrix.elements);
}

//Concatenate all attributes into a single array
function CreateVBO(){
  return Float32Concat(positions,Float32Concat(colors,Float32Concat(normals, texCoords)));
}

//Reset all attributes
function WipeVertices(){
  positions = new Float32Array(numVertices*positionDimensions);
  colors = new Float32Array(numVertices*colorDimensions);
  normals = new Float32Array(numVertices*normalDimensions);
  pointSizes = new Float32Array(numVertices*pointSizeDimensions);
  ipos = icolors = inormals = ipointSizes = 0;
  bufferSetup(gl);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function initTextures(gl) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return null;
  }

  var image = new Image();  // Create a image object
  image.crossOrigin = "anonymous";
  if (!image) {
    console.log('Failed to create the image object');
    return null;
  }
  var u_Sampler0 = gl.getUniformLocation(g_myShader, 'u_Sampler0');

  image.onload = function() {
  // Write the image data to texture object
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler0, 0);

  gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
  };

  // Tell the browser to load an Image
  image.src = 'rick-and-morty.png';

  return texture;
}
