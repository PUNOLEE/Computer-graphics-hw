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
var g_EyeX = 20.00,
    g_EyeY = 0.20,
    g_EyeZ = 2.00;
//var g_EyeX = 0.30, g_EyeY = 0.30, g_EyeZ = 4.0; // Eye position
var g_LookAtX = 0.0, g_LookAtY = 0.0, g_LookAtZ = 0.0;// look-at point z-coordinate
var g_LambAtX = 5.0, g_LambAtY = 5.0, g_LambAtZ = 20.0;
var lampAmbiR = 1.0, lampAmbiG = 1.0, lampAmbiB = 1.0;
var lampDiffR = 1.0, lampDiffG = 1.0, lampDiffB = 1.0;
var lampSpecR = 1.0, lampSpecG = 1.0, lampSpecB = 1.0;
//var lampOn = true; var headLightOn = true;

var mat_sphere = 1;
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var mvpMatrix = new Matrix4();
var quatMatrix = new Matrix4();   // rotation matrix, made from latest qTot
var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1); // 'current' orientation (made from qNew)

//DAT.GUI
var FizzyText = function() {
  this.position = 'Position';
  this.speed = 30.0;
  this.lampAmbiR = 1.0;
  this.lampAmbiG = 1.0;
  this.lampAmbiB = 1.0;
  this.lampDiffR = 1.0;
  this.lampDiffG = 1.0;
  this.lampDiffB = 1.0;
  this.lampSpecR = 1.0;
  this.lampSpecG = 1.0;
  this.lampSpecB = 1.0;
  this.lightingMode = 'Blinn-Phong lighting';
  this.shadingMode = 'Gouraud shading';
};

var obj = { 
  changeLightingMode:function(){ 
    lightingMode = lightingMode == 1 ? 0 : 1;
    text.lightingMode = lightingMode == 0 ? 'Blinn-Phong lighting' : 'Phong lighting';
    console.log("change lighting mode to " + lightingMode);
  },
  changeShadingMode:function(){
    shadingMode = shadingMode == 1 ? 0 : 1;
    text.shadingMode = shadingMode == 0 ? 'Phong shadinging' : 'Gouraud shading';
    console.log("change shading mode to " + shadingMode);
  }
};

window.onload = function() {
  // load controls and canvas
  text = new FizzyText();
  main();
  var gui = new dat.GUI();
  // add controls to GUI
  gui.add(text, 'position').listen();
  gui.add(text, 'speed', -200, 200).onChange(setSpeed);

  var f2 = gui.addFolder('lamp');
  f2.add(text, 'lampAmbiR',0, 1).onChange(seLampAmbiR);
  f2.add(text, 'lampAmbiG',0, 1).onChange(setlampAmbiG);
  f2.add(text, 'lampAmbiB',0, 1).onChange(setlampAmbiB);  
  f2.add(text, 'lampDiffR',0, 1).onChange(setlampDiffR);
  f2.add(text, 'lampDiffG',0, 1).onChange(setlampDiffG);
  f2.add(text, 'lampDiffB',0, 1).onChange(setlampDiffB);
  f2.add(text, 'lampSpecR',0, 1).onChange(setlampSpecR);
  f2.add(text, 'lampSpecG',0, 1).onChange(setlampSpecG);
  f2.add(text, 'lampSpecB',0, 1).onChange(setlampSpecB);
  f2.open();

  var f3 = gui.addFolder('lighting & shading');
  gui.add(text, 'lightingMode').listen();
  gui.add(obj, 'changeLightingMode').name('change lighting');
  gui.add(text, 'shadingMode').listen();
  gui.add(obj, 'changeShadingMode').name('change shading');
  f3.open();
};


function main() {
  canvas = document.getElementById("webgl");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight*0.8;
  // Get the rendering context for WebGL
  gl = init();

  // Additional setup:
  gl.disable(gl.CULL_FACE); // SHOW BOTH SIDES of all triangles
  gl.clearColor(0.25, 0.25, 0.35, 1); // set new screen-clear color, RGBA
  // (for WebGL framebuffer, not canvas)

   
   
   makeGroundGrid();
   makeCube();
   makeSphere();
   makeMess();
  // onkeydown listener
  window.addEventListener("keydown", (ev)=>keydown(ev, gl), false);

  // onmousedown listener
  canvas.addEventListener("mousedown", (ev)=>myMouseDown(ev, canvas)); 
 
  // onmousemove listener
  canvas.addEventListener("mousemove", (ev)=>myMouseMove(ev,gl, canvas)); 

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

function seLampAmbiR(){
  lampAmbiR = text.lampAmbiR;
  console.log("setLampAmbiR:"+ text.lampAmbiR);
}
function setlampAmbiG(){
  lampAmbiR = text.lampAmbiG;
  console.log("setLampAmbiG:"+ text.lampAmbiG);
}
function setlampAmbiB(){
  lampAmbiR = text.lampAmbiB;
  console.log("setLampAmbiB:"+ text.lampAmbiB);
}
function setlampDiffR(){
  lampDiffR = text.lampDiffR;
  console.log("setlampDiffR:"+ text.lampDiffR);
}
function setlampDiffG(){
  lampDiffG = text.lampDiffG;
  console.log("setlampDiffG:"+ text.lampDiffG);
}
function setlampDiffB(){
  lampDiffB = text.lampDiffB;
  console.log("setlampDiffB:"+ text.lampDiffB);
}
function setlampSpecR(){
  lampSpecR = text.lampSpecR;
  console.log("setlampSpecR:"+ text.lampSpecR);
}
function setlampSpecG(){
  lampSpecG = text.lampSpecG;
  console.log("setlampSpecG:"+ text.lampSpecG);
}
function setlampSpecB(){
  lampSpecB = text.lampSpecB;
  console.log("setlampSpecB:"+ text.lampSpecB);
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

function myMouseMove(ev, gl, canvas) {
  //==============================================================================
  // Called when user MOVES the mouse with a button already pressed down.
  // 									(Which button?   console.log('ev.button='+ev.button);    )
  // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
  //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
  
    if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
  
    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  //  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
    
    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
                 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
                 (canvas.height/2);
  //	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);
  
  //Mouse-Drag Moves Lamp0 ========================================================
    // Use accumulated mouse-dragging to change the global var 'lamp0.I_pos';
    // (note how accumulated mouse-dragging sets xmDragTot, ymDragTot below:
    //  use the same method to change the y,z coords of lamp0Pos)
  
    console.log('lamp0.I_pos.elements[0] = ', lamp0.I_pos.elements[0], '\n');
    g_LambAtX = g_LambAtX;
    g_LambAtY = g_LambAtY + 4.0*(x-xMouseclik);
    g_LambAtZ = g_LambAtZ + 4.0*(y-yMouseclik);
    // lamp0.I_pos.elements.set([	
    //         lamp0.I_pos.elements[0],
    //         lamp0.I_pos.elements[1] + 4.0*(x-xMouseclik),	// Horiz drag: change world Y
    //         lamp0.I_pos.elements[2] + 4.0*(y-yMouseclik) 	// Vert. drag: change world Z
    //                         ]);
    /* OLD
    lamp0Pos.set([lamp0Pos[0],										// don't change world x;
                  lamp0Pos[1] + 4.0*(x - xMclik),		// Horiz drag*4 changes world y
                  lamp0Pos[2] + 4.0*(y - yMclik)]);	// Vert drag*4 changes world z
  */ 
  drawView(gl);				// re-draw the image using this updated uniform's value
  // REPORT new lamp0 position on-screen
      // document.getElementById('Mouse').innerHTML=
      //   'Lamp0 position(x,y,z):\t('+ lamp0.I_pos.elements[0].toFixed(5) +
      //                         '\t' + lamp0.I_pos.elements[0].toFixed(5) +
      //                         '\t' + lamp0.I_pos.elements[0].toFixed(5) + ')';	
    
  //END=====================================================================
  
    // find how far we dragged the mouse:
    myX += (x - xMouseclik);					// Accumulate change-in-mouse-position,&
    myY += (y - yMouseclik);
    xMouseclik = x;													// Make next drag-measurement from here.
    yMouseclik = y;
    
  /*	  // REPORT updated mouse position on-screen
      document.getElementById('Mouse').innerHTML=
        'Mouse Drag totals (CVV coords):\t'+xMdragTot+', \t'+yMdragTot;	
  */
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
  //dragQuat(x - xMouseclik, y - yMouseclik);

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
  
    if (ev.keyCode == 77) { // m key
        mat_sphere = (mat_sphere + 1) % 20;
        console.log("change the material");
    }
    else if(ev.keyCode == 39) { // right arrow - step right
    up = [0,1,0]
    look = genelookat(g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ);
    console.log(look)
    
    tmpVec3 = normal(cross(up,look))

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
    up = [0,1,0]
    look = genelookat(g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ);

    tmpVec3 = normal(cross(up,look))

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
    tmpVec3 = genelookat(g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ);

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
    tmpVec3 = genelookat(g_EyeX, g_EyeY, g_EyeZ, g_LookAtX, g_LookAtY, g_LookAtZ);

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
      let eV = [g_EyeX,g_EyeY,g_EyeZ];
      let lV = [g_LookAtX, g_LookAtY, g_LookAtZ];
      r = subtract(lV,eV);
      
      l = Math.sqrt(r[0]*r[0] + r[1]*r[1] + r[2]*r[2]);
      
      lzx =  Math.sqrt(r[0]*r[0] + r[2]*r[2]);
      sin_phi = lzx / l;

      theta0 = Math.PI -  Math.asin(r[0]/lzx);
      THETA_NOW = theta0 + LOOK_STEP;
      
      LAST_UPDATE = 1;
    }
    else
    {
      THETA_NOW += LOOK_STEP;
    }

    g_LookAtY = r[1] + g_EyeY;
    g_LookAtX = l * sin_phi * Math.sin(THETA_NOW) + g_EyeX;
    g_LookAtZ = l * sin_phi * Math.cos(THETA_NOW) + g_EyeZ;
}
else
  if(ev.keyCode==68){//d - look right
    if (LAST_UPDATE==-1 || LAST_UPDATE==0)
    {
      let eV = [g_EyeX,g_EyeY,g_EyeZ];
      let lV = [g_LookAtX, g_LookAtY, g_LookAtZ];
      r = subtract(lV,eV);
      
      l = Math.sqrt(r[0]*r[0] + r[1]*r[1] + r[2]*r[2]);
      
      lzx =  Math.sqrt(r[0]*r[0] + r[2]*r[2]);
      sin_phi = lzx / l;

      theta0 = Math.PI -  Math.asin(r[0]/lzx);
      THETA_NOW = theta0 - LOOK_STEP;
      
      LAST_UPDATE = 1;
    }
    else
    {
      THETA_NOW -= LOOK_STEP;
    }

    g_LookAtY = r[1] + g_EyeY;
    g_LookAtX = l * sin_phi * Math.sin(THETA_NOW) + g_EyeX;
    g_LookAtZ = l * sin_phi * Math.cos(THETA_NOW) + g_EyeZ;
  }
else
  if(ev.keyCode==87){ //w - look up
    if (LAST_UPDATE==-1 || LAST_UPDATE==1)
    {  
      let eV = [g_EyeX,g_EyeY,g_EyeZ];
      let lV = [g_LookAtX, g_LookAtY, g_LookAtZ];
      r = subtract(lV,eV);

      l = Math.sqrt(r[0]*r[0] + r[1]*r[1] + r[2]*r[2]);
      
      lzx =  Math.sqrt(r[0]*r[0] + r[2]*r[2]);

      cos_theta = r[2] /lzx;
      sin_theta = r[0] /lzx;

      phi0 = Math.asin(r[1]/l);

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
      let eV = [g_EyeX,g_EyeY,g_EyeZ];
      let lV = [g_LookAtX, g_LookAtY, g_LookAtZ];
      r = subtract(lV,eV);
      
      l = Math.sqrt(r[0]*r[0] + r[1]*r[1] + r[2]*r[2]);
      
      lzx =  Math.sqrt(r[0]*r[0] + r[2]*r[2]);

      cos_theta = r[2] /lzx;
      sin_theta = r[0] /lzx;

      phi0 = Math.asin(r[1]/l);

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





function drawView(gl){
 
  

  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
   gl.viewport(0, 0, canvas.width, canvas.height);
  projMatrix.setPerspective(35, canvas.width / canvas.height, 1, 100);
  viewMatrix.setLookAt(g_EyeX,g_EyeY, g_EyeZ,      // center of projection
    g_LookAtX, g_LookAtY, g_LookAtZ,      // look-at point 
     0,  1,  0);     // 'up' vector


  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  updateMvpMatrix(mvpMatrix);

  // Calculate the matrix to transform the normal based on the model matrix
  gl.uniform1i(uLoc_lightingMode, lightingMode);
  gl.uniform1i(uLoc_shadingMode, shadingMode);

  eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);
  gl.uniform3fv(uLoc_eyePosWorld, eyePosWorld); 

   //---------------update the light source(s):
  gl.uniform3fv(lamp0.u_pos,  lamp0.I_pos.elements.slice(0,3));
  //     ('slice(0,3) member func returns elements 0,1,2 (x,y,z) ) 
  gl.uniform3fv(lamp0.u_ambi, lamp0.I_ambi.elements);   // ambient
  gl.uniform3fv(lamp0.u_diff, lamp0.I_diff.elements);   // diffuse
  gl.uniform3fv(lamp0.u_spec, lamp0.I_spec.elements);   // Specular

  //---------------update the Material object(s):
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  gl.uniform1i(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  lamp0.I_pos.elements.set([g_LambAtX, g_LambAtY, g_LambAtZ]);
  lamp0.I_ambi.elements.set([lampAmbiR, lampAmbiG, lampAmbiB]);
  lamp0.I_diff.elements.set([lampDiffR, lampDiffG, lampDiffB]);
  lamp0.I_spec.elements.set([lampSpecR, lampSpecG, lampSpecB]);
   
  headLight.I_pos.elements.set([g_EyeX, g_EyeY, g_EyeZ]);
  headLight.I_ambi.elements.set([1.0, 1.0, 1.0]);
  headLight.I_diff.elements.set([1.0, 1.0, 1.0]);
  headLight.I_spec.elements.set([1.0, 1.0, 1.0]);
  
  // update the light sources location
  gl.uniform3fv(lamp0.u_pos, lamp0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(lamp0.u_ambi, lamp0.I_ambi.elements); 
  gl.uniform3fv(lamp0.u_diff, lamp0.I_diff.elements); 
  gl.uniform3fv(lamp0.u_spec, lamp0.I_spec.elements);
  gl.uniform3fv(headLight.u_pos, headLight.I_pos.elements.slice(0, 3));
  gl.uniform3fv(headLight.u_ambi, headLight.I_ambi.elements); 
  gl.uniform3fv(headLight.u_diff, headLight.I_diff.elements);
  gl.uniform3fv(headLight.u_spec, headLight.I_spec.elements);

  draw(gl);

}
function draw(gl) {
  // Draw a new on-screen image.
  gl.useProgram(g_myShader);
  modelMatrix.setIdentity(); 
 modelMatrix.setTranslate(0.0, 0.0, 0.0);
  modelMatrix.rotate(-70,1,0,0);
  pushMatrix(modelMatrix);     // SAVE world coord system;
  modelMatrix.setTranslate(0.0, 0.0, 0.0);
  // draw ground grid
  viewMatrix.rotate(-90.0, 1,0,0); 
  viewMatrix.scale(3, 3,3);  
 
  drawGround(gl);

  modelMatrix = popMatrix(); 
  // draw three joint cube
  modelMatrix.setTranslate(0.7, -1.5, 0.0);
  modelMatrix.rotate(-currentAngle, 0, 0, 1);
  modelMatrix.scale(0.3, 0.3, 0.3);
  pushMatrix(modelMatrix);
  drawCube(gl);
  modelMatrix.translate(0, 0, 1.5);
  modelMatrix.scale(0.7, 0.7, 0.7);
  modelMatrix.rotate(currentAngle*2, 0, 0, 1);
  drawCube(gl);
  modelMatrix.translate(0, 0, 1.3);
  modelMatrix.scale(0.3, 0.3, 0.3);
  modelMatrix.rotate(currentAngle*3, 0, 0, 1);
  drawCube(gl);
  modelMatrix = popMatrix();
  // draw center spinning sphere
  var matl1 = new Material(mat_sphere);
  gl.uniform3fv(matl0.uLoc_Ke, matl1.K_emit.slice(0, 3)); // Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl1.K_ambi.slice(0, 3)); // Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl1.K_diff.slice(0, 3)); // Kd diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl1.K_spec.slice(0, 3)); // Ks specular
  gl.uniform1i(matl0.uLoc_Kshiny, parseInt(matl1.K_shiny, 10)); // Kshiny
  modelMatrix.setTranslate(0, 0, 0);
  modelMatrix.scale(0.5, 0.5, 0.5);
  modelMatrix.rotate(currentAngle, 0, 0, 1);
  pushMatrix(modelMatrix);
  drawSphere(gl);

  modelMatrix = popMatrix();

  var matl2 = new Material(6);
  gl.uniform3fv(matl0.uLoc_Ke, matl2.K_emit.slice(0, 3)); // Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl2.K_ambi.slice(0, 3)); // Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl2.K_diff.slice(0, 3)); // Kd diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl2.K_spec.slice(0, 3)); // Ks specular
  gl.uniform1i(matl0.uLoc_Kshiny, parseInt(matl2.K_shiny, 10)); // Kshiny
  modelMatrix.setTranslate(2,0.8,0.3);
  // spinning BASE dodecahedron;
 var base = 0.15;
  modelMatrix.translate(0.42, 0.4, 0.0); 

  modelMatrix.rotate(currentAngle, 0, 1, 0); // Rotate around the y-axis
  
  drawMess(gl, base);

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

  drawMess(gl,two);
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


}

//draw single dodecahedron
function drawMess(gl,size) {
  pushMatrix(modelMatrix);
  modelMatrix.scale(size, size, size);
  //modelMatrix.scale(0.7, 0.7, 0.7);
  updateModelMatrix(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  updateMvpMatrix(mvpMatrix);
    // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  updateNormalMatrix(normalMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP,1450,180); // DRAW 4 triangles.
  modelMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}

function drawCube(gl){
  pushMatrix(modelMatrix);
  updateModelMatrix(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  updateMvpMatrix(mvpMatrix);
    // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  updateNormalMatrix(normalMatrix);
  gl.drawArrays(gl.TRIANGLES,400,36); // DRAW 4 triangles.
  modelMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}

function drawSphere(gl){
  pushMatrix(modelMatrix);
  updateModelMatrix(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  updateMvpMatrix(mvpMatrix);
    // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  updateNormalMatrix(normalMatrix)

  //gl.drawElements(gl.TRIANGLES, 196, gl.UNSIGNED_SHORT, 0);
  gl.drawArrays(gl.TRIANGLES,436,1014); // DRAW 4 triangles.
  modelMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}


function drawGround(gl){
    //---------Draw Ground Plane, without spinning.
  //pushMatrix(modelMatrix);  // SAVE world drawing coords.

  // position it.
  modelMatrix.translate( 0.4, -0.4, -0.5); 
  //modelMatrix.scale(0.1, 0.1, 0.1);       // shrink by 10X:
  //modelMatrix.setRotate(0.0, 1,0,0 );
  // Drawing:
  // Calculate the model view projection matrix
  // Pass the model view projection matrix to u_MvpMatrix
  updateModelMatrix(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  updateMvpMatrix(mvpMatrix);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  updateNormalMatrix(normalMatrix)

  // Draw just the ground-plane's vertices
  gl.drawArrays(gl.LINES,                 // use this drawing primitive, and
                0, // start at this vertex number, and
                400); // draw this many vertices.
  
  //modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
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

// basic colors
var color = [
    1.0, 0.4, 0.4, 1.0,  1.0, 1.0, 0.0, 1.0,  0.8, 0.5, 1.0, 1.0, 
    1.0, 0.4, 1.0, 1.0,  1.0, 1.0, 0.0, 1.0,  0.6, 0.8, 1.0, 1.0,  
    0.8, 0.3, 1.9, 1.0,  0.6, 1.0, 0.4, 1.0,  1.0, 1.0, 0.0, 1.0,  
    0.0, 0.5, 1.0, 1.0,  1.0, 0.5, 1.0, 1.0,  0.4, 0.8, 1.0, 1.0, 
    1.0, 1.0, 0.0, 1.0,  0.4, 0.4, 1.0, 1.0,  0.6, 1.0, 1.0, 1.0
  ];


function makeSphere(){
  var SPHERE_DIV = 13; //default: 13.  JT: try others: 11,9,7,5,4,3,2,

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var vertices = [];
  
  var normals = [];
  var indices=[];
  var grid = [];
  var index = 0;

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    

    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);
      let vertex = [];
      vertices[index]=[];
      vertex.push(si * sj);  // X
      vertex.push(cj);       // Y
      vertex.push(ci * sj);  // Z
      vertices[index++].push(vertex);
    }
  }
  for (j = 0; j < SPHERE_DIV; j++) {
      for (i = 0; i < SPHERE_DIV; i++) {
        p1 = j * (SPHERE_DIV+1) + i;
        p2 = p1 + (SPHERE_DIV+1);

        positions = positions.concat(vertices[p1].flat());
        positions.push(1.0);
        positions = positions.concat(vertices[p2].flat());
        positions.push(1.0);
        positions = positions.concat(vertices[p1+1].flat());
        positions.push(1.0);
       
        normals = normals.concat(vertices[p1].flat());
        normals = normals.concat(vertices[p2].flat());
        normals = normals.concat(vertices[p1+1].flat());
        positions = positions.concat(vertices[p1+1].flat());
        positions.push(1.0);
        positions = positions.concat(vertices[p2].flat());
        positions.push(1.0);
        positions = positions.concat(vertices[p2+1].flat());
        positions.push(1.0);
        
        normals = normals.concat(vertices[p1+1].flat());
        normals = normals.concat(vertices[p2].flat());
        normals = normals.concat(vertices[p2+1].flat());
      }
    }

  var sphereColors = [];
  // generate colors
  for(var i = 0; i< 1014; i++){
    sphereColors = sphereColors.concat([1.0, 0.4, 0.4, 1.0]);
  }


 //console.log(normals.length/3)
  appendPositions(positions);
  appendColors(sphereColors);
  appendNormals(normals);
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
  //console.log("vertices:" + vertices.length/4)
  // 180 vertices 

  var verticesColors = [];
  // generate colors
  for(var i = 0; i< 60; i++){
    verticesColors = verticesColors.concat(color);
  }
 
  // // 6 vertices
  // var colrA = [1.0, 0.2, 0.2, 1.0,   // bright red
  //   1.0, 0.2, 0.2, 1.0,
  //   0.2, 1.0, 0.2, 1.0,   // bright green
  //   0.2, 1.0, 0.2, 1.0,
  //   0.2, 0.2, 1.0, 1.0,   // bright blue.
  //   0.2, 0.2, 1.0, 1.0,];
  // verticesColors = verticesColors.concat(colrA);
  appendPositions(vertices);

  appendColors(verticesColors);

  var normals = [];
  for (var i = 0; i < vertices.length; i += 12) {
    var a = [vertices[i    ], vertices[i + 1], vertices[i + 2]];
    var b = [vertices[i + 4], vertices[i + 5], vertices[i + 6]];
    var c = [vertices[i + 8], vertices[i + 9], vertices[i + 10]];
    // Normalizing is probably not necessary.
    // It should also be seperated out.
    var nor= normal(cross(subtract(a, b), subtract(a, c)));
    normals = normals.concat(nor, nor, nor);
  }
  appendNormals(normals);

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
  var gndNorms = [];     
  var gndColrs = [];     
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
  var colr = [0.5, 1.0, 0.5, 1.0];
  // group vertices: 400
  for(var j=0; j< 400; j++){
    gndColrs = gndColrs.concat(colr);
  }

  for(var j=0; j< 400; j++){
    gndNorms = gndNorms.concat([0,0,1]);
  }
  appendPositions(gndVerts);
  appendNormals(gndNorms);
  appendColors(gndColrs);
}


function makeCube(){
  // 36 vertices
  var cubeVert = [
    // Front face
     1.0,  1.0,  1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,
     1.0,  1.0,  1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,

    // Right face
     1.0,  1.0, -1.0, 1.0,
     1.0,  1.0,  1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,
     1.0,  1.0, -1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,
     1.0, -1.0, -1.0, 1.0,

     // Top face
     1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
     1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
     1.0,  1.0,  1.0, 1.0,

     // Left face
    -1.0,  1.0,  1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,

    // Bottom face
     1.0, -1.0,  1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0,
     1.0, -1.0,  1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0,
     1.0, -1.0, -1.0, 1.0,

    // Back face
    -1.0,  1.0, -1.0, 1.0,
     1.0,  1.0, -1.0, 1.0,
     1.0, -1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
     1.0, -1.0, -1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0
  ]

  var normals = [    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,// v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,// v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,// v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0 // v4-v7-v6-v5 back
  ];


 appendPositions(cubeVert);
 
 var cubeColr = [];
 cubeColr = cubeColr.concat(color);
 cubeColr = cubeColr.concat(color);
 var seColr = [ 1.0, 0.4, 0.4, 1.0,  1.0, 1.0, 0.0, 1.0,  0.8, 0.5, 1.0, 1.0, 
  1.0, 0.4, 1.0, 1.0,  1.0, 1.0, 0.0, 1.0,  0.6, 0.8, 1.0, 1.0,];
  cubeColr = cubeColr.concat(seColr);
  appendColors(cubeColr);
  appendNormals(normals);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight*0.8;
}

function genelookat(eyeX, eyeY, eyeZ, lookAtX, lookAtY, lookAtZ){

  eyeV = [eyeX, eyeY, eyeZ];
  lookV = [lookAtX, lookAtY, lookAtZ]

  r = subtract(lookV,eyeV);

  len = Math.sqrt(r[0]*r[0] + r[1]*r[1] + r[2]*r[2])

  return [r[0]/len, r[1]/len, r[2]/len];
}

function subtract(a, b){
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a,b)
{
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}

function normal(r)
{
  var len = Math.sqrt(r[0]*r[0] + r[1]*r[1] + r[2]*r[2]) + 0.000001; // prevent divide by 0

  return [r[0]/len,r[1]/len,r[2]/len];
}