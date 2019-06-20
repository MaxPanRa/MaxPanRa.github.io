var modal = document.getElementById('myModal');
var loginB = document.getElementById('myBtnLogin');
var logoutB = document.getElementById('myBtnLogout');
var span = document.getElementsByClassName("close")[0];


function GoogleSignOut(){
    loginB.style.display="block";
    logoutB.style.display="none";
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
      loginlogout();
    }).catch(function(error) {
      // An error happened.
    });
}
function GoogleSignIn(){
    loginB.style.display="none";
    logoutB.style.display="block";
    modal.style.display = "block";

    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().languageCode = 'es';
    firebase.auth().signInWithPopup(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    //Para probar que una cuenta es administradora:
    var ref = firebase.database().ref("Usuarios"); 
    ref.orderByChild("Correo").equalTo(user.email).on("value", (snapshot)=> {
        if(snapshot.val()){
            //console.log(snapshot.val());
            alert("Está en modo administrador.");
        }else{
            //console.log(snapshot.val());
            alert("No cuenta con acceso de administrador.");
            GoogleSignOut();
        }
      });
    // Aquí termina.
    console.log("Success!");
    loginlogout();
    // ...
    }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    console.log("Error");
    console.log("Code:"+errorCode);
    console.log("Message:"+errorMessage);
    console.log("Error email:"+email);
    console.log("Credential:"+credential);
    });

    setInterval(function(){
        modal.style.display="none";
    },2000);

}

//Detecta si el usuario está autenticado.
firebase.auth().onAuthStateChanged(function(user) {
 window.user = user; // user is undefined if no user signed in
 
 if(user == undefined){ // ------------------------------------------------ USUARIO:
    $(".admin_only").each(function(id,element){
        if(element.getAttribute("encrypted").toString() == "false"){
            var encrypted = CryptoJS.AES.encrypt(element.innerHTML, "Secret Passphrase");
            //console.log("encrypted user="+encrypted);
            element.setAttribute("crypt", encrypted);
            element.setAttribute("encrypted", true);
            element.innerHTML="";
        }
    });
    loginB.style.display="block"; 
    logoutB.style.display="none";
    console.log("Not Logged In");
 }else{ // ------------------------------------------------ ADMINISTRADOR:
    $(".admin_only").each(function(id,element){
        if(element.getAttribute("encrypted").toString() == "true"){
            var encrypted=element.getAttribute("crypt").toString();
            //console.log("encrypted admin="+encrypted);
            var decrypted = CryptoJS.AES.decrypt(encrypted, "Secret Passphrase");
            //console.log("decrypted admin="+decrypted);
            var admin_decrypted = decrypted.toString(CryptoJS.enc.Utf8);
            //console.log("decrypted admin_decrypted="+admin_decrypted);
            element.innerHTML=admin_decrypted;
        }
        element.setAttribute("encrypted", false);
    });
    
    loginB.style.display="none";
    logoutB.style.display="block";
    /*
     console.log("User: "+window.user.displayName);
     console.log("Email: "+window.user.email);
     console.log("PhotoURL: "+window.user.photoURL);
     console.log("emailVerified: "+window.user.emailVerified);
     console.log("uid: "+window.user.uid);
     */
 }
});

function loginlogout(){
    firebase.auth().onAuthStateChanged(function(user) {
        window.user = user; // user is undefined if no user signed in
        if(user == undefined){ // ------------------------------------------------ USUARIO:
           $(".admin_only").each(function(id,element){
               if(element.getAttribute("encrypted").toString() == "false"){
                   var encrypted = CryptoJS.AES.encrypt(element.innerHTML, "Secret Passphrase");
                   //console.log("encrypted user="+encrypted);
                   element.setAttribute("crypt", encrypted);
                   element.setAttribute("encrypted", true);
                   element.innerHTML="";
               }
           });
           //console.log("Not Logged In");
        }else{ // ------------------------------------------------ ADMINISTRADOR:
           $(".admin_only").each(function(id,element){
               if(element.getAttribute("encrypted").toString() == "true"){
                   var encrypted=element.getAttribute("crypt").toString();
                   //console.log("encrypted admin="+encrypted);
                   var decrypted = CryptoJS.AES.decrypt(encrypted, "Secret Passphrase");
                   //console.log("decrypted admin="+decrypted);
                   var admin_decrypted = decrypted.toString(CryptoJS.enc.Utf8);
                   //console.log("decrypted admin_decrypted="+admin_decrypted);
                   element.innerHTML=admin_decrypted;
               }
               element.setAttribute("encrypted", false);
           });
        }
       });
}