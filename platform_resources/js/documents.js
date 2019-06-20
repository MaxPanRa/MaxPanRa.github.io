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
                    $("#pdf_div ."+SNAPPED.tipo).append('<span class="admin_only" onclick="RemoveChild(event);" style="color: #ab4949;margin-left: -20px;margin-top: 6px;font-size: 14px;position: absolute;display:none;"><i class="fa fa-trash"></i></span>'+
                                         "<a href='"+url+"' id='pdf_"+data.key+"' target='_blank' download='true'>"+SNAPPED.nombre+"</br></a>");
                  }).catch(function(error) {
                    SNAPPED.remove()
                });
            });
            console.log("Exito al traer los documentos!");
        }else{
            $("#pdf_div").append('<span id="noarchivopdf">No se halló ningún archivo.</span>');
            console.log("No se halló un archivo o se eliminó directamente desde la plataforma firebase.");
        }
      });
    // Aquí termina para iniciando la pagina
  
});

function AddChildren (){
    var url = "https://firebasestorage.googleapis.com/v0/b/optiserv-lab.appspot.com/o/";
   var databaseRef = firebase.database().ref('/Referencia_Documentos/PDF');
    databaseRef.on("value", (snapshot)=> {
        console.log(snapshot.val());
        if(snapshot.val() != undefined && snapshot.val() != null){
            snapshot.forEach(function(data) {
              var SNAPPED = data.val();
                console.log("Document URL: " + (SNAPPED.url.replace(" "," ")));
                console.log("Document NAME: " + (SNAPPED.nombre.replace(" "," ")));
                const pdf = pdfRef.child(SNAPPED.nombre);
                  pdf.getDownloadURL().then((url) => { 
                    console.log("url: "+url);
                    $("#pdf_"+data.key).remove();
                    $("#pdf_div").append("<a href='"+url+"' id='pdf_"+data.key+"' target='_blank' download='true'>"+SNAPPED.nombre+"</br></a>")
                  }).catch(function(error) {
                    SNAPPED.remove();
                });
            });
            console.log("Exito al traer los documentos!");

        }else{
            console.log("No se un archivo o se eliminó directamente desde la plataforma firebase.");
        }
      });
      //Aqui termina para cada que se agrega un documento nuevo
}

function RemoveChild (e){
    console.log(e);
}