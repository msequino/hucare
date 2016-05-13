
var db = require("../models"),
  //sequelize = require("sequelize"),
  qrcode = require("qrcode"),
  Promise = require("promise"),
  log = require("../config/winston");

module.exports.getPatients = function(req,res,next){
  var clinic = !req.user.getDataValue('ClinicId') ? {} : {ClinicId : req.user.getDataValue('ClinicId') };
  db.Patient.findAll(
    { include:
      [{
        model: db.Screening,
        required: true,
        where : clinic
      }]
    }
  ).then(function(patients){
    var data = {};
    data['patients'] = patients;
    db.Clinic.findById(req.user.getDataValue('ClinicId')).then(function(result){
      data['clinic'] = result.abbr;
      res.json(data);
    });

  }).catch(function(error){
    log.log('error',error);
    console.log(error);
    res.status(404).send({message : error});
  });
}

module.exports.getPatient = function(req,res,next){
  var response = {};
  db.Patient.findOne({where : {id:req.params.id}}).then(function(patient){
    response['Patient'] = patient;
    res.json(response);

  }).catch(function(error){
    res.json(error);
  });
}

Number.prototype.printName = function(){
  var s = ("000" + this.valueOf()+1);
  return s.substring(s.length - 4);
}

module.exports.insertPatient = function(req,res,next){

  db.Patient.findAndCountAll({where : {ClinicId:req.body.Patient.ClinicId}}).then(function(result){
    req.body.Patient.name = result.count.printName();
    createQRCode({patient : req.body.Patient.name}).then(function(length){
      db.sequelize.transaction(function(t){
        return db.Screening.create(req.body.Screening, {transaction : t}).then(function(screening){
          log.log('info',"USER " + req.user.id + " CREATED screening " + screening.id + ' ('+ JSON.stringify(screening) + ')');
          req.body.Patient.ScreeningId = screening.id;
          if(req.body.Patient !== undefined)
            return db.Patient.create(req.body.Patient, {transaction : t}).then(function(patient){
              log.log('info',"USER " + req.user.id + " CREATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
            });
        });
      }).then(function(result){
        res.json(p);
      }).catch(function(error){
        res.status(404).send({message : "Error in inserting"});
      });
    }).catch(function(error){
      log.log('error',error);
      res.status(404).send({message : "Impossible to create QRCode"});
    });
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send({message : "No Patient counted"});
  });
}

module.exports.insertNoEligiblePatients = function(req,res,next){

  db.Screening.create(req.body.Screening).then(function(result){
    res.json(result);
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send({message : "No Screening inserted"});
  });
}

module.exports.updatePatient = function(req,res,next){
  db.Patient.findOne({where : {id : req.params.id}}).then(function(patient){

    if(patient)
      patient.updateAttributes(req.body).then(function(p){
        log.log('info',req.user.id + ' UPDATE patient '+ JSON.stringify(p));
        res.json(p);
      }).catch(function(error){
        log.log('error',error);
        res.status(404).send(error.errors[0].message);
      });
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send(error.errors[0].message);
  });
}

function createQRCode(args){

  return new Promise(function(fulfill, reject){
    qrcode.save(__dirname +'/../qrcodes/'+args['patient'] + '.png',args['patient'] , function(err,length){
      if(err) reject(err);
      else fulfill(length);
    });

  });
}
