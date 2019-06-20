//Referencia al storage
var storageRef = firebase.storage().ref();

/*  Para PDFs  */
var pdfRef = storageRef.child('PDF');
console.log("storage: " + pdfRef);
console.log("storage: " + pdfRef.child("Gaceta1.pdf").fullPath);
console.log("storage: " + pdfRef.child("Gaceta1.pdf").name);
console.log("storage: " + pdfRef.child("Gaceta1.pdf").parent);

  const imagen = pdfRef.child('Gaceta1.pdf');
  imagen.getDownloadURL().then((url) => { 
    console.log("url: "+url);
  });

var gsReference = storageRef.refFromURL('gs://bucket/'+pdfRef.child("Gaceta1.pdf").fullPath);
console.log("STORAGE: "+storageRef.refFromURL('https://firebasestorage.googleapis.com/b/bucket/o/'+pdfRef.child("Gaceta1.pdf").fullPath));

/*
// File path is 'images/space.jpg'
var path = spaceRef.fullPath

// File name is 'space.jpg'
var name = spaceRef.name

// Points to 'images'
var imagesRef = spaceRef.parent;

*/