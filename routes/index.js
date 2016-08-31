var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;
var async = require("async");

// vendor library
var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');

// custom library
// models.users
var UserModel = require('../models/users');
var AppModel = require('../models/apps');
var ProcessStatus = require('../models/processStatus');

/* GET home page. */
router.get('/', function(req, res, next) {
	if(!req.isAuthenticated()) {
      	res.redirect('/login');
   	} else{
   		var user = req.user;

	    if(user !== undefined) {
	        user = user.toJSON();
	    }
   		res.render('index', { title: 'Express test' });
   	}
});

router.get('/GetDockers', function(req, res, next) {
  if(!req.isAuthenticated()) {
        res.redirect('/login');
    } else{

      async.waterfall([
          function(callback) {
            AppModel.App.fetchAll().then(function(data){
              var dockersArray = [];

              for(i = 0; i < data.models.length; i++){
                var docker = data.models[i].attributes; 
                dockersArray.push(docker);
              }
              callback(null, dockersArray);
            });
          },
          function(dockersArray, callback) {
            var dockersArrayWithStatus = [];
            async.each(dockersArray, function(docker, callback){
              var containerId = docker['containerId'];
              var processStatus = new ProcessStatus.ProcessStatus({'containerId': containerId}).fetch().then(function(model) {
                var status = model.get('status');
                docker['status'] = status;
                dockersArrayWithStatus.push(docker);
                callback();
              });
            },function(err){
              if(!err){
                callback(null, dockersArrayWithStatus);
              }else{
                console.log(err);
              }
            });
              
          }
      ], function (err, result) {
          if(!err){
            var json = JSON.stringify({ 
              dockers: result
            });
            res.end(json);
          }else{
            console.log(err);
          }
      });
    }
});

////////////////////////
// Start/Stop Process //
////////////////////////

router.post('/startProcess', function(req, res, next) {
  if(!req.isAuthenticated()) {
    res.redirect('/login');
  } else{
    var process = new AppModel.App({'id': req.body.id}).fetch().then(function(model) {
      var err = 0;

      new ProcessStatus.ProcessStatus({'containerId': model.attributes.containerId}).where({'containerId': model.attributes.containerId}).save({'status': 'starting'}, {patch: true}).then(function(model) {
        console.log('Starting process...');        
      });

      var cmd = 'docker start ' + model.attributes.containerId;

      exec(cmd, function(error, stdout, stderr) {
        if(error){
          err = 1;
          console.log(stderr);
        }else{
          new ProcessStatus.ProcessStatus({'containerId': model.attributes.containerId}).where({'containerId': model.attributes.containerId}).save({'status': 'running'}, {patch: true}).then(function(model) {
            console.log('Started process...');
          });
        }
      });

      var json = JSON.stringify({ 
        error: err
      });
      res.end(json);
    });
  }
});

router.post('/stopProcess', function(req, res, next) {
  if(!req.isAuthenticated()) {
    res.redirect('/login');
  } else{
    var process = new AppModel.App({'id': req.body.id}).fetch().then(function(model) {
      var err = 0;

      var cmd = 'docker stop ' + model.attributes.containerId;

      new ProcessStatus.ProcessStatus({'containerId': model.attributes.containerId}).where({'containerId': model.attributes.containerId}).save({'status': 'stopping'}, {patch: true}).then(function(model) {
        console.log('Stopping process...');
      });

      exec(cmd, function(error, stdout, stderr) {
        if(error){
          err = 1;
          console.log(stderr);
        }else{
          new ProcessStatus.ProcessStatus({'containerId': model.attributes.containerId}).where({'containerId': model.attributes.containerId}).save({'status': 'exited'}, {patch: true}).then(function(model) {
          console.log('Stopped process...');
          });
        }
      });

      var json = JSON.stringify({ 
        error: err
      });
      res.end(json);
    });
  }
});

////////////////
// Create App //
////////////////

router.get('/createApp', function(req, res, next) {
  if(!req.isAuthenticated()) {
        res.redirect('/login');
    } else{
      var user = req.user;

      if(user !== undefined) {
          user = user.toJSON();
      }
      res.render('createApp', { status: 0, title: 'Express test' });
    }
});

router.post('/createApp', function(req, res, next) {
  if(!req.isAuthenticated()) {
        res.redirect('/login');
    } else{
      var status = 0;

      var appName = req.body.name;
      var version = req.body.version;
      var platform = req.body.platform;
      var technology = req.body.technology;
      var containerId = req.body.containerId;
      var command = req.body.command;
      var description = req.body.description;
      
      new AppModel.App({
        name: appName,
        version: version,
        platform: platform,
        technology: technology,
        containerId: containerId,
        command: command,
        description: description}
      ).save().then(function(model){
        if(model){
          title = 'App has been created correctly.';
        }else{
          title = 'App has not been created.';
        }
        res.render('createApp', { status: 1, title: title });
      }).catch(function(e) {
        console.log(e); 
        title = 'App has not been created.';
        res.render('createApp', { status: 0, title: title });
      });
    }
});

///////////////
// Show info //
///////////////

router.get('/details/:id', function(req, res, next) {
  if(!req.isAuthenticated()) {
        res.redirect('/login');
    } else{
      var process = new AppModel.App({'id': req.params.id}).fetch().then(function(model) {
        var cmd = 'docker inspect ' + model.attributes.containerId;

        exec(cmd, function(error, stdout, stderr) {
          if(!error){
            var data = JSON.parse(stdout);
            var host_ports = [];
            for(var key in data[0]['NetworkSettings']['Ports']){
              for(var hostConf in data[0]['NetworkSettings']['Ports'][key]){
                host_ports.push(data[0]['NetworkSettings']['Ports'][key][hostConf]['HostPort']);
              }
            }
            var details = {
              Id: data[0]['Id'],
              Created: data[0]['Created'],
              Status: data[0]['State']['Status'],
              Name: data[0]['Name'],
              HostPorts: host_ports,
              ContainerId: data[0]['Config']['Hostname'],
              Image: data[0]['Config']['Image'],
            }
            console.log(details);
            res.render('details', details);
          }else{
            console.log("Error: " + stderr);
            res.render('error', { status: 0, title: 'Express test' });
          }
        });
      });
    }
});

////////////////////
// Login & Logout //
////////////////////

// GET
router.get('/login', function(req, res, next) {
   if(req.isAuthenticated()) res.redirect('/');
   res.render('login', {title: 'Login'});
});
// POST
router.post('/login',
  passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true }), 
  function(req, res, next) {
    console.log('Login');
	console.log(req.user);
});

router.get('/logout', function(req, res, next) {
   if(!req.isAuthenticated()) {
      notFound404(req, res, next);
   } else {
      req.logout();
      res.redirect('/login');
   }
});

module.exports = router;
