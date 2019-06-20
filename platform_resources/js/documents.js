//Referencia al storage
var storageRef = firebase.storage().ref();

/*  Para PDFs  */
var pdfRef = storageRef.child('PDF');

//Traer documentos actuales:
$(document).ready(function(){
   var url = "https://firebasestorage.googleapis.com/v0/b/optiserv-lab.appspot.com/o/";
   var databaseRef = firebase.database().ref('/Referencia_Documentos/PDF');
    databaseRef.orderByChild("nombre").on("value", (snapshot)=> {
        console.log(snapshot.val());
        if(snapshot.val() != undefined && snapshot.val() != null){
            snapshot.forEach(function(data) {
              var SNAPPED = data.val();
                //console.log("Document URL: " + (SNAPPED.url.replace(" "," ")));
                //console.log("Document NAME: " + (SNAPPED.nombre.replace(" "," ")));
                fileLabel.text("Cargar Archivo...");
                fileLabel[0].style.background="white";
                $("#noarchivopdf").remove();
                const pdf = pdfRef.child(SNAPPED.nombre);
                  pdf.getDownloadURL().then((url) => { 
                    console.log("url: "+url); 
                    $("#pdf_"+data.key).remove();
                    $("."+SNAPPED.tipo).css("display","block");
                    $("#pdf_div ."+SNAPPED.tipo).append('<span class="admin_only delete" encrypted="false" crypt="" onclick="RemoveChildPDF(event);" style="display:none;"><i class="fa fa-trash"></i></span>'+
                                         "<a href='"+url+"' id='pdf_"+data.key+"' target='_blank' download='true'>"+SNAPPED.nombre+"</br></a>");
                  }).catch(function(error) {
                    SNAPPED.remove()
                });
            });
            console.log("Exito al traer los documentos!");
            setTimeout(() => {
                var isLogged= hideShowClass("delete");
                if(isLogged){
                    $(".admin_only.delete").css("display","block");
                }else{
                        $(".admin_only.delete").css("display","none");
                }
            }, 3000);
        }else{
            $("#pdf_div").append('<span id="noarchivopdf">No se halló ningún archivo.</span>');
            console.log("No se halló un archivo o se eliminó directamente desde la plataforma firebase.");
        }
      });
    // Aquí termina para iniciando la pagina
  
});

function AddChildrenPDF (){
    var url = "https://firebasestorage.googleapis.com/v0/b/optiserv-lab.appspot.com/o/";
   var databaseRef = firebase.database().ref('/Referencia_Documentos/PDF');
    databaseRef.orderByChild("nombre").on("value", (snapshot)=> {
        console.log(snapshot.val());
        if(snapshot.val() != undefined && snapshot.val() != null){
            snapshot.forEach(function(data) {
              var SNAPPED = data.val();
                //console.log("Document URL: " + (SNAPPED.url.replace(" "," ")));
                //console.log("Document NAME: " + (SNAPPED.nombre.replace(" "," ")));
                fileLabel.text("Cargar Archivo...");
                fileLabel[0].style.background="white";
                $("#noarchivopdf").remove();
                const pdf = pdfRef.child(SNAPPED.nombre);
                  pdf.getDownloadURL().then((url) => { 
                    console.log("url: "+url); 
                    $("#pdf_"+data.key).remove();
                    $("."+SNAPPED.tipo).css("display","block");
                    $("#pdf_div ."+SNAPPED.tipo).append('<span class="admin_only delete" encrypted="false" crypt="" onclick="RemoveChildPDF(event);" style="display:none;"><i class="fa fa-trash"></i></span>'+
                                         "<a href='"+url+"' id='pdf_"+data.key+"' target='_blank' download='true'>"+SNAPPED.nombre+"</br></a>");
                  }).catch(function(error) {
                    SNAPPED.remove()
                });
            });
            console.log("Exito al traer los documentos!");
            setTimeout(() => {
                var isLogged= hideShowClass("delete");
                if(isLogged){
                    $(".admin_only.delete").css("display","block");
                }else{
                        $(".admin_only.delete").css("display","none");
                }
            }, 3000);
        }else{
            $("#pdf_div").append('<span id="noarchivopdf">No se halló ningún archivo.</span>');
            console.log("No se halló un archivo o se eliminó directamente desde la plataforma firebase.");
        }
      });
      //Aqui termina para cada que se agrega un documento nuevo
}

function RemoveChildPDF (e){
    console.log(e.target.parentNode.nextSibling.id);
    var removeID = e.target.parentNode.nextSibling.id;
    var toDelete = removeID.split("pdf_")[1];
    var url = "https://firebasestorage.googleapis.com/v0/b/optiserv-lab.appspot.com/o/";
    console.log("Éxito al borrar el documento!");
    console.log("Padre: "+e.target.parentNode.parentNode);
    console.log("Nodos hijos? "+e.target.parentNode.parentNode.hasChildNodes());
    console.log("# hijos: "+e.target.parentNode.parentNode.children.length);
    var databaseRef = firebase.database().ref('/Referencia_Documentos/PDF');
    databaseRef.orderByChild("nombre").on("value", (snapshot)=> {
        console.log(snapshot.val());
        if(snapshot.val() != undefined && snapshot.val() != null){
            snapshot.forEach(function(data) {
              var SNAPPED = data.val();
                if(removeID==data.key){

                    //databaseRef.child(data.key).remove();
                    console.log("Éxito al borrar el documento!");
                    //e.target.parentNode.nextSibling.remove();
                    //e.target.parentNode.remove();
                }            
            });
        }else{
            console.log("No se pudo eliminar el archivo!");
        }
      });
      //Aqui termina para cada que se agrega un documento nuevo
}
function hideShowClass(classString){
    var logged=false;
    var user = firebase.auth().currentUser;
    if (user) {
      console.log("Mostrando Opción de Borrar Documentos...");
      $(".admin_only."+classString).each(function(id,element){
        if(element.getAttribute("encrypted").toString() == "true"){
            var encrypted=element.getAttribute("crypt").toString();
            var decrypted = CryptoJS.AES.decrypt(encrypted, "Secret Passphrase");
            var admin_decrypted = decrypted.toString(CryptoJS.enc.Utf8);
            element.innerHTML=admin_decrypted;
        }
        element.setAttribute("encrypted", false);
    });
    logged=true;
    } else {
        $(".admin_only."+classString).each(function(id,element){
            if(element.getAttribute("encrypted").toString() == "false"){
                var encrypted = CryptoJS.AES.encrypt(element.innerHTML, "Secret Passphrase");
                element.setAttribute("crypt", encrypted);
                element.setAttribute("encrypted", true);
                element.innerHTML="";
            }
        });
        logged=false;
    }
    return logged;
}