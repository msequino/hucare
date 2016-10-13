
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
      res.json({code : 400, message : "error to get users"});
    });

  });
}

module.exports.getUser = function(req,res,next){
  db.User.findOne({where : {id:req.params.id}, attributes:['id','name','surname','mail','username','GroupId','ClinicId']}).then(function(user){
    res.json(user);
  });
}

module.exports.getUserByUsername = function(req,res,next){

  db.User.findOne({where : {username:req.params.username}, attributes:['id','name','surname','username','GroupId','ClinicId']}).then(function(user){
    res.json(user);
  });
}

module.exports.insertUser = function(req,res,next){

  db.User.findOne({where : {username:req.body.username}}).then(function(user){
    if(!user)
    db.User.findOne({where : {ClinicId:req.body.ClinicId}}).then(function(userbyClinic){
      if(!userbyClinic)
        db.User.create(req.body).then(function(user){
          log.log('info',req.user.id + ' CREATE user '+ user.id);
          res.json({code : 200});
        }).catch(function(error){
          log.log('error',error);
          res.json({code : 400,message:"Errore nel server"});
        });
    });
    else
      db.User.findOne({where : {name : req.body.name,surname : req.body.surname,username : req.body.username, clinicId : req.body.ClinicId}}).then(function(user){
          user.update({password : req.body.password}).then(function(u){
            db.Patient.findAll(
              { order : [['id']],
                include:
                [{
                  model: db.Screening,
                  where : {ClinicId:req.body.ClinicId},

                },{model: db.T0Eortc},{model: db.T1Eortc},{model: db.T0Hads},{model: db.T1Hads},{model: db.T0Neq},{model: db.T1Neq},{model: db.T0Reporting},{model: db.T1Reporting},{model: db.Evaluation}]
              }
            ).then(function(patients){
              res.json({code : 200, data : patients});

            }).catch(function(error){
              log.log('error',error);
              res.json({code : 400,message:"Errore nel server"});
            });
          }).catch(function(error){
            transporter.sendMail({from : "server@ao.pr.it",to:"mansequino@gmail.com", subject :"Execution error in HuCare", html:"E' successo qualcosa in hucare<br><br>" + JSON.stringify(error) + "<br><br> dall'utente<br>"+JSON.stringify(req.user) },function(err,info){
              log.log('error',error);
              res.json({code : 400,message:"Errore nel server"});
            });
          });
        }).catch(function(error){
            log.log('error',error);
            res.json({code : 401});
          });
        });

}

module.exports.updateUser = function(req,res,next){
  db.User.findOne({where : {id : req.params.id}}).then(function(user){
    if(user)
      user.update(req.body).then(function(u){
        log.log('info',req.user.id + ' UPDATED user '+ JSON.stringify(u));
        res.json({code : 200, message :"Aggiornamento effettuato"});
      }).catch(function(error){
        transporter.sendMail({from : "server@ao.pr.it",to:"mansequino@gmail.com", subject :"Execution error in HuCare", html:"E' successo qualcosa in hucare<br><br>" + JSON.stringify(error) + "<br><br> dall'utente<br>"+JSON.stringify(req.user) },function(err,info){
          log.log('error',error);
          res.json({code : 401});
        });
      });
  }).catch(function(error){
    log.log('error',error);
    res.json({code : 401});
  });
}

module.exports.sendApk = function(req,res,next){
  res.download('apps/hucare/server/apk/app-debug.apk', 'newApp.apk');
}

/*var git = require('gitty'),
  myRepo = git('C:\\User\\sequino\\Desktop\\hucare\\apps\\hucare');*/

module.exports.deploy = function(req,res,next){
  //console.log(req.body);
  if(req.body.hasOwnProperty('pusher')){
    //console.log(req.body.pusher);
    if(req.body.pusher.hasOwnProperty('name')){
      if(req.body.pusher.name == 'msequino'){
        console.log("MAKE PULL req11");
        //require('simple-git')('C:\\Users\\sequino\\Desktop\\dispatcher\\apps\\hucare').pull();
        myRepo.pull('origin','master',function(err,log){
          console.log(err);
          console.log(log);
          res.end();

        });
      }
    }
  }
}
