var passport =	require('passport');
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

  /*var isAdmin = function(req, res, next){
    if (!req.isAuthenticated())
      return res.sendStatus(401);
    if (!req.user.isAdmin())
      return res.sendStatus(401);
    next();
  };*/

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
  app.route("/users/clinic/:clinic").get(User.getUsersByClinicId);
  app.route("/users/changepassword/:id").post(User.updateUser);
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
  app.route("/screening").post(isAuthenticated,Patient.insertNoEligiblePatients);
  app.route("/stats").get(isAuthenticated,Patient.countRecluted);

  app.route("/questionaires/bypatient/:id").get(isAuthenticated,Patient.getPatient);
  app.route("/questionaires").get(isAuthenticated,Patient.getPatients);
  app.route("/questionaires/:id").put(isAuthenticated,Patient.updatePatient);
  app.route("/questionaires").post(isAuthenticated,Patient.insertPatient);

  //app.route("/questionaires/t0/:patientId").post(isAuthenticated,Questionaire.insertAllT0);
  //app.route("/questionaires/t1/:patientId").post(isAuthenticated,Questionaire.insertAllT1);

  app.route("/questionaires/insertall/t0/").post(isAuthenticated,Questionaire.insertAllRowT0);
  app.route("/questionaires/insertall/t1/:patientName").post(isAuthenticated,Questionaire.insertAllRowT1);

  app.route("/questionaires/eortcs/t0").post(isAuthenticated,Questionaire.insertT0Eortc);
  app.route("/questionaires/eortcs/t1").post(isAuthenticated,Questionaire.insertT1Eortc);
  app.route("/questionaires/hads/t0").post(isAuthenticated,Questionaire.insertT0Hads);
  app.route("/questionaires/hads/t1").post(isAuthenticated,Questionaire.insertT1Hads);
  app.route("/questionaires/neqs/t0").post(isAuthenticated,Questionaire.insertT0Neq);
  app.route("/questionaires/neqs/t1").post(isAuthenticated,Questionaire.insertT1Neq);
  app.route("/questionaires/reportings/t0").post(isAuthenticated,Questionaire.insertT0Reporting);
  app.route("/questionaires/reportings/t1").post(isAuthenticated,Questionaire.insertT1Reporting);
  app.route("/questionaires/evaluations").post(isAuthenticated,Questionaire.insertEvaluation);

  app.route("/clinics").get(isAuthenticated,Clinic.getClinics);
  app.route("/deployer").post(User.deploy);

}
