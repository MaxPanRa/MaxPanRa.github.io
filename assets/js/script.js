// Initialize Firebase
var config = {
    apiKey: "AIzaSyCOZZzkJtkGx13YfbAvzq5xc-pXVLnB9kM",
    authDomain: "optiserv-lab.firebaseapp.com",
    databaseURL: "https://optiserv-lab.firebaseio.com",
    projectId: "optiserv-lab",
    storageBucket: "optiserv-lab.appspot.com",
    messagingSenderId: "828622975080"
};
firebase.initializeApp(config);

var ref = firebase.database().ref('/Descripcion');

function escribeDesc(text,referencia) {
    referencia.set({
        texto: text
    });
}

escribeDesc("Hola a toditouss!",firebase.database().ref('/Descripcion'));

var idTest = $("#descripcion");
ref.on("value", (snapshot)=> {
    idTest.text(snapshot.val().texto);
    idTest.attr("href",snapshot.val().texto);
    console.log(snapshot.val().texto);
});

