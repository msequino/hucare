
var models = require("../models");
module.exports.getClinics = function(req,res,next){
  models.Clinic.findAll().then(function(data){
    res.json(data);
  });
}
