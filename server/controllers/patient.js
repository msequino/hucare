
var db = require("../models"),
  //sequelize = require("sequelize"),
  //qrcode = require("qrcode"),
  pdf = require('html-pdf'),
  nodemailer = require('nodemailer'),
  fs = require('fs'),
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
  console.log(req.params);
  var html = fs.readFileSync(__dirname + '/../views/neq.html', 'utf8');
  var options = { format: 'Letter' };

  pdf.create(html, options).toFile(__dirname + '/../tmp/neq.pdf', function(err, result) {
    if (err) return console.log(err);

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport('smtps://5859205@aruba.it:8308n3dxs4@smtp.gmail.com');

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Progetto Hucare" <progetto.hucare@gmail.com>', // sender address
        to: req.query.email, // list of receivers
        subject: 'Neq paziente ____', // Subject line
        html: '<b>Gentile referente, in allegato trova il Neq compilato dal paziente</b>', // html body
        attachments : [{filename: __dirname + '/../tmp/neq.pdf'}]
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
      console.log(error);
      if(error)  res.json({code : 400  ,message : "Mail non inviata"});
      else
        res.json({code : 200  ,message : "Informazioni salvate"});
    });
  });
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
