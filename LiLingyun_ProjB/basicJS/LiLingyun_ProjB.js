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

var MOVE_STEP = 0.15;
var LOOK_STEP = 0.02;
var PHI_NOW = 0;
var THETA_NOW = 0;
var LAST_UPDATE = -1;

var g_EyeX = 0.30, g_EyeY = 0.30, g_EyeZ = 4.0; // Eye position
var g_LookAtX = 0.0, g_LookAtY = 0.0, g_LookAtZ = 0.0;// look-at point z-coordinate

var projMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var mvpMatrix = new Matrix4();

var quatMatrix = new Matrix4();   // rotation matrix, made from latest qTot
var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1); // 'current' orientation (made from qNew)

//DAT.GUI
var FizzyText = function() {
  this.position = 'Position';
  this.speed = 30.0;
  this.left = 0.0;
  this.right = 0.0;
  this.bottom = 0.0;
  this.up = 0.0;
  this.near = 1.0;
  this.far = 100.0;
};



window.onload = function() {
  // load controls and canvas
  text = new FizzyText();
  main();
  var gui = new dat.GUI();
  // add controls to GUI
  gui.add(text, 'position').listen();
  gui.add(text, 'speed', -200, 200).onChange(setSpeed);

  var f2 = gui.addFolder('Frustum parameters');
  f2.add(text, 'left').onChange(setLeft);
  // f2.add(text, 'right').onChange(setRight);
  // f2.add(text, 'bottom').onChange(setBottom);  
  // f2.add(text, 'up').onChange(setUp);
  // f2.add(text, 'near').onChange(setNear);
  // f2.add(text, 'far').onChange(setFar);
  f2.open();

};


function main() {
  canvas = document.getElementById("webgl");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight * 0.8;
  // Get the rendering context for WebGL
  gl = init();

  // Additional setup:
  gl.disable(gl.CULL_FACE); // SHOW BOTH SIDES of all triangles
  gl.clearColor(0.25, 0.25, 0.35, 1); // set new screen-clear color, RGBA
  // (for WebGL framebuffer, not canvas)

   
   makeMess();
   makeHeart();
   makeGroundGrid();
   append_Axes();
   append_Wedge();
   makeTorus();
   makeCube();

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

    drawView(gl); // draw objects

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

function setLeft(){
  console.log("set Left:"+ Math.floor(text.left));
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
    console.log("you are dragging your dode");
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
  dragQuat(x - xMouseclik, y - yMouseclik);

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
  dragQuat(x - xMouseclik, y - yMouseclik);

  console.log('myMouseUp: xMdragTot,yMdragTot =',myX,',\t', myY);
};


function dragQuat(xdrag, ydrag) {
  //==============================================================================
  // Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
  // We find a rotation axis perpendicular to the drag direction, and convert the 
  // drag distance to an angular rotation amount, and use both to set the value of 
  // the quaternion qNew.  We then combine this new rotation with the current 
  // rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
  // 'draw()' function converts this current 'qTot' quaternion to a rotation 
  // matrix for drawing. 
    var res = 5;
    var qTmp = new Quaternion(0,0,0,1);
    
    var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
    // console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
    qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
    // (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
                // why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
                // -- to rotate around +x axis, drag mouse in -y direction.
                // -- to rotate around +y axis, drag mouse in +x direction.
                
    qTmp.multiply(qNew,qTot);     // apply new rotation to current rotation. 
    //--------------------------
    // IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
    // ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
    // If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
    // first by qTot, and then by qNew--we would apply mouse-dragging rotations
    // to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
    // rotations FIRST, before we apply rotations from all the previous dragging.
    //------------------------
    // IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
    // them with finite precision. While the product of two (EXACTLY) unit-length
    // quaternions will always be another unit-length quaternion, the qTmp length
    // may drift away from 1.0 if we repeat this quaternion multiply many times.
    // A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
    // Matrix4.prototype.setFromQuat().
  //  qTmp.normalize();           // normalize to ensure we stay at length==1.0.
    qTot.copy(qTmp);
    // show the new quaternion qTot on our webpage in the <div> element 'QuatValue'
    document.getElementById('QuatValue').innerHTML= 
                               '\t X=' +qTot.x.toFixed(res)+
                              'i\t Y=' +qTot.y.toFixed(res)+
                              'j\t Z=' +qTot.z.toFixed(res)+
                              'k\t W=' +qTot.w.toFixed(res)+
                              '<br>length='+qTot.length().toFixed(res);
  };


function keydown(ev, gl) {// Called when user hits any key button;
    
  if(ev.keyCode == 39) { // right arrow - step right
    up = new Vector3();
    up[0] = 0;
    up[1] = 1;
    up[2] = 0;
    look = new Vector3();
    look = vec3FromEye2LookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ);

    tmpVec3 = new Vector3();
    tmpVec3 = vec3CrossProduct(up, look);

    //console.log(tmpVec3[0], tmpVec3[1], tmpVec3[2]);

    g_EyeX -= MOVE_STEP * tmpVec3[0];
    g_EyeY -= MOVE_STEP * tmpVec3[1];
    g_EyeZ -= MOVE_STEP * tmpVec3[2];

    g_LookAtX -= MOVE_STEP * tmpVec3[0];
    g_LookAtY -= MOVE_STEP * tmpVec3[1];
    g_LookAtZ -= MOVE_STEP * tmpVec3[2];

    console.log('eyeX=',g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ, 'lookAtX=', g_LookAtX, 'lookAtY=', g_LookAtY, 'lookAtZ=', g_LookAtZ);
} 
else 
if (ev.keyCode == 37) { // left arrow - step left
    up = new Vector3();
    up[0] = 0;
    up[1] = 1;
    up[2] = 0;
    look = new Vector3();
    look = vec3FromEye2LookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ);

    tmpVec3 = new Vector3();
    tmpVec3 = vec3CrossProduct(up, look);

    //console.log(tmpVec3[0], tmpVec3[1], tmpVec3[2]);

    g_EyeX += MOVE_STEP * tmpVec3[0];
    g_EyeY += MOVE_STEP * tmpVec3[1];
    g_EyeZ += MOVE_STEP * tmpVec3[2];

    g_LookAtX += MOVE_STEP * tmpVec3[0];
    g_LookAtY += MOVE_STEP * tmpVec3[1];
    g_LookAtZ += MOVE_STEP * tmpVec3[2];

    console.log('eyeX=',g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ, 'lookAtX=', g_LookAtX, 'lookAtY=', g_LookAtY, 'lookAtZ=', g_LookAtZ);
} 
else 
if (ev.keyCode == 38) { // up arrow - step forward

    tmpVec3 = new Vector3();
    tmpVec3 = vec3FromEye2LookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ);
    
    g_EyeX += MOVE_STEP * tmpVec3[0];
    g_EyeY += MOVE_STEP * tmpVec3[1];
    g_EyeZ += MOVE_STEP * tmpVec3[2];

    g_LookAtX += MOVE_STEP * tmpVec3[0];
    g_LookAtY += MOVE_STEP * tmpVec3[1];
    g_LookAtZ += MOVE_STEP * tmpVec3[2];

    console.log('eyeX=',g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ, 'lookAtX=', g_LookAtX, 'lookAtY=', g_LookAtY, 'lookAtZ=', g_LookAtZ);

} 
else 
if (ev.keyCode == 40) { // down arrow - step backward
    tmpVec3 = new Vector3();
    tmpVec3 = vec3FromEye2LookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ);
    
    g_EyeX -= MOVE_STEP * tmpVec3[0];
    g_EyeY -= MOVE_STEP * tmpVec3[1];
    g_EyeZ -= MOVE_STEP * tmpVec3[2];

    g_LookAtX -= MOVE_STEP * tmpVec3[0];
    g_LookAtY -= MOVE_STEP * tmpVec3[1];
    g_LookAtZ -= MOVE_STEP * tmpVec3[2];

    console.log('eyeX=',g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ, 'lookAtX=', g_LookAtX, 'lookAtY=', g_LookAtY, 'lookAtZ=', g_LookAtZ);
} 
else
if (ev.keyCode == 65){ // a - look left
  if(LAST_UPDATE==-1 || LAST_UPDATE==0)
    {
      a = g_LookAtX - g_EyeX;
      b = g_LookAtY - g_EyeY;
      c = g_LookAtZ - g_EyeZ;
      l = Math.sqrt(a*a + b*b + c*c);
      
      lzx = Math.sqrt(a*a+c*c);
      sin_phi = lzx / l;

      theta0 = Math.PI -  Math.asin(a/lzx);

      THETA_NOW = theta0 + LOOK_STEP;
      
      LAST_UPDATE = 1;
    }
    else
    {
      THETA_NOW += LOOK_STEP;
    }

    g_LookAtY = b + g_EyeY;
    g_LookAtX = l * sin_phi * Math.sin(THETA_NOW) + g_EyeX;
    g_LookAtZ = l * sin_phi * Math.cos(THETA_NOW) + g_EyeZ;
}
else
  if(ev.keyCode==68){//d - look right
    if (LAST_UPDATE==-1 || LAST_UPDATE==0)
    {
      a = g_LookAtX - g_EyeX;
      b = g_LookAtY - g_EyeY;
      c = g_LookAtZ - g_EyeZ;
      l = Math.sqrt(a*a + b*b + c*c);
      lzx = Math.sqrt(a*a+c*c);
      sin_phi = lzx / l;

      theta0 = Math.PI -  Math.asin(a/lzx);

      THETA_NOW = theta0 - LOOK_STEP;
      
      LAST_UPDATE = 1;
    }
    else
    {
      THETA_NOW -= LOOK_STEP;
    }

    g_LookAtY = b + g_EyeY;
    g_LookAtX = l * sin_phi * Math.sin(THETA_NOW) + g_EyeX;
    g_LookAtZ = l * sin_phi * Math.cos(THETA_NOW) + g_EyeZ;
  }
else
  if(ev.keyCode==87){ //w - look up
    if (LAST_UPDATE==-1 || LAST_UPDATE==1)
    {  
      a = g_LookAtX - g_EyeX;
      b = g_LookAtY - g_EyeY;
      c = g_LookAtZ - g_EyeZ;
      l = Math.sqrt(a*a + b*b + c*c);
      cos_theta = c / Math.sqrt(a*a + c*c);
      sin_theta = a / Math.sqrt(a*a + c*c);

      phi0 = Math.asin(b/l);

      PHI_NOW = phi0 + LOOK_STEP;
      LAST_UPDATE = 0;
    }
    else
    {
      PHI_NOW += LOOK_STEP;
    }

    g_LookAtY = l * Math.sin(PHI_NOW) + g_EyeY;
    g_LookAtX = l * Math.cos(PHI_NOW) * sin_theta + g_EyeX;
    g_LookAtZ = l * Math.cos(PHI_NOW) * cos_theta + g_EyeZ;
  }
else
  if(ev.keyCode==83){ //s-look down
    if(LAST_UPDATE==-1 || LAST_UPDATE==1)
    { 
      a = g_LookAtX - g_EyeX;
      b = g_LookAtY - g_EyeY;
      c = g_LookAtZ - g_EyeZ;
      l = Math.sqrt(a*a + b*b + c*c);

      cos_theta = c / Math.sqrt(a*a + c*c);
      sin_theta = a / Math.sqrt(a*a + c*c);

      phi0 = Math.asin(b/l);

      PHI_NOW = phi0 - LOOK_STEP;
      
      
      LAST_UPDATE = 0;
    }
    else
    {
      PHI_NOW -= LOOK_STEP;
    }

    g_LookAtY = l * Math.sin(PHI_NOW) + g_EyeY;
    g_LookAtX = l * Math.cos(PHI_NOW) * sin_theta + g_EyeX;
    g_LookAtZ = l * Math.cos(PHI_NOW) * cos_theta + g_EyeZ;
  }
}

function vec3FromEye2LookAt(eyeX, eyeY, eyeZ, lookAtX, lookAtY, lookAtZ)
{
  result = new Vector3();
  
  dx = lookAtX - eyeX;
  dy = lookAtY - eyeY;
  dz = lookAtZ - eyeZ;
  amp = Math.sqrt(dx*dx + dy*dy + dz*dz);

  result[0] = dx/amp;
  result[1] = dy/amp;
  result[2] = dz/amp;

  return result;
}

function vec3CrossProduct(up, look) //UpVec x LookVec --> Left Vec
{
  r = new Vector3();

  r[0] = up[1]*look[2] - up[2]*look[1];
  r[1] = up[2]*look[0] - up[0]*look[2];
  r[2] = up[0]*look[1] - up[1]*look[0];

  amp = Math.sqrt(r[0]*r[0] + r[1]*r[1] + r[2]*r[2]) + 0.000001;

  r[0] /= amp;
  r[1] /= amp;
  r[2] /= amp;

  return r;
}


function drawView(gl){
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, canvas.width / 2, canvas.height);
  projMatrix.setPerspective(35, (0.5 * canvas.width) / canvas.height, 1, 100);
  viewMatrix.setLookAt(g_EyeX,g_EyeY, g_EyeZ,      // center of projection
    g_LookAtX, g_LookAtY, g_LookAtZ,      // look-at point 
     0,  1,  0);     // 'up' vector
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  updateMvpMatrix(mvpMatrix);

  draw(gl);

  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  projMatrix.setOrtho(-0.5*canvas.width/600, 0.5*canvas.width/600,          // left,right;
    -canvas.height/600, canvas.height/600,          // bottom, top;
    1, 100);       // near, far; (always >=0)
  viewMatrix.setLookAt(g_EyeX,g_EyeY, g_EyeZ,      // center of projection
    g_LookAtX, g_LookAtY, g_LookAtZ,   // look-at point 
      0,  1,  0);     // 'up' vector
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  updateMvpMatrix(mvpMatrix);
  draw(gl);

}
function draw(gl) {
  // Draw a new on-screen image.
  modelMatrix.setIdentity(); 
  modelMatrix.setTranslate(0.0, 0.0, 0.0);
  modelMatrix.rotate(70,1,0,0);
  // Be sure to clear the screen before re-drawing ...
  //modelMatrix.setTranslate(0.0, 0.0, 0.0);
  pushMatrix(modelMatrix);     // SAVE world coord system;
  modelMatrix.setTranslate(0.0, 0.0, 0.0);
  // draw ground grid
  viewMatrix.rotate(-90.0, 1,0,0); 
  viewMatrix.translate(0.0, 0.0, -0.6); 
  viewMatrix.scale(0.6, 0.6,0.6);  
 
  drawGround(gl);
  modelMatrix.setTranslate(0.3,-2,0);
  // draw ground axes
  drawAxes(gl);
  modelMatrix = popMatrix(); 
  pushMatrix(modelMatrix); 

  // draw tetrahedron 
  modelMatrix.setTranslate(-1.5,-1,0);
  modelMatrix.rotate(-currentAngle, 0, 0, 1);
  drawAxes(gl);
  modelMatrix.scale(0.4, 0.4, 0.4);
  drawFullWedge(gl);
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  // draw toru
  modelMatrix.setTranslate(-0.4, -1, 0.2);
  modelMatrix.scale(1,1,-1);	
  modelMatrix.scale(0.3, 0.3, 0.3);
  modelMatrix.rotate(currentAngle, 0, 1, 1);
  drawToru(gl);
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //draw cube
  modelMatrix.setTranslate(1.5, 1.5, 0.3);
  modelMatrix.scale(0.3, 0.3, 0.3);
  modelMatrix.rotate(currentAngle, 0, 0, 1);
  drawCube(gl);
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  // draw spinning  dodecahedron;
  modelMatrix.setTranslate(0.42, 0.4, 0.5); 
  
    // Let mouse-drag move the drawing axes before we do any other drawing:
  quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w); // Quaternion-->Matrix
  modelMatrix.concat(quatMatrix); // apply that matrix.
  drawAxes(gl);
  modelMatrix.scale(0.5,0.5,0.5);
  drawMess(gl);

  modelMatrix = popMatrix(); 

  pushMatrix(modelMatrix); 

//draw joint hearts
  modelMatrix.setTranslate(1.5, -0.6, 0.0);

   pushMatrix(modelMatrix); 
// Rocking the heart-shaped dish:-----------------------------------
  //on the bottom of to the 2nd hollow heart
   var sizeSecond = 0.3;

   modelMatrix.translate(-0.5, -0.48, 0.2); 
   modelMatrix.rotate(-180, 1, 0, 0); // Rotate -300 around the x-axis
   modelMatrix.rotate(currentAngle, 0, 0, -1); // Rotate around the z-axis
   
   drawheart(gl,sizeSecond);
  // END of Rocking the heart-shaped dish:---------------------------- 
  // Rocking 1st hollow heart:-----------------------------------
  var size = 0.15;
  modelMatrix.rotate(90,0,1,0)
  modelMatrix.rotate(-90,0,0,1)
  modelMatrix.translate(0.0,0.18,0.0)
  modelMatrix.rotate(cAngle2, 0, 1, 0); // Rotate around the x & y-axis
  drawheart(gl,size);
  // END of Rocking 1st hollow heart:---------------------------- 
  modelMatrix.translate(0.0, 0.35, 0.0); 
   //drawAxes(gl);
   drawheart(gl,size);
  // END of Rocking 2nd  heart:---------------------------- 
  // Rocking 1st hollow LINE heart:-----------------------------------
  // on the top of hollow heart
   var sizeThird = 0.14;

   modelMatrix.translate(0.0, 0.1, 0.0); 
   modelMatrix.rotate(300+cAngle2, -1, 0, 0); // Rotate negatively around the x-axis
   modelMatrix.scale(0.6,0.6,0.6);   // SHRINK axes by 60% for this heart
   modelMatrix.translate(0.0, 0.23, 0.0); 

   drawheart(gl,sizeThird);
  // END of Rocking 1st hollow LINE heart:---------------------------- 
  // Rocking 2nd hollow LINE heart:-----------------------------------
  // on the top of hollow heart
  var sizeThird = 0.14;

  modelMatrix.translate(0.0, 0.1, 0.0); 
  modelMatrix.rotate(300+cAngle2, 1, 0, 0); // Rotate negatively around the x-axis
  modelMatrix.scale(0.6,0.6,0.6);   // SHRINK axes by 60% for this heart
  modelMatrix.translate(0.0, 0.23, 0.0); 

  drawheart(gl,sizeThird);
 // END of Rocking 2nd hollow LINE heart:---------------------------- 
   modelMatrix = popMatrix();

}

//draw single dodecahedron
function drawMess(gl) {
  
  pushMatrix(modelMatrix);

  updateModelMatrix(modelMatrix);
  // Calculate the model view projection matrix
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  updateMvpMatrix(mvpMatrix);

  // Draw the dodecahedron
  gl.drawArrays(gl.TRIANGLE_STRIP,0,180);
  
  modelMatrix = popMatrix(); // Retrieve the model matrix 

}

function drawAxes(gl) {
  //-----------------------------------------------------------------------------
  // Calculate the model view projection matrix
  updateModelMatrix(modelMatrix);
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  updateMvpMatrix(mvpMatrix);
  gl.drawArrays(gl.LINES,1300,6);   // 2nd set of 6 verts in GPU.
}

function drawFullWedge(gl) {
  //-----------------------------------------------------------------------------
  // Draw all 4 triangles of our tetrahedron
  // base is in z=0 plane centered at origin; apex on z axis.
    pushMatrix(modelMatrix);  // SAVE the given myMatrix contents, then:
    updateModelMatrix(modelMatrix);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
    updateMvpMatrix(mvpMatrix);
    gl.drawArrays(gl.TRIANGLE_STRIP,1306,6); // DRAW 4 triangles.
    modelMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}

function drawToru(gl){
  pushMatrix(modelMatrix);
  updateModelMatrix(modelMatrix);
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  updateMvpMatrix(mvpMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP,1312,600); // DRAW 4 triangles.
  modelMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}

function drawCube(gl){
  pushMatrix(modelMatrix);
  updateModelMatrix(modelMatrix);
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  updateMvpMatrix(mvpMatrix);
  gl.drawArrays(gl.TRIANGLES,1912,36); // DRAW 4 triangles.
  modelMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}

function drawheart(gl, size){

  pushMatrix(modelMatrix);
  
  modelMatrix.scale(size,size,size); 
  updateModelMatrix(modelMatrix);
  // Calculate the model view projection matrix
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  updateMvpMatrix(mvpMatrix);
  // when size equals to 0.15, draw a hollow heart
  // when size equals to 0.3, draw a heart-shaped dish
  // else draw a line-shaped heart
  if(size === 0.15)
    gl.drawArrays(gl.LINE_STRIP,180,720);
  else if(size === 0.3)
    gl.drawArrays(gl.TRIANGLE_FAN,180,720);
  else
    gl.drawArrays(gl.LINES,180,720);
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
  // Calculate the model view projection matrix
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  updateMvpMatrix(mvpMatrix);
  // Draw just the ground-plane's vertices
  gl.drawArrays(gl.LINES,                 // use this drawing primitive, and
                900, // start at this vertex number, and
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
  // group vertices: 400
  for(var j=0; j< 400; j++){
    verticesColors = verticesColors.concat(colr);
  }
  // 6 vertices
  var colrA = [1.0, 0.2, 0.2, 1.0,   // bright red
    1.0, 0.2, 0.2, 1.0,
    0.2, 1.0, 0.2, 1.0,   // bright green
    0.2, 1.0, 0.2, 1.0,
    0.2, 0.2, 1.0, 1.0,   // bright blue.
    0.2, 0.2, 1.0, 1.0,];
  verticesColors = verticesColors.concat(colrA);
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
  }

  appendPositions(gndVerts);
}

function append_Axes() {
  //-----------------------------------------------------------------------------
  // Create & store 'Axes' 3D part that uses gl.LINES primitives to draw 
  // the +x,+y,+z axes as unit-length red,green,blue lines outwards from origin,
  // using the CURRENT DRAWING AXES (as defined my ModelMatrix on GPU).
    appendPositions([0.0, 0.0, 0.0, 1.0,      // x axis
                     1.0, 0.0, 0.0, 1.0,
                     0.0, 0.0, 0.0, 1.0,      // y axis
                     0.0, 1.0, 0.0, 1.0,
                     0.0, 0.0, 0.0, 1.0,      // z axis
                     0.0, 0.0, 1.0, 1.0, ]);
}

function append_Wedge() {
  //------------------------------------------------------------------------------
  // Create & store a 2-triangle wedge-like 3D part.
  // (from old 5.04.ControlMulti starter code).
    var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
    var sq2	= Math.sqrt(2.0);						
  
  /*
    // Coordinates(x,y,z,w) and colors (R,G,B,A) for a tetrahedron:
    // Apex on +z axis; equilateral triangle base at z=0 centered at origin.
    Nodes:
       0.0,	 0.0, sq2, 1.0,		// n0 (apex, +z axis;  white)
       c30, -0.5, 0.0, 1.0, 	// n1 (base: lower rt; blue)
       0.0,  1.0, 0.0, 1.0,  	// n2 (base: +y axis;  red)
      -c30, -0.5, 0.0, 1.0, 	// n3 (base:lower lft; grn)
        // Face 0: (right side);  Node 0,1,2
        // Face 1: (left side);   Node 0,2,3
        // Face 2: (lower side);  Node 0,3,1    // Use these last 2 faces...
        // Face 3: (base side);   Node 3,2,1.  
  */
    appendPositions([  0.0,  0.0, sq2, 1.0,  // node 0     // triangle-strip.  
                      -c30, -0.5, 0.0, 1.0,  // node 3     // Draw 1st 4 verts only.
                       c30, -0.5, 0.0, 1.0,  // node 1
                       0.0,  1.0, 0.0, 1.0,  // node 2
                       0.0,	 0.0, sq2, 1.0,  // node 0
                      -c30, -0.5, 0.0, 1.0,  // node 3
    ]);
    appendColors([1.0, 0.4, 0.4, 1.0,  
      1.0, 1.0, 0.0, 1.0,  
      0.8, 0.5, 1.0, 1.0, 
      1.0, 0.4, 1.0, 1.0,  
      1.0, 1.0, 0.0, 1.0,  
      0.6, 0.8, 1.0, 1.0, 
                ]);
  
}

function makeTorus() {
  //==============================================================================
  // 		Create a torus centered at the origin that circles the z axis.  
  // Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
  // into a circle around the z-axis. The bent bar's centerline forms a circle
  // entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
  // bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
  // around the z-axis in counter-clockwise (CCW) direction, consistent with our
  // right-handed coordinate system.
  // 		This bent bar forms a torus because the bar itself has a circular cross-
  // section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
  // around the bar's centerline, circling right-handed along the direction 
  // forward from the bar's start at theta=0 towards its end at theta=2PI.
  // 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
  // a slight increase in phi moves that point in -z direction and a slight
  // increase in theta moves that point in the +y direction.  
  // To construct the torus, begin with the circle at the start of the bar:
  //					xc = rbend + rbar*cos(phi); 
  //					yc = 0; 
  //					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
  // and then rotate this circle around the z-axis by angle theta:
  //					x = xc*cos(theta) - yc*sin(theta) 	
  //					y = xc*sin(theta) + yc*cos(theta)
  //					z = zc
  // Simplify: yc==0, so
  //					x = (rbend + rbar*cos(phi))*cos(theta)
  //					y = (rbend + rbar*cos(phi))*sin(theta) 
  //					z = -rbar*sin(phi)
  // To construct a torus from a single triangle-strip, make a 'stepped spiral' 
  // along the length of the bent bar; successive rings of constant-theta, using 
  // the same design used for cylinder walls in 'makeCyl()' and for 'slices' in 
  // makeSphere().  Unlike the cylinder and sphere, we have no 'special case' 
  // for the first and last of these bar-encircling rings.
  //
  var rbend = 1.0;										// Radius of circle formed by torus' bent bar
  var rbar = 0.5;											// radius of the bar we bent to form torus
  var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
                                      // more segments for more-circular torus
  var barSides = 13;										// # of sides of the bar (and thus the 
                                      // number of vertices in its cross-section)
                                      // >=3 req'd;
                                      // more sides for more-circular cross-section
  // for nice-looking torus with approx square facets, 
  //			--choose odd or prime#  for barSides, and
  //			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
  // EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.
  
    // Create a (global) array to hold this torus's vertices:
   var torVerts = [];
  //	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
  // triangle and last slice will skip its last triangle. To 'close' the torus,
  // repeat the first 2 vertices at the end of the triangle-strip.  Assume 7
  
  var phi=0, theta=0;										// begin torus at angles 0,0
  var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
  var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
                                        // (WHY HALF? 2 vertices per step in phi)
    // s counts slices of the bar; v counts vertices within one slice; j counts
    // array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
    for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
      for(v=0; v< 2*barSides; v++, j+=4) {		// for each vertex in this slice:
        if(v%2==0)	{	// even #'d vertices at bottom of slice,
          torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
                                               Math.cos((s)*thetaStep);
                  //	x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
                                               Math.sin((s)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;		// w
        }
        else {				// odd #'d vertices at top of slice (s+1);
                      // at same phi used at bottom of slice (v-1)
          torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
                                               Math.cos((s+1)*thetaStep);
                  //	x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
                                               Math.sin((s+1)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;		// w
        }
      }
    }
    // Repeat the 1st 2 vertices of the triangle strip to complete the torus:
        torVerts[j  ] = rbend + rbar;	// copy vertex zero;
                //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
        torVerts[j+1] = 0.0;
                //  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
        torVerts[j+2] = 0.0;
                //  z = -rbar  *   sin(phi==0)
        torVerts[j+3] = 1.0;	
        j+=4; // go to next vertex:
        torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
                //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
        torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
                //  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
        torVerts[j+2] = 0.0;
                //  z = -rbar  *   sin(phi==0)
        torVerts[j+3] = 1.0;		// w
        appendPositions(torVerts);

        var torColors = [];
        // generate colors for 600 vertices
        for(var i = 0; i< 40; i++){
          torColors = torColors.concat(color);
        }
        appendColors(torColors);

}

function makeCube(){
  // 36 vertices
  var cubeVert = [
    // Front face
    -1.0, -1.0,  1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,
     1.0,  1.0,  1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
    
    // Back face
    -1.0, -1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
     1.0, -1.0, -1.0, 1.0,
     1.0, -1.0, -1.0, 1.0,
     1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    
    // Top face
    -1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
     1.0,  1.0, -1.0, 1.0,
     1.0,  1.0, -1.0, 1.0,
     1.0,  1.0,  1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
    
    // Bottom face
    -1.0, -1.0, -1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,
     1.0, -1.0, -1.0, 1.0,
     1.0, -1.0, -1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,
    
    // Right face
     1.0, -1.0, -1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,
     1.0,  1.0, -1.0, 1.0,
     1.0,  1.0, -1.0, 1.0,
     1.0,  1.0,  1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,
    
    // Left face
    -1.0, -1.0, -1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,
  ]

 appendPositions(cubeVert);
 var cubeColr = [];
 cubeColr = cubeColr.concat(color);
 cubeColr = cubeColr.concat(color);
 var seColr = [ 1.0, 0.4, 0.4, 1.0,  1.0, 1.0, 0.0, 1.0,  0.8, 0.5, 1.0, 1.0, 
  1.0, 0.4, 1.0, 1.0,  1.0, 1.0, 0.0, 1.0,  0.6, 0.8, 1.0, 1.0,];
  cubeColr = cubeColr.concat(seColr);
  appendColors(cubeColr);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight * 0.8;
}