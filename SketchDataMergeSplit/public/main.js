// https://stackoverflow.com/questions/9815625/looping-through-files-for-filereader-output-always-contains-last-value-from-loo

function init() {

  //
  labelToContainerMap = {};

  // assign event handler to sketch loader button
  var sketchLoader = document.getElementById("sketchLoader");
  sketchLoader.addEventListener("change", loadSketches, false);
}

function loadSketches(e) {
  // get the sketch files from the sketch loader button
  sketchFiles = e.target.files;

  // get and clear the selections
  var leftSelections = document.getElementById("leftSelections");
  var rightSelections = document.getElementById("rightSelections");
  clearSelections(leftSelections);
  clearSelections(rightSelections);

  // read the sketch files
  var containers = [];
  var numFileReads = 0;
  for (var i = 0; i < sketchFiles.length; ++i) {
    // get the current sketch file
    var sketchFile = sketchFiles[i];

    // read the file
    (function(file) {

      // set up and run the file reader
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function(event) {
        // get the sketches
        var contents = event.target.result;
        var sketches = JSON.parse(contents);

        // get the sketch containers (container: filename, index, sketch)
        var localContainers = [];
        for (var j = 0; j < sketches.length; ++j) {
          // get the current sketch
          var sketch = sketches[j];

          // create the current container
          var container  = {};
          container.filename = file.name;
          container.index = j;
          container.sketch = sketch;
          container.label = container.filename + "[" + container.index + "] = " + container.sketch.shapes[0].interpretation;
          
          // add the container to the collection
          localContainers.push(container);
          containers.push(container);
        }

        // increment the number of file reads and quit if there are still more file reads left
        ++numFileReads;
        if (numFileReads !== sketchFiles.length) { return; }

        // sort containers by filename
        sortAscending(containers);

        // add the containers to the sketch selections
        for (var j = 0; j < containers.length; ++j) {
          // get the current container and dislay text
          var container = containers[j];

          // map the option text to the container
          labelToContainerMap[container.label] = container;

          // add the option to the left selections
          var option = document.createElement("option");
          option.value = option.text = container.label;
          leftSelections.options.add(option);
        }

        // update left selections count display
        updateCountDisplay(leftSelections.options.length, 0);

        // clear the loader
        var sketchLoader = document.getElementById("sketchLoader");
        sketchLoader.value = "";
      }

    })(sketchFile);

  }
}

function updateCountDisplay(leftCount, rightCount) {
  var leftCountDisplay = document.getElementById("leftCount");
  var rightCountDisplay = document.getElementById("rightCount");
  // leftCountDisplay.innerHTML = "#: " + leftCount;
  // rightCountDisplay.innerHTML = "#: " + rightCount;
  leftCountDisplay.innerHTML = "#: " + leftCount;
  rightCountDisplay.innerHTML = "#: " + rightCount;
}

function sortAscending(containers) {
  containers.sort(function(a, b) {
    if (a.filename > b.filename)
      return 1;
    else if (a.filename < b.filename)
      return -1;
    else {
      if (a.index > b.index)
        return 1;
      else if (a.index < b.index)
        return -1;
      else
        return 0;
    }
    // return (a.filename > b.filename) ? 1 : ((b.label > a.label) ? -1 : 0);
  });
}

function move(isRight) {
  // get sketch selections elements
  var leftSelections = document.getElementById("leftSelections");
  var rightSelections = document.getElementById("rightSelections");

  var beforeSelections = isRight ? leftSelections : rightSelections;
  var afterSelections = !isRight ? leftSelections : rightSelections;
  
  var selections = isRight ? leftSelections : rightSelections;
  var options = beforeSelections.options;

  // get the selected options, if any
  var selectedOptions = [];
  for (var i = 0; i < options.length; ++i) {
    // get the current option
    var option = options[i];

    // collect the selected options
    if (option.selected) {
      selectedOptions.push(option);
    }
  }

  // no selected options => quit function
  if (selectedOptions.length === 0) { return; }

  // add the selected options to the right listbox 
  for (var i = 0; i < selectedOptions.length; ++i) {
    var selectedOption = selectedOptions[i];
    afterSelections.options.add(selectedOption);
  }

  // update left selections count display
  updateCountDisplay(leftSelections.options.length, rightSelections.options.length);
}

function downloadData() {
  // get the sketches
  var sketches = [];
  var selections = document.getElementById("rightSelections");
  for (var i = 0; i < selections.options.length; ++i) {
    // get the current label
    var label = selections.options[i].text;

    // get the corresponding container
    var container = labelToContainerMap[label];

    // get the sketch and add to collection
    var sketch = container.sketch;
    sketches.push(sketch);
  }

  // download data
  var data = JSON.stringify(sketches);
  downloadFile(data);
}

function downloadFile(data) {
  var blob = new Blob([data], {type: "application/json"});
  var url  = URL.createObjectURL(blob);  
  var a = document.createElement('a');
  a.href = url;
  a.download = "data.json";
 
  document.body.appendChild(a);
  a.click();
}

function sortSelections(isLeft) {
  // get the corresponding selections
  var selections = isLeft ? document.getElementById("leftSelections") : document.getElementById("rightSelections");

  // get the containers
  var containers = [];
  for (var i = 0; i < selections.length; ++i) {
    containers.push(labelToContainerMap[selections.options[i].text]);
  }

  // sort containers
  sortAscending(containers);

  // clear the selections
  clearSelections(selections)

  // add the sorted containers back to the selections
  for (var i = 0; i < containers.length; ++i) {
    var option = document.createElement("option");
    option.value = option.text = containers[i].label;
    selections.options.add(option);
  }

}

function clearSelections(selections) {
  for (var i = selections.options.length - 1; i >= 0; --i) {
    selections.remove(i);
  }
}


var sketchFiles;
var labelToContainerMap;