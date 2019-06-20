// Cuando ya tengas tu token reemplaza el texto 'AQUÍ_VA_TU_TOKEN' de la siguiente variable con él.
var token = 'cb0e7660-2912-4479-b48e-97ee4728bc47';
			
var urlApiBusqueda = "https://www.inegi.org.mx/app/api/denue/v1/consulta/buscar/#condicion/#latitud,#longitud/#metros/#token";
var urlApiBusquedaTmp="";
var locations = [];
var markers = [];
var vecNombres = [
'id de establecimiento',
'Nombre de la unidad econ&oacute;mica:',
'Raz&oacute;n social:',
'Nombre de la clase de actividad:',
'Personal ocupado (estrato):',
'Tipo de vialidad:',
'Nombre de la vialidad:',
'N&uacute;mero exterior o km:',
'N&uacute;mero o letra interior:',
'Nombre del asentamiento humano:',
'C&oacute;digo postal:',
'Entidad,Municipio,Localidad:',
'N&uacute;mero de tel&eacute;fono:',
'Correo electr&oacute;nico:',
'Sitio en Internet:',
'Tipo de unidad econ&oacute;mica:',
'Latitud:',
'Longitud:'];

var gLatLon //origen rutas
var gDest //destino rutas

function llamarApiDenueBus(){

	console.log(locations);

	var geocoder = new google.maps.Geocoder();

	geocodeAddress(geocoder,map);
	
}

function geocodeAddress(geocoder, resultsMap) {
	document.getElementById("map").style.display = "block";
	var address = document.getElementById('dir').value;
	var mts = document.getElementById('mts').value;
	var currentLocation = $('#actualDir:checked').val();
	console.log(address);
	geocoder.geocode({'address': address}, function(results, status) {		
	  if (status === 'OK') {
		
		if(!currentLocation)	
			resultsMap.setCenter(results[0].geometry.location);
		
	    var latitud=results[0].geometry.location.lat();
			var longitud=results[0].geometry.location.lng();
			
			gLatLon = new google.maps.LatLng(latitud,longitud); 

		urlApiBusquedaTmp = urlApiBusqueda.replace('#latitud',latitud);
		urlApiBusquedaTmp = urlApiBusquedaTmp.replace('#longitud',longitud);

		locationsINEGI();
		
	  } else {
	    alert('No se pudo localizar el punto especificado, intente otro diferente\n fallo : ' + status);
	  }
	});
	return;
}

function setMapOnAll(map) {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
	}
	
}

function locationsINEGI(){
	var condicion = $('#condi').val();
	var direccion = $('#dir').val();
	var metros = $('#mts').val();
	setMapOnAll(null);
	markers = [];
	urlApiBusquedaTmp = urlApiBusquedaTmp.replace('#condicion',condicion);
	urlApiBusquedaTmp = urlApiBusquedaTmp.replace('#metros',metros);
	urlApiBusquedaTmp = urlApiBusquedaTmp.replace('#token',token);
	console.log(urlApiBusquedaTmp);
	$.getJSON( urlApiBusquedaTmp, function( json ) { 
		google.maps.event.trigger(map, 'resize');
		var infowindow = new google.maps.InfoWindow();
	    var marker, i; 
	    locations=[];
		for(var i = 0; i < json.length; i++){
			locations.push([json[i].Nombre,json[i].Latitud,json[i].Longitud,json[i].Clase_actividad]);
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(locations[i][1], locations[i][2]),
				icon: icons["building"].icon,
				map: map
			});
			
			markers.push(marker);

			

      google.maps.event.addListener(marker, 'click', (function(marker, i) {
        return function() {
					infowindow.setContent(locations[i][0]+" <br />" +
																locations[i][3]+"<br/> <button onclick='crearRuta("+locations[i][1]+","+locations[i][2]+")'>ver ruta</button>");	
          infowindow.open(map, marker);
        }
      })(marker, i));
		}
		console.log("locaciones:"+locations);
	});	
	return;
}
var ds;
var dr;
//Rutas
function crearRuta(lati,loti){

	var objConfigDR = {
		map: map,
		suppressMarkers: true
	}

	var gDest = new google.maps.LatLng(parseFloat(lati),parseFloat(loti))

	var objConfigDS = {
		origin: gLatLon,
		destination: gDest,
		travelMode: google.maps.TravelMode.DRIVING 
	}

	if(dr!=null){
		dr.setMap(null);	
	}
		

		ds= new google.maps.DirectionsService();
		dr = new google.maps.DirectionsRenderer(objConfigDR);
			ds.route(objConfigDS, fnRutear);
						
						function fnRutear( resultados, status){
							//muestra la linea de origin y dest
							if(status == 'OK'){
								dr.setDirections(resultados);
							}else{
								alert('Error' + status);
	
							}
						}
	
}

