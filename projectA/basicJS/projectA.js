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

var FizzyText = function() {
  this.position = 'Position';
  this.speed = 30.0;
  this.heartSize = 1.0;
  this.displayOutline = false;
  this.explode = function() { };
  // Define render logic ...
};

window.onload = function() {
  text = new FizzyText();
  main();
  var gui = new dat.GUI();
  
  gui.add(text, 'position').listen();
  gui.add(text, 'speed', -200, 200).onChange(setSpeed);
  gui.add(text, 'heartSize', 0,1).onChange(setHeartSize);
  gui.add(text, 'explode');
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
   
  // onkeydown listener
  window.addEventListener("keydown", (ev)=>keydown(ev, gl), false);

  // onmousedown listener
  canvas.addEventListener("mousedown", (ev)=>myMouseDown(ev, canvas)); 
 
  // onmousemove listener
  canvas.addEventListener("mousemove", (ev)=>myMouseMove(ev, canvas)); 

  // onmouseup listener
  canvas.addEventListener("mouseup", (ev)=>myMouseUp(ev, canvas)); 

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
  ANGLE_STEP = text.speed;
}

function setHeartSize(){
  heartSize = text.heartSize;
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
//  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = true;                    // set our mouse-dragging flag
  if(isDrag)
    console.log("you are dragging your mess");
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
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
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
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'tick()' function instead)
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
  // Put it on our webpage too...
  document.getElementById('MouseAtResult').innerHTML = 
  'myMouseUp(       ) at CVV coords x,y = '+x+', '+y;
};


function keydown(ev, gl) {// Called when user hits any key button;
  console.log("You are hitting keyboard ")
  switch (ev.keyCode) {
    case 65: //a
      heartY -= step;
      break;
    case 68: //d
      heartY += step;
      break;
    case 40: // Up arrow key
      myY -= step;
      break;
    case 38: // Down arrow key
      myY += step;
      break;
    case 39: // Right arrow key -> the positive rotation around the y-axis
      currentAngle = (currentAngle + 3.0) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation around the y-axis
      currentAngle = (currentAngle - 3.0) % 360;
      break;
    default:
      return; // Skip drawing at no effective action
  }
  // Draw mess
  draw(gl);
}

function draw(gl) {
  //draw images
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

  modelMatrix.setTranslate(myX, myY, 0.0);


  var base = 0.3;
  modelMatrix.translate(0.4, 0.3, 0.0); 

  modelMatrix.rotate(currentAngle, 0, 1, 0); // Rotate around the y-axis
  
  drawMess(gl, base);

  pushMatrix(modelMatrix); 

  var two = 0.28;

  modelMatrix.translate(0.0, 0.3, 0.34); 
  modelMatrix.rotate(90-currentAngle, 1, 1, 0);

  drawMess(gl, two);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 

  var two = 0.28;

  modelMatrix.translate(0.0, -0.3, -0.34); 
  modelMatrix.rotate(150.0 + 70-currentAngle, 1, 1, 0);

  drawMess(gl, two);


  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 

  var third = 0.15;

  modelMatrix.translate(-0.35, -0.3, -0.43);
  //modelMatrix.translate(0.5, 0.0, 0.0); 
  modelMatrix.rotate(cAngle2, 1, 0, 1);

  drawMess(gl, third);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix); 

  var third = 0.15;

  modelMatrix.translate(0.35, 0.3, 0.43);
  //modelMatrix.translate(0.5, 0.0, 0.0); 
  modelMatrix.rotate(cAngle2, 1, 0, 1);

  drawMess(gl, third);
  modelMatrix = popMatrix();

//draw heart
  modelMatrix.setTranslate(heartX, heartY, 0.0);
  modelMatrix.scale(heartSize,heartSize,heartSize); 

  pushMatrix(modelMatrix); 
  var size = 0.15;
  modelMatrix.translate(-0.5, 0.0, 0.0); 
  modelMatrix.rotate(cAngle2, 0, 1, 0); // Rotate around the x & y-axis

  drawheart(gl,size);
  
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix); 

   var sizeThird = 0.14;

   modelMatrix.translate(-0.5, 0.1, -0.3); 
   modelMatrix.rotate(300+cAngle2, -1, 0, 0); // Rotate around the x & y-axis
   modelMatrix.scale(0.6,0.6,0.6);   // Rotate around the x & y-axis
   modelMatrix.translate(0.0, 0.23, 0.0); 

   drawheart(gl,sizeThird);

   modelMatrix = popMatrix();


   pushMatrix(modelMatrix); 

   modelMatrix.translate(-0.5, -0.35, 0.0); 
   modelMatrix.rotate(cAngle2, 0, 1, 0); // Rotate around the x & y-axis

   drawheart(gl,size);

   modelMatrix = popMatrix();


   pushMatrix(modelMatrix); 

   var sizeSecond = 0.3;

   modelMatrix.translate(-0.5, -0.45, 0.0); 
   modelMatrix.rotate(-300, 1, 0, 0); // Rotate around the x & y-axis
   modelMatrix.rotate(currentAngle, 0, 0, 1); // Rotate around the x & y-axis

   drawheart(gl,sizeSecond);

   modelMatrix = popMatrix();

}

//draw single mess
function drawMess(gl, size) {
  
  pushMatrix(modelMatrix);

  modelMatrix.scale(size, size, size);
  // Calculate the model matrix
  // Pass the model matrix to u_ModelMatrix
  updateModelMatrix(modelMatrix);

  // Draw the mess
  gl.drawArrays(gl.TRIANGLE_STRIP,0,180);
  
  modelMatrix = popMatrix(); // Retrieve the model matrix 

}

function drawheart(gl, size){

  pushMatrix(modelMatrix);
  
  modelMatrix.scale(size,size,size); 

  updateModelMatrix(modelMatrix);
  if(size === 0.15)
    gl.drawArrays(gl.LINE_STRIP,180,350*2);
  else if(size === 0.3)
    gl.drawArrays(gl.TRIANGLE_FAN,180,350*2);
  else
    gl.drawArrays(gl.LINES,180,350*2);
  modelMatrix = popMatrix(); // Retrieve the model matrix
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
    heartSizeStep = heartSizeStep < 0 ? -heartSizeStep: heartSizeStep;
  }
  if(heartSize > 1.0){
    heartSize=1.0;
    heartSizeStep = heartSizeStep > 0 ? -heartSizeStep: heartSizeStep;
  }

  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = currentAngle + (ANGLE_STEP * elapsed) / 1000.0;
  currentAngle = (newAngle %= 360);

  var newColor = currentColor + (colorStep * elapsed) / 1000.0 *0.5;
  currentColor = (newColor %= 255);

  updateColorControl();

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

  var colors = [];
  for(var i = 0; i< 48; i++){
    colors.push.apply(colors, color);
  }

  appendPositions(data);
  
  //appendColors(colors);

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

  var verticesColors = [];
  
  for(var i = 0; i< 48; i++){
    verticesColors.push.apply(verticesColors, color);
  }
  

   appendPositions(vertices);

   appendColors(verticesColors);
}
