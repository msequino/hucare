
var models = require("../models");
module.exports.getGroups = function(req,res,next){
  models.Group.findAll().then(function(data){
    res.json(data);
  });
}
