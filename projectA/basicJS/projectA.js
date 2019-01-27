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
  document.onkeydown = function(ev) {
    keydown(ev, gl);
  };
  // onmousedown listener
  canvas.onmousedown = function(ev) {
    myMouseDown(ev, gl, canvas);
  };
  // onmousemove listener
  canvas.onmousemove = function(ev) {
    myMouseMove(ev, gl, canvas);
  };
  // onmouseup listener
  canvas.onmouseup = function(ev) {
    myMouseUp(ev, gl, canvas);
  };

  //tick function -> animation
  var tick = function() {
    animate(); // Update the rotation angle

    draw(gl); // draw objects

    requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
  };
  tick();
}

//handle user input
function submitA() {
  var userInput = document.getElementById("userInput").value;
  //set step using user input
  ANGLE_STEP = userInput;
  console.log("your mess moving speed now is " + ANGLE_STEP);
  document.getElementById("userInput").value = "";
}

function submitB() {
  var userInputHeart = document.getElementById("userInputHeart").value;
  //set step using user input
  cAngle2Step = userInputHeart;
  console.log("your heart moving speed now is " + cAngle2Step);
  document.getElementById("userInputHeart").value = "";
}

function myMouseDown(ev, gl, canvas) {// Called when user PRESSES down any mouse button;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var w = canvas.width;
  var h = canvas.height;

  var canvasX =
    (ev.clientX - rect.left - w / 2) / (w / 2); // normalize canvas to -1 <= x < +1,
  var canvasY =
    (h / 2 - (ev.clientY - rect.top)) / (h / 2); //  -1 <= y < +1.

  isDrag = true; // set our mouse-dragging flag
  if(isDrag)
    console.log("you are dragging your mess");
  xMouseclik = canvasX; // record where mouse-dragging began
  yMouseclik = canvasY;
}

function myMouseMove(ev, gl, canvas) {// Called when user MOVES the mouse with a button already pressed down.
  
  if (isDrag == false) {
    return;
  }
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var w = canvas.width;
  var h = canvas.height;

  var canvasX =
    (ev.clientX - rect.left - w/ 2) / (w / 2); // normalize canvas to -1 <= x < +1,
  var canvasY =
    (h / 2 - (ev.clientY - rect.top)) / (h / 2); // -1 <= y < +1

  // find how far we dragged the mouse:
  myX += canvasX - xMouseclik; // Accumulate change-in-mouse-position,&
  myY += canvasY - yMouseclik;
  xMouseclik = canvasX; // Make next drag-measurement from here.
  yMouseclik = canvasY;
}

function myMouseUp(ev, gl, canvas) {// Called when user LEAVES any mouse button;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var w = canvas.width;
  var h = canvas.height;
  var canvasX =
    (ev.clientX - rect.left - w/ 2) / (w / 2); // normalize canvas to -1 <= x < +1,
  var canvasY =
    (h / 2 - (ev.clientY - rect.top)) / (h / 2); // -1 <= y < +1

  isDrag = false;
  myX += canvasX - xMouseclik;
  myY += canvasY - yMouseclik;

}

function keydown(ev, gl) {// Called when user hits any key button;
  console.log("You are hitting keyboard ")
  switch (ev.keyCode) {
    case 87:
      heartSize += step;
      break;
    case 83:
      heartSize -= step;
    case 65: //a
      heartX -= step;
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
  gl.clear(gl.COLOR_BUFFER_BIT);

  var base = 0.2;
  modelMatrix.setTranslate(0.0, 0.0, 0.0); 

  modelMatrix.rotate(currentAngle, 0, 1, 0); // Rotate around the y-axis
  
  drawMess(gl, base);


  var two = 0.3;

  modelMatrix.translate(0.0, 0.31, 0.34); 
  modelMatrix.translate(0.5, 0.0, 0.0);

  drawMess(gl, two);

  
}

//draw single mess
function drawMess(gl, size) {
  
  pushMatrix(modelMatrix);

  modelMatrix.scale(size, size, size);
  modelMatrix.translate(myX, myY, 0.0);
  // Calculate the model matrix
  // Pass the model matrix to u_ModelMatrix
  updateModelMatrix(modelMatrix);

  // Draw the mess
  gl.drawArrays(gl.LINE_LOOP,0,20);
  
  modelMatrix = popMatrix(); // Retrieve the model matrix 

  // Draw heart
  drawHeart(gl,size);

}

function drawHeart(gl, size){

  pushMatrix(modelMatrix);
  modelMatrix.rotate(cAngle2, 1, 1, 0); // Rotate around the x & y-axis

  modelMatrix.scale(size,size,size); 
  modelMatrix.scale(heartSize,heartSize,heartSize); 
  modelMatrix.translate(heartX, heartY, 0.0);

  updateModelMatrix(modelMatrix);
  gl.drawArrays(gl.LINE_STRIP,20,350);
  modelMatrix = popMatrix(); // Retrieve the model matrix
}


function animate() {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = currentAngle + (ANGLE_STEP * elapsed) / 1000.0;
  currentAngle = (newAngle %= 360);

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


function makeHeart(){
  var data = [];

  //Formula from http://mathworld.wolfram.com/HeartCurve.html
  for (let i = 0; i < 360; i++) {
    t = i;
    x = 16 * Math.pow(Math.sin(t),3);
    y = 13 * Math.cos(t) - 5* Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)
    data = data.concat([x/10,y/10,0.0,1.0]);
  }

  var colors = [];

  for(let j=0;j<360;j++){
      colors.push(1.0);
      colors.push(0.4);
      colors.push(0.4);
  }

  appendPositions(data);
  
  appendColors(colors);

}

function makeMess(){

  // calculated from a dodecahedron
   var t = (1 + Math.sqrt(5)) / 2;
    var r = 1 / t;
  //20 vertices
  var verticesPos = [
    // (±1, ±1, ±1)
    -1, -1, -1, 1,
     -1, -1, 1, 1,  
     -1, 1, -1,1,  
     -1, 1, 1,1,
     1, -1, -1, 1,  
      1, -1, 1, 1,   
      1, 1, -1,1,  
      1, 1, 1,1,

    // (0, ±1/φ, ±φ)
     0, -r, -t,1, 
      0, -r, t,1, 
       0, r, -t,1,  
       0, r, t,1,

    // (±1/φ, ±φ, 0) 
    -r, -t,  0,1,  
    -r,  t, 0,1,  
    r, -t, 0,1,   
    r, t, 0,1,

    // (±φ, 0, ±1/φ)
    -t,  0, -r,1,  
    t,  0, -r,1, 
    -t, 0, r,1,  
    t, 0, r,1,
  ];

  var colors = [
    1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0,
    1.0, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 
    1.0, 1.0, 1.0, 0.4, 1.0, 1.0, 1.0, 1.0, 1.0, 0.4, 1.0, 1.0, 
    1.0, 0.4, 0.4, 0.4, 0.4, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 0.4, 
    1.0, 0.4, 0.4, 0.4, 1.0, 0.4, 1.0, 0.4, 0.4, 0.4, 1.0, 0.4 
  ];

   appendPositions(verticesPos);

   appendColors(colors);
}
