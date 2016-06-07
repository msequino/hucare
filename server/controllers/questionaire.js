
var db = require("../models"),
  //sequelize = require("sequelize"),
  //qrcode = require("qrcode"),
  Promise = require("promise"),
  log = require("../config/winston");

module.exports.insertAllT0 = function(req,res,next){
  console.log(req.body);
  console.log(req.params);

  db.sequelize.transaction(function(t){
    return db.T0Eortc.create(req.body.Eortc, {transaction : t}).then(function(e){
      log.log('info',"USER " + req.user.id + " CREATED T0Eortc " + e.id + ' ('+ JSON.stringify(e) + ')');
      return db.T0Hads.create(req.body.Hads, {transaction : t}).then(function(h){
        log.log('info',"USER " + req.user.id + " CREATED T0Hads " + h.id + ' ('+ JSON.stringify(h) + ')');
        return db.T0Neq.create(req.body.Neq, {transaction : t}).then(function(n){
          log.log('info',"USER " + req.user.id + " CREATED T0Neq " + n.id + ' ('+ JSON.stringify(n) + ')');
          return db.T0Reporting.create(req.body.Reporting, {transaction : t}).then(function(r){
            log.log('info',"USER " + req.user.id + " CREATED T0Reporting " + r.id + ' ('+ JSON.stringify(r) + ')');
            /*TODO Nello studio normale, devi togliere le valutazioni */
            return db.Evaluation.create(req.body.Evaluation, {transaction : t}).then(function(ev){
              log.log('info',"USER " + req.user.id + " CREATED Evaluation " + ev.id + ' ('+ JSON.stringify(ev) + ')');

              return db.Patient.find({where : {id : req.params.patientId}}, {transaction : t}).then(function(patient){
                log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
                if (patient) { // if the record exists in the db
                  patient.updateAttributes({T0EortcId: e.id,T0HadsId: h.id,T0NeqId: n.id,
                                            T0ReportingId: r.id,EvaluationId: ev.id,T0Date : new Date()});
                }
              });
            });
          });
        });
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    console.log(error);
    log.log('error',"USER " + req.user.id + " ERROR ("+ JSON.stringify(error) +")");

    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertAllRowT0 = function(req,res,next){
  console.log(req.body);
  console.log(req.params);

  db.sequelize.transaction(function(t){
    return db.T0Eortc.create(req.body.Eortc, {transaction : t}).then(function(e){
      log.log('info',"USER " + req.user.id + " CREATED T0Eortc " + e.id + ' ('+ JSON.stringify(e) + ')');
      return db.T0Hads.create(req.body.Hads, {transaction : t}).then(function(h){
        log.log('info',"USER " + req.user.id + " CREATED T0Hads " + h.id + ' ('+ JSON.stringify(h) + ')');
        return db.T0Neq.create(req.body.Neq, {transaction : t}).then(function(n){
          log.log('info',"USER " + req.user.id + " CREATED T0Neq " + n.id + ' ('+ JSON.stringify(n) + ')');
          return db.T0Reporting.create(req.body.Reporting, {transaction : t}).then(function(r){
            log.log('info',"USER " + req.user.id + " CREATED T0Reporting " + r.id + ' ('+ JSON.stringify(r) + ')');
            /*TODO Nello studio normale, devi togliere le valutazioni */
            return db.Evaluation.create(req.body.Evaluation, {transaction : t}).then(function(ev){
              log.log('info',"USER " + req.user.id + " CREATED Evaluation " + ev.id + ' ('+ JSON.stringify(ev) + ')');
              return db.Screening.create(req.body.Screening, {transaction : t}).then(function(sc){
                log.log('info',"USER " + req.user.id + " CREATED Screening " + sc.id + ' ('+ JSON.stringify(sc) + ')');
                req.body.Patient.T0EortcId = e.id;
                req.body.Patient.T0HadsId = h.id;
                req.body.Patient.T0NeqId = n.id;
                req.body.Patient.T0ReportingId = r.id;
                req.body.Patient.T0Date = new Date();
                req.body.Patient.EvaluationId = ev.id;
                req.body.Patient.ScreeningId = sc.id;

                return db.Patient.create(req.body.Patient, {transaction : t}).then(function(patient){
                  log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
                });
              });
            });
          });
        });
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    console.log(error);
    log.log('error',"USER " + req.user.id + " ERROR ("+ JSON.stringify(error) +")");

    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}



module.exports.insertAllT1 = function(req,res,next){
  console.log(req.body);

  db.sequelize.transaction(function(t){
    return db.T1Eortc.create(req.body.Eortc, {transaction : t}).then(function(e){
      log.log('info',"USER " + req.user.id + " CREATED T1Eortc " + e.id + ' ('+ JSON.stringify(e) + ')');
      return db.T1Hads.create(req.body.Hads, {transaction : t}).then(function(h){
        log.log('info',"USER " + req.user.id + " CREATED T1Hads " + h.id + ' ('+ JSON.stringify(h) + ')');
        return db.T1Neq.create(req.body.Neq, {transaction : t}).then(function(n){
          log.log('info',"USER " + req.user.id + " CREATED T1Neq " + n.id + ' ('+ JSON.stringify(n) + ')');
          return db.T1Reporting.create(req.body.Reporting, {transaction : t}).then(function(r){
            log.log('info',"USER " + req.user.id + " CREATED T1Reporting " + r.id + ' ('+ JSON.stringify(r) + ')');
            return db.Patient.find({where : {name : req.params.patientName}}, {transaction : t}).then(function(patient){
              log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
              if (patient) { // if the record exists in the db
                patient.updateAttributes({T1EortcId: e.id,T1HadsId: h.id,T1NeqId: n.id,
                                          T1ReportingId: r.id,T1Date : new Date()});
              }
            });
          });
        });
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    console.log(error);
    log.log('error',"USER " + req.user.id + " ERROR ("+ JSON.stringify(error) +")");

    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}


module.exports.insertAllRowT1 = function(req,res,next){
  console.log(req.body);
  console.log(req.params);

  db.sequelize.transaction(function(t){
    return db.T1Eortc.create(req.body.Eortc, {transaction : t}).then(function(e){
      log.log('info',"USER " + req.user.id + " CREATED T1Eortc " + e.id + ' ('+ JSON.stringify(e) + ')');
      return db.T1Hads.create(req.body.Hads, {transaction : t}).then(function(h){
        log.log('info',"USER " + req.user.id + " CREATED T1Hads " + h.id + ' ('+ JSON.stringify(h) + ')');
        return db.T1Neq.create(req.body.Neq, {transaction : t}).then(function(n){
          log.log('info',"USER " + req.user.id + " CREATED T1Neq " + n.id + ' ('+ JSON.stringify(n) + ')');
          return db.T1Reporting.create(req.body.Reporting, {transaction : t}).then(function(r){
            log.log('info',"USER " + req.user.id + " CREATED T1Reporting " + r.id + ' ('+ JSON.stringify(r) + ')');
            return db.Patient.find({where : {id : req.params.patientId}}, {transaction : t}).then(function(patient){
              log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
              if (patient) { // if the record exists in the db
                patient.updateAttributes({T1EortcId: e.id,T1HadsId: h.id,T1NeqId: n.id,
                                          T1ReportingId: r.id,T1Date : new Date()});
              }
            });
          });
        });
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    console.log(error);
    log.log('error',"USER " + req.user.id + " ERROR ("+ JSON.stringify(error) +")");

    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

/*--------------ALTRI------------------*/
module.exports.insertT0Eortc = function(req,res,next){
  console.log(req.user);
  console.log(req.body);
  db.sequelize.transaction(function(t){
    return db.T0Eortc.create(req.body.T0Eortc, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED T0Eortc " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({T0Eortc: questionaire.id});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertT1Eortc = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T1Eortc.create(req.body.T1Eortc, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED T1Eortc " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({T1Eortc: questionaire.id});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertT0Hads = function(req,res,next){
  console.log(req.user);
  console.log(req.body);

  db.sequelize.transaction(function(t){
    return db.T0Hads.create(req.body.T0Hads, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED T0Hads " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({T0Hads: questionaire.id});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertT1Hads = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T1Hads.create(req.body.T1Hads, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED T1Hads " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({T1Hads: questionaire.id});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertT0Neq = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T0Neq.create(req.body.T0Neq, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED T0Neq " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({T0Neq: questionaire.id});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertT1Neq = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T1Neq.create(req.body.T1Neq, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED T1Neq " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({T1Neq: questionaire.id});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertT0Reporting = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T0Reporting.create(req.body.T0NReporting, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED T0Reporting " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({T0Reporting: questionaire.id,T0Date : questionaire.date});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertT1Reporting = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T1Reporting.create(req.body.T1Reporting, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED T1Reporting " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({T1Reporting: questionaire.id,T1Date : questionaire.date});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}

module.exports.insertEvaluation = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.Evaluation.create(req.body.Evaluation, {transaction : t}).then(function(questionaire){
      log.log('info',"USER " + req.user.id + " CREATED Evaluation " + questionaire.id + ' ('+ JSON.stringify(questionaire) + ')');
      return db.Patient.find({where : {id : req.body.PatientId}}, {transaction : t}).then(function(patient){
        log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
        if (patient) { // if the record exists in the db
          patient.updateAttributes({Evaluation: questionaire.id});
        }
      });
    })
  }).then(function(result){
      res.json({code : 200 , message : "Informazioni salvate"});
  }).catch(function(error){
    res.status(404).send({code: 400, message : "Error in inserting"});
  });
}
