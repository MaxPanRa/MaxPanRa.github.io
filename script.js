
// Handles loading the events for <model-viewer>'s slotted progress bar
const onProgress = (event) => {
  const progressBar = event.target.querySelector('.progress-bar');
  const updatingBar = event.target.querySelector('.update-bar');
  updatingBar.style.width = `${event.detail.totalProgress * 100}%`;
  if (event.detail.totalProgress === 1) {
    progressBar.classList.add('hide');
  } else {
    progressBar.classList.remove('hide');
    if (event.detail.totalProgress === 0) {
      event.target.querySelector('.center-pre-prompt').classList.add('hide');
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  // Your code here, which will run after the DOM has loaded
  console.log('DOM content has loaded');

// Function to get the value of a variable from the URL
function getParameterValue(variableName) {
  // Get the current URL
  var url = window.location.href;

  // Split the URL at the "?" symbol to get the query string
  var queryString = url.split('?')[1];

  // Split the query string into key-value pairs
  var params = queryString.split('&');

  // Loop through the key-value pairs to find the desired variable
  for (var i = 0; i < params.length; i++) {
    var pair = params[i].split('=');
    if (pair[0] === variableName) {
      // Return the value of the variable
      return decodeURIComponent(pair[1]);
    }
  }

  // Return null if the variable is not found
  return null;
}

var mv = document.getElementById("modelv");

var fridge = getParameterValue('fridge');
console.log(fridge);

mv.src = "./Assets/3d/"+fridge+".glb";
mv.setAttribute("ios-src","./Assets/3d/"+fridge+".usdz");

});


document.querySelector('.model-viewer').addEventListener('progress', onProgress);
