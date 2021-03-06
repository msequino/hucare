var passport =	require('passport');
var multer  = require('multer');
var fs  = require('fs');
var path  = require('path');
var User = require("../controllers/user"),
    Auth = require("../controllers/auth"),
    Clinic = require("../controllers/clinic"),
    Group = require("../controllers/group"),
    Patient = require("../controllers/patient"),
    Questionaire = require("../controllers/questionaire");

module.exports = function(app) {

  var isAuthenticated = function(req, res, next){

    if (!req.isAuthenticated())
      return res.sendStatus(401);
    next();
  };

  // Deny only USER
  var isAdmin = function(req, res, next){
    if (!req.isAuthenticated())
      return res.sendStatus(401);
    if (!req.user.isNotUser() )
      return res.sendStatus(401);
    next();
  };

  //INSERISCI VARI ROUTE
  var pass = require("../controllers/pass")(app,passport);

  app.get('/auth/session', isAuthenticated, Auth.getSession);
  app.post('/auth/login', passport.authenticate('local-login'), Auth.login);
  app.post('/auth/signup', passport.authenticate('local-signup'), Auth.signup);
  app.post('/auth/logout', isAuthenticated, Auth.logout);

  app.route("/user/:username").get(isAuthenticated,User.getUserByUsername);
  app.route("/users/upgrade").get(isAuthenticated,User.sendApk);
  app.route("/users/clinic/:clinic").get(isAdmin, User.getUsersByClinicId);
  app.route("/users/changepassword/:id").post(isAdmin, User.updateUser);
  app.route("/users").get(isAdmin,User.getUsers);
  app.route("/users/:id").get(isAdmin,User.getUser);
  app.route("/users/:id").put(isAdmin,User.updateUser);
  app.route("/users").post(isAdmin,User.insertUser);

  app.route("/patients/document/:id").get(isAuthenticated,Patient.printPatient);
  app.route("/patients/:id").get(isAuthenticated,Patient.getPatient);
  app.route("/patients").get(isAuthenticated,Patient.getPatients);
  app.route("/patients/:id").put(isAuthenticated,Patient.updatePatient);
  app.route("/patients").post(isAuthenticated,Patient.insertPatient);
  app.route("/patient/login").post(Patient.isValidPatient);
  app.route("/screening").post(                             isAuthenticated,Patient.insertNoEligiblePatients);

  app.route("/stats/dataset/test").get(         isAdmin,Patient.getDatasetForTest);
  app.route("/stats/dataset").get(              isAdmin,Patient.getDataset);
  app.route("/stats/quest/:clinic/:period").get(isAdmin,Patient.countQuest);
  app.route("/stats/:period").get(              isAdmin,Patient.countRecluted);

  app.route("/questionaires/test").post(        isAuthenticated,Patient.insertPatientForTest);
  app.route("/questionaires/bypatient/:id").get(isAuthenticated,Patient.getPatient);
  app.route("/questionaires").get(              isAuthenticated,Patient.getPatients);
  app.route("/questionaires/:id").put(          isAuthenticated,Patient.updatePatient);
  app.route("/questionaires").post(             isAuthenticated,Patient.insertPatient);

  //app.route("/questionaires/t0/:patientId").post(isAuthenticated,Questionaire.insertAllT0);
  //app.route("/questionaires/t1/:patientId").post(isAuthenticated,Questionaire.insertAllT1);

  /* For mobile section */
  app.route("/questionaires/insertall/patient").post(        isAuthenticated,Questionaire.insertPatient);
  app.route("/questionaires/insertall/t0/:patientName").post(isAuthenticated,Questionaire.insertAllRowT0);
  app.route("/questionaires/insertall/t1/:patientName").post(isAuthenticated,Questionaire.insertAllRowT1);
  app.route("/questionaires/clone/:patientName").put(        isAuthenticated,Questionaire.makeACopy);
  app.route("/questionaires/get/:patientName").get(          isAuthenticated,Patient.getPatientForMobile);

  app.route("/questionaires/Eortcs/savefield/:time/:patientName").post(isAuthenticated,Questionaire.saveFieldEortc);
  app.route("/questionaires/Hads/savefield/:time/:patientName").post(isAuthenticated,Questionaire.saveFieldHads);
  app.route("/questionaires/Neqs/savefield/:time/:patientName").post(isAuthenticated,Questionaire.saveFieldNeq);
  /*app.route("/questionaires/eortcs/savefield/t1").post(isAuthenticated,Questionaire.saveField);
  app.route("/questionaires/hads/t0").post(isAuthenticated,Questionaire.insertT0Hads);
  app.route("/questionaires/hads/t1").post(isAuthenticated,Questionaire.insertT1Hads);
  app.route("/questionaires/neqs/t0").post(isAuthenticated,Questionaire.insertT0Neq);
  app.route("/questionaires/neqs/t1").post(isAuthenticated,Questionaire.insertT1Neq);
  app.route("/questionaires/reportings/t0").post(isAuthenticated,Questionaire.insertT0Reporting);
  app.route("/questionaires/reportings/t1").post(isAuthenticated,Questionaire.insertT1Reporting);
  app.route("/questionaires/evaluations").post(isAuthenticated,Questionaire.insertEvaluation);*/

  app.route("/clinics").get(isAuthenticated,Clinic.getClinics);
  //app.route("/deployer").post(User.deploy);

  var storage = multer.diskStorage({
    destination: function(req,file,cb){
      var path_resources = path.join(__dirname ,'..','..','app','resources',(req.query.type > 8) ? req.query.clinic : 'commons');
      if (!fs.existsSync(path_resources)){
          fs.mkdirSync(path_resources);
      }
      cb(null,path_resources);
    },
    filename: function (req, file, cb) {
      var name = (req.query.type == 1 ? "utilizzo.mp4" :
                  (req.query.type == 2 ? "esempio.mp4" :
                  (req.query.type == 3 ? "faq.pdf" :
                  (req.query.type == 4 ? "protocollo.pdf" :
                  (req.query.type == 5 ? "sinossi.pdf" :
                  (req.query.type == 6 ? "eortc.pdf" :
                  (req.query.type == 7 ? "hads.pdf" :
                  (req.query.type == 8 ? "neq.pdf" :
                  (req.query.type == 9 ? "fogli_informativi.pdf" :
                  (req.query.type == 10 ? "consenso_informato.pdf" : "altro.pdf"))))))))));

      cb(null, name);
    }
  })

  var upload = multer({ storage: storage })

  app.post("/uploadFile",isAdmin, upload.single('file'),function(req,res){
    res.json(200);
  });

}
