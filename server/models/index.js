"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var db        = require("../config/db.json");
var sequelize = new Sequelize(db.name, db.user, db.pass, {
                                                          host: db.hasOwnProperty('host') ? db.host : "localhost",
                                                          port : 3306,
                                                          logging : false,
                                                          freezeTableName : false});
var db        = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
//db.Sequelize = Sequelize;

module.exports = db;
