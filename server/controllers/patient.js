
var db = require("../models"),
  //sequelize = require("sequelize"),
  //qrcode = require("qrcode"),
  pdf = require('html-pdf'),
  nm = require('nodemailer'),
  smtpTransport = require('nodemailer-smtp-transport'),
  fs = require('fs'),
  path = require('path'),
  Promise = require("promise"),
  log = require("../config/winston");

module.exports.getPatients = function(req,res,next){
  var clinic = !req.user.getDataValue('ClinicId') ? {} : {ClinicId : req.user.getDataValue('ClinicId') };
  db.Patient.findAll(
    { include:
      [{
        model: db.Screening,
        where : clinic,
        include : [{
          model:db.Clinic,
        }]
      }]
    }
  ).then(function(patients){
    res.json({code : 200, data : patients});

  }).catch(function(error){
    log.log('error',error);
    console.log(error);
    res.status(404).send({message : error});
  });
}

module.exports.getPatient = function(req,res,next){
  db.Patient.findOne({ include:
    [{
      model: db.Screening,
      required: true,
      include : [{
        model:db.Clinic,
      }]
    }],
    where : {id:req.params.id}
  }).then(function(patient){

    //res.sendFile(__dirname + "/../qrcodes/"+patient.name+".png");
    //var data = {};
    //data['patient'] = patient;
//    data['img'] =
    res.json({code : 200, data : patient});

  }).catch(function(error){
    res.json({code : 200, message : error});
  });
}

module.exports.isValidPatient = function(req,res,next){

  db.Patient.findOne( { where : {name:req.body.username.substr(2,6)} ,
    include:
      [{
        model: db.Screening,
        required: true,
        where : {clinicId:req.body.clinic}
      }],

  }).then(function(patient){
    var birth = new Date(patient.birth).toISOString();

    var b = birth.substr(0,birth.indexOf("T")).split("-");

    var isOk = (b[2] == req.body.password.substr(0,2) && b[1] == req.body.password.substr(2,4));

    res.json({code : (isOk ? 200 : 400), data : isOk ? {GroupId:3,
      username:req.body.username,
      id:patient.id,
      ClinicId:req.body.clinic,
      sex : parseInt(patient.sex),
      T0Date : patient.T0Date,
      T1Date : patient.T1Date,
      T0Eortc : patient.T0EortcId,
      T1Eortc : patient.T1EortcId,
      T0Hads : patient.T0HadsId,
      T1Hads : patient.T1HadsId,
      T0Neq : patient.T0NeqId,
      T1Neq : patient.T1NeqId,
      T0Reporting : patient.T0ReportingId,
      T1Reporting : patient.T1ReportingId,
      Evalutation : patient.Evalutation} : {}});

  }).catch(function(error){
    console.log(error);
    res.json({code : 400 , message : "Patient not valid"});
  });
}

Number.prototype.printName = function(){
  var s = ("000" + (parseInt(this.valueOf())));
  return s.substring(s.length - 4);
}

module.exports.insertPatient = function(req,res,next){

  var patient = 0;
  db.Patient.findAndCountAll(
    { include:
      [{
        model: db.Screening,
        required: true,
        where : {ClinicId:req.body.Screening.ClinicId}
      }]
    }
  ).then(function(result){
    db.sequelize.transaction(function(t){
      return db.Screening.create(req.body.Screening, {transaction : t}).then(function(screening){
        log.log('info',"USER " + req.user.id + " CREATED screening " + screening.id + ' ('+ JSON.stringify(screening) + ')');
        req.body.Patient.ScreeningId = screening.id;
        patient = result.count;
        req.body.Patient.name = req.body.Patient.name + (result.count+1).printName();
        return db.Patient.create(req.body.Patient, {transaction : t}).then(function(patient){
          log.log('info',"USER " + req.user.id + " CREATED patient " + patient.id + ' ('+ JSON.stringify(patient) + ')');
          //if(patient.finalized)  createQRCode({patient : patient.name,birth: patient.birth});
        });
      })
    }).then(function(result){
        res.json({code : 200 , message : "Informazioni salvate"});
    }).catch(function(error){
      console.log(error);
      res.status(404).send({code: 400, message : "Error in inserting"});
    });
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send({code: 400, message : "No Patient counted"});
  });
}

module.exports.insertNoEligiblePatients = function(req,res,next){

  db.Screening.create(req.body.Screening).then(function(result){
    res.json({code : 200 , data: result ,message : "Informazioni salvate"});
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send({message : "No Screening inserted"});
  });
}

module.exports.countRecluted = function(req,res,next){

  var timeLimit = {$gte : "2016-10-17 00:00:00", $lte : "2018-07-27 23:59:59"};

  if(req.params.period == 1)
    timeLimit = {$gte : "2016-10-17 00:00:00", $lte : "2017-01-27 23:59:59" };
  else if(req.params.period == 2)
    timeLimit = {$gte : "2017-02-06 00:00:00", $lte : "2017-05-19 23:59:59" };
  else if(req.params.period == 3)
    timeLimit = {$gte : "2017-06-12 00:00:00", $lte : "2017-09-22 23:59:59" };
  else if(req.params.period == 4)
    timeLimit = {$gte : "2017-12-04 00:00:00", $lte : "2018-03-16 23:59:59" };
  else if(req.params.period == 5)
    timeLimit = {$gte : "2018-04-16 00:00:00" , $lte : "2018-07-27 23:59:59"};

//console.log(timeLimit);

  db.Screening.findAll({
    attributes : [[db.sequelize.fn('count',db.sequelize.col('ClinicId')), 'ClinicCount']],
    include : [{model : db.Clinic,attributes : ['id','name']}],
    where : {"createdAt": timeLimit},
    group : ['ClinicId']}).then(function(screenedPatients){

      db.Patient.findAll({
        include : [
          {model : db.Screening , attributes : ['ClinicId'], where : {'createdAt' : timeLimit} }
        ],
        attributes : ['Screening.ClinicId',[db.sequelize.fn('count',db.sequelize.col('*')), 'ClinicCount']],
        where : {'T1Date' : {$ne : null} },
        group : ['Screening.ClinicId']
      }).then(function(enrolledPatientsT1){

        db.Patient.findAll({
          include : [
            {model : db.Screening , attributes : ['ClinicId'], where : {'createdAt' : timeLimit} }
          ],
          attributes : ['Screening.ClinicId',[db.sequelize.fn('count',db.sequelize.col('*')), 'ClinicCount']],
          where : {'T0Date' : {$ne : null} },
          group : ['Screening.ClinicId']
        }).then(function(enrolledPatientsT0){

          db.Screening.findAll({
            attributes : [[db.sequelize.fn('count',db.sequelize.col('ClinicId')), 'ClinicCount']],
            include : [{model : db.Clinic,attributes : ['id','name']}],
            where: { 'createdAt' : timeLimit  , $or : [{'incl1' : { $ne : 1}},{'incl2' : { $ne : 1}},{'incl3' : { $ne : 1}},{'incl4' : { $ne : 1}},
                            {'incl5' : { $ne : 1}},{'excl1' : { $ne : 2}},{'excl2' : { $ne : 2}},{'excl3' : { $ne : 2}},
                            {'excl4' : { $ne : 2}},{'excl5' : { $ne : 2}},{'excl6' : { $ne : 2}},{'excl7' : { $ne : 2}},
                            {'signed' : { $ne : 1}}]},
            group : ['ClinicId']}).then(function(notScreenedPatients){

              db.User.findAll().then(function(users){

                for(var i =0;i<screenedPatients.length;i++){

                  for(var j =0;j<users.length;j++)
                    if(users[j].ClinicId == screenedPatients[i].Clinic.id)
                      screenedPatients[i].dataValues.username = users[j].username;

                  for(var j =0;j<enrolledPatientsT1.length;j++)
                    if(enrolledPatientsT1[j].Screening.ClinicId == screenedPatients[i].Clinic.id)
                      screenedPatients[i].dataValues.Fu = enrolledPatientsT1[j].dataValues.ClinicCount;

                  for(var j =0;j<enrolledPatientsT0.length;j++)
                    if(enrolledPatientsT0[j].Screening.ClinicId == screenedPatients[i].Clinic.id)
                      screenedPatients[i].dataValues.T0 = enrolledPatientsT0[j].dataValues.ClinicCount;

                  for(var j =0;j<notScreenedPatients.length;j++)
                    if(notScreenedPatients[j].Clinic.id == screenedPatients[i].Clinic.id)
                      screenedPatients[i].dataValues.notValid = notScreenedPatients[j].dataValues.ClinicCount;

                }
                res.json({code : 200 , data: screenedPatients});

              }).catch(function(error){
                log.log('error',error);
                res.json({code :404});

              });
          }).catch(function(error){
            log.log('error',error);
            res.json({code :404});
          });

        }).catch(function(error){
          log.log('error',error);
          console.log(error);
          res.json({code :404});
        });
      }).catch(function(error){
        log.log('error',error);
        res.json({code :404});
      });

  }).catch(function(error){
    log.log('error',error);
    console.log(error);
    res.json({code :404});
  });
}

module.exports.countQuest = function(req,res,next){

  var timeLimit = "s.createdAt >= '2016-10-17 00:00:00' AND s.createdAt <= '2018-07-27 23:59:59'";

  if(req.params.period == 1)
    timeLimit = "s.createdAt >= '2016-10-17 00:00:00' AND s.createdAt <= '2017-01-27 23:59:59'";
  else if(req.params.period == 2)
    timeLimit = "s.createdAt >= '2017-02-06 00:00:00' AND s.createdAt <= '2017-05-19 23:59:59'";
  else if(req.params.period == 3)
    timeLimit = "s.createdAt >= '2017-06-12 00:00:00' AND s.createdAt <= '2017-09-22 23:59:59'";
  else if(req.params.period == 4)
    timeLimit = "s.createdAt >= '2017-12-04 00:00:00' AND s.createdAt <= '2018-03-16 23:59:59'";
  else if(req.params.period == 5)
    timeLimit = "s.createdAt >= '2018-04-16 00:00:00' AND s.createdAt <= '2018-07-27 23:59:59'";

  var where = (req.params.clinic.indexOf("0") == -1 ? "WHERE c.id = " + req.params.clinic  : "") + " AND " + timeLimit;
  db.sequelize.query("SELECT c.name,"+
  //eortc t0
  "count(e0.dom1) TOTE0DOM1, sum(if(e0.dom1 = 0,1,0)) MISSE0DOM1, sum(if(e0.dom1 is null,1,0)) NULLE0DOM1, "+
  "count(e0.dom2) TOTE0DOM2, sum(if(e0.dom2 = 0,1,0)) MISSE0DOM2, sum(if(e0.dom2 is null,1,0)) NULLE0DOM2, "+
  "count(e0.dom3) TOTE0DOM3, sum(if(e0.dom3 = 0,1,0)) MISSE0DOM3, sum(if(e0.dom3 is null,1,0)) NULLE0DOM3, "+
  "count(e0.dom4) TOTE0DOM4, sum(if(e0.dom4 = 0,1,0)) MISSE0DOM4, sum(if(e0.dom4 is null,1,0)) NULLE0DOM4, "+
  "count(e0.dom5) TOTE0DOM5, sum(if(e0.dom5 = 0,1,0)) MISSE0DOM5, sum(if(e0.dom5 is null,1,0)) NULLE0DOM5, "+
  "count(e0.dom6) TOTE0DOM6, sum(if(e0.dom6 = 0,1,0)) MISSE0DOM6, sum(if(e0.dom6 is null,1,0)) NULLE0DOM6, "+
  "count(e0.dom7) TOTE0DOM7, sum(if(e0.dom7 = 0,1,0)) MISSE0DOM7, sum(if(e0.dom7 is null,1,0)) NULLE0DOM7, "+
  "count(e0.dom8) TOTE0DOM8, sum(if(e0.dom8 = 0,1,0)) MISSE0DOM8, sum(if(e0.dom8 is null,1,0)) NULLE0DOM8, "+
  "count(e0.dom9) TOTE0DOM9, sum(if(e0.dom9 = 0,1,0)) MISSE0DOM9, sum(if(e0.dom9 is null,1,0)) NULLE0DOM9, "+
  "count(e0.dom10) TOTE0DOM10, sum(if(e0.dom10 = 0,1,0)) MISSE0DOM10, sum(if(e0.dom10 is null,1,0)) NULLE0DOM10, "+
  "count(e0.dom11) TOTE0DOM11, sum(if(e0.dom11 = 0,1,0)) MISSE0DOM11, sum(if(e0.dom11 is null,1,0)) NULLE0DOM11, "+
  "count(e0.dom12) TOTE0DOM12, sum(if(e0.dom12 = 0,1,0)) MISSE0DOM12, sum(if(e0.dom12 is null,1,0)) NULLE0DOM12, "+
  "count(e0.dom13) TOTE0DOM13, sum(if(e0.dom13 = 0,1,0)) MISSE0DOM13, sum(if(e0.dom13 is null,1,0)) NULLE0DOM13, "+
  "count(e0.dom14) TOTE0DOM14, sum(if(e0.dom14 = 0,1,0)) MISSE0DOM14, sum(if(e0.dom14 is null,1,0)) NULLE0DOM14, "+
  "count(e0.dom15) TOTE0DOM15, sum(if(e0.dom15 = 0,1,0)) MISSE0DOM15, sum(if(e0.dom15 is null,1,0)) NULLE0DOM15, "+
  "count(e0.dom16) TOTE0DOM16, sum(if(e0.dom16 = 0,1,0)) MISSE0DOM16, sum(if(e0.dom16 is null,1,0)) NULLE0DOM16, "+
  "count(e0.dom17) TOTE0DOM17, sum(if(e0.dom17 = 0,1,0)) MISSE0DOM17, sum(if(e0.dom17 is null,1,0)) NULLE0DOM17, "+
  "count(e0.dom18) TOTE0DOM18, sum(if(e0.dom18 = 0,1,0)) MISSE0DOM18, sum(if(e0.dom18 is null,1,0)) NULLE0DOM18, "+
  "count(e0.dom19) TOTE0DOM19, sum(if(e0.dom19 = 0,1,0)) MISSE0DOM19, sum(if(e0.dom19 is null,1,0)) NULLE0DOM19, "+
  "count(e0.dom20) TOTE0DOM20, sum(if(e0.dom20 = 0,1,0)) MISSE0DOM20, sum(if(e0.dom20 is null,1,0)) NULLE0DOM20, "+
  "count(e0.dom21) TOTE0DOM21, sum(if(e0.dom21 = 0,1,0)) MISSE0DOM21, sum(if(e0.dom21 is null,1,0)) NULLE0DOM21, "+
  "count(e0.dom22) TOTE0DOM22, sum(if(e0.dom22 = 0,1,0)) MISSE0DOM22, sum(if(e0.dom22 is null,1,0)) NULLE0DOM22, "+
  "count(e0.dom23) TOTE0DOM23, sum(if(e0.dom23 = 0,1,0)) MISSE0DOM23, sum(if(e0.dom23 is null,1,0)) NULLE0DOM23, "+
  "count(e0.dom24) TOTE0DOM24, sum(if(e0.dom24 = 0,1,0)) MISSE0DOM24, sum(if(e0.dom24 is null,1,0)) NULLE0DOM24, "+
  "count(e0.dom25) TOTE0DOM25, sum(if(e0.dom25 = 0,1,0)) MISSE0DOM25, sum(if(e0.dom25 is null,1,0)) NULLE0DOM25, "+
  "count(e0.dom26) TOTE0DOM26, sum(if(e0.dom26 = 0,1,0)) MISSE0DOM26, sum(if(e0.dom26 is null,1,0)) NULLE0DOM26, "+
  "count(e0.dom27) TOTE0DOM27, sum(if(e0.dom27 = 0,1,0)) MISSE0DOM27, sum(if(e0.dom27 is null,1,0)) NULLE0DOM27, "+
  "count(e0.dom28) TOTE0DOM28, sum(if(e0.dom28 = 0,1,0)) MISSE0DOM28, sum(if(e0.dom28 is null,1,0)) NULLE0DOM28, "+
  "count(e0.dom29) TOTE0DOM29, sum(if(e0.dom29 = 0,1,0)) MISSE0DOM29, sum(if(e0.dom29 is null,1,0)) NULLE0DOM29, "+
  "count(e0.dom30) TOTE0DOM30, sum(if(e0.dom30 = 0,1,0)) MISSE0DOM30, sum(if(e0.dom30 is null,1,0)) NULLE0DOM30, "+

  //eortct1
  "count(e1.dom1) TOTE1DOM1, sum(if(e1.dom1 = 0,1,0)) MISSE1DOM1, sum(if(e1.dom1 is null,1,0)) NULLE1DOM1, "+
  "count(e1.dom2) TOTE1DOM2, sum(if(e1.dom2 = 0,1,0)) MISSE1DOM2, sum(if(e1.dom2 is null,1,0)) NULLE1DOM2, "+
  "count(e1.dom3) TOTE1DOM3, sum(if(e1.dom3 = 0,1,0)) MISSE1DOM3, sum(if(e1.dom3 is null,1,0)) NULLE1DOM3, "+
  "count(e1.dom4) TOTE1DOM4, sum(if(e1.dom4 = 0,1,0)) MISSE1DOM4, sum(if(e1.dom4 is null,1,0)) NULLE1DOM4, "+
  "count(e1.dom5) TOTE1DOM5, sum(if(e1.dom5 = 0,1,0)) MISSE1DOM5, sum(if(e1.dom5 is null,1,0)) NULLE1DOM5, "+
  "count(e1.dom6) TOTE1DOM6, sum(if(e1.dom6 = 0,1,0)) MISSE1DOM6, sum(if(e1.dom6 is null,1,0)) NULLE1DOM6, "+
  "count(e1.dom7) TOTE1DOM7, sum(if(e1.dom7 = 0,1,0)) MISSE1DOM7, sum(if(e1.dom7 is null,1,0)) NULLE1DOM7, "+
  "count(e1.dom8) TOTE1DOM8, sum(if(e1.dom8 = 0,1,0)) MISSE1DOM8, sum(if(e1.dom8 is null,1,0)) NULLE1DOM8, "+
  "count(e1.dom9) TOTE1DOM9, sum(if(e1.dom9 = 0,1,0)) MISSE1DOM9, sum(if(e1.dom9 is null,1,0)) NULLE1DOM9, "+
  "count(e1.dom10) TOTE1DOM10, sum(if(e1.dom10 = 0,1,0)) MISSE1DOM10, sum(if(e1.dom10 is null,1,0)) NULLE1DOM10, "+
  "count(e1.dom11) TOTE1DOM11, sum(if(e1.dom11 = 0,1,0)) MISSE1DOM11, sum(if(e1.dom11 is null,1,0)) NULLE1DOM11, "+
  "count(e1.dom12) TOTE1DOM12, sum(if(e1.dom12 = 0,1,0)) MISSE1DOM12, sum(if(e1.dom12 is null,1,0)) NULLE1DOM12, "+
  "count(e1.dom13) TOTE1DOM13, sum(if(e1.dom13 = 0,1,0)) MISSE1DOM13, sum(if(e1.dom13 is null,1,0)) NULLE1DOM13, "+
  "count(e1.dom14) TOTE1DOM14, sum(if(e1.dom14 = 0,1,0)) MISSE1DOM14, sum(if(e1.dom14 is null,1,0)) NULLE1DOM14, "+
  "count(e1.dom15) TOTE1DOM15, sum(if(e1.dom15 = 0,1,0)) MISSE1DOM15, sum(if(e1.dom15 is null,1,0)) NULLE1DOM15, "+
  "count(e1.dom16) TOTE1DOM16, sum(if(e1.dom16 = 0,1,0)) MISSE1DOM16, sum(if(e1.dom16 is null,1,0)) NULLE1DOM16, "+
  "count(e1.dom17) TOTE1DOM17, sum(if(e1.dom17 = 0,1,0)) MISSE1DOM17, sum(if(e1.dom17 is null,1,0)) NULLE1DOM17, "+
  "count(e1.dom18) TOTE1DOM18, sum(if(e1.dom18 = 0,1,0)) MISSE1DOM18, sum(if(e1.dom18 is null,1,0)) NULLE1DOM18, "+
  "count(e1.dom19) TOTE1DOM19, sum(if(e1.dom19 = 0,1,0)) MISSE1DOM19, sum(if(e1.dom19 is null,1,0)) NULLE1DOM19, "+
  "count(e1.dom20) TOTE1DOM20, sum(if(e1.dom20 = 0,1,0)) MISSE1DOM20, sum(if(e1.dom20 is null,1,0)) NULLE1DOM20, "+
  "count(e1.dom21) TOTE1DOM21, sum(if(e1.dom21 = 0,1,0)) MISSE1DOM21, sum(if(e1.dom21 is null,1,0)) NULLE1DOM21, "+
  "count(e1.dom22) TOTE1DOM22, sum(if(e1.dom22 = 0,1,0)) MISSE1DOM22, sum(if(e1.dom22 is null,1,0)) NULLE1DOM22, "+
  "count(e1.dom23) TOTE1DOM23, sum(if(e1.dom23 = 0,1,0)) MISSE1DOM23, sum(if(e1.dom23 is null,1,0)) NULLE1DOM23, "+
  "count(e1.dom24) TOTE1DOM24, sum(if(e1.dom24 = 0,1,0)) MISSE1DOM24, sum(if(e1.dom24 is null,1,0)) NULLE1DOM24, "+
  "count(e1.dom25) TOTE1DOM25, sum(if(e1.dom25 = 0,1,0)) MISSE1DOM25, sum(if(e1.dom25 is null,1,0)) NULLE1DOM25, "+
  "count(e1.dom26) TOTE1DOM26, sum(if(e1.dom26 = 0,1,0)) MISSE1DOM26, sum(if(e1.dom26 is null,1,0)) NULLE1DOM26, "+
  "count(e1.dom27) TOTE1DOM27, sum(if(e1.dom27 = 0,1,0)) MISSE1DOM27, sum(if(e1.dom27 is null,1,0)) NULLE1DOM27, "+
  "count(e1.dom28) TOTE1DOM28, sum(if(e1.dom28 = 0,1,0)) MISSE1DOM28, sum(if(e1.dom28 is null,1,0)) NULLE1DOM28, "+
  "count(e1.dom29) TOTE1DOM29, sum(if(e1.dom29 = 0,1,0)) MISSE1DOM29, sum(if(e1.dom29 is null,1,0)) NULLE1DOM29, "+
  "count(e1.dom30) TOTE1DOM30, sum(if(e1.dom30 = 0,1,0)) MISSE1DOM30, sum(if(e1.dom30 is null,1,0)) NULLE1DOM30, "+

  //hads t0
  "count(h0.dom1) TOTH0DOM1, sum(if(h0.dom1 = 0,1,0)) MISSH0DOM1, sum(if(h0.dom1 is null,1,0)) NULLH0DOM1, "+
  "count(h0.dom2) TOTH0DOM2, sum(if(h0.dom2 = 0,1,0)) MISSH0DOM2, sum(if(h0.dom2 is null,1,0)) NULLH0DOM2, "+
  "count(h0.dom3) TOTH0DOM3, sum(if(h0.dom3 = 0,1,0)) MISSH0DOM3, sum(if(h0.dom3 is null,1,0)) NULLH0DOM3, "+
  "count(h0.dom4) TOTH0DOM4, sum(if(h0.dom4 = 0,1,0)) MISSH0DOM4, sum(if(h0.dom4 is null,1,0)) NULLH0DOM4, "+
  "count(h0.dom5) TOTH0DOM5, sum(if(h0.dom5 = 0,1,0)) MISSH0DOM5, sum(if(h0.dom5 is null,1,0)) NULLH0DOM5, "+
  "count(h0.dom6) TOTH0DOM6, sum(if(h0.dom6 = 0,1,0)) MISSH0DOM6, sum(if(h0.dom6 is null,1,0)) NULLH0DOM6, "+
  "count(h0.dom7) TOTH0DOM7, sum(if(h0.dom7 = 0,1,0)) MISSH0DOM7, sum(if(h0.dom7 is null,1,0)) NULLH0DOM7, "+
  "count(h0.dom8) TOTH0DOM8, sum(if(h0.dom8 = 0,1,0)) MISSH0DOM8, sum(if(h0.dom8 is null,1,0)) NULLH0DOM8, "+
  "count(h0.dom9) TOTH0DOM9, sum(if(h0.dom9 = 0,1,0)) MISSH0DOM9, sum(if(h0.dom9 is null,1,0)) NULLH0DOM9, "+
  "count(h0.dom10) TOTH0DOM10, sum(if(h0.dom10 = 0,1,0)) MISSH0DOM10, sum(if(h0.dom10 is null,1,0)) NULLH0DOM10, "+
  "count(h0.dom11) TOTH0DOM11, sum(if(h0.dom11 = 0,1,0)) MISSH0DOM11, sum(if(h0.dom11 is null,1,0)) NULLH0DOM11, "+
  "count(h0.dom12) TOTH0DOM12, sum(if(h0.dom12 = 0,1,0)) MISSH0DOM12, sum(if(h0.dom12 is null,1,0)) NULLH0DOM12, "+
  "count(h0.dom13) TOTH0DOM13, sum(if(h0.dom13 = 0,1,0)) MISSH0DOM13, sum(if(h0.dom13 is null,1,0)) NULLH0DOM13, "+
  "count(h0.dom14) TOTH0DOM14, sum(if(h0.dom14 = 0,1,0)) MISSH0DOM14, sum(if(h0.dom14 is null,1,0)) NULLH0DOM14, "+

  //hadst1
  "count(h1.dom1) TOTH1DOM1, sum(if(h1.dom1 = 0,1,0)) MISSH1DOM1, sum(if(h1.dom1 is null,1,0)) NULLH1DOM1, "+
  "count(h1.dom2) TOTH1DOM2, sum(if(h1.dom2 = 0,1,0)) MISSH1DOM2, sum(if(h1.dom2 is null,1,0)) NULLH1DOM2, "+
  "count(h1.dom3) TOTH1DOM3, sum(if(h1.dom3 = 0,1,0)) MISSH1DOM3, sum(if(h1.dom3 is null,1,0)) NULLH1DOM3, "+
  "count(h1.dom4) TOTH1DOM4, sum(if(h1.dom4 = 0,1,0)) MISSH1DOM4, sum(if(h1.dom4 is null,1,0)) NULLH1DOM4, "+
  "count(h1.dom5) TOTH1DOM5, sum(if(h1.dom5 = 0,1,0)) MISSH1DOM5, sum(if(h1.dom5 is null,1,0)) NULLH1DOM5, "+
  "count(h1.dom6) TOTH1DOM6, sum(if(h1.dom6 = 0,1,0)) MISSH1DOM6, sum(if(h1.dom6 is null,1,0)) NULLH1DOM6, "+
  "count(h1.dom7) TOTH1DOM7, sum(if(h1.dom7 = 0,1,0)) MISSH1DOM7, sum(if(h1.dom7 is null,1,0)) NULLH1DOM7, "+
  "count(h1.dom8) TOTH1DOM8, sum(if(h1.dom8 = 0,1,0)) MISSH1DOM8, sum(if(h1.dom8 is null,1,0)) NULLH1DOM8, "+
  "count(h1.dom9) TOTH1DOM9, sum(if(h1.dom9 = 0,1,0)) MISSH1DOM9, sum(if(h1.dom9 is null,1,0)) NULLH1DOM9, "+
  "count(h1.dom10) TOTH1DOM10, sum(if(h1.dom10 = 0,1,0)) MISSH1DOM10, sum(if(h1.dom10 is null,1,0)) NULLH1DOM10, "+
  "count(h1.dom11) TOTH1DOM11, sum(if(h1.dom11 = 0,1,0)) MISSH1DOM11, sum(if(h1.dom11 is null,1,0)) NULLH1DOM11, "+
  "count(h1.dom12) TOTH1DOM12, sum(if(h1.dom12 = 0,1,0)) MISSH1DOM12, sum(if(h1.dom12 is null,1,0)) NULLH1DOM12, "+
  "count(h1.dom13) TOTH1DOM13, sum(if(h1.dom13 = 0,1,0)) MISSH1DOM13, sum(if(h1.dom13 is null,1,0)) NULLH1DOM13, "+
  "count(h1.dom14) TOTH1DOM14, sum(if(h1.dom14 = 0,1,0)) MISSH1DOM14, sum(if(h1.dom14 is null,1,0)) NULLH1DOM14, "+

  //neq t0
  "count(n0.dom1) TOTN0DOM1, sum(if(n0.dom1 = 0,1,0)) MISSN0DOM1, sum(if(n0.dom1 is null,1,0)) NULLN0DOM1, "+
  "count(n0.dom2) TOTN0DOM2, sum(if(n0.dom2 = 0,1,0)) MISSN0DOM2, sum(if(n0.dom2 is null,1,0)) NULLN0DOM2, "+
  "count(n0.dom3) TOTN0DOM3, sum(if(n0.dom3 = 0,1,0)) MISSN0DOM3, sum(if(n0.dom3 is null,1,0)) NULLN0DOM3, "+
  "count(n0.dom4) TOTN0DOM4, sum(if(n0.dom4 = 0,1,0)) MISSN0DOM4, sum(if(n0.dom4 is null,1,0)) NULLN0DOM4, "+
  "count(n0.dom5) TOTN0DOM5, sum(if(n0.dom5 = 0,1,0)) MISSN0DOM5, sum(if(n0.dom5 is null,1,0)) NULLN0DOM5, "+
  "count(n0.dom6) TOTN0DOM6, sum(if(n0.dom6 = 0,1,0)) MISSN0DOM6, sum(if(n0.dom6 is null,1,0)) NULLN0DOM6, "+
  "count(n0.dom7) TOTN0DOM7, sum(if(n0.dom7 = 0,1,0)) MISSN0DOM7, sum(if(n0.dom7 is null,1,0)) NULLN0DOM7, "+
  "count(n0.dom8) TOTN0DOM8, sum(if(n0.dom8 = 0,1,0)) MISSN0DOM8, sum(if(n0.dom8 is null,1,0)) NULLN0DOM8, "+
  "count(n0.dom9) TOTN0DOM9, sum(if(n0.dom9 = 0,1,0)) MISSN0DOM9, sum(if(n0.dom9 is null,1,0)) NULLN0DOM9, "+
  "count(n0.dom10) TOTN0DOM10, sum(if(n0.dom10 = 0,1,0)) MISSN0DOM10, sum(if(n0.dom10 is null,1,0)) NULLN0DOM10, "+
  "count(n0.dom11) TOTN0DOM11, sum(if(n0.dom11 = 0,1,0)) MISSN0DOM11, sum(if(n0.dom11 is null,1,0)) NULLN0DOM11, "+
  "count(n0.dom12) TOTN0DOM12, sum(if(n0.dom12 = 0,1,0)) MISSN0DOM12, sum(if(n0.dom12 is null,1,0)) NULLN0DOM12, "+
  "count(n0.dom13) TOTN0DOM13, sum(if(n0.dom13 = 0,1,0)) MISSN0DOM13, sum(if(n0.dom13 is null,1,0)) NULLN0DOM13, "+
  "count(n0.dom14) TOTN0DOM14, sum(if(n0.dom14 = 0,1,0)) MISSN0DOM14, sum(if(n0.dom14 is null,1,0)) NULLN0DOM14, "+
  "count(n0.dom15) TOTN0DOM15, sum(if(n0.dom15 = 0,1,0)) MISSN0DOM15, sum(if(n0.dom15 is null,1,0)) NULLN0DOM15, "+
  "count(n0.dom16) TOTN0DOM16, sum(if(n0.dom16 = 0,1,0)) MISSN0DOM16, sum(if(n0.dom16 is null,1,0)) NULLN0DOM16, "+
  "count(n0.dom17) TOTN0DOM17, sum(if(n0.dom17 = 0,1,0)) MISSN0DOM17, sum(if(n0.dom17 is null,1,0)) NULLN0DOM17, "+
  "count(n0.dom18) TOTN0DOM18, sum(if(n0.dom18 = 0,1,0)) MISSN0DOM18, sum(if(n0.dom18 is null,1,0)) NULLN0DOM18, "+
  "count(n0.dom19) TOTN0DOM19, sum(if(n0.dom19 = 0,1,0)) MISSN0DOM19, sum(if(n0.dom19 is null,1,0)) NULLN0DOM19, "+
  "count(n0.dom20) TOTN0DOM20, sum(if(n0.dom20 = 0,1,0)) MISSN0DOM20, sum(if(n0.dom20 is null,1,0)) NULLN0DOM20, "+
  "count(n0.dom21) TOTN0DOM21, sum(if(n0.dom21 = 0,1,0)) MISSN0DOM21, sum(if(n0.dom21 is null,1,0)) NULLN0DOM21, "+
  "count(n0.dom22) TOTN0DOM22, sum(if(n0.dom22 = 0,1,0)) MISSN0DOM22, sum(if(n0.dom22 is null,1,0)) NULLN0DOM22, "+
  "count(n0.dom23) TOTN0DOM23, sum(if(n0.dom23 = 0,1,0)) MISSN0DOM23, sum(if(n0.dom23 is null,1,0)) NULLN0DOM23, "+

  //neq t1
  "count(n1.dom1) TOTN1DOM1, sum(if(n1.dom1 = 0,1,0)) MISSN1DOM1, sum(if(n1.dom1 is null,1,0)) NULLN1DOM1, "+
  "count(n1.dom2) TOTN1DOM2, sum(if(n1.dom2 = 0,1,0)) MISSN1DOM2, sum(if(n1.dom2 is null,1,0)) NULLN1DOM2, "+
  "count(n1.dom3) TOTN1DOM3, sum(if(n1.dom3 = 0,1,0)) MISSN1DOM3, sum(if(n1.dom3 is null,1,0)) NULLN1DOM3, "+
  "count(n1.dom4) TOTN1DOM4, sum(if(n1.dom4 = 0,1,0)) MISSN1DOM4, sum(if(n1.dom4 is null,1,0)) NULLN1DOM4, "+
  "count(n1.dom5) TOTN1DOM5, sum(if(n1.dom5 = 0,1,0)) MISSN1DOM5, sum(if(n1.dom5 is null,1,0)) NULLN1DOM5, "+
  "count(n1.dom6) TOTN1DOM6, sum(if(n1.dom6 = 0,1,0)) MISSN1DOM6, sum(if(n1.dom6 is null,1,0)) NULLN1DOM6, "+
  "count(n1.dom7) TOTN1DOM7, sum(if(n1.dom7 = 0,1,0)) MISSN1DOM7, sum(if(n1.dom7 is null,1,0)) NULLN1DOM7, "+
  "count(n1.dom8) TOTN1DOM8, sum(if(n1.dom8 = 0,1,0)) MISSN1DOM8, sum(if(n1.dom8 is null,1,0)) NULLN1DOM8, "+
  "count(n1.dom9) TOTN1DOM9, sum(if(n1.dom9 = 0,1,0)) MISSN1DOM9, sum(if(n1.dom9 is null,1,0)) NULLN1DOM9, "+
  "count(n1.dom10) TOTN1DOM10, sum(if(n1.dom10 = 0,1,0)) MISSN1DOM10, sum(if(n1.dom10 is null,1,0)) NULLN1DOM10, "+
  "count(n1.dom11) TOTN1DOM11, sum(if(n1.dom11 = 0,1,0)) MISSN1DOM11, sum(if(n1.dom11 is null,1,0)) NULLN1DOM11, "+
  "count(n1.dom12) TOTN1DOM12, sum(if(n1.dom12 = 0,1,0)) MISSN1DOM12, sum(if(n1.dom12 is null,1,0)) NULLN1DOM12, "+
  "count(n1.dom13) TOTN1DOM13, sum(if(n1.dom13 = 0,1,0)) MISSN1DOM13, sum(if(n1.dom13 is null,1,0)) NULLN1DOM13, "+
  "count(n1.dom14) TOTN1DOM14, sum(if(n1.dom14 = 0,1,0)) MISSN1DOM14, sum(if(n1.dom14 is null,1,0)) NULLN1DOM14, "+
  "count(n1.dom15) TOTN1DOM15, sum(if(n1.dom15 = 0,1,0)) MISSN1DOM15, sum(if(n1.dom15 is null,1,0)) NULLN1DOM15, "+
  "count(n1.dom16) TOTN1DOM16, sum(if(n1.dom16 = 0,1,0)) MISSN1DOM16, sum(if(n1.dom16 is null,1,0)) NULLN1DOM16, "+
  "count(n1.dom17) TOTN1DOM17, sum(if(n1.dom17 = 0,1,0)) MISSN1DOM17, sum(if(n1.dom17 is null,1,0)) NULLN1DOM17, "+
  "count(n1.dom18) TOTN1DOM18, sum(if(n1.dom18 = 0,1,0)) MISSN1DOM18, sum(if(n1.dom18 is null,1,0)) NULLN1DOM18, "+
  "count(n1.dom19) TOTN1DOM19, sum(if(n1.dom19 = 0,1,0)) MISSN1DOM19, sum(if(n1.dom19 is null,1,0)) NULLN1DOM19, "+
  "count(n1.dom20) TOTN1DOM20, sum(if(n1.dom20 = 0,1,0)) MISSN1DOM20, sum(if(n1.dom20 is null,1,0)) NULLN1DOM20, "+
  "count(n1.dom21) TOTN1DOM21, sum(if(n1.dom21 = 0,1,0)) MISSN1DOM21, sum(if(n1.dom21 is null,1,0)) NULLN1DOM21, "+
  "count(n1.dom22) TOTN1DOM22, sum(if(n1.dom22 = 0,1,0)) MISSN1DOM22, sum(if(n1.dom22 is null,1,0)) NULLN1DOM22, "+
  "count(n1.dom23) TOTN1DOM23, sum(if(n1.dom23 = 0,1,0)) MISSN1DOM23, sum(if(n1.dom23 is null,1,0)) NULLN1DOM23 "+

//TODO questa parte non deve essere committata
  "FROM Patients p LEFT JOIN T0Eortcs e0 ON p.t0eortcid=e0.id LEFT JOIN T1Eortcs e1 ON p.t1eortcid=e1.id " +
  "LEFT JOIN T0Hads h0 ON p.t0hadid=h0.id LEFT JOIN T1Hads h1 ON p.t1hadid=h1.id " +
  "LEFT JOIN T0Neqs n0 ON p.t0neqid=n0.id LEFT JOIN T1Neqs n1 ON p.t1neqid=n1.id " +
  "LEFT JOIN Screenings s ON p.screeningid=s.id INNER JOIN Clinics c ON c.id=s.ClinicId " + where ,{type : db.sequelize.QueryTypes.SELECT}).then(function(result){
    res.json({code : 200 , data: result});
  }).catch(function(error){
    console.log(error);
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
        res.status(404).send(error);
      });
  }).catch(function(error){
    log.log('error',error);
    res.status(404).send(error);
  });
}

module.exports.printPatient = function(req,res,next){

  /*  if(req.user.rand_date < new Date())
    return res.json({code : 400  ,message : "Attenzione: il centro non è stato ancora randomizzato, queste informazioni saranno visibili solo ad inizio sperimentazione"})*/
  db.Patient.findOne( { where : {name:req.params.id} ,
    include:
    [{model: db.T0Eortc},{model: db.T1Eortc},{model: db.T0Neq},{model: db.T1Neq},{model: db.Screening}],
  }).then(function(patient){

    if(!patient) return res.json({code : 400  ,message : "Il paziente non è stato ancora inserito nel database centrale. Si prega di inserirlo tramite il relativo reporting form"});
    //if(!patient.T0Neq) return res.json({code : 400  ,message : "Il paziente non ha compilato il questionario"});
    var options = {format : "Letter"};
    var attachments = [];

    var html = module.exports.createNeq(patient.name,patient.T0Neq,0);
    pdf.create(html, options).toFile(path.join(__dirname, '..','tmp',req.params.id+'Neq0.pdf'), function(err, result) {
      if(result) attachments.push({filename: req.params.id+'NeqT0.pdf', path : path.join(__dirname,'..','tmp',req.params.id+'Neq0.pdf')});
      var html = module.exports.createNeq(patient.name,patient.T1Neq,1);
      pdf.create(html, options).toFile(path.join(__dirname, '..','tmp',req.params.id+'Neq1.pdf'), function(err, result) {
        if(result) attachments.push({filename: req.params.id+'NeqT1.pdf', path : path.join(__dirname,'..','tmp',req.params.id+'Neq1.pdf')});
        var html = module.exports.createEortc(patient.name,patient.T0Eortc,0);
        pdf.create(html, options).toFile(path.join(__dirname, '..','tmp',req.params.id+'Eortc0.pdf'), function(err, result) {
          if(result) attachments.push({filename: req.params.id+'EortcT0.pdf', path : path.join(__dirname,'..','tmp',req.params.id+'Eortc0.pdf')});
          var html = module.exports.createEortc(patient.name,patient.T1Eortc,1);
          pdf.create(html, options).toFile(path.join(__dirname, '..','tmp',req.params.id+'Eortc1.pdf'), function(err, result) {
            if(result) attachments.push({filename: req.params.id+'EortcT1.pdf', path : path.join(__dirname,'..','tmp',req.params.id+'Eortc1.pdf')});

            // create reusable transporter object using the default SMTP transport
            //var transporter = nm.createTransport("SMTP", require('../config/aruba_config.json'));
            var transporter = nm.createTransport(smtpTransport(require('../config/aruba_config.json')));
            // setup e-mail data with unicode symbols

            db.User.findOne({where : {ClinicId:patient.Screening.ClinicId}, attributes:['mail']}).then(function(user){

              var mailOptions = {
                  from: '"Progetto Hucare" <progetto.hucare@gmail.com>', // sender address
                  //to: req.query.email, // list of receivers
                  to: user.mail, // list of receivers
                  //to: 'mansequino@gmail.com', // list of receivers
                  subject: 'HuCare: Questionari paziente ' + req.params.id, // Subject line
                  html: 'Gentile partecipante allo Studio HuCARE,<br> in allegato trova tutti i questionari compilati dal paziente ' + req.params.id +'<br><br><b>NB</b>: se la mail non presenta allegati, vuol dire che il paziente non ha compilato né i questionari Eortc né quelli Neq', // html body
                  attachments : attachments
                  };
                  //console.log(attachments);
              // send mail with defined transport object
              transporter.sendMail(mailOptions, function(error, info){

                try{
                  if(fs.statSync(path.join(__dirname ,'..','tmp',req.params.id+'Neq0.pdf')).isFile())
                    fs.unlink(path.join(__dirname ,'..','tmp',req.params.id+'Neq0.pdf'));
                }catch(err){}
                try{
                  if(fs.statSync(path.join(__dirname ,'..','tmp',req.params.id+'Neq1.pdf')).isFile())
                    fs.unlink(path.join(__dirname ,'..','tmp',req.params.id+'Neq1.pdf'));
                }catch(err){}
                try{
                  if(fs.statSync(path.join(__dirname ,'..','tmp',req.params.id+'Eortc0.pdf')).isFile())
                    fs.unlink(path.join(__dirname ,'..','tmp',req.params.id+'Eortc0.pdf'));
                }catch(err){}
                try{
                  if(fs.statSync(path.join(__dirname ,'..','tmp',req.params.id+'Eortc1.pdf')).isFile())
                    fs.unlink(path.join(__dirname ,'..','tmp',req.params.id+'Eortc1.pdf'));
                }catch(err){}

                if(error)  res.json({code : 400  ,message : "Mail non inviata"});
                else
                  res.json({code : 200  ,message : "Informazioni salvate"});
              });
            });

          });
        });

      });
    });
  });

}

function getRealValue(val){
  switch(val){
    case 0 : return "NA"; break;
    case 1 : return "No"; break;
    case 2 : return "Un po'"; break;
    case 3 : return "Parecchio"; break;
    case 4 : return "Moltissimo"; break;
  }
}
module.exports.createEortc = function(name, eortc, time){
  if(eortc)
    if(eortc.date)
    return "<html>"+
    "<body style='width:90%;margin-left:40px;margin-top:50px;margin-right:50px;font-size:15'><header style='border-style:solid;'><h1><center>VALUTAZIONE " + (time == 0 ? "BASALE" : "FOLLOW-UP")+ " paziente " + name +"</center></h1>"+
    "</header>"+
    "<center><h2>Questionario per la Valutazione della Qualità della Vita</h2></center>"+
    "<p>Versione elettronica delle domande inserite dal paziente</p>"+
    "<br/>"+
    "<h2>In generale</h2>"+
    "<table style='border-spacing:8px;border-collapse:separate;font-size:12;page-break-after: always;' border='2'>"+
      "<thead>"+
        "<tr><th></th><th>Domanda</th><th>Risposta</th></tr>"+
      "</thead>"+
      "<tbody>"+
        "<tr><td>1</td><td>Ha difficoltà nel fare lavori faticosi come portare una borsa della spesa pesante o una valigia?</td><td align='center'>" + getRealValue(eortc.dom1) + "</td></tr>"+
        "<tr><td>2</td><td>Ha difficoltà nel fare una lunga passeggiata?</td><td align='center'>" + getRealValue(eortc.dom2) + "</td></tr>"+
        "<tr><td>3</td><td>Ha difficoltà nel fare una breve passeggiata fuori casa</td><td align='center'>" + getRealValue(eortc.dom3) + "</td></tr>"+
        "<tr><td>4</td><td>Ha bisogno di stare a letto o su una sedia durante il giorno?</td><td align='center'>" + getRealValue(eortc.dom4) + "</td></tr>"+
        "<tr><td>5</td><td>Ha bisongo di aiuto per mangiare, vestirsi, lavarsi o andare in bagno?</td><td align='center'>" + getRealValue(eortc.dom5) + "</td></tr>"+
        "</tbody>"+
      "</table>"+
      "<br>"+
      "<h2>Durante gli ultimi sette giorni</h2>"+
      "<table style='border-spacing:8px;border-collapse:separate;font-size:12;margin-top:40px;page-break-after: always;' border='2'>"+
        "<thead>"+
          "<tr><th></th><th>Domanda</th><th>Risposta</th></tr>"+
        "</thead>"+
        "<tbody>"+
        "<tr><td>6</td><td>Ha avuto limitazioni nel fare il suo lavoro o i lavori di casa?</td><td align='center'>" + getRealValue(eortc.dom6) + "</td></tr>"+
        "<tr><td>7</td><td>Ha avuto limitazioni nel praticare i Suoi passatempi-hobby o altre attività di divertimento o svago?</td><td align='center'>" + getRealValue(eortc.dom7) + "</td></tr>"+
        "<tr><td>8</td><td>Le è mancato il fiato?</td><td align='center'>" + getRealValue(eortc.dom8) + "</td></tr>"+
        "<tr><td>9</td><td>Ha avuto dolore?</td><td align='center'>" + getRealValue(eortc.dom9) + "</td></tr>"+
        "<tr><td>10</td><td>Ha avuto bisogno di riposo?</td><td align='center'>" + getRealValue(eortc.dom10) + "</td></tr>"+
        "<tr><td>11</td><td>Ha avuto difficoltà a dormire?</td><td align='center'>" + getRealValue(eortc.dom11) + "</td></tr>"+
        "<tr><td>12</td><td>Ha sentito debolezza?</td><td align='center'>" + getRealValue(eortc.dom12) + "</td></tr>"+
        "<tr><td>13</td><td>Le è mancato l'appetito?</td><td align='center'>" + getRealValue(eortc.dom13) + "</td></tr>"+
        "<tr><td>14</td><td>Ha avuto un senso di nausea?</td><td align='center'>" + getRealValue(eortc.dom14) + "</td></tr>"+
        "<tr><td>15</td><td>Ha vomitato?</td><td align='center'>" + getRealValue(eortc.dom15) + "</td></tr>"+
        "<tr><td>16</td><td>Ha avuto problemi di stitichezza?</td><td align='center'>" + getRealValue(eortc.dom16) + "</td></tr>"+
        "<tr><td>17</td><td>Ha avuto problemi di diarrea?</td><td align='center'>" + getRealValue(eortc.dom17) + "</td></tr>"+
        "<tr><td>18</td><td>Ha sentito stanchezza?</td><td align='center'>" + getRealValue(eortc.dom18) + "</td></tr>"+
        "<tr><td>19</td><td>Il dolore ha interferito con le Sue attività quotidiane?</td><td align='center'>" + getRealValue(eortc.dom19) + "</td></tr>"+
        "<tr><td>20</td><td>Ha avuto difficoltà a concentrarsi su cose come leggere un giornale o guardare la televisione?</td><td align='center'>" + getRealValue(eortc.dom20) + "</td></tr>"+
        "<tr><td>21</td><td>Si è sentito/a teso/a?</td><td align='center'>" + getRealValue(eortc.dom21) + "</td></tr>"+
        "<tr><td>22</td><td>Ha avuto preoccupazioni?</td><td align='center'>" + getRealValue(eortc.dom22) + "</td></tr>"+
        "<tr><td>23</td><td>Ha avuto manifestazioni di irritabilità?</td><td align='center'>" + getRealValue(eortc.dom23)+ "</td></tr>"+
        "<tr><td>24</td><td>Ha avvertito uno stato di depressione?</td><td align='center'>" + getRealValue(eortc.dom24) + "</td></tr>"+
        "<tr><td>25</td><td>Ha avuto difficoltà a ricordare le cose?</td><td align='center'>" + getRealValue(eortc.dom25) + "</td></tr>"+
        "</tbody>"+
        "</table>"+
        "<table style='border-spacing:8px;border-collapse:separate;font-size:12;margin-top:40px' border='2'>"+
          "<thead>"+
            "<tr><th></th><th>Domanda</th><th>Risposta ( 1 = Pessimo; 7 = Ottimo )</th></tr>"+
          "</thead>"+
          "<tbody>"+
        "<tr><td>26</td><td>Le Sue condizioni fisiche o il Suo trattamento medico hanno interferito con le Sua vita familiare?</td><td align='center'>" + getRealValue(eortc.dom26) + "</td></tr>"+
        "<tr><td>27</td><td>Le Sue condizioni fisiche o il Suo trattamento medico hanno interferito con le Sue attività sociali?</td><td align='center'>" + getRealValue(eortc.dom27) + "</td></tr>"+
        "<tr><td>28</td><td>Le Sue condizioni fisiche o il Suo trattamento medico Le hanno causato difficoltà finanziarie?</td><td align='center'>" + getRealValue(eortc.dom28) + "</td></tr>"+
          "</tbody>"+
        "</table>"+
        "<br><br>"+
        "<br><br>"+
        "<table style='border-spacing:8px;border-collapse:separate;font-size:12' border='2'>"+
          "<thead>"+
            "<tr><th></th><th>Domanda</th><th>Risposta ( 1 = Pessimo; 7 = Ottimo )</th></tr>"+
          "</thead>"+
          "<tbody>"+
        "<tr><td>29</td><td>Come valuterebbe in generale la Sua salute durante gli ultimi sette giorni?</td><td align='center'>" + (eortc.dom29 == 0? "NA" : eortc.dom29) + "</td></tr>"+
        "<tr><td>30</td><td>Come valuterebbe in generale la Sua qualità di vita durante gli ultimi sette giorni?</td><td align='center'>" + (eortc.dom30 == 0 ? "NA" : eortc.dom30) + "</td></tr>"+
      "</tbody>"+
    "</table>"+
    "</body>"+
    "</html>";
//  else
    return " ";
}

module.exports.createNeq = function(name, neq, time){
  if(neq)
    if(neq.date)
    return "<html>"+
    "<body style='width:90%;margin-left:40px;margin-right:50px;margin-top:60px;font-size:15'><header style='border-style:solid;'><h1><center>VALUTAZIONE " + (time == 0 ? "BASALE" : "FOLLOW-UP")+ " paziente " + name +"</center></h1>"+
    "</header>"+
    "<center><h2>Questionario per la Valutazione dei Bisogni del Paziente</h2></center>"+
    "<p>Versione elettronica delle domande inserite dal paziente</p>"+
    "<table style='font-size:12;border-spacing:8px;border-collapse:separate;page-break-after: always;' border='2'>"+
      "<thead>"+
        "<tr><th></th><th>Domanda</th><th>SI</th><th>NO</th></tr>"+
      "</thead>"+
      "<tbody>"+
        "<tr><td>A</td><td>Ho bisogno di avere maggiori informazioni sulla mia diagnosi</td><td>" + (neq.dom1 == 1 ? "X" : "")+ "</td><td>" + (neq.dom1 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>B</td><td>Ho bisogno di avere maggiori informazioni sulle mie condizioni future</td><td>" + (neq.dom2 == 1 ? "X" : "")+ "</td><td>" + (neq.dom2 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>C</td><td>Ho bisogno di avere maggiori informazioni sugli esami che mi stanno facendo</td><td>" + (neq.dom3 == 1 ? "X" : "")+ "</td><td>" + (neq.dom3 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>D</td><td>Ho bisogno di avere maggiori spiegazioni sui trattamenti</td><td>" + (neq.dom4 == 1 ? "X" : "")+ "</td><td>" + (neq.dom4 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>E</td><td>Ho bisogno di essere più coinvolto/a nelle scelte terapeutiche</td><td>" + (neq.dom5 == 1 ? "X" : "")+ "</td><td>" + (neq.dom5 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>F</td><td>Ho bisogno che i medici e gli infermieri mi diano informazioni comprensibili</td><td>" + (neq.dom6 == 1 ? "X" : "")+ "</td><td>" + (neq.dom6 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>G</td><td>Ho bisogno che i medici siano più sinceri con me</td><td>" + (neq.dom7 == 1 ? "X" : "")+ "</td><td>" + (neq.dom7 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>H</td><td>Ho bisogno di avere un dialogo maggiore con i medici</td><td>" + (neq.dom8 == 1 ? "X" : "")+ "</td><td>" + (neq.dom8 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>I</td><td>Ho bisogno che alcuni dei miei disturbi ( dolore, nausea, insonnia, ecc.) siano maggiormente controllati</td><td>" + (neq.dom9 == 1 ? "X" : "")+ "</td><td>" + (neq.dom9 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>L</td><td>Ho bisogno di maggiore aiuto per mangiare, vestirmi ed andare in bagno</td><td>" + (neq.dom10 == 1 ? "X" : "")+ "</td><td>" + (neq.dom10 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>M</td><td>Ho bisogno di maggiore rispetto della mia intimità</td><td>" + (neq.dom11 == 1 ? "X" : "")+ "</td><td>" + (neq.dom11 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>N</td><td>Ho bisogno di maggiore attenzione da parte del personale infermieristico</td><td>" + (neq.dom12 == 1 ? "X" : "")+ "</td><td>" + (neq.dom12 == 2 ? "X" : "") + "</td></tr>"+
        "</tbody>"+
        "</table>"+
        "<table style='font-size:12;border-spacing:8px;border-collapse:separate;margin-top:40px;' border='2'>"+
          "<thead>"+
            "<tr><th></th><th>Domanda</th><th>SI</th><th>NO</th></tr>"+
          "</thead>"+
          "<tbody>"+
            "<tr><td>O</td><td>Ho bisogno di essere più rassicurato dai medici</td><td>" + (neq.dom13 == 1 ? "X" : "")+ "</td><td>" + (neq.dom13 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>P</td><td>Ho bisogno che i servizi offerti dall'ospedale (bagni, pasti, pulizia) siano migliori</td><td>" + (neq.dom14 == 1 ? "X" : "")+ "</td><td>" + (neq.dom14 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>Q</td><td>Ho bisogno di avere maggiori informazioni economico-assicurative legate alla mia malattia (ticket, invalidità, ecc.)</td><td>" + (neq.dom15 == 1 ? "X" : "")+ "</td><td>" + (neq.dom15 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>R</td><td>Ho bisogno di un aiuto economico</td><td>" + (neq.dom16 == 1 ? "X" : "")+ "</td><td>" + (neq.dom16 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>S</td><td>Ho bisogno di parlare con uno psicologo</td><td>" + (neq.dom17 == 1 ? "X" : "")+ "</td><td>" + (neq.dom17 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>T</td><td>Ho bisogno di parlare con un assistente spirituale</td><td>" + (neq.dom18 == 1 ? "X" : "")+ "</td><td>" + (neq.dom18 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>U</td><td>Ho bisogno di parlare con persone che hanno avuto la mia stessa esperienza</td><td>" + (neq.dom19 == 1 ? "X" : "")+ "</td><td>" + (neq.dom19 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>V</td><td>Ho bisogno di essere maggiormente rassicurato dai miei famigliari</td><td>" + (neq.dom20 == 1 ? "X" : "")+ "</td><td>" + (neq.dom20 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>X</td><td>Ho bisogno di sentirmi maggiormente utile in famiglia</td><td>" + (neq.dom21 == 1 ? "X" : "")+ "</td><td>" + (neq.dom21 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>Y</td><td>Ho bisogno di sentirmi meno abbandonato a me stesso</td><td>" + (neq.dom22 == 1 ? "X" : "")+ "</td><td>" + (neq.dom22 == 2 ? "X" : "") + "</td></tr>"+
        "<tr><td>Z</td><td>Ho bisogno di essere meno commiserato dagli altri</td><td>" + (neq.dom23 == 1 ? "X" : "")+ "</td><td>" + (neq.dom23 == 2 ? "X" : "") + "</td></tr>"+
      "</tbody>"+
    "</table>"+
    "</body>"+
    "</html>";
  //else
    return " ";
}

/*
function createQRCode(args){

  var b = args['birth'].split("-");
  return new Promise(function(fulfill, reject){
    qrcode.save(__dirname +'/../qrcodes/'+args['patient'] + '.png',args['patient']+";"+b[2]+""+b[1] , function(err,length){
      if(err) reject(err);
      else fulfill(length);
    });

  });
}*/
