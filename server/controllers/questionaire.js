
var db = require("../models"),
  //sequelize = require("sequelize"),
  //qrcode = require("qrcode"),
  Promise = require("promise"),
  Patient = require("./patient"),
  pdf = require('html-pdf'),
  nm = require('nodemailer'),
  smtpTransport = require('nodemailer-smtp-transport'),
  path = require('path'),
  fs = require('fs'),
  log = require("../config/winston");

var transporter = nm.createTransport("SMTP", require('../config/aruba_config.json'));

module.exports.insertAllRowT0 = function(req,res,next){

  var patientName = req.body.Patient.name;
  db.sequelize.transaction(function(t){
    return db.T0Eortc.create(req.body.Eortc, {transaction : t}).then(function(e){
      log.log('info',"USER " + req.user.id + " CREATED T0Eortc " + e.id + ' ('+ JSON.stringify(e) + ')');
      return db.T0Hads.create(req.body.Had, {transaction : t}).then(function(h){
        log.log('info',"USER " + req.user.id + " CREATED T0Hads " + h.id + ' ('+ JSON.stringify(h) + ')');
        return db.T0Neq.create(req.body.Neq, {transaction : t}).then(function(n){
          log.log('info',"USER " + req.user.id + " CREATED T0Neq " + n.id + ' ('+ JSON.stringify(n) + ')');
          return db.T0Reporting.create(req.body.Reporting, {transaction : t}).then(function(r){
            log.log('info',"USER " + req.user.id + " CREATED T0Reporting " + r.id + ' ('+ JSON.stringify(r) + ')');
            /*TODO Nello studio normale, devi togliere le valutazioni */
            //return db.Evaluation.create(req.body.Evaluation, {transaction : t}).then(function(ev){
            //  log.log('info',"USER " + req.user.id + " CREATED Evaluation " + ev.id + ' ('+ JSON.stringify(ev) + ')');
              return db.Screening.create(req.body.Screening, {transaction : t}).then(function(sc){
                log.log('info',"USER " + req.user.id + " CREATED Screening " + sc.id + ' ('+ JSON.stringify(sc) + ')');
                req.body.Patient.T0EortcId = e.id;
                req.body.Patient.T0HadId = h.id;
                req.body.Patient.T0NeqId = n.id;
                req.body.Patient.T0ReportingId = r.id;
                req.body.Patient.T0Date = new Date();
                //req.body.Patient.EvaluationId = ev.id;
                req.body.Patient.ScreeningId = sc.id;

                return db.Patient.create(req.body.Patient, {transaction : t}).then(function(patient){
                  log.log('info',"USER " + req.user.id + " CREATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
                });
              });
            //});
          });
        });
      });
    })
  }).then(function(){

    db.Patient.findOne( { where : {name: patientName, test: 0} ,
      include:
      [{model: db.T0Eortc},{model: db.T0Neq},{model: db.T0Hads},{model: db.Screening}],
    }).then(function(patient){

      if(!patient) return res.json({code : 400  ,message : "Il paziente non è stato ancora inserito nel database centrale. Si prega di inserirlo tramite il relativo reporting form"});
      //if(!patient.T0Neq) return res.json({code : 400  ,message : "Il paziente non ha compilato il questionario"});
      var options = {format : "Letter"};
      var attachments = [];

      var html = Patient.createNeq(patient.name,patient.T0Neq,0);
      pdf.create(html, options).toFile(path.join(__dirname , '..' , 'tmp', patient.name+'Neq0.pdf'), function(err, result) {
        if(result) attachments.push({filename: patient.name+'NeqT0.pdf', path : path.join(__dirname,'..','tmp',patient.name+'Neq0.pdf')});
        var html = Patient.createEortc(patient.name,patient.T0Eortc,0);
        pdf.create(html, options).toFile(path.join(__dirname, '..','tmp',patient.name+'Eortc0.pdf'), function(err, result) {
          if(result) attachments.push({filename: patient.name+'EortcT0.pdf', path :path.join( __dirname,'..','tmp',patient.name+'Eortc0.pdf')});
          var html = Patient.createHads(patient.name,patient.T0Had,0);
          pdf.create(html, options).toFile(path.join(__dirname , '..' , 'tmp', patient.name+'Hads0.pdf'), function(err, result) {
            if(result) attachments.push({filename: patient.name+'HadsT0.pdf', path : path.join(__dirname,'..','tmp',patient.name+'Hads0.pdf')});

            // create reusable transporter object using the default SMTP transport
            //var transporter = nm.createTransport("SMTP", require('../config/aruba_config.json'));
            var transporter = nm.createTransport(smtpTransport(require('../config/aruba_config.json')));
            // setup e-mail data with unicode symbols

            db.User.findOne({where : {ClinicId:patient.Screening.ClinicId}, attributes:['mail']}).then(function(user){

              var mailOptions = {
                  from: '"Progetto Hucare" <progetto.hucare@gmail.com>', // sender address
                  //to: req.query.email, // list of receivers
                  to: user.mail, // list of receivers
                  subject: 'HuCare: Questionari paziente ' + patient.name + ' al basale', // Subject line
                  html: 'Gentile referente,<br> in allegato trova i questionari compilati dal paziente ' + patient.name +' al basale<br><br><b>Nota bene</b>: se la mail non presenta allegati, vuol dire che il paziente non ha compilato né i questionari Eortc né quelli Neq', // html body
                  attachments : attachments
                  };

              // send mail with defined transport object
              transporter.sendMail(mailOptions, function(error, info){

                if(error)
                  log.log('error',"T1 USER " + req.user.id + " sending mail for " + patient.name +  " ERROR " + JSON.stringify(error));

                try{
                  if(fs.statSync(path.join(__dirname ,'..','tmp',patient.name+'Neq0.pdf')).isFile())
                    fs.unlink(path.join(__dirname ,'..','tmp',patient.name+'Neq0.pdf'));
                }catch(err){}
                try{
                  if(fs.statSync(path.join(__dirname ,'..','tmp',patient.name+'Eortc0.pdf')).isFile())
                    fs.unlink(path.join(__dirname ,'..','tmp',patient.name+'Eortc0.pdf'));
                }catch(err){}
                try{
                  if(fs.statSync(path.join(__dirname ,'..','tmp',patient.name+'Hads0.pdf')).isFile())
                    fs.unlink(path.join(__dirname ,'..','tmp',patient.name+'Hads0.pdf'));
                }catch(err){}

                //res.json({code : 200 , message : "Informazioni salvate"});
                if(error){
                  log.log('error',"T0 USER " + req.user.id + " requested mail for " + patient.name +  " ERROR (cannot send email) ");
                  //res.json({code : 400  ,message : "Mail non inviata"});
                }
                return res.json({code : 200  ,message : "Informazioni salvate"});
              });
            });
          });
        });
      });
    });
  }).catch(function(error){
    transporter.sendMail({from : "server@ao.pr.it",to:"mansequino@gmail.com", subject :"Execution error in HuCare", html:"Impossibile inserire le info al T0<br><br><b>" + error + "</b><br><br> dall'utente <b>"+JSON.stringify(req.user.username) + "</b><br><br><br>" + JSON.stringify(req.body) },function(err,info){
      log.log('error',"T0 USER " + req.user.id + " pz " + JSON.stringify(req.body) + " ERROR ("+ JSON.stringify(error) +")");
      return res.json({code: 400, message : "Error in inserting"});
    });
  });
}

module.exports.insertAllRowT1 = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T1Eortc.create(req.body.Eortc, {transaction : t}).then(function(e){
      log.log('info',"USER " + req.user.id + " CREATED T1Eortc " + e.id + ' ('+ JSON.stringify(e) + ')');
      return db.T1Hads.create(req.body.Had, {transaction : t}).then(function(h){
        log.log('info',"USER " + req.user.id + " CREATED T1Hads " + h.id + ' ('+ JSON.stringify(h) + ')');
        return db.T1Neq.create(req.body.Neq, {transaction : t}).then(function(n){
          log.log('info',"USER " + req.user.id + " CREATED T1Neq " + n.id + ' ('+ JSON.stringify(n) + ')');
          return db.T1Reporting.create(req.body.Reporting, {transaction : t}).then(function(r){
            log.log('info',"USER " + req.user.id + " CREATED T1Reporting " + r.id + ' ('+ JSON.stringify(r) + ')');
            return db.Patient.find({where : {name : req.params.patientName, test: 0}}, {transaction : t}).then(function(patient){
              log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
              if (patient) { // if the record exists in the db
                patient.updateAttributes({T1EortcId: e.id,T1HadId: h.id,T1NeqId: n.id,
                                          T1ReportingId: r.id,T1Date : new Date()});
              }
            });
          });
        });
      });
    })
  }).then(function(result){
    db.Patient.findOne( { where : {name:req.params.patientName, test: 0} ,
      include:
      [{model: db.T1Eortc},{model: db.T1Neq},{model: db.T1Hads},{model: db.Screening}],
    }).then(function(patient){

      if(!patient) return res.json({code : 400  ,message : "Il paziente non è stato ancora inserito nel database centrale. Si prega di inserirlo tramite il relativo reporting form"});
      //if(!patient.T0Neq) return res.json({code : 400  ,message : "Il paziente non ha compilato il questionario"});
      var options = {format : "Letter"};
      var attachments = [];

        var html = Patient.createNeq(patient.name,patient.T1Neq,1);
        pdf.create(html, options).toFile(path.join(__dirname, '..','tmp',patient.name+'Neq1.pdf'), function(err, result) {
          if(result) attachments.push({filename: patient.name+'NeqT1.pdf', path :path.join( __dirname,'..','tmp',patient.name+'Neq1.pdf')});
          var html = Patient.createEortc(patient.name,patient.T1Eortc,1);
          pdf.create(html, options).toFile(path.join(__dirname, '..' ,'tmp',patient.name+'Eortc1.pdf'), function(err, result) {
            if(result) attachments.push({filename: patient.name+'EortcT1.pdf', path : path.join(__dirname,'..','tmp',patient.name+'Eortc1.pdf')});
            var html = Patient.createHads(patient.name,patient.T1Had,1);
            pdf.create(html, options).toFile(path.join(__dirname, '..' ,'tmp',patient.name+'Hads1.pdf'), function(err, result) {
              if(result) attachments.push({filename: patient.name+'Hads1.pdf', path : path.join(__dirname,'..','tmp',patient.name+'Hads1.pdf')});

              // create reusable transporter object using the default SMTP transport
              //var transporter = nm.createTransport("SMTP", require('../config/aruba_config.json'));
              var transporter = nm.createTransport(smtpTransport(require('../config/aruba_config.json')));
              // setup e-mail data with unicode symbols


              db.User.findOne({where : {ClinicId:patient.Screening.ClinicId}, attributes:['mail']}).then(function(user){

                var mailOptions = {
                    from: '"Progetto Hucare" <progetto.hucare@gmail.com>', // sender address
                    //to: req.query.email, // list of receivers
                    to: user.mail, // list of receivers
                    subject: 'HuCare: Questionari paziente ' + patient.name + ' al follow-up', // Subject line
                    html: 'Gentile referente,<br> in allegato trova i questionari compilati dal paziente ' + patient.name +'  al follow-up<br><br><b>Nota bene</b>: se la mail non presenta allegati, vuol dire che il paziente non ha compilato né i questionari Eortc né quelli Neq', // html body
                    attachments : attachments
                    };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, info){

                  if(error)
                    log.log('error',"T1 USER " + req.user.id + " sending mail for " + patient.name +  " ERROR " + JSON.stringify(error));

                  try{
                    if(fs.statSync(path.join(__dirname ,'..','tmp',patient.name+'Neq1.pdf')).isFile())
                      fs.unlink(path.join(__dirname ,'..','tmp',patient.name+'Neq1.pdf'));
                  }catch(err){}
                  try{
                    if(fs.statSync(path.join(__dirname ,'..','tmp',patient.name+'Eortc1.pdf')).isFile())
                      fs.unlink(path.join(__dirname ,'..','tmp',patient.name+'Eortc1.pdf'));
                  }catch(err){}
                  try{
                    if(fs.statSync(path.join(__dirname ,'..','tmp',patient.name+'Hads1.pdf')).isFile())
                      fs.unlink(path.join(__dirname ,'..','tmp',patient.name+'Hads1.pdf'));
                  }catch(err){}

                  //res.json({code : 200 , message : "Informazioni salvate"});
                  if(error)  {
                    log.log('error',"T1 USER " + req.user.id + " requested mail for " + patient.name +  " ERROR (cannot send email) ");
                    //res.json({code : 400  ,message : "Mail non inviata"});
                  }
                  //else
                  return res.json({code : 200  ,message : "Informazioni salvate"});
                });
              });
            });

        });
      });
    });
  }).catch(function(error){

    transporter.sendMail({from : "server@ao.pr.it",to:"mansequino@gmail.com", subject :"Execution error in HuCare", html:"Impossibile inserire le info al T1<br><br><b>" + error + "</b><br><br> dall'utente <b>"+JSON.stringify(req.user.username) + "</b><br><br><br>" + JSON.stringify(req.body) },function(err,info){
      log.log('error',"T1 USER " + req.user.id + " pz " + JSON.stringify(req.body) + " ERROR ("+ JSON.stringify(error) +")");
      return res.json({code: 400, message : "Error in inserting"});
    });
  });
}

module.exports.makeACopy = function(req, res, next) {

  db.sequelize.transaction(function(t){

    return db.Patient.find({where : {name : req.params.patientName, test: 0}}, {transaction : t}).then(function(old_patient){
      //log.log('info',"USER " + req.user.id + " CLONED patient " + old_patient.id + ' ('+ JSON.stringify(old_patient) + ')');

      if (!old_patient)
        return res.json({code: 200, message : "Nessun paziente è stato clonato"});

      else { // if the record exists in the db

        return old_patient.updateAttributes({
          T1Date : new Date(),
          test : 1,
          note : "Sottomissione nuovo reporting Form"
        }, {transaction : t}).then(function(patient){

          log.log('info',"USER " + req.user.id + " CLONED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');

          var new_patient = JSON.parse(JSON.stringify(old_patient));

          new_patient.birth = new Date(new_patient.birth);
          new_patient.date = new Date(new_patient.date);
          delete new_patient.id;
          new_patient.test = 0;
          new_patient.note = null;
          new_patient.T1EortcId = null;
          new_patient.T1HadId = null;
          new_patient.T1NeqId = null;
          new_patient.T1ReportingId = null;
          new_patient.T1Date = null;

          return db.Patient.create(new_patient, {transaction : t}).then(function(result){
            log.log('info',"USER " + req.user.id + " CREATED new patient " + result.id + ' ('+ JSON.stringify(result) + ')');
          }).catch(function(err) {console.log(err);});

        });
      }
    });

  }).then(function() {

    var mailOptions = {
        from: '"Progetto Hucare" <progetto.hucare@gmail.com>', // sender address
        to: "hucare@ao.pr.it", // list of receivers
        subject: 'HuCare: Duplicazione paziente ' + req.params.patientName + ' per inserimento nuovo follow-up', // Subject line
        html: 'Gentile responsabile,<br> '+
              'il presente reminder serve a comunicare che il centro <b>' + req.user.getUsername() +
              'ha richiesto di inserire nuovamente i questionari al tempo T1 per il paziente ' + req.params.patientName + '.'+
              '<br>'+
              'Il centro provvederà ad inserire il questionario nei prossimi giorni.<br><br>'
        };

    transporter.sendMail(mailOptions, function(error, info){
      if(error)
        log.log("error", "Paziente duplicato, impossibile inviare la mail a hucare");
      else
        log.log("info", "Inviata mail a hucare");

      return res.json({code: 200, message : "Il paziente è stato clonato"});
    });

  }).catch(function(error) {
    log.log("error", "Impossibile duplicare paziente " + JSON.stringify(error));
    return res.json({code: 400, message : "Nessun paziente è stato clonato"});
  });

}

/*--------------ALTRI------------------*/

module.exports.insertAllT0 = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T0Eortc.create(req.body.Eortc, {transaction : t}).then(function(e){
      log.log('info',"USER " + req.user.id + " CREATED T0Eortc " + e.id + ' ('+ JSON.stringify(e) + ')');
      return db.T0Hads.create(req.body.Had, {transaction : t}).then(function(h){
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
                  patient.updateAttributes({T0EortcId: e.id,T0HadId: h.id,T0NeqId: n.id,
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

module.exports.insertAllT1 = function(req,res,next){

  db.sequelize.transaction(function(t){
    return db.T1Eortc.create(req.body.Eortc, {transaction : t}).then(function(e){
      log.log('info',"USER " + req.user.id + " CREATED T1Eortc " + e.id + ' ('+ JSON.stringify(e) + ')');
      return db.T1Hads.create(req.body.Had, {transaction : t}).then(function(h){
        log.log('info',"USER " + req.user.id + " CREATED T1Hads " + h.id + ' ('+ JSON.stringify(h) + ')');
        return db.T1Neq.create(req.body.Neq, {transaction : t}).then(function(n){
          log.log('info',"USER " + req.user.id + " CREATED T1Neq " + n.id + ' ('+ JSON.stringify(n) + ')');
          return db.T1Reporting.create(req.body.Reporting, {transaction : t}).then(function(r){
            log.log('info',"USER " + req.user.id + " CREATED T1Reporting " + r.id + ' ('+ JSON.stringify(r) + ')');
            return db.Patient.find({where : {name : req.params.patientName}}, {transaction : t}).then(function(patient){
              log.log('info',"USER " + req.user.id + " UPDATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
              if (patient) { // if the record exists in the db
                patient.updateAttributes({T1EortcId: e.id,T1HadId: h.id,T1NeqId: n.id,
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
