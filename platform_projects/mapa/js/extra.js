codHtml += '<table style="width:50%;">';
			codHtml += '<tr><th colspan="2">Establecimiento ' + (i + 1) + '</th></tr>';
			codHtml += '<tr ><td style="width:50%;" >' + vecNombres[0] + '</td><td style="width:50%;">' + json[i].Id + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[1] + '</td><td style="width:50%;">' + json[i].Nombre + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[2] + '</td><td style="width:50%;">' + json[i].Razon_social + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[3] + '</td><td style="width:50%;">' + json[i].Clase_actividad + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[4] + '</td><td style="width:50%;">' + json[i].Estrato + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[5] + '</td><td style="width:50%;">' + json[i].Tipo_vialidad + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[6] + '</td><td style="width:50%;">' + json[i].Calle + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[7] + '</td><td style="width:50%;">' + json[i].Num_Exterior + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[8] + '</td><td style="width:50%;">' + json[i].Num_Interior + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[9] + '</td><td style="width:50%;">' + json[i].Colonia + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[10] + '</td><td style="width:50%;">' + json[i].CP + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[11] + '</td><td style="width:50%;">' + json[i].Ubicacion + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[12] + '</td><td style="width:50%;">' + json[i].Telefono + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[13] + '</td><td style="width:50%;">' + json[i].Correo_e + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[14] + '</td><td style="width:50%;">' + json[i].Sitio_internet + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[15] + '</td><td style="width:50%;">' + json[i].Tipo + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[16] + '</td><td style="width:50%;">' + json[i].Latitud + '</td></tr>'+
			'<tr ><td style="width:50%;" >' + vecNombres[17] + '</td><td style="width:50%;">' + json[i].Longitud + '</td></tr>'
			codHtml += '<tr><td></td></tr></table><br><br>';

    
    // PARA PEDIR UBICACION DESDE EL NAVEGADOR.
    /*if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        map.setCenter(pos);
      }, function() {
        handleLocationError(true, infoWindow, map.getCenter());
      });
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }*/
