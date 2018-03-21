var SketchRecTools = {

  //#region Scale Methods
  scaleProportional: function(sketch, size, isVertical) {
    // get the bounding box and determine scale
    var box = this.calculateBoundingBox(sketch);
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

    // // restore the sketch's canvas dimensions
    // newSketch.canvasWidth = sketch.canvasWidth;
    // newSketch.canvasHeight = sketch.canvasHeight;

    // transfer the metadata back
    SketchRecTools.transferMetadata(newSketch, sketch);

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

    // transfer the metadata back
    SketchRecTools.transferMetadata(newSketch, sketch);

    return newSketch;
  },
  //#endregion

  //#region Resample Methods
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

    // // restore the sketch's canvas dimensions
    // newSketch.canvasWidth = sketch.canvasWidth;
    // newSketch.canvasHeight = sketch.canvasHeight;

    // transfer the metadata back
    SketchRecTools.transferMetadata(newSketch, sketch);

    return newSketch;
  },
  //#endregion

  //#region Translate Methods
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

    // // create the new sketch and its canvas width and height
    var newSketch = {strokes: newStrokes};

    // transfer the metadata back
    SketchRecTools.transferMetadata(newSketch, sketch);

    return newSketch;
  },

  translateToCenter: function(sketch) {
    var newSketch = this.cloneSketch(sketch);

    var box = this.calculateBoundingBox(sketch);
    var boxX = box.centerX;
    var boxY = box.centerY;
    var canvasX = sketch.canvasWidth / 2;
    var canvasY = sketch.canvasHeight / 2;
    var deltaX = canvasX - boxX;
    var deltaY = canvasY - boxY;
    newSketch = this.translate(newSketch, deltaX, deltaY);

    // transfer the metadata back
    this.transferMetadata(newSketch, sketch);

    return newSketch;
  },

  translateToCentroid: function(sketch) {
    var newSketch = this.cloneSketch(sketch);

    var box = this.calculateBoundingBox(sketch);
    var boxX = box.centroidX;
    var boxY = box.centroidY;
    var canvasX = sketch.canvasWidth / 2;
    var canvasY = sketch.canvasHeight / 2;
    var deltaX = canvasX - boxX;
    var deltaY = canvasY - boxY;
    newSketch = this.translate(newSketch, deltaX, deltaY);

    // transfer the metadata back
    this.transferMetadata(newSketch, sketch);

    return newSketch;
  },
  //#endregion

  //#region Helper Methods
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

  getPointCloud: function(sketch) {
    // initialize the list of points
    var pointCloud = [];

    // iterate through the strokes
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; ++i) {
      // iterate through the points
      var points = strokes[i].points;
      for (var j = 0; j < points.length; ++j) {
        // add the current point
        var point = points[j];
        pointCloud.push(point);
      }
    }

    return pointCloud;
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

  cloneSketch: function(sketch) {
    var clone = JSON.parse(JSON.stringify(sketch));
    return clone;
  },

  transferMetadata: function(sketch, original) {
    // add the sketch metadata
    sketch.id = this.generateUuidv4();
    sketch.time = original.strokes[0].points[0].time; 
    sketch.domain = original.domain;
    sketch.shapes = original.shapes;
    sketch.canvasWidth = original.canvasWidth;
    sketch.canvasHeight = original.canvasHeight;

    // iterate through each stroke 
    for (var i = 0; i < sketch.strokes.length; ++i) {
      // get the current stroke
      var stroke = sketch.strokes[i];

      // add the stroke metadata
      stroke.id = this.generateUuidv4();
      stroke.time = sketch.strokes[i].points[0].time;

      // iterate through each point
      for (var j = 0; j < stroke.points.length; ++j) {
        var point = stroke.points[j];

        // add the point metadata
        point.id = this.generateUuidv4();
      }
    }
    
  },

  convertSketchToSpreadsheet: function(sketch) {
    // iterate through the strokes
    var lines = [];
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; ++i) {
      // iterate through the points
      var points = strokes[i].points;
      for (var j = 0; j < points.length; ++j) {
        // get the current point
        var point = points[j];
        var x = point.x;
        var y = point.y;
        lines.push("" + x + "\t" + y);
      }
      
      //
      lines.push("");
    }
    
    return lines;
  }
  //#endregion

};