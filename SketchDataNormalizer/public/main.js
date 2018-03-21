// ####################
// ### INITIALIZERS ###
// ####################
// #region Initializers

/**
 * Initializes the body at start.
 */
function init() {

    // initialize the sketch collection and current index
    sketch = [];
    currentIndex = 0;
    hasReadBefore = false;

    // load files at file input
    input = document.querySelector('input'); // access the <input> tag
    input.addEventListener('change', loadFiles);

    // get the canvas and its context
    drawCanvas = document.getElementById('drawCanvas');
    if (drawCanvas.getContext) {
        drawContext = drawCanvas.getContext('2d');
    }

    // initially disable all other buttons (until data is finally loaded later)
    disableInputTagStates(true);
}

/**
 * Loads the file or files from the file open dialog window.
 * @param {Object} event The loading files event.
 */
function loadFiles(event) {

  // display loading message
  document.getElementById("indexDisplay").innerHTML = "Waiting for sketches to be loaded...";

  // initially disable the buttons
  disableInputTagStates(true);
    
  // get the files that were selected from the <input> tag's file open dialog window
  var files = event.target.files;
          
  // no file or files selected => quit function
  if (files.length === 0) { alert("Failed to load files"); }

  // initialze the repsective counts and flag
  numReads = 0;
  numFiles = files.length;
  hasReadBefore = false;

  // collect the sketches from the file or files
  sketches = [];
  for (var i = 0; i < files.length; i++) {

    // get the current file
    var file = files[i];

    // set up the reader once it is ready to load the file
    // note: closure is used to ensure that code is processed in-line
    var reader = new FileReader();
    reader.onload = ( function(file) {
      return function(e) {

        // get the curent local sketch
        var text = e.target.result;
        var localSketches = JSON.parse(text);

        // add the sketch to the general collection of contents 
        for (var j = 0; j < localSketches.length; j++) {
          var localSketch = localSketches[j];
          sketches.push(localSketch);
        }

        // check if file-reading has been done before after lodaing the files
        if (!hasReadBefore) {
          // 1. get the first sketch
          // 2. display the first sketch
          // 3. indicate that file reading has been done
          var first = localSketches[0];
          displaySketch(first, strokeColor);

          // enable the read-before flag
          hasReadBefore = true;
        }

        //
        numReads++;

        if (numReads === numFiles) {
          // enable all the buttons
          if (sketches.length >= 1) {
              disableInputTagStates(false);
              document.getElementById("backButton").disabled = true;;
          }
          else {
            disableInputTagStates(true);
          }

          //
          currentIndex = 0;
          updateIndexDisplay(currentIndex, sketches.length - 1);

          //
          document.getElementById("sketchDataUploadsButton").value = "";
        }

      };
    })(file);

    // read the current file
    reader.readAsText(file);
  }

}

// #endregion



// ##########################
// ### CONTENT DISPLAYERS ###
// ##########################
// #region Content Displayers

/**
 * Displays the sketch to the canvas.
 * @param {Object} sketch - The input sketch.
 * @param {String} color - The sketch's stroke colors.
 */
function displaySketch(sketch, color) {
    //
    var originalColor = this.strokeColor;					// save original color
    strokeColor = color;								// change color
    drawContext.fillStyle = color;

    //
    drawCanvas.width = sketch.canvasWidth;
    drawCanvas.height = sketch.canvasHeight;

    // iterate through each stroke
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; i++) {
        var points = strokes[i].points;

        // iterate through each point in the stroke
        for (var j = 0; j < points.length - 1; j++) {

            var currPoint = points[j];
            var nextPoint = points[j + 1];
            drawLineSegment(drawContext, currPoint.x, currPoint.y, nextPoint.x, nextPoint.y, strokeColor, strokeSize);
        }
    }
    strokeColor = originalColor;						// revert color
    drawContext.fillStyle = strokeColor;
}

/**
 * Draw a line segment between two points on the display canvas.
 * @param {Object} context - The display context.
 * @param {Number} x0 - The first x-coordinate.
 * @param {Number} y0 - The first y-coordinate.
 * @param {Number} x1 - The second x-coordinate.
 * @param {Number} y1 - The second y-coordinate,
 * @param {String} color - The stroke color.
 * @param {Number} size - The stroke size.
 */
function drawLineSegment(context, x0, y0, x1, y1, color, size) {
    
    // select a fill style
    context.strokeStyle = color;

    // draw a filled line
    context.beginPath();

    // move to the old previous position
    context.moveTo(x0, y0);

    // draw a line to the current touch/pointer position
    context.lineTo(x1, y1);

    // set the line thickness and draw the line
    context.lineWidth = size;
    context.stroke();

    context.closePath();
}

/**
 * Displays the current sketch index and the total number ofsketches.
 * @param {Number} index - The current sketch index. 
 * @param {Number} total - The total number of sketches.
 */
function updateIndexDisplay(index, total) {
    document.getElementById("indexDisplay").innerHTML = "" + index + " / " + total;
}

function displayOptions() {
  var scale = document.getElementById("scaleBox").checked;
  var resample = document.getElementById("resampleBox").checked;
  var translate = document.getElementById("translateBox").checked;

  var scaleOptions = document.getElementById("scaleOptions");
  var resampleOptions = document.getElementById("resampleOptions");
  var translateOptions = document.getElementById("translateOptions");

  if (scale) { scaleOptions.style.display = "inline"; }
  else { scaleOptions.style.display = "none"; }

  if (resample) { resampleOptions.style.display = "inline"; }
  else { resampleOptions.style.display = "none"; }

  if (translate) { translateOptions.style.display = "inline"; }
  else { translateOptions.style.display = "none"; }
}

function displayScaleDimensions() {
  var display = document.getElementById("scaleProportionalButton").checked;
  var scaleDimensionButtons = document.getElementsByName("scaleDimension");
  
  for (var i = 0; i < scaleDimensionButtons.length; ++i)
    scaleDimensionButtons[i].disabled = !display;
}

function displayCanvasDimensions() {
  var display = document.getElementById("resizeCanvasButton").checked;

  document.getElementById("canvasWidthBox").disabled = !display;
  document.getElementById("canvasHeightBox").disabled = !display;
}

function displayTranslateCanvas() {
  var display = document.getElementById("translateSketchNoneButton").checked;

  document.getElementById("translateCanvasCenterButton").disabled = display;
  document.getElementById("translateCanvasOriginButton").disabled = display;
}

// #endregion



// ##########################
// ### TRANSITION BUTTONS ###
// ##########################
// #region Transition Buttons

/**
 * Displays the previous sketch.
 * @param {Object} canvas - The display canvas.
 * @param {Object} context - The display context. 
 */
function backButton(canvas, context) {
    // update the current index
    --currentIndex;
    updateIndexDisplay(currentIndex, sketches.length - 1);

    // disable the previous button if at the first sketch
    document.getElementById("nextButton").disabled = false;
    if (currentIndex === 0) {
        document.getElementById("backButton").disabled = true;
    }
    
    // clear the previous sketch and display the current sketch
    clearCanvas(canvas, context);
    displaySketch(sketches[currentIndex], strokeColor);
}

/**
 * Displays the next sketch.
 * @param {Object} canvas - The display canvas.
 * @param {Object} context - The display context. 
 */
function nextButton(canvas, context) {
    // update the current index
    ++currentIndex;
    updateIndexDisplay(currentIndex, sketches.length - 1);

    // disable the next button if at the last sketch
    document.getElementById("backButton").disabled = false;
    if (currentIndex === sketches.length - 1) {
        document.getElementById("nextButton").disabled = true;
    }

    // clear the previous sketch and display the current sketch 
    clearCanvas(canvas, context);
    displaySketch(sketches[currentIndex], strokeColor);
}

/**
 * Displays the inputted index's sketch. 
 * @param {Object} canvas - The display canvas.
 * @param {Object} context - The display context.
 */
function jumpButton(canvas, context) {
    // get the input target index from the corresponding text box
    var targetIndex = document.getElementById("targetIndex").value;

    // check for range
  if (targetIndex < 0 || targetIndex > sketches.length) {
    alert("ALERT: You have entered an index value that is out of range.");
    return;
  }

    // check for valid parsing
  targetIndex = Number.parseInt(targetIndex);
  if (Number.isNaN(targetIndex) || typeof targetIndex !== 'number') {
    alert("ALERT: You have entered a non-numerical index value.");
  }

    // 1. clear the canvas
    // 2. set the inputted index as the current index
    // 3. display the new current sketch to the canvas
    // 4. update the displayed current index
  clearCanvas(canvas, context);
  currentIndex = targetIndex;
  displaySketch(sketches[currentIndex], "black");
  updateIndexDisplay(currentIndex, sketches.length - 1);
}

// #endregion



// ########################
// ### HELPER FUNCTIONS ###
// ########################
// #region Helper Functions

function cloneSketch(sketch) {
  var clone = JSON.parse(JSON.stringify(sketch));
  return clone;
}

/**
 * Determines whether the input file is of type JSON.
 * @param {Object} file - The input file.
 * @return {Boolean} Whether the input file is of type JSON. 
 */
function validFileType(file) {

    // get the file extension
    var fileName = file.name;
    if (fileName.length <= 5) { return false; }
    var fileType = fileName.slice((fileName.length - 5) + 1, fileName.length);

    // compare the extension to the JSON extension
    if (fileType.toLowerCase() === "json") {
        return true;
    }

    return false;
}

/**
 * Handles the disable states of the interface buttons.
 * @param {Boolean} disable - Indicates whether to disable the interface buttons or not.
 */
function disableInputTagStates(disable) {
    // retrieve all buttons with the "buttonlook" class
    var buttonElements = document.querySelectorAll(".buttonlook");
    
    // individually set the disable state of each button
    for (var i = 0; i < buttonElements.length; i++) {
        buttonElements[i].disabled = disable;
    }
}

/**
 * Clears the canvas of strokes.
 * @param {Object} canvas  - The display canvas.
 * @param {Object} context - The display context. 
 */
function clearCanvas(canvas, context) {
  // clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function checkNumber(value) {
  return (typeof value === 'number') && !Number.isNaN(value);
}

function displayPoints(context, points, color) {
  context.fillStyle = color;						// change color
  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    context.beginPath();
    context.arc(point.x, point.y, 5, 0, 2* Math.PI);
    context.fill();
    context.closePath();
  }
  context.fillStyle = strokeColor;			// revert color
}

function downloadData(contents) {
  // serialize the sketches
  var data = JSON.stringify(contents, null, jsonSpaces);
  var blob = new Blob([data], {type: "application/json"});
  var url  = URL.createObjectURL(blob);  
  var a = document.createElement('a');
  a.href = url;
  a.download = "data.json";
	
	// pop up the download
	document.body.appendChild(a);
	a.click();
}

// #endregion



// ###############################
// ### NORMALIZATION FUNCTIONS ###
// ###############################
// #region Normalization Functions 

function previewButton(canvas, context) {
  // clone the original sketch
  var original = sketches[currentIndex];
  var sketch = cloneSketch(original);

  // case: scale option selected
  var scaleBox = document.getElementById("scaleBox");
  if (scaleBox.checked) { sketch = doScale(sketch); }
  if (sketch === undefined) { return; }

  // case: resample option selected
  var resampleBox = document.getElementById("resampleBox");
  if (resampleBox.checked) { sketch = doResample(sketch); }
  if (sketch === undefined) { return; }

  // case: translate option selected
  var translateBox = document.getElementById("translateBox");
  if (translateBox.checked) { sketch = doTranslate(sketch); }
  if (sketch === undefined) { return; }

  // clear the previous sketch and display the normalized sketch 
  clearCanvas(canvas, context);
  displaySketch(sketch, strokeColor);

  // resample box and display points box checked => display points
  if (resampleBox.checked && document.getElementById("displayPointsBox").checked) {
    var points = [];
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; i++) {
      var stroke = strokes[i];
      for (var j = 0; j < stroke.points.length; j++) {
        points.push(stroke.points[j]);
      }
    }
    displayPoints(drawContext, points, "red");
  }
}

function doScale(sketch) {
  // clone the original sketch
  var original = cloneSketch(sketch);

  // get the resize amount
  var resizeAmount = Number.parseInt(document.getElementById("resizeAmountBox").value);
  if (!checkNumber(resizeAmount) || resizeAmount <= 0) {
    alert("Resize amount is not in range.");
    return sketch;
  }

  // sketch-only box is unchecked => temporarily add canvas stroke to sketch
  var sketchOnly = document.getElementById("scaleStrokesButton").checked;
  if (!sketchOnly) {
    // create the canvas stroke
    var point1 = {x: 0, y: 0, t: 0};
    var point2 = {x: sketch.canvasWidth, y: sketch.canvasHeight, t: 0};
    var canvasStroke = {points: [point1, point2]};

    // add the canvas stroke to the sketch
    sketch.strokes.push(canvasStroke);
  }

  // get the original canvas dimensions
  var canvasWidth = sketch.canvasWidth;
  var canvasHeight = sketch.canvasHeight;

  // proportional button checked => proportionally scale sketch
  if (document.getElementById("scaleProportionalButton").checked) {
    // get sketch's bounding box and its center coordinates
    var preBox = SketchRecTools.calculateBoundingBox(sketch);
  
    // determine whether sketch should be scaled vertically from options
    var isVertical;
    if (document.getElementById("scaleWidthButton").checked) { isVertical = false; }
    else if (document.getElementById("scaleHeightButton").checked) {isVertical = true; }
    else if (document.getElementById("scaleLongButton").checked) { isVertical = preBox.width > preBox.height; }
    else if (document.getElementById("scaleShortButton").checked) { isVertical = preBox.width < preBox.height; }
  
    // scale the sketch proportionally
    sketch = SketchRecTools.scaleProportional(sketch, resizeAmount, isVertical);

    if (sketchOnly) {
      // set sketch to original canvas dimensions
      sketch.canvasWidth = canvasWidth;
      sketch.canvasHeight = canvasHeight;
    }
    else {
      // align the sketch back to the origin
      var postBox = SketchRecTools.calculateBoundingBox(sketch);
      sketch = SketchRecTools.translate(sketch, -postBox.minX, -postBox.minY);

      // resize the sketch's canvas to the resize amount
      sketch.canvasWidth = resizeAmount;
      sketch.canvasHeight = resizeAmount;
    }
  }

  // square button checked => scale sketch squarely
  else {
    // scale the sketch squarely
    sketch = SketchRecTools.scaleSquare(sketch, resizeAmount);

    // set sketch to original canvas dimensions
    sketch.canvasWidth = canvasWidth;
    sketch.canvasHeight = canvasHeight;
  }

  // sketch-only box is unchecked => remove canvas stroke from sketch
  if (!sketchOnly) { sketch.strokes.pop(); }

  return sketch;
}

function doResample(sketch) {
  // clone the original sketch
  var original = cloneSketch(sketch);

   // get the resize amount
  var resampleAmount = Number.parseInt(document.getElementById("resampleAmountBox").value);
  if (!checkNumber(resampleAmount) || resampleAmount <= 0) {
    alert("Resample amount is not in range.");
    return sketch;
  }

  // resample count radio button selected => resample sketch by count
  if (document.getElementById("resampleCountButton").checked)
    sketch = SketchRecTools.resampleByCount(sketch, resampleAmount);
  // resample distance radio button selected => resample sketch by distance
  else if (document.getElementById("resampleDistanceButton").checked)
    sketch = SketchRecTools.resampleByDistance(sketch, resampleAmount);

  // set sketch to original sketch dimensions
  sketch.canvasWidth = original.canvasWidth;
  sketch.canvasHeight = original.canvasHeight;

  return sketch;
}

function doTranslate(sketch) {
  // clone the original sketch
  var original = cloneSketch(sketch);

  // resize canvas button checked => save sketch's new dimensions
  var resizeCanvas = document.getElementById("resizeCanvasButton").checked;
  var width, height;
  if (resizeCanvas)
  {
    // get the new width 
    width = Number.parseInt(document.getElementById("canvasWidthBox").value);
    if (!checkNumber(width) || width <= 0) {
      alert("Width is not in range.");
      return sketch;
    }

    // get the new height
    height = Number.parseInt(document.getElementById("canvasHeightBox").value);
    if (!checkNumber(height) || height <= 0) {
      alert("Height is not in range.");
      return sketch;
    }

    // set the new dimensions
    sketch.canvasWidth = width;
    sketch.canvasHeight = height;
  }

  // translate sketch based on options
  if (document.getElementById("translateSketchNoneButton").checked)
    ; // do nothing
  else if (document.getElementById("translateSketchCenterButton").checked)
    sketch = SketchRecTools.translateToCenter(sketch);
  else if (document.getElementById("translateSketchCentroidButton").checked)
    sketch = SketchRecTools.translateToCentroid(sketch);

  // translate canvas based on options
  if (document.getElementById("translateCanvasCenterButton").checked)
    ; // do nothing
  else if (document.getElementById("translateCanvasOriginButton").checked)
    sketch = SketchRecTools.translate(sketch, -sketch.canvasWidth/2, -sketch.canvasHeight/2); 
  
  // set sketch to original canvas dimensions
  if (!resizeCanvas)
  {
    sketch.canvasWidth = original.canvasWidth;
    sketch.canvasHeight = original.canvasHeight;
  }
  
  return sketch;
}

function resetButton(canvas, context) {
  // clear the previous sketch and display the current sketch 
  clearCanvas(canvas, context);
  displaySketch(sketches[currentIndex], strokeColor);
}

function normalizeAllButton() {
  //
  var normalized = [];
  for (var i = 0; i < sketches.length; ++i) {
    // clone the original sketch
    var original = sketches[i];
    var input = cloneSketch(original);

    // case: scale option selected
    var scaleBox = document.getElementById("scaleBox");
    if (scaleBox.checked) { input = doScale(input); }
    if (input === undefined) { return; }

    // case: resample option selected
    var resampleBox = document.getElementById("resampleBox");
    if (resampleBox.checked) { input = doResample(input); }
    if (input === undefined) { return; }

    // case: translate option selected
    var translateBox = document.getElementById("translateBox");
    if (translateBox.checked) { input = doTranslate(input); }
    if (input === undefined) { return; }

    // transfer and update the remaining sketch data properties
    var sketch = {};
    sketch.id = SketchRecTools.generateUuidv4();
    sketch.time = original.strokes[0].points[0].time; 
    sketch.domain = original.domain;
    sketch.canvasWidth = input.canvasWidth;
    sketch.canvasHeight = input.canvasHeight;
    sketch.strokes = [];
    for (var j = 0; j < input.strokes.length; ++j) {
      var stroke = {};
      stroke.id = SketchRecTools.generateUuidv4();
      stroke.time = input.strokes[j].points[0].time;
      stroke.points = input.strokes[j].points;
      for (var k = 0; k < stroke.points.length; ++k) {
        var point = stroke.points[k];
        point.id = SketchRecTools.generateUuidv4();
      }
      sketch.strokes.push(stroke);
    }
    
    // create the sketch shapes property
    var shape = {};
    shape.subElements = [];
    for (var j = 0; j < sketch.strokes.length; ++j)
      shape.subElements.push(sketch.strokes[j].id);
    shape.time = original.strokes[0].points[0].time;
    shape.interpretation = original.shapes[0].interpretation;
    shape.confidence = "1.0";
    sketch.shapes = [shape];
  
    // add the normalized sketch to the list
    normalized.push(sketch);
  }

  // download the list of normalized sketches
  downloadData(normalized);
}

// #endregion


// ##########
// # FIELDS #
// ##########
// #region Fields

//  Accesses the canvas and its information.
var drawCanvas;
var drawContext;

// Keeps track of the sketches and index of the currently-viewed sketch. 
var sketches;
var currentIndex;

// Stores the stroke visual details.
var strokeSize = 3;
var strokeColor = "black";

// Flag for whether a file has been read yet after initial loading.
// If true, then the currently-read file is the first file being read.
// So get the first file's first sketch to load into display canvas. 
var hasReadBefore;

// Keeps track of the number of file reads after loading and number of files.
// If the number of reads match the number of files, then the reading is done. 
var numReads;
var numFiles;

var jsonSpaces = 0;

// #endregion


// SketchRecTools library
var SketchRecTools = {
  
    /**
     * Calculates the bounding box.
     * @param {Sketch} sketch - The target sketch.
     * @return {Box} The target sketch's bounding box.
     */
    calculateBoundingBox: function(sketch) {
      // bounding box is null if there is not sketch or sketch strokes
      if (sketch === null || sketch === undefined || sketch.strokes === null || sketch.strokes === undefined || sketch.strokes.length === 0) {
        return null;
      }
  
      // get the sketch's strokes and first point
      var strokes = sketch.strokes;
      var point0 = strokes[0].points[0];

      // initially set the min and max coordinates to the first point
      var minX = point0.x;
      var minY = point0.y;
      var maxX = point0.x;
      var maxY = point0.y;

      // initialize the coordinate sums and count
      var sumX = 0;
      var sumY = 0;
      var count = 0;
  
      // iterate through each stroke
      for (var i = 0; i < strokes.length; i++) {
        // get the current stroke points
        var points = strokes[i].points;
        
        // iterate through each stroke point
        for (var j = 0; j < points.length; j++) {
          // get the current point
          var point = points[j];
          
          // check the point for min and max coordinate conditions
          if (point.x < minX) { minX = point.x; }
          else if (point.x > maxX) { maxX = point.x; }
          if (point.y < minY) { minY = point.y; }
          else if (point.y > maxY) { maxY = point.y; }

          // add to the coordinate sums and count
          sumX += point.x;
          sumY += point.y;
          ++count;
        }
      }

      // calculate the center coordinates
      var centerX = minX + ((maxX - minX) / 2);
      var centerY = minY + ((maxY - minY) / 2);
  
      // calculate the centroid coordinates
      var centroidX = sumX / count;
      var centroidY = sumY / count;

      // calculate the corner, center, and centroid points 
      var topLeft = {x: minX, y: minY};
      var topRight = {x: maxX, y: minY};
      var bottomLeft = {x: minX, y: maxY};
      var bottomRight = {x: maxX, y: maxY};
      var center = {x: centerX, y: centerY};
      var centroid = {x: centroidX, y: centroidY};
  
      // calcuate the dimensions
      var width = maxX - minX;
      var height = maxY - minY;
  
      // create and return the bounding box
      var box = {topLeft: topLeft,
        topRight: topRight,
        bottomLeft: bottomLeft,
        bottomRight: bottomRight,
        center: center,
        centroid: centroid,
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY,
        centerX: centerX,
        centerY: centerY,
        centroidX: centroidX,
        centroidY: centroidY,
        height: height,
        width: width};
      return box;
    },

    scaleProportional: function(sketch, size, isVertical) {
      // get the bounding box and determine scale
      var box = this.calculateBoundingBox(sketch);

      // var scale = box.height > box.width ? size / box.height : size / box.width;
      var scale = isVertical ? size / box.height : size / box.width;
  
      // get the offset
      var xOffset = Number.MAX_SAFE_INTEGER;
      var yOffset = Number.MAX_SAFE_INTEGER;
      var strokes = sketch.strokes;
      for (var i = 0; i < strokes.length; i++) {
        var points = strokes[i].points;
        for (var j = 0; j < points.length; j++) {
          var point = points[j];
          if (point.x < xOffset) { xOffset = point.x; }
          if (point.y < yOffset) { yOffset = point.y; }
        }
      }
  
      // get the scaled sketch
      var newStrokes = [];
      for (var i = 0; i < strokes.length; i++) {
        var points = strokes[i].points;
        var newPoints = [];
        for (var j = 0; j < points.length; j++) {
          var point = points[j];
          var x = ((point.x - xOffset) * scale) + xOffset;
          var y = ((point.y - yOffset) * scale) + yOffset;
          newPoints.push({x: x, y: y, time: point.time});
        }
        var newStroke = {points: newPoints};
        newStrokes.push(newStroke);
      }
      var newSketch = {strokes: newStrokes};
  
      // relocate scaled sketch to center of original sketch
      var newBox = this.calculateBoundingBox(newSketch);
      var moveX = box.centerX - newBox.centerX;
      var moveY = box.centerY - newBox.centerY;
      newSketch = this.translate(newSketch, moveX, moveY);
  
      return newSketch;
    },

    scaleSquare: function(sketch, size) {
      // get the bounding box
      var box = this.calculateBoundingBox(sketch);
  
      // get the scaled sketch
      var newStrokes = [];
      var strokes = sketch.strokes;
      for (var i = 0; i < strokes.length; i++) {
        var points = strokes[i].points;
        var newPoints = [];
        for (var j = 0; j < points.length; j++) {
          var point = points[j];
          var x = point.x * size / box.width;
          var y = point.y * size / box.height;
          newPoints.push({x: x, y: y, time: point.time});
        }
        var newStroke = {points: newPoints};
        newStrokes.push(newStroke);
      }
      var newSketch = {strokes: newStrokes};
  
      // relocate scaled sketch to center of original sketch
      var newBox = this.calculateBoundingBox(newSketch);
      var moveX = box.centerX - newBox.centerX;
      var moveY = box.centerY - newBox.centerY;
      newSketch = this.translate(newSketch, moveX, moveY);
  
      return newSketch;
    },

    resampleByCount: function(sketch, n) {
      var S = this.calculatePathLength(sketch) / (n - 1);
  
      return this.resample(sketch, S);
    },

    resampleByDistance: function(sketch, S) {
      if (typeof S === "undefined") {
        S = this.determineResampleSpacing(sketch);
      }
  
      return this.resample(sketch, S);
    },

    /**
     * Resamples the sketch on an interspacing distance.
     * @param {Sketch} sketch - The target sketch.
     * @param {number} S - The interspacing distance.
     * @return {Sketch} The resampled sketch.
     */
    resample: function(sketch, S) {
      //  initialize the variables
      var D = 0.0;
      var newStrokes = [];
      var strokes = sketch.strokes;

      // iterate through the strokes
      for (var i = 0; i < strokes.length; i++) {
        // get the current stroke, and skip if no points
        var stroke = strokes[i];
        if (stroke.points.length === 0) { continue; }

        // get the raw points
        var points = [];
        for (var j = 0; j < stroke.points.length; j++) {
          // get the current stroke point and add it to the points list
          var p = stroke.points[j];
          points.push(p);
        }

        // initialize the resampled points with the first raw point
        var newPoints = [];
        newPoints.push( {x: points[0].x, y: points[0].y, time: points[0].time} );

        // get the resampled points
        for (var j = 1; j < points.length; j++) {
          // get the previous and current point
          var prevPoint = points[j - 1];
          var currPoint = points[j];

          // get the distance between the previous and current point
          var d = this.calculateDistance(prevPoint.x, prevPoint.y, currPoint.x, currPoint.y);

          // check for ready resampled points
          if (D + d >= S) { // resampled point ready

            // set the resampled point's (x, y, t)
            var qx = prevPoint.x + ((S-D)/d)*(currPoint.x-prevPoint.x);
            var qy = prevPoint.y + ((S-D)/d)*(currPoint.y-prevPoint.y);
            var qt = currPoint.time;

            // set the resampled point data
            var q = {x: qx, y: qy, time: qt};

            // insert the resampled point into the raw and resampled point list
            newPoints.push(q);
            points.splice(j, 0, q);
            D = 0.0;
          }
          else { D += d; } // resampled point ready
        }

        // reset the distance counter for the next stroke
        D = 0.0;

        // wrap the resampled points to a stroke and add it to array of resampled strokes
        newStroke = {points: newPoints};
        newStrokes.push(newStroke);
      }

      // wrap the resampled strokes into a resampled sketch and return
      var newSketch = {strokes: newStrokes};
      return newSketch;
    },

    /**
     * Translate the sketch to a point.
     * @param {Sketch} sketch - The target sketch.
     * @param {number} x - The amount of pixels to move the sketch left or right.
     * @param {number} y - The amount of pixels to move the sketch up or down.
     * @return {Sketch} The translated sketch.
     */
    translate: function(sketch, x, y) {
      // error-check existing sketch 
      if (sketch === null || sketch === undefined || sketch.strokes === null || sketch.strokes === undefined || sketch.strokes.length === 0) {
        return null;
      }

      // get the current strokes and initialize the new strokes
      var strokes = sketch.strokes;
      var newStrokes = [];

      // iterate through each stroke
      for (var i = 0; i < strokes.length; i++) {

        // get the current points and initialize the new points
        var points = strokes[i].points;
        var newPoints = [];

        // iterate through each point
        for (var j = 0; j < points.length; j++) {

          // get the current point
          var point = points[j];

          // get the translated point
          var qx = point.x + x;
          var qy = point.y + y;
          var qtime = point.time;
          var q = {x: qx, y: qy, time: qtime};

          // add the new point
          newPoints.push(q);
        }

        // add the new stroke
        newStrokes.push({points: newPoints});
      }

      // create the new sketch and its canvas width and height
      var newSketch = {strokes: newStrokes};
      newSketch.canvasWidth = sketch.canvasWidth;
      newSketch.canvasHeight = sketch.canvasHeight;

      return newSketch;
    },

    translateToCenter: function(sketch) {
      var box = this.calculateBoundingBox(sketch);
      var boxX = box.centerX;
      var boxY = box.centerY;
      var canvasX = sketch.canvasWidth / 2;
      var canvasY = sketch.canvasHeight / 2;
      var deltaX = canvasX - boxX;
      var deltaY = canvasY - boxY;
      sketch = this.translate(sketch, deltaX, deltaY);

      return sketch;
    },

    translateToCentroid: function(sketch) {
      var box = this.calculateBoundingBox(sketch);
      var boxX = box.centroidX;
      var boxY = box.centroidY;
      var canvasX = sketch.canvasWidth / 2;
      var canvasY = sketch.canvasHeight / 2;
      var deltaX = canvasX - boxX;
      var deltaY = canvasY - boxY;
      sketch = this.translate(sketch, deltaX, deltaY);

      return sketch;

      return sketch;
    },

    determineResampleSpacing(sketch) {
      var box = this.calculateBoundingBox(sketch);
      var diagonal = this.calculateDistance(box.minX, box.minY, box.maxX, box.maxY);
      S = diagonal / 40.0;
  
      return S;
    },
  
    calculateDistance: function(x0, y0, x1, y1) {
      //
      return Math.sqrt( (x1 - x0)*(x1 - x0) + (y1 - y0)*(y1 - y0)  );
    },

    calculatePathLength: function(sketch) {
      // 
      var distances = 0.0;
  
      var strokes = sketch.strokes;
      for (var i = 0; i < strokes.length; i++) {
        var points = strokes[i].points;
        for (var j = 0; j < points.length - 1; j++) {
  
          var p0 = points[j];
          var p1 = points[j + 1];
          distances += this.calculateDistance(p0.x, p0.y, p1.x, p1.y);
        }
      }
  
      return distances;
    },

    /**
     * Generates a new UUID (v4) value.
     * @return {Number} A new UUID (v4) value.
     */
    generateUuidv4: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
  
  }