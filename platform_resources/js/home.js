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

function validarCorreo(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

$("#dudasSubmit").click(function(){
    var ref = firebase.database().ref('/dudasysugerencias');

    let name= $("#nombre").val();
    let email= $("#email").val();
    let empresa= $("#empresa").val();
    let tel= $("#tel").val();
    let dudas= $("#dudas").val();
    if(email == undefined || email == "" || dudas == undefined || dudas == "" ){
        alert("No has llenado todos los campos obligatorios (dudas y correo)");
        return;
    }
    if(!validarCorreo(email)){
        alert("El correo no tiene el formato correcto (ej. correo@dominio.com)");
        return;
    }

    ref.push().set({
        nombre: name,
        correo: email,
        telefono: tel,
        empresa: empresa,
        "dudas o sugerencias":dudas
      });
      location.reload();
});