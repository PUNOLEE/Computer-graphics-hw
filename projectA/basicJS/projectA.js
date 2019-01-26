var ANGLE_STEP = 30.0;

var g_mvpMatrix = new Matrix4();
var g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals

var g_last = Date.now(); // Timestamp for most-recently-drawn image;
var isDrag = false;
var xMouseclik = 0.0;
var yMouseclik = 0.0;
var step = 0.1;
var x = 0;
var y = 0;
var currentAngle = 0.0;
var right = true;

function main() {
  var canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = init();

  // Additional setup:
  gl.disable(gl.CULL_FACE); // SHOW BOTH SIDES of all triangles
  gl.clearColor(0.25, 0.25, 0.25, 1); // set new screen-clear color, RGBA
  // (for WebGL framebuffer, not canvas)

  // Set the vertex coordinates and color
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log("Failed to set the vertex information");
    return;
  }

  // Get the storage location of u_MvpMatrix,u_NormalMatrix,u_LightColor,u_LightPosition,u_AmbientLight
  var u_MvpMatrix = gl.getUniformLocation(gl.program, "u_MvpMatrix");
  var u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  var u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
  var u_LightPosition = gl.getUniformLocation(gl.program, "u_LightPosition");
  var u_AmbientLight = gl.getUniformLocation(gl.program, "u_AmbientLight");
  if (
    !u_MvpMatrix ||
    !u_NormalMatrix ||
    !u_LightColor ||
    !u_LightPosition ||
    !u_AmbientLight
  ) {
    console.log("Failed to get the storage location");
    return;
  }

  var vpMatrix = new Matrix4(); // View projection matrix
  vpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
  vpMatrix.lookAt(6, 6, 14, 0, 0, 0, 0, 1, 0);

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

  // onkeydown listener
  document.onkeydown = function(ev) {
    keydown(ev, gl, n, vpMatrix, u_MvpMatrix, u_NormalMatrix);
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
    currentAngle = animate(currentAngle); // Update the rotation angle

    draw(gl, n, vpMatrix, u_MvpMatrix, u_NormalMatrix); // draw objects

    requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
  };
  tick();
}

//handle user input
function submitA() {
  var userInput = document.getElementById("userInput").value;
  //set step using user input
  ANGLE_STEP = userInput;
  document.getElementById("userInput").value = "";
}

function myMouseDown(ev, gl, canvas) {// Called when user PRESSES down any mouse button;
  
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge

  // Convert to Canonical View Volume (CVV) coordinates too:
  var cx =
    (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var cy =
    (yp - canvas.height / 2) / //                     -1 <= y < +1.
    (canvas.height / 2);

  isDrag = true; // set our mouse-dragging flag
  xMouseclik = cx; // record where mouse-dragging began
  yMouseclik = cy;
}

function myMouseMove(ev, gl, canvas) {// Called when user MOVES the mouse with a button already pressed down.
  
  if (isDrag == false) {
    return;
  }
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge

  // Convert to Canonical View Volume (CVV) coordinates too:
  var cx =
    (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var cy =
    (yp - canvas.height / 2) / //                     -1 <= y < +1.
    (canvas.height / 2);

  // find how far we dragged the mouse:
  x += cx - xMouseclik; // Accumulate change-in-mouse-position,&
  y += cy - yMouseclik;
  xMouseclik = cx; // Make next drag-measurement from here.
  yMouseclik = cy;
}

function myMouseUp(ev, gl, canvas) {// Called when user LEAVES any mouse button;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge

  // Convert to Canonical View Volume (CVV) coordinates too:
  var cx =
    (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var cy =
    (yp - canvas.height / 2) / //                     -1 <= y < +1.
    (canvas.height / 2);
  isDrag = false;
  x += cx - xMouseclik;
  y += cy - yMouseclik;

}

function keydown(ev, gl, n, vpMatrix, u_MvpMatrix, u_NormalMatrix) {// Called when user hits any key button;
  switch (ev.keyCode) {
    case 65: //a
      x -= step;
      break;
    case 68: //d
      x += step;
      break;
    case 40: // Up arrow key
      y -= step;
      break;
    case 38: // Down arrow key
      y += step;
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
  // Draw dodecahedrons
  draw(gl, n, vpMatrix, u_MvpMatrix, u_NormalMatrix);
}

function draw(gl, n, vpMatrix, u_MvpMatrix, u_NormalMatrix) {
  //draw single dodecahedron
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var base = 0.5;
  modelMatrix.setRotate(currentAngle, 0, 1, 0); // Rotate around the y-axis
  drawDod(gl, n, base, vpMatrix, u_MvpMatrix, u_NormalMatrix);

  var next = 1.0;
  modelMatrix.setRotate(currentAngle, 0, 0, 1); // Rotate around the  z-axis
  modelMatrix.translate(1.26, 2, 0.5);
  drawDod(gl, n, next, vpMatrix, u_MvpMatrix, u_NormalMatrix);

  var third = 1.5;
  modelMatrix.setRotate(currentAngle, 1, 0, 1); // Rotate around the x & z-axis
  modelMatrix.translate(-1.5, 0.3, 2.53);
  drawDod(gl, n, third, vpMatrix, u_MvpMatrix, u_NormalMatrix);
}

//draw single dodecahedron
function drawDod(gl, n, width, vpMatrix, u_MvpMatrix, u_NormalMatrix) {
  
  pushMatrix(modelMatrix);
  modelMatrix.scale(width, width, width);

  modelMatrix.translate(x, y, 0.0);

  // Calculate the model matrix
  //modelMatrix.translate(x,y,0.0);
  // Pass the model matrix to u_ModelMatrix
  updateModelMatrix(modelMatrix);

  // Pass the model view projection matrix to u_MvpMatrix
  g_mvpMatrix.set(vpMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

  // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
  g_normalMatrix.setInverseOf(modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

  // Draw the dodecahedron
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  modelMatrix = popMatrix(); // Retrieve the model matrix
  //console.log("draw")
}

function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return (newAngle %= 360);
}

function initVertexBuffers(gl) {
  var t = (1 + Math.sqrt(5)) / 2;
  var r = 1 / t;
  //20 vertices
  var vertices = new Float32Array([
    // (±1, ±1, ±1)
    -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1,
     1, -1, -1,  1, -1, 1,  1, 1, -1,  1, 1, 1,

    // (0, ±1/φ, ±φ)
     0, -r, -t,  0, -r, t,  0, r, -t,  0, r, t,

    // (±1/φ, ±φ, 0) 
    -r, -t,  0, -r,  t, 0,  r, -t, 0,  r, t, 0,

    // (±φ, 0, ±1/φ)
    -t,  0, -r,  t,  0, -r, -t, 0, r,  t, 0, r
  ]);

  // Colors
  var colors = new Float32Array([
    1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0,
    1.0, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 
    1.0, 1.0, 1.0, 0.4, 1.0, 1.0, 1.0, 1.0, 1.0, 0.4, 1.0, 1.0, 
    1.0, 0.4, 0.4, 0.4, 0.4, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 0.4, 
    1.0, 0.4, 0.4, 0.4, 1.0, 0.4, 1.0, 0.4, 0.4, 0.4, 1.0, 0.4 
  ]);

  // Normal
  var normals = new Float32Array([
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 
    -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 
    -1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0, 0.0 
  ]);
  // Indices of the vertices
  var indices = new Uint8Array([
   3, 11, 7,  3, 7, 15,   3, 15, 13,
    7, 19, 17,  7, 17, 6,   7, 6, 15,
    17, 4, 8,   17, 8, 10,  17, 10, 6,
    8, 0, 16,   8, 16, 2,   8, 2, 10,
    0, 12, 1,   0, 1, 18,   0, 18, 16,
    6, 10, 2,   6, 2, 13,   6, 13, 15,
    2, 16, 18,  2, 18, 3,   2, 3, 13,
    18, 1, 9,   18, 9, 11,  18, 11, 3,
    4, 14, 12,  4, 12, 0,   4, 0, 8,
    11, 9, 5,   11, 5, 19,  11, 19, 7,
    19, 5, 14,  19, 14, 4,  19, 4, 17,
    1, 12, 14,  1, 14, 5,   1, 5, 9
  ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, "a_Position", vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, "a_Color", colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, "a_Normal", normals, 3, gl.FLOAT)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log("Failed to create the buffer object");
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log("Failed to create the buffer object");
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log("Failed to get the storage location of " + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}
