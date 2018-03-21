var Greedy = {
  /**
   * Run the template matcher on the input sketch.
   * @param {Object} input The input sketch.
   * @param {Object[]} templates The template sketches. 
   */
  run: function(input, templates) {
    // iterate through each template
    var results = [];
    for (var i = 0; i < templates.length; ++i) {
      // 1. Get the input's point cloud.
      // 2. Get the template and its label and point cloud.
      // 3. Get the smaller point cloud size beteween the input and template point clouds.
      // 4. Pop the larger point cloud until both point clouds are the same size.

      // get the input's point cloud
      var inputCloud = SketchRecTools.getPointCloud(input);

      // get the current template and its label and point cloud
      var template = templates[i];
      var templateLabel = template.shapes[0].interpretation;
      var templateCloud = SketchRecTools.getPointCloud(template);

      // get the smaller point count of the input and template point clouds
      var pointCount = Math.min(inputCloud.length, templateCloud.length);

      // pop the larger point cloud until both point clouds are the same size
      while (inputCloud.length > pointCount) { inputCloud.pop(); }
      while (templateCloud.length > pointCount) { templateCloud.pop(); }

      // calculate the greedy Hausdorff distance between the input and template both ways
      // need to divide by point count since point cloud count differs per template
      var score = this.calculateDistance(inputCloud, templateCloud) / pointCount;   // compare input from template
      var score2 = this.calculateDistance(templateCloud, inputCloud) / pointCount;  // compare template from input

      // get the lowest score
      score = score < score2 ? score : score2;

      // get and add the template-distance pair
      var result = {label: templateLabel, score: score};
      results.push(result);
    }

    // sort and return the template-distance pairs
    results.sort(function(a, b) { return a.score - b.score; });
    return results;
  },

  calculateDistance: function(cloud, otherCloud) {
    // set up both point clouds
    // need to clone the second point cloud since it will be modified
    var thisCloud = cloud;
    var thatCloud = [];
    for (var i = 0; i < otherCloud.length; ++i) { thatCloud.push(otherCloud[i]); }

    // iterate through the input point cloud
    var distance = 0;
    for (var i = 0; i < thisCloud.length; ++i) {
      // get the current input point
      var thisPoint = thisCloud[i];

      // iterate through the template points
      // find the minimum Euclidean distance between the input and template point  
      var minDistance = Number.MAX_SAFE_INTEGER;
      var minIndex = -1;
      for (var j = 0; j < thatCloud.length; ++j) { // fix

        // get the current template point
        var templatePoint = thatCloud[j];

        // get the input-template Euclidean distance
        var currentDistance
          = SketchRecTools.calculateDistance(
              thisPoint.x,
              thisPoint.y,
              templatePoint.x,
              templatePoint.y);
        
        // check for minimum distance
        if (currentDistance < minDistance) {
          minDistance = currentDistance;
          minIndex = j;
        }
      }

      // add the  minimum distance
      distance +=  minDistance;
      thatCloud.splice(minIndex, 1);
    }

    // calculate and return the score from the Hausdorff distance
    var score = distance; // / thisCloud.length;
    return score;
  }

  //end
};