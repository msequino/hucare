
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

module.exports.countRecluted = function(req,res,next){
  db.Screening.findAll({
    attributes : ['Clinic.name',[db.sequelize.fn('count',db.sequelize.col('ClinicId')), 'ClinicCount']],
    include : [db.Clinic],
    group : ['ClinicId']}).then(function(result){

      db.Patient.findAll({
        include : [
          {attributes : ['ClinicId',[db.sequelize.fn('count',db.sequelize.col('ClinicId')), 'ClinicCount']],
          model : db.Screening }],
        where : {'T1Date' : {$ne : null}},
        group : ['Screening.ClinicId']
      }).then(function(result){
        console.log(result);
        res.json({code : 200 , data: result});
      }).catch(function(error){
        log.log('error',error);
        res.json({code :404});
      });

  }).catch(function(error){
    log.log('error',error);
    res.json({code :404});
  });
}

module.exports.countFU = function(req,res,next){
  db.Screening.findAll({group : ['ClinicId']}).then(function(result){
    res.json({code : 200 , data: result});
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
    [{model: db.T0Eortc},{model: db.T1Eortc},{model: db.T0Neq},{model: db.T1Neq}],
  }).then(function(patient){

    if(!patient) return res.json({code : 400  ,message : "Il paziente non è stato ancora inserito nel database centrale. Si prega di inserirlo tramite il relativo reporting form"});
    //if(!patient.T0Neq) return res.json({code : 400  ,message : "Il paziente non ha compilato il questionario"});
    var options = {format : "Letter"};
    var attachments = [];

    var html = createNeq(patient.name,patient.T0Neq,0);
    pdf.create(html, options).toFile(__dirname + '/../tmp/'+req.params.id+'Neq0.pdf', function(err, result) {
      if(result) attachments.push({filename: req.params.id+'NeqT0.pdf', path : __dirname +'\\..\\tmp\\'+req.params.id+'Neq0.pdf'});
      var html = createNeq(patient.name,patient.T1Neq,1);
      pdf.create(html, options).toFile(__dirname + '/../tmp/'+req.params.id+'Neq1.pdf', function(err, result) {
        if(result) attachments.push({filename: req.params.id+'NeqT1.pdf', path : __dirname +'\\..\\tmp\\'+req.params.id+'Neq1.pdf'});
        var html = createEortc(patient.name,patient.T0Eortc,0);
        pdf.create(html, options).toFile(__dirname + '/../tmp/'+req.params.id+'Eortc0.pdf', function(err, result) {
          if(result) attachments.push({filename: req.params.id+'EortcT0.pdf', path : __dirname +'\\..\\tmp\\'+req.params.id+'Eortc0.pdf'});
          var html = createEortc(patient.name,patient.T1Eortc,1);
          pdf.create(html, options).toFile(__dirname + '/../tmp/'+req.params.id+'Eortc1.pdf', function(err, result) {
            if(result) attachments.push({filename: req.params.id+'EortcT1.pdf', path : __dirname +'\\..\\tmp\\'+req.params.id+'Eortc1.pdf'});

            var obj = JSON.parse(fs.readFileSync(__dirname +'\\..\\config\\aruba_config.json', 'utf8'));
            // create reusable transporter object using the default SMTP transport
            var transporter = nodemailer.createTransport(obj);
            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: '"Progetto Hucare" <progetto.hucare@gmail.com>', // sender address
                to: req.query.email, // list of receivers
                subject: 'HuCare: Questionari paziente ' + req.params.id, // Subject line
                html: 'Gentile referente,<br> in allegato trova i questionari compilati dal paziente ' + req.params.id +'', // html body
                attachments : attachments
                };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
              try{
                if(fs.statSync(__dirname +'\\..\\tmp\\'+req.params.id+'Neq0.pdf').isFile())
                  fs.unlink(__dirname +'\\..\\tmp\\'+req.params.id+'Neq0.pdf');
              }catch(err){}
              try{
                if(fs.statSync(__dirname +'\\..\\tmp\\'+req.params.id+'Neq1.pdf').isFile())
                  fs.unlink(__dirname +'\\..\\tmp\\'+req.params.id+'Neq1.pdf');
              }catch(err){}
              try{
                if(fs.statSync(__dirname +'\\..\\tmp\\'+req.params.id+'Eortc0.pdf').isFile())
                  fs.unlink(__dirname +'\\..\\tmp\\'+req.params.id+'Eortc0.pdf');
              }catch(err){}
              try{
                if(fs.statSync(__dirname +'\\..\\tmp\\'+req.params.id+'Eortc1.pdf').isFile())
                  fs.unlink(__dirname +'\\..\\tmp\\'+req.params.id+'Eortc1.pdf');
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

}

function createEortc(name, eortc, time){
  if(eortc)
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
        "<tr><td>1</td><td>Ho bisogno di avere maggiori informazioni sulla mia diagnosi?</td><td>" + eortc.dom1 + "</td></tr>"+
        "<tr><td>2</td><td>Ho bisogno di avere maggiori informazioni sulle mie condizioni future?</td><td>" + eortc.dom2 + "</td></tr>"+
        "<tr><td>3</td><td>Ho bisogno di avere maggiori informazioni sugli esami che mi stanno facendo?</td><td>" + eortc.dom3 + "</td></tr>"+
        "<tr><td>4</td><td>Ho bisogno di avere maggiori spiegazioni sui trattamenti?</td><td>" + eortc.dom4 + "</td></tr>"+
        "<tr><td>5</td><td>Ho bisogno di essere più coinvolto/a nelle scelte terapeutiche?</td><td>" + eortc.dom5 + "</td></tr>"+
        "</tbody>"+
      "</table>"+
      "<br>"+
      "<h2>Durante gli ultimi sette giorni</h2>"+
      "<table style='border-spacing:10px;border-collapse:separate' border='2'>"+
        "<thead>"+
          "<tr><th></th><th>Domanda</th><th>Valore segnato</th></tr>"+
        "</thead>"+
        "<tr><td>6</td><td>Ha avuto limitazioni nel fare il suo lavoro o i lavori di casa?</td><td>" + eortc.dom6 + "</td></tr>"+
        "<tr><td>7</td><td>Ha avuto limitazioni nel praticare i Suoi passatempi-hobby o altre attività di divertimento o svago?</td><td>" + eortc.dom7 + "</td></tr>"+
        "<tr><td>8</td><td>Le è mancato il fiato?</td><td>" + eortc.dom8 + "</td></tr>"+
        "<tr><td>9</td><td>Ha avuto dolore?</td><td>" + eortc.dom9 + "</td></tr>"+
        "<tr><td>10</td><td>Ha avuto bisogno di riposo?</td><td>" + eortc.dom10 + "</td></tr>"+
        "<tr><td>11</td><td>Ha avuto difficoltà a dormire?</td><td>" + eortc.dom11 + "</td></tr>"+
        "<tr><td>12</td><td>Ha sentito debolezza?</td><td>" + eortc.dom12 + "</td></tr>"+
        "<tr><td>13</td><td>Le è mancato l'appetito?</td><td>" + eortc.dom13 + "</td></tr>"+
        "<tr><td>14</td><td>Ha avuto un senso di nausea?</td><td>" + eortc.dom14 + "</td></tr>"+
        "<tr><td>15</td><td>Ha vomitato?</td><td>" + eortc.dom15 + "</td></tr>"+
        "<tr><td>16</td><td>Ha avuto problemi di stitichezza?</td><td>" + eortc.dom16 + "</td></tr>"+
        "<tr><td>17</td><td>Ha avuto problemi di diarrea?</td><td>" + eortc.dom17 + "</td></tr>"+
        "<tr><td>18</td><td>Ha sentito stanchezza?</td><td>" + eortc.dom18 + "</td></tr>"+
        "<tr><td>19</td><td>Il dolore ha interferito con le Sue attività quotidiane?</td><td>" + eortc.dom19 + "</td></tr>"+
        "<tr><td>20</td><td>Ha avuto difficoltà a concentrarsi su cose come leggere un giornale o guardare la televisione?</td><td>" + eortc.dom20 + "</td></tr>"+
        "<tr><td>21</td><td>Si è sentito/a teso/a?</td><td>" + eortc.dom21 + "</td></tr>"+
        "<tr><td>22</td><td>Ha avuto preoccupazioni?</td><td>" + eortc.dom22 + "</td></tr>"+
        "<tr><td>23</td><td>Ha avuto manifestazioni di irritabilità?</td><td>" + eortc.dom23+ "</td></tr>"+
        "<tr><td>24</td><td>Ha avvertito uno stato di depressione?</td><td>" + eortc.dom24 + "</td></tr>"+
        "<tr><td>25</td><td>Ha avuto difficoltà a ricordare le cose?</td><td>" + eortc.dom25 + "</td></tr>"+
        "<tr><td>26</td><td>Le Sue condizioni fisiche o il Suo trattamento medico hanno interferito con le Sua vita familiare?</td><td>" + eortc.dom26 + "</td></tr>"+
        "<tr><td>27</td><td>Le Sue condizioni fisiche o il Suo trattamento medico hanno interferito con le Sue attività sociali?</td><td>" + eortc.dom27 + "</td></tr>"+
        "<tr><td>28</td><td>Le Sue condizioni fisiche o il Suo trattamento medico Le hanno causato difficoltà finanziarie?</td><td>" + eortc.dom28 + "</td></tr>"+
        "<tr><td>29</td><td>Come valuterebbe in generale la Sua salute durante gli ultimi sette giorni?</td><td>" + eortc.dom29 + "</td></tr>"+
        "<tr><td>30</td><td>Come valuterebbe in generale la Sua qualità di vita durante gli ultimi sette giorni?</td><td>" + eortc.dom30 + "</td></tr>"+
      "</tbody>"+
    "</table>"+
    "</body>"+
    "</html>";
  else
    return " ";
}

function createNeq(name, neq, time){
  if(neq)
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
  else
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
