/*
Code for setting up a sketch data collection.

// https://stackoverflow.com/questions/14094697/javascript-how-to-create-new-div-dynamically-change-it-move-it-modify-it-in
// https://stackoverflow.com/questions/14853779/adding-input-elements-dynamically-to-form
*/

function init() {
	sessionCount = 0;

	var studyLoader = document.getElementById("studyLoader");
	studyLoader.addEventListener("change", loadStudy, false);

	var dimensionsBox = document.getElementById("dimensionsBox");
	dimensionsBox.addEventListener("click", changeDimensionsDisplay, false);
}

function addSession() {	
	// get the session options container
	var container = document.getElementById("sessionOptions");

	// create blank session
	var div = createBlankSession(sessionCount);

	// add the div object to the session options container
	container.appendChild(div);

		// increment the session count
		++sessionCount;
}

function createBlankSession(index) {
	// create the div tag
	var div = document.createElement("div");
	div.id = "session" + index;
	div.style.marginBottom = entryMargin;

	// add the remove checkbox
	var removeInput = document.createElement("input");
	removeInput.type = "checkbox";
	div.appendChild(removeInput);

	// add the label text input
	var labelTextbox = document.createElement("input");
	labelTextbox.type = "text";
	labelTextbox.id = "label" + index;
	labelTextbox.maxlength = 20;
	labelTextbox.size = 20;
	div.appendChild(labelTextbox);

	// add the label text label
	var labelLabel = document.createElement("label");
	labelLabel.setAttribute("for", labelTextbox.id);
	labelLabel.innerHTML = "Label, ";
	div.appendChild(labelLabel);

	// add the filename text input
	var filenameTextbox = document.createElement("input");
	filenameTextbox.type = "text";
	filenameTextbox.id = "filename" + index;
	filenameTextbox.maxlength = 20;
	filenameTextbox.size = 20;
	filenameTextbox.readOnly = true;
	div.appendChild(filenameTextbox);

	// add the filename text label
	var filenameLabel = document.createElement("label");
	filenameLabel.setAttribute("for", filenameTextbox.id);
	filenameLabel.innerHTML = "Filename, ";
	div.appendChild(filenameLabel);

	// add the filename button
	var filenameButton = document.createElement("input");
	filenameButton.id = "filenameButton" + index;
	filenameButton.type = "file";
	filenameButton.setAttribute("value", "Load");
	filenameButton.setAttribute("accept", "image/*");
	filenameButton.addEventListener("change", function() {
		filenameTextbox.value = filenameButton.value.split(/[\/\\]/).slice(-1);
	});
	div.appendChild(filenameButton);

	return div;
}

function removeSession() {
	// get the session options container
	var container = document.getElementById("sessionOptions");

	//
	var elements = container.children;
	var ids = [];
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		var checkbox = element.children[0];

		if (checkbox.checked) { ids.push(element.id); }
	}

	for (var i = 0; i < ids.length; i++) {
		var id = ids[i];
		var element = document.getElementById(id);
		container.removeChild(element);
	}
}

function clearStudy() {
  // get the confirmation result
  var result = confirm("WARNING: Do you wish to clear the current study?");
  if (!result) { return; }

  //
  var titleEntry = document.getElementById("titleEntry");
  var countEntry = document.getElementById("countEntry");
  var traceDisplay = document.getElementById("traceDisplay");
  var dimensionsBox = document.getElementById("dimensionsBox");
  var dimensionsEntry = document.getElementById("dimensionsEntry");
  var canvasWidthEntry = document.getElementById("canvasWidthEntry");
  var canvasHeightEntry = document.getElementById("canvasHeightEntry");
  var randomizeBox = document.getElementById("randomizeBox");
  var container = document.getElementById("sessionOptions");

  //
  titleEntry.value = "Study";
  countEntry.value = 1;
  traceDisplay.checked = true;
	dimensionsBox.checked = false;
	randomizeBox.checked = false;
  dimensionsEntry.style.direction = "none";
  canvasWidthEntry.value = 0;
  canvasHeightEntry.value = 0;
	sessionCount = 0;
  container.innerHTML = "";
}

function saveStudy() {
	// get the session options container
	var container = document.getElementById("sessionOptions");
	var elements = container.children;

	// collect the study details
	var title = document.getElementById("titleEntry").value;
	var count = document.getElementById("countEntry").value;
	var random = document.getElementById("randomizeBox").checked;

	// error-check for missing title
	if (label === "") {
		alert("ERROR: Missing a title.");
		return;
	}

	// error-check for missing count, invalid, or non-positive count
	if (count === "") {
		alert("ERROR: Missing a count.");
		return;
  }

  // error-check for non-numerical or non-positive count
  count = Number.parseInt(count);
  if ((typeof count !== 'number') || Number.isNaN(count)) {
    alert("ERROR: Count is not a number.");
    return;
  }
  if (count <= 0) {
    alert("ERROR: Count is non-positive.");
    return;
  }

	// get the display type
	var displays = document.getElementsByName("displayType");
	var display;
	for (var i = 0; i < displays.length; i++) {
		var currentDisplay = displays[i];
		if (currentDisplay.checked) {
			display = currentDisplay.value;
			break;
		}
	}

	// collect the study entries
	var entries = [];
	for (var i = 0; i < elements.length; ++i) {
		// get the current element and its contents
		var element = elements[i];
		var contents = element.children;

		// get the label
		var label = contents[1].value;
		if (label === "") {
			alert("ERROR: At least one entry is missing a label.");
			return;
		}

    // get the filename (trace and preview display only)
    var filename = "";
    if (display !== DISPLAY_TEXT) {
      filename = contents[3].value;
      if (filename === "") {
        alert("ERROR: At least one entry is missing a filename.");
        return;
      }
    }

		// collect the current entry
		var entry = {label: label, filename: filename};
		entries.push(entry);
	}

	// error-check on entry count
	if (entries.length === 0) {
		alert("ERROR: There are no entries.");
		return;
  }
  
  // error-check dimensions (text display only)
  var canvasWidth = Number.parseInt(document.getElementById("canvasWidthEntry").value);
  var canvasHeight = Number.parseInt(document.getElementById("canvasHeightEntry").value);
  if (display === DISPLAY_TEXT) {
    if ((typeof canvasWidth !== 'number') || Number.isNaN(canvasWidth)) {
      alert("ERROR: Canvas width is not a number.");
      return;
    }
    if (canvasWidth <= 0) {
      alert("ERROR: Canvas width is non-positive.");
      return;
    }
    if ((typeof canvasHeight !== 'number') || Number.isNaN(canvasHeight)) {
      alert("ERROR: Canvas height is not a number.");
      return;
    }
    if (canvasHeight <= 0) {
      alert("ERROR: Canvas height is non-positive.");
      return;
    }
  }

	// create the study
	var study = {};
	study.title = title;
	study.count = count;
	study.random = random;
	study.display = display;
	study.canvasWidth = canvasWidth;
  study.canvasHeight = canvasHeight;
  study.entries = entries;

	// download the data
	var data = JSON.stringify(study, null, 4); // stringify in clean format
	downloadFile(data);
}

function loadStudy(e) {
	// laod the file
	var file = e.target.files[0];
	if (file === undefined) { return; }

	// read the file
	var reader = new FileReader();
	reader.readAsText(file);
	reader.onload = function(event) {
		// get the file's text
    var contents = event.target.result;
		
		// convert text to JSON
		var data = JSON.parse(contents);

		// extract the data
		var title = data.title;
		var count = data.count;
		var random = data.random;
		var display = data.display;
		var canvasWidth = data.canvasWidth;
		var canvasHeight = data.canvasHeight;

		// extract the entries
		var entries = [];
		for (var i = 0; i < data.entries.length; ++i) {
			var entry = data.entries[i];
			entries.push(entry);
		}

		// -----

		// set title
		var titleEntry = document.getElementById("titleEntry");
		titleEntry.value = title;

		// set count
		var countEntry = document.getElementById("countEntry");
		countEntry.value = count;

    // set display and dimensions display
    var dimensionsBox = document.getElementById("dimensionsBox");
    var dimensionsEntry = document.getElementById("dimensionsEntry");
		if (display === DISPLAY_TRACE) {
			var display = document.getElementById("traceDisplay");
			display.checked = true;

      dimensionsBox.checked = false;
      dimensionsEntry.style.display = "none";
		}
		else if (display === DISPLAY_PREVIEW) {
			var display = document.getElementById("previewDisplay");
			display.checked = true;

			dimensionsBox.checked = false;
      dimensionsEntry.style.display = "none";
		}
		else if (display === DISPLAY_TEXT) {
			var display = document.getElementById("textDisplay");
			display.checked = true;

			dimensionsBox.checked = true;
      dimensionsEntry.style.display = "inline";
		}

		// set dimensions
		var canvasWidthEntry = document.getElementById("canvasWidthEntry");
		var canvasHeightEntry = document.getElementById("canvasHeightEntry");
		canvasWidthEntry.value = canvasWidth;
		canvasHeightEntry.value = canvasHeight;

		// set randomize
		var randomizeBox = document.getElementById("randomizeBox");
		randomizeBox.checked = random;

		// set entries
		sessionCount = 0;
		var container = document.getElementById("sessionOptions");
		container.innerHTML = "";
		for (var i = 0; i < entries.length; ++i) {
			// get the current entry
			var entry = entries[i];

			// create the div session
			var div = createBlankSession(sessionCount);
			div.childNodes[1].value = entry.label;
			div.childNodes[3].value = entry.filename;

			// append the div session
			container.appendChild(div);

			// increment the session count
			++sessionCount;
		}
		
		// clear study loader
		var studyLoader = document.getElementById("studyLoader");
		studyLoader.value = "";
	};

}

function downloadFile(data) {
  var blob = new Blob([data], {type: "application/json"});
  var url  = URL.createObjectURL(blob);  
  var a = document.createElement('a');
  a.href = url;
  a.download = "study.json";

  document.body.appendChild(a);
  a.click();
}

function changeDimensionsDisplay() {
  var textDisplay = document.getElementById("textDisplay");
  var dimensionsBox = document.getElementById("dimensionsBox");
  var dimensionsEntry = document.getElementById("dimensionsEntry");

  if (textDisplay.checked) {
    dimensionsBox.checked = true;
    dimensionsEntry.style.display = "inline";
    return;
  }

  if (dimensionsBox.checked)
    dimensionsEntry.style.display = "inline";
  else
    dimensionsEntry.style.display = "none";
}

// #region Fields
var sessionCount;
var entryMargin = "20px";

var DISPLAY_TRACE = "trace";
var DISPLAY_PREVIEW = "preview";
var DISPLAY_TEXT = "text";
// #endregion