var ANGLE_STEP = 30.0;

var g_last = Date.now(); // Timestamp for most-recently-drawn image;
var isDrag = false;
var xMouseclik = 0.0;
var yMouseclik = 0.0;
var step = 0.1;
var myX = 0.0;
var myY = 0.0;
var heartX = 0.0;
var heartY = 0.0;
var heartSize = 1;
var currentAngle = 0.0;
var cAngle2 = 0.0;
var cAngle2Step = 100.0;
var right = true;
var colorStep = 30.0;
var currentColor = 0.0;
var heartSizeStep = 0.1;
var text;
var floatsPerVertex = 4;

//DAT.GUI
var FizzyText = function() {
  this.position = 'Position';
  this.speed = 30.0;
  this.heartSize = 1.0;
};

window.onload = function() {
  // load controls and canvas
  text = new FizzyText();
  main();
  var gui = new dat.GUI();
  // add controls to GUI
  gui.add(text, 'position').listen();
  gui.add(text, 'speed', -200, 200).onChange(setSpeed);
  gui.add(text, 'heartSize', 0,1).onChange(setHeartSize);

};

function main() {
  var canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = init();

  // Additional setup:
  gl.disable(gl.CULL_FACE); // SHOW BOTH SIDES of all triangles
  gl.clearColor(0.25, 0.25, 0.35, 1); // set new screen-clear color, RGBA
  // (for WebGL framebuffer, not canvas)

   
   makeMess();
   makeHeart();
   makeGroundGrid();
   
  // onkeydown listener
  window.addEventListener("keydown", (ev)=>keydown(ev, gl), false);

  // onmousedown listener
  canvas.addEventListener("mousedown", (ev)=>myMouseDown(ev, canvas)); 
 
  // onmousemove listener
  canvas.addEventListener("mousemove", (ev)=>myMouseMove(ev, canvas)); 

  // onmouseup listener
  canvas.addEventListener("mouseup", (ev)=>myMouseUp(ev, canvas)); 

  //  update GUI's position message 
  var update = function() {
    requestAnimationFrame(update);
    text.position =  myX +','+ myY;
  };

  update();
  //tick function -> animation
  var tick = function() {
    animate(); // Update the rotation angle

    draw(gl); // draw objects

    requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
  };
  tick();
}

//handle user input
function setSpeed(){
  // set current speed when user changes speed control of GUI
  ANGLE_STEP = text.speed;
  console.log("current speed:"+ Math.floor(text.speed));
}

function setHeartSize(){
  // set current heart size when user changes heartSize control of GUI
  heartSize = text.heartSize;
  console.log("current heartSize:"+  text.heartSize);
}



function myMouseDown(ev, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
//                  (Which button?    console.log('ev.button='+ev.button);   )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                    // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  
  isDrag = true;                    // set our mouse-dragging flag
  if(isDrag)
    console.log("you are dragging your bracelet");
  xMouseclik = x;                       // record where mouse-dragging began
  yMouseclik = y;                       // using global vars (above main())
  
};

function myMouseMove(ev, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  if(isDrag==false) return;     // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                    // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  myX += (x - xMouseclik);      // Accumulate change-in-mouse-position,&
  myY += (y - yMouseclik);
  xMouseclik = x;                       // Make next drag-measurement from here.
  yMouseclik = y;
};

function myMouseUp(ev,canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                    // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  myX += (x - xMouseclik);
  myY += (y - yMouseclik);
  console.log('myMouseUp: xMdragTot,yMdragTot =',myX,',\t', myY);
};


function keydown(ev, gl) {// Called when user hits any key button;
  switch (ev.keyCode) {
    case 65: //a key
      console.log(' a key.');
      heartY -= step;
      console.log("heart dish Y pos:" + heartY);
      break;
    case 68: //d key
      console.log(' d key.');
      heartY += step;
      console.log("heart dish Y pos:" + heartY);
      break;
    case 40: // Up arrow key
      console.log(' up-arrow.');
      myY -= step;
      console.log("bracelet Y pos:" + myY);
      break;
    case 38: // Down arrow key
      console.log(' down-arrow.');
      myY += step;
      console.log("bracelet Y pos:" + myY);
      break;
    case 39: // Right arrow key -> the positive rotation around the y-axis
      console.log(' right-arrow.');
      currentAngle = (currentAngle + 3.0) % 360;
      console.log("bracelet currentAngle:" + currentAngle);
      break;
    case 37: // Left arrow key -> the negative rotation around the y-axis
      console.log(' left-arrow.');
      currentAngle = (currentAngle - 3.0) % 360;
      console.log("bracelet currentAngle:" + currentAngle);
      break;
    default:
      return; // Skip drawing at no effective action
  }
  // Draw all
  draw(gl);
}

function draw(gl) {
  // Draw a new on-screen image.

  // Be sure to clear the screen before re-drawing ...
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

  modelMatrix.setIdentity();    // DEFINE 'world-space' coords.

  modelMatrix.perspective(42.0,   // FOVY: top-to-bottom vertical image angle, in degrees
                           1.0,   // Image Aspect Ratio: camera lens width/height
                           1.0,   // camera z-near distance (always positive; frustum begins at z = -znear)
                        1000.0);  // camera z-far distance (always positive; frustum ends at z = -zfar)

  modelMatrix.lookAt( 5.0,  5.0,  3.0,      // center of projection
                     -1.0, -2.0, -0.5,      // look-at point 
                      0.0,  0.0,  1.0);     // 'up' vector

  pushMatrix(modelMatrix);     // SAVE world coord system;
  drawGround(gl);
  modelMatrix = popMatrix(); 
  pushMatrix(modelMatrix); 
  // Let mouse-drag move the drawing axes before we do any other drawing:
  //modelMatrix.setTranslate(myX, myY, 0.0);

  // spinning BASE dodecahedron;
  // small ones
  var base = 0.15;
  modelMatrix.translate(0.42, 0.4, 0.0); 

  modelMatrix.rotate(currentAngle, 0, 1, 0); // Rotate around the y-axis
  
  drawMess(gl, base);

  modelMatrix = popMatrix(); 

  pushMatrix(modelMatrix); 
  // Rocking 2nd dodecahedron:-----------------------------------
  // larger one -- top of the base dodecahedron
  var two = 0.2;

  modelMatrix.translate(0.2, 0.18, 0.14); // move drawing axes to base dodecahedron's 
                         // point: use this as the base dodecahedron's 'hinge point'
                         // and make 'rocking' drawing axes pivot around it.
  modelMatrix.rotate(90-currentAngle, 1, 1, 0); // 'rock' the drawing axes,

  drawMess(gl, two);
 // END of Rocking 2nd dodecahedron:---------------------------- 
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 
// Rocking 3rd dodecahedron:-----------------------------------
  // larger one -- bottom of the base dodecahedron
  modelMatrix.translate(-0.16, -0.18, 0.14); 
  modelMatrix.rotate(150.0 + 70-currentAngle, 1, 1, 0); // Rotate around the x & y-axis

  drawMess(gl, two);
 // END of Rocking 3rd dodecahedron:---------------------------- 
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 
// Rocking 4th dodecahedron:-----------------------------------
  // small one -- next to the 3rd dodecahedron
  modelMatrix.translate(-0.2, -0.48, 0.14);
  modelMatrix.rotate(-cAngle2, 1, 0, 1); // Rotate around the x & z-axis

  drawMess(gl, base);
 // END of Rocking 4th dodecahedron:---------------------------- 
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 
// Rocking 5th object- a heart:-----------------------------------
  // small one heart -- next to the 2nd dodecahedron
  modelMatrix.translate(0.48, 0.1, 0.2);
  modelMatrix.rotate(-55, 0, 1, 1); // Rotate -55 around the y & z-axis
  modelMatrix.scale(0.7, 0.7, 0.7); // SHRINK axes by 70% for the heart,

  drawheart(gl,base);
 // END of Rocking the heart:---------------------------- 
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 
// Rocking 5th dodecahedron:-----------------------------------
  // larger one -- next to the 4th dodecahedron
  modelMatrix.translate(0.06, -0.6, 0.24); 
  modelMatrix.rotate(150.0 + 70-currentAngle, 0, 0, 1);// Rotate around the z-axis

  drawMess(gl, two);
 // END of Rocking 5th dodecahedron:---------------------------- 
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 
// Rocking 6th dodecahedron:-----------------------------------
  // larger one -- next to the 5th dodecahedron
  modelMatrix.translate(0.37, -0.5, 0.24);
  modelMatrix.rotate(-cAngle2, 1, 0, 0);// Rotate around the x-axis

  drawMess(gl, base);
// END of Rocking 6th dodecahedron:---------------------------- 
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 
// Rocking the last dodecahedron:-----------------------------------
  // larger one -- next to the 6th dodecahedron and the heart
  modelMatrix.translate(0.5, -0.2, 0.24); 
  modelMatrix.rotate(150.0 + 70-currentAngle, 0, 0, 1);// Rotate around the z-axis

  drawMess(gl, two+0.03);
// END of Rocking the last dodecahedron:---------------------------- 
  modelMatrix = popMatrix();



//draw heart

  // Let key board clicks move the drawing axes before we do any other drawing:
  modelMatrix.setTranslate(-0.2, -0.2, 0.0);
  // Let GUI controls change the drawing heart size before we do any other drawing:
  modelMatrix.scale(0.5,0.5,0.5); 

  pushMatrix(modelMatrix); 
  // Rocking 1st hollow BASE heart:-----------------------------------
  var size = 0.15;
  modelMatrix.translate(-0.5, 0.0, 0.0); 
  modelMatrix.rotate(cAngle2, 0, 1, 0); // Rotate around the x & y-axis

  drawheart(gl,size);
  // END of Rocking 1st hollow BASE heart:---------------------------- 

   pushMatrix(modelMatrix); 
  // Rocking 2nd hollow heart:-----------------------------------
  // on the bottom of the 1st hollow heart
   modelMatrix.translate(0.0, -0.35, 0.0); 

   drawheart(gl,size);
  // END of Rocking 2nd hollow heart:---------------------------- 
   modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 
  // Rocking hollow LINE heart:-----------------------------------
  // on the top of BASE heart
   var sizeThird = 0.14;

   modelMatrix.translate(0.0, 0.1, -0.0); 
   modelMatrix.rotate(300+cAngle2, -1, 0, 0); // Rotate negatively around the x-axis
   modelMatrix.scale(0.6,0.6,0.6);   // SHRINK axes by 60% for this heart
   modelMatrix.translate(0.0, 0.23, 0.0); 

   drawheart(gl,sizeThird);
  // END of Rocking hollow LINE heart:---------------------------- 
   modelMatrix = popMatrix();
   
   modelMatrix = popMatrix();


   pushMatrix(modelMatrix); 
// Rocking the heart-shaped dish:-----------------------------------
  //on the bottom of to the 2nd hollow heart
   var sizeSecond = 0.3;

   modelMatrix.translate(-0.5, -0.48, 0.0); 
   modelMatrix.rotate(-300, 1, 0, 0); // Rotate -300 around the x-axis
   modelMatrix.rotate(currentAngle, 0, 0, -1); // Rotate around the z-axis

   drawheart(gl,sizeSecond);
  // END of Rocking the heart-shaped dish:---------------------------- 
   modelMatrix = popMatrix();

  

}

//draw single dodecahedron
function drawMess(gl, size) {
  
  pushMatrix(modelMatrix);

  modelMatrix.scale(size, size, size);
  // Calculate the model matrix
  // Pass the model matrix to u_ModelMatrix
  updateModelMatrix(modelMatrix);

  // Draw the dodecahedron
  gl.drawArrays(gl.TRIANGLE_STRIP,0,180);
  
  modelMatrix = popMatrix(); // Retrieve the model matrix 

}

function drawheart(gl, size){

  pushMatrix(modelMatrix);
  
  modelMatrix.scale(size,size,size); 
// Calculate the model matrix
  // Pass the model matrix to u_ModelMatrix
  updateModelMatrix(modelMatrix);
  // when size equals to 0.15, draw a hollow heart
  // when size equals to 0.3, draw a heart-shaped dish
  // else draw a line-shaped heart
  if(size === 0.15)
    gl.drawArrays(gl.LINE_STRIP,180,350*2);
  else if(size === 0.3)
    gl.drawArrays(gl.TRIANGLE_FAN,180,350*2);
  else
    gl.drawArrays(gl.LINES,180,350*2);
  modelMatrix = popMatrix(); // Retrieve the model matrix
}

function drawGround(gl){
    //---------Draw Ground Plane, without spinning.
  pushMatrix(modelMatrix);  // SAVE world drawing coords.

  // position it.
  modelMatrix.translate( 0.4, -0.4, 0.0); 
  modelMatrix.scale(0.1, 0.1, 0.1);       // shrink by 10X:
//  modelMatrix.rotate(-60.0, 1,0,0 );
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  updateModelMatrix(modelMatrix);
  // Draw just the ground-plane's vertices
  gl.drawArrays(gl.LINES,                 // use this drawing primitive, and
                880, // start at this vertex number, and
                400); // draw this many vertices.
  
  modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================
}

function animate() {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  // Update the current heart size (adjusted by the elapsed time)
  heartSize = heartSize + (heartSizeStep * elapsed) / 1000.0;
  if(heartSize < 0.5){
    heartSize=0.5;
    heartSizeStep = heartSizeStep < 0 ? -heartSizeStep: heartSizeStep; // go LARGER
  }
  if(heartSize > 1.0){
    heartSize=1.0;
    heartSizeStep = heartSizeStep > 0 ? -heartSizeStep: heartSizeStep; // go SMALLER
  }

  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = currentAngle + (ANGLE_STEP * elapsed) / 1000.0;
  currentAngle = (newAngle %= 360);

  var newColor = currentColor + (colorStep * elapsed) / 1000.0 *0.5;
  currentColor = (newColor %= 255);

  //updateColorControl();

  // Update the current heart  rotation angle (adjusted by the elapsed time)
   cAngle2 = cAngle2 + (cAngle2Step * elapsed) / 1000.0; // advance;
  if( cAngle2 < 20.0 ) { 
    cAngle2 = 20.0;             
    cAngle2Step = cAngle2Step < 0 ? -cAngle2Step: cAngle2Step; // go FORWARDS
    }
  if( cAngle2 > 200.0 ) { 
   cAngle2 = 200.0;  
   cAngle2Step = cAngle2Step > 0 ? -cAngle2Step: cAngle2Step; // go BACKWARDS
  }
}

function updateColorControl(){
  // change color over time
  gl.uniform4f(u_RandomColor, Math.abs(currentColor/300 -0.2), Math.abs(currentColor/300 -0.5), Math.abs(currentColor/300 -0.6), 0.7); 

}
// basic colors
var color = [
    1.0, 0.4, 0.4, 1.0,  1.0, 1.0, 0.0, 1.0,  0.8, 0.5, 1.0, 1.0, 
    1.0, 0.4, 1.0, 1.0,  1.0, 1.0, 0.0, 1.0,  0.6, 0.8, 1.0, 1.0,  
    0.8, 0.3, 1.9, 1.0,  0.6, 1.0, 0.4, 1.0,  1.0, 1.0, 0.0, 1.0,  
    0.0, 0.5, 1.0, 1.0,  1.0, 0.5, 1.0, 1.0,  0.4, 0.8, 1.0, 1.0, 
    1.0, 1.0, 0.0, 1.0,  0.4, 0.4, 1.0, 1.0,  0.6, 1.0, 1.0, 1.0
  ];

function makeHeart(){
  var data = [];

  //Formula from http://mathworld.wolfram.com/HeartCurve.html
  for (let i = 0; i < 360; i++) {
    t = i;
    x = 16 * Math.pow(Math.sin(t),3);
    y = 13 * Math.cos(t) - 5* Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)
    data = data.concat([x/10,y/10,0.5,1.0]);
    data = data.concat([x/10,y/10,-0.0,1.0]);
  }

  // var colors = [];
  // for(var i = 0; i< 48; i++){
  //   colors = colors.concat(color);
  // }

  appendPositions(data);
}

function makeMess(){
  // Refer to https://en.wikipedia.org/wiki/Dodecahedron
  // https://en.wikipedia.org/wiki/Regular_dodecahedron
  // -1<=x<+1 -1<=y<+1 -1<=z<+1
  var h = ( Math.sqrt(5)-1) / 2; //  golden ratio 
  var a = 1 / Math.sqrt(3); // 1
  var b = a / h; // 1/ϕ
  var c = a * h; // ϕ
 
  
  var vertices = [];

  // 12 faces
  var faces = [
     a,  a,  a,   0,  b,  c,  -a,  a,  a,  -c,  0,  b,   c,  0,  b,
    -a, -a,  a,   0, -b,  c,   a, -a,  a,   c,  0,  b,  -c,  0,  b,
     a, -a, -a,   0, -b, -c,  -a, -a, -a,  -c,  0, -b,   c,  0, -b,
    -a,  a, -a,   0,  b, -c,   a,  a, -a,   c,  0, -b,  -c,  0, -b,

     0,  b, -c,   0,  b,  c,   a,  a,  a,   1,  c,  0,   a,  a, -a,
     0,  b,  c,   0,  b, -c,  -a,  a, -a,  -1,  c,  0,  -a,  a,  a,
     0, -b, -c,   0, -b,  c,  -a, -a,  a,  -1, -c,  0,  -a, -a, -a,
     0, -b,  c,   0, -b, -c,   a, -a, -a,   1, -c,  0,   a, -a,  a,

     a,  a,  a,   c,  0,  b,   a, -a,  a,   1, -c,  0,   1,  c,  0,
     a, -a, -a,   c,  0, -b,   a,  a, -a,   1,  c,  0,   1, -c,  0,
    -a,  a, -a,  -c,  0, -b,  -a, -a, -a,  -1, -c,  0,  -1,  c,  0,
    -a, -a,  a,  -c,  0,  b,  -a,  a,  a,  -1,  c,  0,  -1, -c,  0
  ];

  for (var i = 0; i <faces.length; i += 15) {
    var a = [faces[i],faces[i + 1],faces[i + 2],1.0];
    var b = [faces[i + 3],faces[i + 4],faces[i + 5],1.0];
    var c = [faces[i + 6],faces[i + 7],faces[i + 8],1.0];
    var d = [faces[i + 9],faces[i + 10],faces[i + 11],1.0];
    var e = [faces[i + 12],faces[i + 13],faces[i + 14],1.0];
    var center = [
      (a[0] + b[0] + c[0] + d[0] + e[0]) / 5,
      (a[1] + b[1] + c[1] + d[1] + e[1]) / 5,
      (a[2] + b[2] + c[2] + d[2] + e[2]) / 5,
      1.0
    ];

    // 5 triangles in one face, 15 vertices
    vertices = vertices.concat(a).concat(b).concat(center);
    vertices = vertices.concat(b).concat(c).concat(center);
    vertices = vertices.concat(c).concat(d).concat(center);
    vertices = vertices.concat(d).concat(e).concat(center);
    vertices = vertices.concat(e).concat(a).concat(center);
    
  }
  // 180 vertices + 720 vertices

  var verticesColors = [];
  // generate colors
  for(var i = 0; i< 60; i++){
    verticesColors = verticesColors.concat(color);
  }
  var colr = [0.5, 1.0, 0.5, 1.0];
  
  for(var j=0; j< 400; j++){
    verticesColors = verticesColors.concat(colr);
  }
   appendPositions(vertices);

   appendColors(verticesColors);
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 100;     // # of lines to draw in x,y to make the grid.
  var ycount = 100;   
  var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
  //var xColr = new Float32Array([1.0, 1.0, 0.3]);  // bright yellow
  //var yColr = new Float32Array([0.5, 1.0, 0.5]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  var gndVerts = [];
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    //gndVerts[j+4] = xColr[0];     // red
    //gndVerts[j+5] = xColr[1];     // grn
    //gndVerts[j+6] = xColr[2];     // blu
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    //gndVerts[j+4] = yColr[0];     // red
    //gndVerts[j+5] = yColr[1];     // grn
    //gndVerts[j+6] = yColr[2];     // blu
  }

  appendPositions(gndVerts);
}