
var models = require("../models"),
  log = require('../config/winston');

module.exports.getUsers = function(req,res,next){
  models.User.findAll({attributes:['id','name','surname','GroupId','ClinicId']}).then(function(users){
    res.json(users);
  });
}

module.exports.getUser = function(req,res,next){
  models.User.findOne({where : {id:req.params.id}, attributes:['id','name','surname','username','GroupId','ClinicId']}).then(function(user){
    res.json(user);
  });
}

module.exports.getUserByUsername = function(req,res,next){
  models.User.findOne({where : {username:req.params.username}, attributes:['id','name','surname','username','GroupId','ClinicId']}).then(function(user){
    res.json(user);
  });
}

module.exports.insertUser = function(req,res,next){
  models.User.create(req.body).then(function(user){
    log.log('info',req.user.id + ' CREATE user '+ user.id);
    res.json({id : user.getDataValue('id')});
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send(error.errors[0].message);
  });
}

module.exports.updateUser = function(req,res,next){
  models.User.findOne({where : {id : req.params.id}}).then(function(user){
    if(user)
      user.updateAttributes(req.body).then(function(u){
        log.log('info',req.user.id + ' UPDATED user '+ JSON.stringify(user));
        res.json(u);
      }).catch(function(error){
        log.log('error',error);
        res.status(404).send(error.errors[0].message);
      });
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send(error.errors[0].message);
  });
}
