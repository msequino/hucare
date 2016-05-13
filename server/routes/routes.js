var passport =	require('passport');
var User = require("../controllers/user"),
    Auth = require("../controllers/auth"),
    Clinic = require("../controllers/clinic"),
    Group = require("../controllers/group"),
    Patient = require("../controllers/patient");

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

  app.route("/users").get(isAdmin,User.getUsers);
  app.route("/users/:id").get(isAdmin,User.getUser);
  app.route("/user/:username").get(isAuthenticated,User.getUserByUsername);
  app.route("/users/:id").put(isAdmin,User.updateUser);
  app.route("/users").post(isAdmin,User.insertUser);

  app.route("/patients/:id").get(isAuthenticated,Patient.getPatient);
  app.route("/patients").get(isAuthenticated,Patient.getPatients);
  app.route("/patients/:id").put(isAuthenticated,Patient.updatePatient);
  app.route("/patients").post(isAuthenticated,Patient.insertPatient);
  app.route("/patients/screening").post(isAuthenticated,Patient.insertNoEligiblePatients);

  app.route("/questionaires/bypatient/:id").get(isAuthenticated,Patient.getPatient);
  app.route("/questionaires").get(isAuthenticated,Patient.getPatients);
  app.route("/questionaires/:id").put(isAuthenticated,Patient.updatePatient);
  app.route("/questionaires").post(isAuthenticated,Patient.insertPatient);

  app.route("/clinics").get(isAuthenticated,Clinic.getClinics);

}
