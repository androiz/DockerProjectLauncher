function startProcess(id){
	$('.c'+id+' .status span').remove();
	$('.c'+id+' .status').html('<span class="label label-warning">Starting</span>');

	var request = $.ajax({
	  url: "/startProcess",
	  method: "POST",
	  dataType: "json",
	  data: {id: id}
	});

	request.done(function( data ) {
		var html = '';
		if(data['error'] == 0){
			html = '<div class="alert alert-success alert-dismissible"> \
			<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> \
			Process has been started correctly.</div>';
		}else if(data['error'] == 1){
			html = '<div class="alert alert-danger alert-dismissible"> \
			<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> \
			Process has not been started.</div>';
		}
		$('.msg').append(html);
		$('.c'+id+' .actions .btnStart').addClass('hidden');
	});

	request.fail(function( jqXHR, textStatus ) {
	  console.log( "Request failed: " + textStatus );
	});
}

function stopProcess(id){
	$('.c'+id+' .status span').remove();
	$('.c'+id+' .status').html('<span class="label label-danger">Stopping</span>');

	var request = $.ajax({
	  url: "/stopProcess",
	  method: "POST",
	  dataType: "json",
	  data: {id: id}
	});

	request.done(function( data ) {
		var html = '';
		if(data['error'] == 0){
			html = '<div class="alert alert-success alert-dismissible"> \
			<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> \
			Process has been stopped correctly.</div>';
		}else if(data['error'] == 1){
			html = '<div class="alert alert-danger alert-dismissible"> \
			<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> \
			Process has not been stopped.</div>';
		}
		$('.msg').append(html);
		$('.c'+id+' .actions .btnStop').addClass('hidden');
	});

	request.fail(function( jqXHR, textStatus ) {
	  console.log( "Request failed: " + textStatus );
	});
}

function GetDockers(){
	var request = $.ajax({
	  url: "/GetDockers",
	  method: "GET",
	  dataType: "json"
	});
	 
	request.done(function( data ) {
		var stopped = 0;
		var running = 0;
		var rows = '';
		for (i = 0; i < data['dockers'].length; i++) {
			var docker = data['dockers'][i];
			var row = '';
			var clase = '';
			var status = '';
			var activeButtons = '';
			if (i%2) { clase = 'odd'; }else{ clase = 'even'; }
			clase += ' c' + docker['id'];

			var state = docker['status'];
			switch(state){
				case 'exited':
					activeButtons = '<a href="details/'+ docker['id'] +'" class="btn btn-info">Details</a><button onclick="startProcess('+ docker['id'] +')" class="btn btn-success btnStart">Start</button><button onclick="stopProcess('+ docker['id'] +')" class="btn btn-danger hidden btnStop">Stop</button>';
					status = '<span class="label label-danger">Stopped</span>';
					stopped += 1;
					break;
				case 'running':
					activeButtons = '<a href="details/'+ docker['id'] +'" class="btn btn-info">Details</a><button onclick="startProcess('+ docker['id'] +')" class="btn btn-success hidden btnStart">Start</button><button onclick="stopProcess('+ docker['id'] +')" class="btn btn-danger btnStop">Stop</button>';
					status = '<span class="label label-warning">Running</span>';
					running += 1;
					break;
				case 'paused':
					status = '<span class="label label-default">Paused</span>';
					break;
				case 'restarting':
					status = '<span class="label label-success">Restarting</span>';
					break;
				case 'created':
					status = '<span class="label label-info">Created</span>';
					break;
				case 'dead':
					status = '<span class="label label-primary">Dead</span>';
					break;
				case 'stopping':
					activeButtons = '<a href="details/'+ docker['id'] +'" class="btn btn-info">Details</a><button onclick="startProcess('+ docker['id'] +')" class="btn btn-success btnStart hidden">Start</button><button onclick="stopProcess('+ docker['id'] +')" class="btn btn-danger btnStop hidden">Stop</button>';
					status = '<span class="label label-danger">Stopping</span>';
					break;
				case 'starting':
					activeButtons = '<a href="details/'+ docker['id'] +'" class="btn btn-info">Details</a><button onclick="startProcess('+ docker['id'] +')" class="btn btn-success btnStart hidden">Start</button><button onclick="stopProcess('+ docker['id'] +')" class="btn btn-danger btnStop hidden">Stop</button>';
					status = '<span class="label label-warning">Starting</span>';
					break;
			}

			row = '<tr class="' + clase + '"><td>' + docker['name'] + '</td><td>'+ docker['version'] +'</td><td>'+ docker['containerId'] +'</td><td align="center" class="status">'+ status +'</td><td align="center" class="actions center">' + activeButtons + '</td></tr>'
			rows += row;
		};
		$('#dockersTable tbody tr').remove();
		$('#dockersTable tbody').append(rows);
		$('#running-proccess').html(running);
		$('#stopped-proccess').html(stopped);
	});
	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log( "Request failed: " + textStatus );
	});
}

GetDockers();

setInterval(function(){ GetDockers(); }, 10000);



