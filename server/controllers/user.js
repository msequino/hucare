
var db = require("../models"),
  log = require('../config/winston');

module.exports.getUsers = function(req,res,next){
  db.User.findAll({attributes:['id','name','surname','GroupId','ClinicId']}).then(function(users){
    res.json(users);
  });
}

module.exports.getUsersByClinicId = function(req,res,next){
  var response = [];
  db.User.findAll({where : {ClinicId : req.params.clinic}, attributes:['id','username']}).then(function(users){

    var user = [];

    users.forEach(function(u){
      user.push(u.username);
    });
    response = response.concat(user);
    db.Patient.findAll(
      { attributes:['id','name'],
        include:
        [{
          model: db.Screening,
          required: true,
          where : {ClinicId : req.params.clinic},
          attributes:['id'],
          include : [{
            model:db.Clinic,
            attributes:['abbr'],
          }]
        }]
      }
    ).then(function(patients){
      var newpat = [];

      patients.forEach(function(p){
        newpat.push(p.Screening.Clinic.abbr + p.name);
      });

      response = response.concat(newpat);
      res.json({code : 200, data : response});

    }).catch(function(error){
      log.log('error',error);
      console.log(error);
      res.json({code : 400, message : "error to get users"});
    });

  });
}

module.exports.getUser = function(req,res,next){
  db.User.findOne({where : {id:req.params.id}, attributes:['id','name','surname','username','GroupId','ClinicId']}).then(function(user){
    res.json(user);
  });
}

module.exports.getUserByUsername = function(req,res,next){

  db.User.findOne({where : {username:req.params.username}, attributes:['id','name','surname','username','GroupId','ClinicId']}).then(function(user){
    res.json(user);
  });
}

module.exports.insertUser = function(req,res,next){
  db.User.create(req.body).then(function(user){
    log.log('info',req.user.id + ' CREATE user '+ user.id);
    res.json({id : user.getDataValue('id')});
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send(error.errors[0].message);
  });
}

module.exports.updateUser = function(req,res,next){
  db.User.findOne({where : {username : req.params.id}}).then(function(user){
    if(user)
      user.updateAttributes(req.body).then(function(u){
        log.log('info',req.user.id + ' UPDATED user '+ JSON.stringify(user));
        res.json({code : 200, message :"Aggiornamento effettuato"});
      }).catch(function(error){
        log.log('error',error);
        res.json({code : 401});
      });
  }).catch(function(error){
    log.log('error',error);
    res.json({code : 401});
  });
}

module.exports.sendApk = function(req,res,next){
/*  var apk = fs.readFileSync('apps/hucare/server/apk/app-debug.apk');
  res.writeHead(200, {'Content-Type': 'application/vnd.android.package-archive' });
  res.end(apk, 'binary');*/
  res.download('apps/hucare/server/apk/app-debug.apk', 'newApp.apk');
}

module.exports.deploy = function(req,res,next){
  //console.log(req.body);
  if(req.body.hasOwnProperty('pusher')){
    //console.log(req.body.pusher);
    if(req.body.pusher.hasOwnProperty('name')){
      if(req.body.pusher.name == 'msequino'){
        console.log("MAKE PULL");
        require('simple-git')(_dirname + '/../../').pull(function(err,update) {
          console.log(err);
          res.end();
        });
      }
    }
  }
}
