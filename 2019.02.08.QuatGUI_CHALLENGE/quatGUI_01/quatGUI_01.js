
/*    
   quatGUI_01.js   Jack Tumblin, jet861, 2019.02.06 
  
  Exploring Quaternions with the aid of interactive GUI features & 'lib1.js'
  
    Version control:
  quatGUI_01 -- simplified and 'cleaned up' copy of the 'tetraGUI_10' program 
        from 2019.01.25.ProjA_Help03.  Added 'depth reversal' fix and
        --REMOVED 'myKeyPress()' fcn (deprecated on Firefox); 
          put all keyboard-response contents into myKeyDown().
        --append_Wedge(), drawWedge() to replace 'halfTetra' shape with simpler
          less awkward geometry: (mimics old 5.04jt.ControlMulti starter code). 
        --Add 'append_Axes(), drawAxes() to depict current drawing axes on-screen.
  
*/

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.

//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
var g_myMatrix = new Matrix4();   
                  // 4x4 matrix we send to the GPU where it transforms vertices
var g_digits = 5; // # of digits printed on-screen (e.g. x.toFixed(g_digits);

//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;  

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
var g_angle01 = 0;                  // initial rot. angle for left tetrahedron.
var g_angle01Rate = 45.0;           // spin speed, in degrees/second.
var g_angle02 = 0;                  // initial rot. angle for right tetrahedron
var g_angle02Rate = 200.0;          // spin speed, in degrees/second.
var g_angle02_MaxRock =  50.0;      // keep g_angle02 BELOW this max. angle  
var g_angle02_MinRock = -20.0;      // keep g_angle02 ABOVE this min. angle

function main() {
//=============================================================================
  gl = init();    // from Bommier's 'lib1.js' library: 
                  // do all setup needed to enable us to draw colored vertices
                  // using your browser's WebGL implemention.  Returns the
                  // WebGL 'rendering context', a giant JavaScript object that:
                  //  -- has member variables for all WebGL 'state' data (e.g. 
                  // what's enabled, what's disabled, all modes, all settings)
                  //  -- has member functions (or 'methods') for all the
                  // webGL functions. For example, we call 'gl.drawArrays()'
                  // (NOTE: 'gl' declared above as global var)

  // Additional setup:
  gl.disable(gl.CULL_FACE);       // SHOW BOTH SIDES of all triangles
  gl.clearColor(0.25, 0.25, 0.25, 1);	  // set new screen-clear color, RGBA
                                        // (for WebGL framebuffer, not canvas)

  // EVERYTHING webGL draws on-screen fits within the +/-1 'cube' called
  // the 'Canonical View Volume' or CVV.  This axis-aligned cube is easy to
  // imagine because its corners are located at (x,y,z)==(+/-1, +/-1, +/-1).
  // WebGL fills the HTML-5 canvas object (the black square in our web-page)
  // with the CVV, with horizontal x-axis, vertical y-axis, and z-axis set
  // perpendicular to the screen.  

  //----------------SOLVE THE 'REVERSED DEPTH' PROBLEM:------------------------
  // IF the GPU doesn't transform our vertices by a 3D Camera Projection Matrix
  // (and it doesn't -- not until Project B) then the GPU will compute reversed 
  // depth values:  depth==0 for vertex z == -1;   (but depth = 0 means 'near') 
  //		    depth==1 for vertex z == +1.   (and depth = 1 means 'far').
  //
  // To correct for this historical quirk of OpenGL/WebGL, we could either:
  //  a) reverse the sign of z before we render it (scale(1,1,-1); ?! Ugh. No.)
  //  b) reverse the usage of the depth-buffer's stored values, like this:
  gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.
  gl.clearDepth(0.0);       // each time we 'clear' our depth buffer, set all
                            // pixel depths to 0.0  (1.0 is DEFAULT)
  gl.depthFunc(gl.GREATER); // draw a pixel only if its depth value is GREATER
                            // than the depth buffer's stored value.
                            // (gl.LESS is DEFAULT; reverse it!)L 
    
	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------

  append_Wedge();                 // create 1st 3D part in the GPU (v0-v5)
  append_Axes();                  // create 2nd 3D part in the GPU (v6-v11)
  tick(); // start animation.
}

// 
function tick() {
//-----------------------------------------------------------------------------
// if global var g_isRun==true, repeatedly adjust-and-draw the on-screen image;
// otherwise do nothing.
  if(g_isRun == false)  return;
  timerAll();              // Update all animation timing parameters.
  drawAll();               // Draw it all on-screen.
  requestAnimationFrame(tick, g_canvas);    // 'at the next opportunity' call
  // the 'tick()' function again (HTML-5 function for g_canvas element).
};
  
function buttonRunStop() {
//-----------------------------------------------------------------------------
// called when user presses HTML 'Run/Stop' button on webpage.
  if(g_isRun==true) g_isRun = false;  // STOP animation.
  else {
    g_isRun = true;   // RESTART animation.
    tick();
  }
}

function timerAll() {
//-----------------------------------------------------------------------------
// Re-compute ALL parameters that may change in the next on-screen image.

  // Find the elapsed time in milliseconds:
  var now = Date.now();     
  var elapsed = now - g_lastMS; // current time - previous-frame timestamp.
  g_lastMS = now;               // set new timestamp.
  // console.log("elapsed in milliseconds:",elapsed);
  if(elapsed > 500) elapsed = 20;   // ignore long pauses (caused by hiding 
                                    // browser window or g_isRun set false)
  
  // Update the current rotation angle (adjusted by the elapsed time)
  g_angle01 = g_angle01 + (g_angle01Rate/1000.0) * elapsed;
  g_angle01 %= 360;        // keep angle between 0 and 360 degrees.
//  console.log("angle01:", g_angle01);
  
  // MORE TIME_DEPENDENT VALUES:
  g_angle02 = g_angle02 + (g_angle02Rate/1000.0) * elapsed; // advance;
  if( g_angle02 < g_angle02_MinRock ) { // did we go past lower limit?
    g_angle02 = g_angle02_MinRock;      // yes. Stop at limit, and
    if(g_angle02Rate < 0) g_angle02Rate = -g_angle02Rate; // go FORWARDS
    }
  if( g_angle02 > g_angle02_MaxRock ) { // did we go past upper limit?
   g_angle02 = g_angle02_MaxRock;       // yes. Stop at limit, and
   if(g_angle02Rate > 0) g_angle02Rate = -g_angle02Rate; // go BACKWARDS
  }
//  console.log("angle02:", g_angle02);
}

function drawAll()
//-----------------------------------------------------------------------------
 // Draw a new on-screen image.
 {
  // Be sure to clear the screen before re-drawing ...
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);		
  
  g_myMatrix.setIdentity();         // set drawing axes to CVV:
  updateModelMatrix(g_myMatrix);    // set GPU's ModelMatrix to identity, and
  drawAxes();
  
  // Let mouse-drag move the drawing axes before we do any other drawing:
  g_myMatrix.setTranslate(g_xMdragTot, g_yMdragTot, 0.0); 
  g_myMatrix.translate(-0.6,-0.5,0); // move drawing axes downwards,
  g_myMatrix.scale(0.6,0.6,0.6);  // shrink drawing axes uniformly,
  // spinning BASE tetra;
  g_myMatrix.rotate(g_angle01,0,1,0);      // spin the drawing axes,
  drawAxes();
  drawHalfWedge();

    // Report mouse-drag totals on-screen:
		document.getElementById('MouseDragResult').innerHTML=
			'Mouse Drag totals (CVV coords):\t' + g_xMdragTot.toFixed(g_digits)+
			                             ', \t' + g_yMdragTot.toFixed(g_digits);	

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
  appendColors([  1.0, 1.0, 1.0, 1.0, // n0 white
                  0.0, 1.0, 0.0, 1.0, // n3 green
                  0.0, 0.0, 1.0, 1.0, // n1 blue
                  1.0, 0.0, 0.0, 1.0, // n2 red
                  1.0, 1.0, 1.0, 1.0, //n0 white
                  0.0, 1.0, 0.0, 1.0, // n3 green
              ]);

}

function drawHalfWedge() {
//------------------------------------------------------------------------------
// Draw only the first 2 triangles of tetrahedron 
// base is in z=0 plane centered at origin: apex on z axis.

  pushMatrix(g_myMatrix);  // SAVE the given myMatrix contents, then:
    updateModelMatrix(g_myMatrix);        // send it to GPU
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4); // DRAW 2 triangles.
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}

function drawFullWedge() {
//-----------------------------------------------------------------------------
// Draw all 4 triangles of our tetrahedron
// base is in z=0 plane centered at origin; apex on z axis.
  pushMatrix(g_myMatrix);  // SAVE the given myMatrix contents, then:
    updateModelMatrix(g_myMatrix);        // send it to GPU
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4); // DRAW 2 triangles.
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents.
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
  appendColors([1.0, 0.2, 0.2, 1.0,   // bright red
                1.0, 0.2, 0.2, 1.0,
                0.2, 1.0, 0.2, 1.0,   // bright green
                0.2, 1.0, 0.2, 1.0,
                0.2, 0.2, 1.0, 1.0,   // bright blue.
                0.2, 0.2, 1.0, 1.0,]);
}

function drawAxes() {
//-----------------------------------------------------------------------------
// using current drawing axes
  updateModelMatrix(g_myMatrix);
  gl.drawArrays(gl.LINES,6,6);   // 2nd set of 6 verts in GPU.
}

//=================================
//================================
//
//    KEYBOARD & MOUSE FUNCTIONS
//
//================================
//=================================

function myKeyDown(kev) {
//============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
	document.getElementById('KeyDownResult').innerHTML = ''; // clear old result
  document.getElementById('KeyModResult' ).innerHTML = ''; 
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
  document.getElementById('KeyModResult' ).innerHTML = 
        "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
    "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
    "<br> --kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
  
              //"--kev.code:"+kev.code+"--kev.key:"+kev.key; 
/*              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
*/
  switch(kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if(g_isRun==true) {
			  g_isRun = false;    // STOP animation
			  }
			else {
			  g_isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
			console.log("a/A key: Strafe LEFT!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found a/A key. Strafe LEFT!';
			break;
    case "KeyD":
			console.log("d/D key: Strafe RIGHT!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'myKeyDown() found d/D key. Strafe RIGHT!';
			break;
		case "KeyS":
			console.log("s/S key: Move BACK!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'myKeyDown() found s/Sa key. Move BACK.';
			break;
		case "KeyW":
			console.log("w/W key: Move FWD!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found w/W key. Move FWD!';
			break;
		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Left Arrow='+kev.keyCode;
			break;
		case "ArrowRight":
			console.log('right-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
  		break;
		case "ArrowUp":		
			console.log('   up-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
			break;
		case "ArrowDown":
			console.log(' down-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
  		break;	
    default:
      console.log("UNUSED!");
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): UNUSED!';
      break;
  }
}

function myKeyUp(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard.
// Rarely needed -- most code needs only myKeyDown().

	console.log("myKeyUp():\n--kev.code:",kev.code,"\t\t--kev.key:", kev.key);
}

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x.toFixed(g_digits),',\t',y.toFixed(g_digits));
	
	g_isDrag = true;										// set our mouse-dragging flag
	g_xMclik = x;												// record where mouse-dragging began
	g_yMclik = y;                       // using global vars (above main())
		document.getElementById('MouseAtResult').innerHTML = 
	'myMouseDown() at CVV coords x,y = '+x.toFixed(g_digits)+
	                                ', '+y.toFixed(g_digits);
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;			// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x.toFixed(g_digits),',\t',y.toFixed(g_digits));

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);      // Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	g_xMclik = x;									      // Make next drag-measurement from here.
	g_yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'tick()' function instead)
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x.toFixed(g_digits),',\t',y.toFixed(g_digits));
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',g_xMdragTot.toFixed(g_digits),',\t', g_yMdragTot.toFixed(g_digits));
	// Put it on our webpage too...
	document.getElementById('MouseAtResult').innerHTML = 
	'myMouseUp(       ) at CVV coords x,y = ' +x.toFixed(g_digits)+
	                                      ', '+y.toFixed(g_digits);
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	


function buttonClearDragTot() {
//=============================================================================
// on-screen button: clears global mouse-drag totals.
  g_xMdragTot = 0.0;
  g_yMdragTot = 0.0;
}