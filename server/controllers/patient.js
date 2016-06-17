
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

/*  if(req.user.rand_date < new Date())
    return res.json({code : 400  ,message : "Attenzione: il centro non è stato ancora randomizzato, queste informazioni saranno visibili solo ad inizio sperimentazione"})*/
  db.Patient.findOne( { where : {name:req.params.id} ,
    include:
      [{
        model: db.T0Neq,
      },{
        model: db.T1Neq,
      }],
  }).then(function(patient){

    if(!patient) return res.json({code : 400  ,message : "Il paziente non è stato ancora inserito nel database centrale. Si prega di inserirlo tramite il relativo reporting form"});
    //if(!patient.T0Neq) return res.json({code : 400  ,message : "Il paziente non ha compilato il questionario"});
    var html = createNeq(patient.name,patient.T0Neq,0);
    var options = { format: 'Letter' };

    pdf.create(html, options).toFile(__dirname + '/../tmp/'+req.params.id+'_neq0.pdf', function(err, result) {
      if (err) return console.log(err);

      if(patient.T1Neq){
        var html = createNeq(patient.name,patient.T1Neq,1);

      }else{
        var obj = JSON.parse(fs.readFileSync(__dirname +'\\..\\config\\aruba_config.json', 'utf8'));
        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport(obj);
        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: '"Progetto Hucare" <progetto.hucare@gmail.com>', // sender address
            to: req.query.email, // list of receivers
            subject: 'Neq paziente ' + req.params.id, // Subject line
            html: '<b>Gentile referente, in allegato trova il Neq compilato dal paziente ' + req.params.id +'</b>', // html body
            attachments : [{filename: 'neqT0.pdf', path : __dirname +'\\..\\tmp\\'+req.params.id+'neq0.pdf'}]
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
          fs.unlink(__dirname +'\\..\\tmp\\neq.pdf');
          console.log(error);
          if(error)  res.json({code : 400  ,message : "Mail non inviata"});
          else
            res.json({code : 200  ,message : "Informazioni salvate"});
        });

      }
    });
  });
}
function createEortc(name, neq, time){
  return "<html>"+
  "<body><header style='border-style:solid;'><h1><center>VALUTAZIONE " + (time == 0 ? "BASALE" : "FOLLOW-UP")+ " paziente " + name +"</center></h1>"+
  "</header>"+
  "<center><h2>Questionario per la Valutazione della Qualità della Vita</h2></center>"+
  "<p>Versione elettronica delle domande inserite dal paziente</p>"+
  "<br/>"+
  "<h2>In generale</h2>"+
  "<table style='border-spacing:10px;border-collapse:separate' border='2'>"+
    "<thead>"+
      "<tr><th></th><th>Domanda</th><th>Valore segnato</th></tr>"+
    "</thead>"+
    "<tbody>"+
      "<tr><td>1</td><td>Ho bisogno di avere maggiori informazioni sulla mia diagnosi</td><td>" + (neq.dom1 == 1 ? "X" : "")+ "</td><td>" + (neq.dom1 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>2</td><td>Ho bisogno di avere maggiori informazioni sulle mie condizioni future</td><td>" + (neq.dom2 == 1 ? "X" : "")+ "</td><td>" + (neq.dom2 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>3</td><td>Ho bisogno di avere maggiori informazioni sugli esami che mi stanno facendo</td><td>" + (neq.dom3 == 1 ? "X" : "")+ "</td><td>" + (neq.dom3 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>4</td><td>Ho bisogno di avere maggiori spiegazioni sui trattamenti</td><td>" + (neq.dom4 == 1 ? "X" : "")+ "</td><td>" + (neq.dom4 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>5</td><td>Ho bisogno di essere più coinvolto/a nelle scelte terapeutiche</td><td>" + (neq.dom5 == 1 ? "X" : "")+ "</td><td>" + (neq.dom5 == 2 ? "X" : "") + "</td></tr>"+
      "</tbody>"+
    "</table>"+
    "<br>"+
    "<h2>Durante gli ultimi sette giorni</h2>"+
    "<table style='border-spacing:10px;border-collapse:separate' border='2'>"+
      "<thead>"+
        "<tr><th></th><th>Domanda</th><th>Valore segnato</th></tr>"+
      "</thead>"+
      "<tr><td>6</td><td>Ha avuto limitazioni nel fare il suo lavoro o i lavori di casa</td><td>" + (neq.dom6 == 1 ? "X" : "")+ "</td><td>" + (neq.dom6 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>7</td><td>Ha avuto limitazioni nel praticare i Suoi passatempi-hobby o altre attività di divertimento o svago</td><td>" + (neq.dom7 == 1 ? "X" : "")+ "</td><td>" + (neq.dom7 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>8</td><td>Ho bisogno di avere un dialogo maggiore con i medici</td><td>" + (neq.dom8 == 1 ? "X" : "")+ "</td><td>" + (neq.dom8 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>9</td><td>Ho bisogno che alcuni dei miei disturbi ( dolore, nausea, insonnia, ecc.) siano maggiormente controllati</td><td>" + (neq.dom9 == 1 ? "X" : "")+ "</td><td>" + (neq.dom9 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>10</td><td>Ho bisogno di maggiore aiuto per mangiare, vestirmi ed andare in bagno</td><td>" + (neq.dom10 == 1 ? "X" : "")+ "</td><td>" + (neq.dom10 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>11</td><td>Ho bisogno di maggiore rispetto della mia intimità</td><td>" + (neq.dom11 == 1 ? "X" : "")+ "</td><td>" + (neq.dom11 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>12</td><td>Ho bisogno di maggiore attenzione da parte del personale infermieristico</td><td>" + (neq.dom12 == 1 ? "X" : "")+ "</td><td>" + (neq.dom12 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>13</td><td>Ho bisogno di essere più rassicurato dai medici</td><td>" + (neq.dom13 == 1 ? "X" : "")+ "</td><td>" + (neq.dom13 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>15</td><td>Ho bisogno che i servizi offerti dall'ospedale (bagni, pasti, pulizia) siano migliori</td><td>" + (neq.dom14 == 1 ? "X" : "")+ "</td><td>" + (neq.dom14 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>15</td><td>Ho bisogno di avere maggiori informazioni economico-assicurative legate alla mia malattia (ticket, invalidità, ecc.)</td><td>" + (neq.dom15 == 1 ? "X" : "")+ "</td><td>" + (neq.dom15 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>16</td><td>Ho bisogno di un aiuto economico</td><td>" + (neq.dom16 == 1 ? "X" : "")+ "</td><td>" + (neq.dom16 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>17</td><td>Ho bisogno di parlare con uno psicologo</td><td>" + (neq.dom17 == 1 ? "X" : "")+ "</td><td>" + (neq.dom17 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>18</td><td>Ho bisogno di parlare con un assistente spirituale</td><td>" + (neq.dom18 == 1 ? "X" : "")+ "</td><td>" + (neq.dom18 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>19</td><td>Ho bisogno di parlare con persone che hanno avuto la mia stessa esperienza</td><td>" + (neq.dom19 == 1 ? "X" : "")+ "</td><td>" + (neq.dom19 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>20</td><td>Ho bisogno di essere maggiormente rassicurato dai miei famigliari</td><td>" + (neq.dom20 == 1 ? "X" : "")+ "</td><td>" + (neq.dom20 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>21</td><td>Ho bisogno di sentirmi maggiormente utile in famiglia</td><td>" + (neq.dom21 == 1 ? "X" : "")+ "</td><td>" + (neq.dom21 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>22</td><td>Ho bisogno di sentirmi meno abbandonato a me stesso</td><td>" + (neq.dom22 == 1 ? "X" : "")+ "</td><td>" + (neq.dom22 == 2 ? "X" : "") + "</td></tr>"+
      "<tr><td>23</td><td>Ho bisogno di essere meno commiserato dagli altri</td><td>" + (neq.dom23 == 1 ? "X" : "")+ "</td><td>" + (neq.dom23 == 2 ? "X" : "") + "</td></tr>"+
    "</tbody>"+
  "</table>"+
  "</body>"+
  "</html>";
}

function createNeq(name, neq, time){
  return "<html>"+
  "<body><header style='border-style:solid;'><h1><center>VALUTAZIONE " + (time == 0 ? "BASALE" : "FOLLOW-UP")+ " paziente " + name +"</center></h1>"+
  "</header>"+
  "<center><h2>Questionario per la Valutazione dei Bisogni del Paziente</h2></center>"+
  "<p>Versione elettronica delle domande inserite dal paziente</p>"+
  "<table style='border-spacing:10px;border-collapse:separate' border='2'>"+
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
