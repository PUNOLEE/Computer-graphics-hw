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
  modelMatrix.setTranslate(0.0, 0.5, 0.0); 

  modelMatrix.rotate(currentAngle, 0, 1, 0); // Rotate around the y-axis
  
  drawMess(gl, base);


  var two = 0.3;

  modelMatrix.translate(0.0, 0.31, 0.34); 
  modelMatrix.translate(0.5, 0.0, 0.0);
  modelMatrix.rotate(currentAngle, 1, 1, 0);

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
  gl.drawArrays(gl.TRIANGLE_STRIP,0,180);
  
  modelMatrix = popMatrix(); // Retrieve the model matrix 

  // Draw heart
  modelMatrix.translate(-0.5, -0.5, 0.0);
  drawHeart(gl,size);

}

function drawHeart(gl, size){

  pushMatrix(modelMatrix);
  modelMatrix.rotate(cAngle2, 1, 1, 0); // Rotate around the x & y-axis

  modelMatrix.scale(size,size,size); 
  modelMatrix.scale(heartSize,heartSize,heartSize); 
  modelMatrix.translate(heartX, heartY, 0.0);

  updateModelMatrix(modelMatrix);
  gl.drawArrays(gl.TRIANGLE_FAN,180,350*2);
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

var color = [
    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,
    1.0, 0.5, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4, 
    1.0, 0.5, 1.0,  0.4, 1.0, 0.4,  1.0, 0.5, 1.0,  0.4, 1.0, 1.0, 
    1.0, 0.4, 0.4,  0.4, 0.4, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 0.4, 
    1.0, 0.4, 0.4,  0.4, 1.0, 0.4,  1.0, 0.4, 0.4,  0.4, 1.0, 0.4 
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
  for(var i = 0; i< 36; i++){
    colors.push.apply(colors, color);
  }

  appendPositions(data);
  
  appendColors(colors);

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

  var egdeVs = [
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

  for (var i = 0; i <egdeVs.length; i += 15) {
    var a = [egdeVs[i],egdeVs[i + 1],egdeVs[i + 2]];
    var b = [egdeVs[i + 3],egdeVs[i + 4],egdeVs[i + 5]];
    var c = [egdeVs[i + 6],egdeVs[i + 7],egdeVs[i + 8]];
    var d = [egdeVs[i + 9],egdeVs[i + 10],egdeVs[i + 11]];
    var e = [egdeVs[i + 12],egdeVs[i + 13],egdeVs[i + 14]];
    var center = [
      (a[0] + b[0] + c[0] + d[0] + e[0]) / 5,
      (a[1] + b[1] + c[1] + d[1] + e[1]) / 5,
      (a[2] + b[2] + c[2] + d[2] + e[2]) / 5
    ];

    // 5 triangles
    vertices.push.apply(vertices, a);vertices.push(1.0);
    vertices.push.apply(vertices, b);vertices.push(1.0);
    vertices.push.apply(vertices, center);vertices.push(1.0);

    vertices.push.apply(vertices, b);vertices.push(1.0);
    vertices.push.apply(vertices, c);vertices.push(1.0);
    vertices.push.apply(vertices, center);vertices.push(1.0);

    vertices.push.apply(vertices, c);vertices.push(1.0);
    vertices.push.apply(vertices, d);vertices.push(1.0);
    vertices.push.apply(vertices, center);vertices.push(1.0);

    vertices.push.apply(vertices, d);vertices.push(1.0);
    vertices.push.apply(vertices, e);vertices.push(1.0);
    vertices.push.apply(vertices, center);vertices.push(1.0);

    vertices.push.apply(vertices, e);vertices.push(1.0);
    vertices.push.apply(vertices, a);vertices.push(1.0);
    vertices.push.apply(vertices, center);vertices.push(1.0);
  }

  var verticesColors = [];
  
  for(var i = 0; i< 36; i++){
    verticesColors.push.apply(verticesColors, color);
  }
  

   appendPositions(vertices);

   appendColors(verticesColors);
}
