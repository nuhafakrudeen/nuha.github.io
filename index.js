// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// Global variables for WebGL and GLSL
let canvas, gl, a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix; 

//globals for the body-expansion animation:
let g_bodyAnimation = false;
let g_bodyAnimationStartTime = 0;
let g_bodyScaleFactor = 1.0;
let g_bodyAnimationDuration = 1.0;
const g_bodyAmplitude = 0.2;

//globals (for other animations):
let g_globalAngle = 0;

let g_RightLegAngle = 0;
let g_RightLegAnimation = false;
let g_RightPawAngle = 0;
let g_RightPawAnimation = false;

let g_LeftLegAngle = 0;
let g_LeftLegAnimation = 0;
let g_LeftPawAngle = false;
let g_LeftPawAnimation = false;

let g_armAngle = 0;
let g_armAnimation = false;

let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

function setupWebGL() {
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}


function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}


// globals related to UI elements
function addActions() {
  document.getElementById('animationRightLegOffButton').onclick = function () { g_RightLegAnimation = false; };
  document.getElementById('animationRightLegOnButton').onclick = function () { g_RightLegAnimation = true; };
  document.getElementById('animationRightLegPawOffButton').onclick = function () { g_RightPawAnimation = false; };
  document.getElementById('animationRightLegPawOnButton').onclick = function () { g_RightPawAnimation = true; };

  document.getElementById('animationLeftLegOnButton').onclick = function () { g_LeftPawAngle = true; };
  document.getElementById('animationLeftLegOffButton').onclick = function () { g_LeftPawAngle = false; };
  document.getElementById('animationLeftPawOffButton').onclick = function () { g_LeftPawAnimation = false; };
  document.getElementById('animationLeftPawOnButton').onclick = function () { g_LeftPawAnimation = true; };

  document.getElementById('animationArmOffButton').onclick = function () { g_armAnimation = false; };
  document.getElementById('animationArmOnButton').onclick = function () { g_armAnimation = true; };
  
  document.getElementById('RightLegSlide').addEventListener('mousemove', function () { g_RightLegAngle = this.value; renderScene(); });
  document.getElementById('LeftLegSlide').addEventListener('mousemove', function () { g_LeftLegAngle = this.value; renderScene(); });

  document.getElementById('armSlide').addEventListener('mousemove', function () { g_armAngle = this.value; renderScene(); });

  document.getElementById('angleSlide').addEventListener('mousemove', function () { g_globalAngle = this.value; renderScene(); });
}


function main() {
  setupWebGL();

  connectVariablesToGLSL();

  addActions();

  canvas.addEventListener("click", function(e) {
    if (e.shiftKey) {
      g_bodyAnimation = true;
      g_bodyAnimationStartTime = performance.now() / 1000.0;
    }
  });
  
  canvas.addEventListener("mousedown", function(e) {
    isMouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  canvas.addEventListener("mousemove", function(e) {
    if (!isMouseDown) return;
    let dx = e.clientX - lastMouseX;
    g_globalAngle += dx;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  canvas.addEventListener("mouseup", function(e) {
    isMouseDown = false;
  });
  canvas.addEventListener("mouseleave", function(e) {
    isMouseDown = false;
  });

  gl.clearColor(1.0, 0.8, 0.8, 1.0);

  renderScene();
  requestAnimationFrame(tick);
}


var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;


function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  updateAnimationAngles();

  if (g_bodyAnimation) {
    let dt = performance.now() / 1000.0 - g_bodyAnimationStartTime;
    if (dt > g_bodyAnimationDuration) {
      dt = g_bodyAnimationDuration;
      g_bodyAnimation = false;
    }
    g_bodyScaleFactor = 1.0 + g_bodyAmplitude * (1 - Math.cos(2 * Math.PI * dt / g_bodyAnimationDuration)) / 2.0;
  } else {
    g_bodyScaleFactor = 1.0;
  }

  renderScene();
  requestAnimationFrame(tick);
}


function updateAnimationAngles() {
  let RightSlider = document.getElementById('RightLegSlide');
  let LeftSlider = document.getElementById('LeftLegSlide');
  let RightPawSlider = document.getElementById('RightPawSlide');
  let LeftPawSlider = document.getElementById('LeftPawSlide');
  let armSlider = document.getElementById('armSlide');

  let RightLegBase = parseFloat(RightSlider.value);
  let LeftLegBase = parseFloat(LeftSlider.value);
  let RightPawBase = parseFloat(RightPawSlider.value);
  let LeftPawBase = parseFloat(LeftPawSlider.value);
  let armBase = parseFloat(armSlider.value);

  if (g_RightLegAnimation) {
    g_RightLegAngle = RightLegBase + 30 * Math.sin(g_seconds);
  } else {
    g_RightLegAngle = RightLegBase;
  }

  if (g_LeftPawAngle) {
    g_LeftLegAngle = LeftLegBase + 30 * Math.sin(g_seconds);
  } else {
    g_LeftLegAngle = LeftLegBase;
  }

  if (g_RightPawAnimation) {
    g_RightPawAngle = RightPawBase + 30 * Math.sin(2 * g_seconds);
  } else {
    g_RightPawAngle = RightPawBase;
  }

  if (g_LeftPawAnimation) {
    g_LeftLegAnimation = LeftPawBase + 30 * Math.sin(2 * g_seconds);
  } else {
    g_LeftLegAnimation = LeftPawBase;
  }

  if (g_armAnimation) {
    g_armAngle = armBase + 45 * Math.cos(g_seconds);
  } else {
    g_armAngle = armBase;
  }
}

var g_shapesList = [];


function Heart() {
  this.color = [1.0, 0.0, 0.0, 1.0];
  this.matrix = new Matrix4();
  
  if (!Heart.vertexBuffer) {
    var vertices = new Float32Array([
      0.0,   0.2,  0.1,    
      0.0,  -1.0,  0.1,    
      -1.0, -0.2,  0.1,    
      -1.4,  0.2,  0.1,    
      -1.6,  0.6,  0.1,    
      -1.4,  1.0,  0.1,    
      -0.8,  1.3,  0.1,    
      0.0,  0.9,  0.1,    
      0.8,  1.3,  0.1,    
      1.4,  1.0,  0.1,    
      1.6,  0.6,  0.1,    
      1.4,  0.2,  0.1,    
      1.0, -0.2,  0.1,    
      0.0,   0.2, -0.1,    
      0.0,  -1.0, -0.1,    
      -1.0, -0.2, -0.1,    
      -1.4,  0.2, -0.1,    
      -1.6,  0.6, -0.1,    
      -1.4,  1.0, -0.1,    
      -0.8,  1.3, -0.1,    
      0.0,  0.9, -0.1,    
      0.8,  1.3, -0.1,    
      1.4,  1.0, -0.1,    
      1.6,  0.6, -0.1,    
      1.4,  0.2, -0.1,    
      1.0, -0.2, -0.1     
    ]);

    var indices = new Uint16Array([
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 5,
        0, 5, 6,
        0, 6, 7,
        0, 7, 8,
        0, 8, 9,
        0, 9, 10,
        0, 10, 11,
        0, 11, 12,
        0, 12, 1,
        13, 25, 24,
        13, 24, 23,
        13, 23, 22,
        13, 22, 21,
        13, 21, 20,
        13, 20, 19,
        13, 19, 18,
        13, 18, 17,
        13, 17, 16,
        13, 16, 15,
        13, 15, 14,
        13, 14, 25,
         1,  2, 15,   1, 15, 14,
         2,  3, 16,   2, 16, 15,
         3,  4, 17,   3, 17, 16,
         4,  5, 18,   4, 18, 17,
         5,  6, 19,   5, 19, 18,
         6,  7, 20,   6, 20, 19,
         7,  8, 21,   7, 21, 20,
         8,  9, 22,   8, 22, 21,
         9, 10, 23,   9, 23, 22,
        10, 11, 24,  10, 24, 23,
        11, 12, 25,  11, 25, 24,
        12,  1, 14,  12, 14, 25
      ]);
  
      // Create and bind the vertex buffer.
      Heart.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, Heart.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      Heart.vertexBuffer.itemSize = 3;
      Heart.vertexBuffer.numItems = vertices.length / 3;
  
      // Create and bind the index buffer.
      Heart.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Heart.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      Heart.indexBuffer.numItems = indices.length;
    }
  }
  
  Heart.prototype.render = function() {
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4fv(u_FragColor, this.color);
    gl.bindBuffer(gl.ARRAY_BUFFER, Heart.vertexBuffer);
    gl.vertexAttribPointer(a_Position, Heart.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Heart.indexBuffer);
    gl.drawElements(gl.TRIANGLES, Heart.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  };


function renderScene() {
  var startTime = performance.now();

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var body = new Cube();
  body.color = [0.5, 0.25, 0.1, 1];
  body.matrix.translate(-0.25, -0.3, 0.0);
  body.matrix.rotate(0, 1, 0, 0);
  body.matrix.scale(0.7 * g_bodyScaleFactor, 0.8 * g_bodyScaleFactor, 0.7 * g_bodyScaleFactor);
  body.render();

  //draw legs
  var RightLeg = new Cube();
  RightLeg.color = [0.5, 0.25, 0.1, 1];
  RightLeg.matrix.setTranslate(-0.12, -0.3, 0.3);
  RightLeg.matrix.rotate(-5, 1, 0, 0);
  RightLeg.matrix.rotate(-g_RightLegAngle, 0, 0, 1);
  RightLeg.matrix.scale(0.5, -0.5, 0.5);
  var RightLegCoordinatesMat = new Matrix4(RightLeg.matrix);
  RightLeg.matrix.scale(0.55, 0.85, 0.55);
  RightLeg.matrix.translate(-0.5, 0, 0);
  RightLeg.render();

  var RightPaw = new Cube();
  RightPaw.color = [0.5, 0.25, 0.1, 1];
  RightPaw.matrix = RightLegCoordinatesMat;
  RightPaw.matrix.translate(0, 0.65, 0);
  RightPaw.matrix.rotate(-g_RightPawAngle, 0, 0, 1);
  RightPaw.matrix.scale(0.50, 0.55, 0.50);
  RightPaw.matrix.translate(-0.5, 0.45, -0.001);
  RightPaw.render();

  var LeftLeg = new Cube();
  LeftLeg.color = [0.5, 0.25, 0.1, 1];
  LeftLeg.matrix.setTranslate(0.25, -0.3, 0.3);
  LeftLeg.matrix.rotate(-5, 1, 0, 0);
  LeftLeg.matrix.rotate(-g_LeftLegAngle, 0, 0, 1);
  LeftLeg.matrix.scale(0.5, -0.5, 0.5);
  var LeftLegCoordinatesMat = new Matrix4(LeftLeg.matrix);
  LeftLeg.matrix.scale(0.55, 0.85, 0.55);
  LeftLeg.matrix.translate(-0.5, 0, 0);
  LeftLeg.render();

  var LeftPaw = new Cube();
  LeftPaw.color = [0.5, 0.25, 0.1, 1];
  LeftPaw.matrix = LeftLegCoordinatesMat;
  LeftPaw.matrix.translate(0, 0.65, 0);
  LeftPaw.matrix.rotate(-g_LeftLegAnimation, 0, 0, 1);
  LeftPaw.matrix.scale(0.50, 0.55, 0.50);
  LeftPaw.matrix.translate(-0.5, 0.45, -0.001);
  LeftPaw.render();

  // Draw a head.
  var head = new Cube();
  head.color = [0.5, 0.25, 0.1, 1];
  head.matrix.translate(-0.15, 0.5, 0.15);
  head.matrix.scale(0.40, 0.30, 0.40);
  head.render();

  //draw arms
  var leftarm = new Cube();
  leftarm.color = [0.5, 0.25, 0.1, 1];
  leftarm.matrix.translate(-0.45, -0.10, 0.35);
  leftarm.matrix.rotate(-0.75, 1, 1, 0);
  leftarm.matrix.scale(0.2, 0.5, 0.2);
  leftarm.render();

  var rightarm = new Cube();
  rightarm.color = [0.5, 0.25, 0.1, 1];
  rightarm.matrix.translate(0.45, 0.5, 0.35);
  rightarm.matrix.rotate(-0.75, 1, -1, 0);
  rightarm.matrix.rotate(-g_armAngle, 0, 0, 1);
  rightarm.matrix.scale(0.2, 0.5, 0.2);
  rightarm.render();

  // Draw ears
  var rightear = new Cube();
  rightear.color = [0.5, 0.25, 0.1, 1];
  rightear.matrix.translate(-0.25, 0.80, 0.35);
  rightear.matrix.rotate(-0.75, 1, 1, 0);
  rightear.matrix.scale(0.2, 0.2, 0.2);
  rightear.render();

  var leftear = new Cube();
  leftear.color = [0.5, 0.25, 0.1, 1];
  leftear.matrix.translate(0.15, 0.80, 0.35);
  leftear.matrix.rotate(-0.75, 1, 1, 0);
  leftear.matrix.scale(0.2, 0.2, 0.2);
  leftear.render();

  // Draw nose
  var nose = new Cube();
  nose.color = [0.5, 0.4, 0.1, 1];
  nose.matrix.translate(-0.15, 0.50, 0);
  nose.matrix.rotate(-0.75, 1, 1, 0);
  nose.matrix.scale(0.4, 0.2, 0.2);
  nose.render();

  // Draw eyes
  var righteye = new Cube();
  righteye.color = [0, 0, 0, 1];
  righteye.matrix.translate(0.1, 0.70, 0.1);
  righteye.matrix.rotate(-0.75, 1, 1, 0);
  righteye.matrix.scale(0.1, 0.1, 0.1);
  righteye.render();

  var leftteye = new Cube();
  leftteye.color = [0, 0, 0, 1];
  leftteye.matrix.translate(-0.1, 0.70, 0.1);
  leftteye.matrix.rotate(-0.75, 1, 1, 0);
  leftteye.matrix.scale(0.1, 0.1, 0.1);
  leftteye.render();

  var heart = new Heart();
  heart.matrix.setTranslate(0.1, 0.1, 0);
  heart.matrix.scale(0.2, 0.2, 0.2);
  heart.render();

  //background hearts
  var heart1 = new Heart();
  heart1.color = [1.0, 0.0, 0.0, 1.0];
  heart1.matrix.translate(-0.7, 0.6, -0.5);
  heart1.matrix.scale(0.1, 0.1, 0.1);
  heart1.render();

  var heart2 = new Heart();
  heart2.color = [1.0, 0.0, 0.0, 1.0];
  heart2.matrix.translate(0.7, -0.7, -0.6);
  heart2.matrix.scale(0.1, 0.1, 0.1);
  heart2.render();

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");
}


function sendTextToHTML(text, htmlID) {
  var hteml = document.getElementById(htmlID);
  if (!hteml) {
    console.log("Failed to get: " + htmlID + " from HTML");
    return;
  }
  hteml.innerHTML = text;
}
