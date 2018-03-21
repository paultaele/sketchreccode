// https://developer.mozilla.org/en-US/docs/Web/API/FileReader/onload

// #region Loader and Runner

function init() {
  // get the canvas and its context
	canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");

  // initially disable the editing buttons
  document.getElementById("clearButton").disabled = true;
  document.getElementById("undoButton").disabled = true;
	document.getElementById("submitButton").disabled = true;

  // add the "change" event listener to the image getter
  var imageGetter = document.getElementById("imageGetter");
  imageGetter.addEventListener("change", chooseImages, false);

  // add the "change" event listener to the study getter
	var studyGetter = document.getElementById("studyGetter");
  studyGetter.addEventListener("change", chooseStudy, false);

  // react to mouse events on the canvas, and mouseup on the entire document
  canvas.addEventListener('mousedown', canvas_mouseDown, false);
  canvas.addEventListener('mousemove', canvas_mouseMove, false);
  canvas.addEventListener('mouseup', canvas_mouseUp, false);

  // react to touch events on the canvas
  canvas.addEventListener('touchstart', canvas_touchStart, false);
  canvas.addEventListener('touchend', canvas_touchEnd, false);
  canvas.addEventListener('touchmove', canvas_touchMove, false);

  // initialize the canvas states
  canvasStates = [];
}

function run() {
  // error-check the study file
  if (studyFile === undefined) {
    alert("ERROR: no study file was selected");
    return;
  }

  // instantiate the file reader
  var reader = new FileReader();

  // read the study file
  reader = new FileReader();
  reader.readAsText(studyFile);
  reader.onload = function(event) {
    // get the file's text
    var contents = event.target.result;

    // convert text to JSON
    var data = JSON.parse(contents);

    // extract the data
    var title = data.title;
    var count = data.count;
    var random = data.random;
    displayType = data.display;
    canvasWidth = data.canvasWidth;
    canvasHeight = data.canvasHeight;

    // debug
    console.log("Display Type: " + displayType);
    // end debug

    // error-check the image files
    if ( (displayType === DISPLAY_TRACE || displayType === DISPLAY_PREVIEW) && imageFiles === undefined) {
      alert("ERROR: no image files were selected");
      return;
    }

    // disable study loader button
    var studyLoader = document.getElementById("studyLoader");
    studyLoader.disabled = true;

    // hide study setup and show study header and viewer
    document.getElementById("studySetup").style.display = "none";
    document.getElementById("studyHeader").style.display = "inline";
    document.getElementById("studyViewer").style.display = "inline";

    // set title
    var titleText = document.getElementById("titleText");
    titleText.innerHTML = "Study: " + title;

    // initialize the old and new entries
    entries = data.entries;
    var newEntries = [];
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      for (var j = 0; j < count; j++) {
        newEntries.push(entry);
      }
    }

    // randomize the entries, if enabled
    if (random) { shuffle(newEntries); }

    // update the entries to the study settings
    entries = newEntries;

    // create a filename-to-file map
    if (displayType === DISPLAY_TRACE || displayType === DISPLAY_PREVIEW) {
      var filenameToFileMap = {};
      for (var i = 0; i < imageFiles.length; i++) {
        var file = imageFiles[i];
        var filename = file.name;
        filenameToFileMap[filename] = file;
      }

      // get entries
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var filename = entry.filename;
        entry.file = filenameToFileMap[filename];
      }
    }

    // initialize index
    index = 0;

    // set label and progress
    var entry = entries[index];
    updateHeader(entry.label, index + 1, entries.length);

    // load canvas image
    if (displayType === DISPLAY_TRACE) {
      loadCanvasImage(canvas, context, entries[index].file, true);
    }
    else if (displayType === DISPLAY_PREVIEW) {
      loadCanvasImage(canvas, context, entries[index].file, false);
    }
    else if (displayType === DISPLAY_TEXT) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    // load thumbnail image
    if (displayType === DISPLAY_TRACE || displayType === DISPLAY_PREVIEW) {
      var previewThumbnail = document.getElementById("previewThumbnail");
      loadThumbnailImage(previewThumbnail, entries[index].file);
    }

    // update transition button states
    document.getElementById("clearButton").disabled = false;
    document.getElementById("undoButton").disabled = false;
    if (entries.length >= 1) {
      document.getElementById("submitButton").disabled = false;   
    }
  };
  
}

// #endregion

// #region Setup Event Handlers

function chooseImages(e) {
  imageFiles = e.target.files;
}

function chooseStudy(e) {
  studyFile = e.target.files[0];
}

// #endregion

// #region Editing Event Handlers 

function submitButton() {
  
  // get the sketch's strokes
  var sketch = {};
  var strokes = CanvasData.strokes;
  
  // no drawn strokes ==> quit function
  if (strokes.length === 0) { return; }

  // get the sketch's interpretation 
  var entry = entries[index];
  var interpretation = entry.label;
  
  // set the sketch's domain
  var domain = "Sketch";
  var canvas = document.getElementById("canvas");
  var width = canvas.width;
  var height = canvas.height;

  // collect the current sketch
  collectSketch(strokes, width, height, interpretation, domain);

  // -----

  // update current index by incrementing
  ++index;

  // reached last index ==> disable submit button
	if (index >= entries.length ) {
    // hide transition buttons
    document.getElementById("clearButton").style.display = "none";
    document.getElementById("undoButton").style.display = "none";
    document.getElementById("submitButton").style.display = "none";

    // display download button
    var downloadButton = document.getElementById("downloadButton");
    downloadButton.style.display = "inline";

    // quit function
    return;
  }

  // set label and progress
  var entry = entries[index];
  updateHeader(entry.label, index + 1, entries.length);

  // load the next trace image
  if (displayType === DISPLAY_TRACE) {
    loadCanvasImage(canvas, context, entries[index].file, true);
  }
  else if (displayType === DISPLAY_PREVIEW) {
    loadCanvasImage(canvas, context, entries[index].file, false);
  }
  // !!!
  // else if (displayType === DISPLAY_TEXT) {
  //   canvas.width = canvasWidth;
  //   canvas.height = canvasHeight;
  // }

  // load the next preview thumbnail image
  if (displayType === DISPLAY_TRACE || displayType === DISPLAY_PREVIEW) {
    var previewThumbnail = document.getElementById("previewThumbnail");
    loadThumbnailImage(previewThumbnail, entries[index].file);
  }
  else if (displayType === DISPLAY_TEXT) {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  // reset the draw canvas' points and strokes
  CanvasData.points = [];
  CanvasData.strokes = [];

  // reset canvas states
  canvasStates = [];
}

/**
 * Clears the draw canvas and drawing data.
 * @param {Object} canavs - The draw canvas.
 * @param {Object} context - The draw context. 
 */
function clearButton(canvas, context) {
  // no recorded strokes => do nothing
  if (CanvasData.strokes.length === 0) { return; }

  // !!!
  var canvasState = canvasStates[0];
  context.putImageData(canvasState, 0, 0);
  canvasStates = [];

  // reset the draw canvas' points and strokes
  CanvasData.points = [];
  CanvasData.strokes = [];
}

/**
 * Undoes the most recent stroke on the draw canvas, if any.
 * @param {Object} canvas - The draw canvas.
 * @param {Object} context - The draw context.
 */
function undoButton(canvas, context) {
  // no recorded strokes => do nothing
  if (CanvasData.strokes.length === 0) { return; }

  // !!!
  var canvasState = canvasStates.pop();
  context.putImageData(canvasState, 0, 0);

  // remove the last stroke and clear the canvas
  CanvasData.strokes.pop();

  // re-draw the remaining strokes
  //redraw(canvas, context, CanvasData.strokes, strokeColor, strokeSize);
}

function downloadButton() {
  var content = CanvasData.sketches;
  var data = JSON.stringify(content);
  
  var blob = new Blob([data], {type: "application/json"});
  var url  = URL.createObjectURL(blob);  
  var a = document.createElement('a');
  a.href = url;
  a.download = "data.json";
 
  document.body.appendChild(a);
  a.click();
}

// #endregion

// #region GUI Updaters

/**
 * Update the draw canvas with the latest point and line segment.
 * @param {Object} context - The draw context.
 * @param {Number} x - The x-coordinate.
 * @param {Number} y - The y-coordinate.
 */
function updateCanvas(canvas, context, x, y) {
  // !!!
  if (CanvasData.points.length === 0) {
    var canvasState = context.getImageData(0, 0, canvas.width, canvas.height);
    canvasStates.push(canvasState);
  }

  // lastX is not set => set lastX and lastY to the current position
  if (lastX === -1) {
    lastX = x;
    lastY = y;
  }

  // draw latest line segment
  drawLineSegment(context, lastX, lastY, x, y, strokeColor, strokeSize);

  // Update the last position to reference the current position
  lastX = x;
  lastY = y;
}
  
/**
 * Clear the canvas, and also the save link (if any).
 * @param {Object} canvas - The draw canvas.
 * @param {Object} context - The draw context. 
 */
function clearCanvas(canvas, context) {
  // clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // TODO: clear the save link, if any
  // document.getElementById("saveLink").innerHTML = "";
}
  
/**
 * Draw a line segment between two points onto the draw canvas.
 * @param {Object} context - The draw context.
 * @param {Number} x0 - The first x-coordinate.
 * @param {Number} y0 - The first y-coordinate.
 * @param {Number} x1 - The second x-coordinate.
 * @param {Number} y1 - The second y-coordinate.
 * @param {String} color - The stroke color.
 * @param {Number} size - The stroke size.
 */
function drawLineSegment(context, x0, y0, x1, y1, color, size) {

  // set the stroke color
  context.strokeStyle = color;
  //ctx.strokeStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";

  // set the line "cap" style to round, so lines at different angles can join into each other
  //context.lineCap = "round"; (default is "butt")

  // begin the stroke path
  context.beginPath();

  // user drew dot => increment the position by one to make drawn dot visible
  if (x0 === x1 && y0 === y1) {
    x1++;
    y1++;
  }

  // move to the previous point position
  context.moveTo(x0, y0);

  // draw a line to the current point position
  context.lineTo(x1, y1);

  // set the line thickness and draw the line
  context.lineWidth = size;
  context.stroke();

  // end the stroke path
  context.closePath();
}
  
/**
 * Redraws the strokes back onto the draw canvas.
 * @param {Object} canvas - The draw canvas.
 * @param {Object} context - The draw context.
 * @param {Object[]} strokes - The array of sketch strokes.
 * @param {String} strokeColor - The stroke color.
 * @param {Number} strokeSize - The stroke size.
 */
function redraw(canvas, context, strokes, strokeColor, strokeSize) {
  // clear the canvas before re-drawing strokes
  clearCanvas(canvas, context);

  //
  var file = entries[index].file;

  // read the file
  var fileReader = new FileReader();
  fileReader.readAsDataURL(file);

  // create the image
  var image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function() {
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    // redraw each stroke
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;

      // re-draw the line segments of the current stroke
      for (var j = 0; j < points.length - 1; j++) {
        var point0 = points[j];
        var point1 = points[j + 1];
        drawLineSegment(context, point0.x, point0.y, point1.x, point1.y, strokeColor, strokeSize);
      }
    }
  };
  
}

// #endregion

// #region Mouse Event Handlers

/**
 * Keeps track of the mouse button being pressed, and draws a dot.
 */
function canvas_mouseDown() {
  mouseDown = true;
  updateCanvas(canvas, context, mouseX, mouseY);
  collectPoint(mouseX, mouseY);
}

/**
 * Keeps track of the mouse position, and draws a dot if the mouse button is currently ressed.
 * @param {Object} e - The mouse event.
 */
function canvas_mouseMove(e) {
  // update the mouse co-ordinates when moved
  getMousePos(e);

  // draw a dot if the mouse button is currently being pressed
  if (mouseDown) {
      updateCanvas(canvas, context, mouseX, mouseY);
      collectPoint(mouseX, mouseY);
  }
}

/**
 * Keep track of the mouse button being released.
 */
function canvas_mouseUp() {
  // mousedown flag not already down => leave function 
  if (!mouseDown) { return; }

  // collect the stroke only if the mouse was already down, and disable the mouse tracking
  if (mouseDown) { collectStroke(); }
  mouseDown = false;

  // reset lastX and lastY to -1 to indicate that they are now invalid since mouse is up
  lastX = -1;
  lastY = -1;
}

/**
 * Set the current mouse position from the current mouse event.
 * @param {Object} e - The mouse event.
 */
function getMousePos(e) {
  if (!e)
      var e = event;

  if (e.offsetX) {
      mouseX = e.offsetX;
      mouseY = e.offsetY;
  }
  else if (e.layerX) {
      mouseX = e.layerX;
      mouseY = e.layerY;
  }
}

// #endregion

// #region Touch Event Handlers

/**
 * Draw when touch start is detected.
 */
function canvas_touchStart() {
  // update the touch coordinates
  getTouchPos();

  updateCanvas(canvas, context, touchX, touchY);
  collectPoint(touchX, touchY);

  // prevent an additional mousedown event being triggered
  event.preventDefault();
}

/**
 * Draw when touch movement is detected, and prevent default scrolling.
 * @param {Object} e - The touch event.
 */
function canvas_touchMove(e) {
  // update the touch co-ordinates
  getTouchPos(e);

  // during a touchmove event, unlike a mousemove event, there is no need to check if the touch is engaged,
  // since there will always be contact with the screen by definition.
  updateCanvas(canvas, context, touchX, touchY);
  collectPoint(touchX, touchY);

  // prevent a scrolling action as a result of this touchmove triggering.
  event.preventDefault();
}

/**
 * Finish drawing when touch is completed.
 */
function canvas_touchEnd() {
  // reset lastX and lastY to -1 to indicate that they are now invalid, since touch is completed
  lastX = -1;
  lastY = -1;

  collectStroke();
}

/**
 * Get the touch position relative to the top-left of the draw canvas.
 * Note: When getting the raw values of pageX and pageY below, it takes into account the scrolling on the page
 * but not the position relative to our target div. Therefore, adjust them using "target.offsetLeft" and
 * target.offsetTop" to get the correct values in relation to the top left of the canvas.
 * @param {Object} e - The touch event.
 */
function getTouchPos(e) {
  if (!e) {var e = event; }

  if(e.touches) {
    if (e.touches.length === 1) { // Only deal with one finger
      var touch = e.touches[0]; // Get the information for finger #1
      touchX = touch.pageX - touch.target.offsetLeft;
      touchY = touch.pageY - touch.target.offsetTop;
    }
  }
}

// #endregion

// #region Data Collectors

/**
 * Collects the current point to add to the list.
 * @param {Number} x - The current point's x-coordinate.
 * @param {Number} y - The current point's y-coordinate.
 */
function collectPoint(x, y) {

  // create the current point and add to the point collection
  var time = Date.now();                  // create the time
  var id = generateUuidv4();
  var point = {x: x, y: y, time: time, id: id};   // create the point
  CanvasData.points.push(point);      // add to point collection
}

/**
 * Collects the current stroke to the list.
 */
function collectStroke() {
  //
  var id = generateUuidv4();
  var time = CanvasData.points[0].time;
  var stroke = {id: id, time: time, points: CanvasData.points, };
  CanvasData.strokes.push(stroke);
  CanvasData.points = [];
}

/**
 * Collects the current sketch to add to the list.
 */
function collectSketch(strokes, width, height, interpretation, domain) {
  var id = generateUuidv4();

  // get the sketch's first time
  var firstTime = strokes[0].points[0].time;

  // create the sketch's shapes object
  var shape = {};
  shape.subElements = [];
  for (var i = 0; i < strokes.length; i++) {
    var stroke = strokes[i];
    shape.subElements.push(stroke.id);
  }
  shape.time = firstTime;
  shape.interpretation = interpretation;
  shape.confidence = "1.0";

  // id, time, domain, strokes, shapes
  var sketch = {};
  sketch.id = id;
  sketch.time = firstTime;
  sketch.domain = domain;
  sketch.canvasWidth = width;
  sketch.canvasHeight = height;
  sketch.strokes = strokes;
  sketch.substrokes = strokes;
  sketch.shapes = [shape];

  CanvasData.sketches.push(sketch);
}

/**
 * Generates a new UUID (v4) value.
 * @return {Number} A new UUID (v4) value.
 */
function generateUuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// #endregion

// #region Helper Functions

function updateHeader(label, index, max) {
  var labelText = document.getElementById("labelText");
  labelText.innerHTML = "Label:<br/>" + label;
  var progressText = document.getElementById("progressText");
  progressText.innerHTML = "Progress:<br/>" + index + " / " + max;
}

function loadCanvasImage(canvas, context, file, showTrace) {
  // read the file
  var fileReader = new FileReader();
  fileReader.readAsDataURL(file);

  // create the image
  var image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function() {
    canvas.width = image.width;
    canvas.height = image.height;

    if (showTrace) { context.drawImage(image, 0, 0); }
  };
}

function loadThumbnailImage(element, file) {
  // read the file
  var fileReader = new FileReader();
  fileReader.readAsDataURL(file);

  // create the thumbnail image
  var image = document.createElement('img');
  image.src = URL.createObjectURL(file);
  image.style.height = "100px";
  image.style.width = "auto";
  image.onload = function() {
    element.innerHTML = "";
    element.appendChild(image);
  };
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// #endregion

// #region Fields

// The canvas and its context.
var canvas;
var context;

// The image and study files.
var imageFiles;
var studyFile;

// The study entries and current index.
var entries;
var index;

// The mouse interaction variables.
var mouseX = 0;
var mouseY = 0;
var mouseDown;

// The touch interaction variables.
var touchX;
var touchY;

// Keep track of the old/last position when drawing a line
// We set it to -1 at the start to indicate that we don't have a good value for it yet
var lastX = -1;
var lastY = -1;

// The stroke size and color.
var strokeSize = 5;
var strokeColor = "black";

// The data structure variables for storing the data collection session.
var CanvasData = {
  points: [],
  strokes: [],
  sketches: [],
};

// The canvas states.
var canvasStates;

// The canvas dimensions.
var canvasWidth;
var canvasHeight;

// The display types.
var displayType;
var DISPLAY_TRACE = "trace";
var DISPLAY_PREVIEW = "preview";
var DISPLAY_TEXT = "text";

// #endregion