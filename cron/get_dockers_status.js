var exec = require('child_process').exec;
var mysql = require('mysql');


var connection = mysql.createConnection({
   host: 'localhost',  // your host
   user: 'root', // your database user
   password: '', // your database password
   database: 'dashboard',
   charset: 'UTF8_GENERAL_CI'
});

console.log('Running get_dockers_status.js');

exec('docker ps -a', function(error, stdout, stderr) {
	if(!error){
		// Get all containers in docker
	    var lines_aux = stdout.toString().split('\n');
	    var lines = lines_aux.slice(1, lines_aux.length-1);
		var results = new Array();
		lines.forEach(function(line) {
		    var parts = line.replace(/\s+/g, ' ').split(' ');
		    results.push(parts[0]);
		});

		// Looping for each containerId in docker
		results.forEach(function(containerId) {
			// Get json data from container
			exec('docker inspect '+containerId, function(error, stdout, stderr){
				if(!error){
					var json = JSON.parse(stdout);
					var status = json[0]['State']['Status'];
				}else{console.log(stderr);}
			
				// Open MySQL connection
				connection.connect(function(err) {
					if(err){
				  		console.log('Error connecting: ' + err);
					}
				});

				// Change the container's status in database
				var sql  = "UPDATE process_status SET ? WHERE ?";
				var query = connection.query(sql, [{status:status},{containerId:containerId}], function(err, result){
				  if(err){console.log("Error updating: " + err);}
				});

				// Closing MySQL connection
				connection.end(function(err) {
				    if(err){
				    	console.log("Error closing: " + err);
				    }
				});
			});
		});

		

	}else{
		console.log(stderr);
	}
});
