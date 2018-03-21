var Dollar = {
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
    var thisCloud = cloud;
    var thatCloud = otherCloud;

    // iterate through the input point cloud
    var distance = 0;
    for (var i = 0; i < thisCloud.length; ++i) {
      // get the current input and template point
      var thisPoint = thisCloud[i];
      var thatPoint = thatCloud[i];

      // add the minimum distance
      distance += SketchRecTools.calculateDistance(
        thisPoint.x,
        thisPoint.y,
        thatPoint.x,
        thatPoint.y);
    }

    // calculate and return the score from the Hausdorff distance
    var score = distance; // / thisCloud.length;
    return score;
  }

  //end
};