"use strict";

module.exports = function(sequelize, DataTypes) {
  var T1Reporting = sequelize.define("T1Reporting", {
    date: {
      type : DataTypes.DATEONLY,
    },
    dom1: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 5},
      comment : "compState = 1 => questionari compilati; compSta = 2 => almeno un questionario risulta non compilato "
    },
    dom2: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 3},
      comment : "Se compState = 2 => chiedi motivazione"
    },
    dom3: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Se compState = 2 => chiedi motivazione"
    },
    dom4: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 3},
      comment : "Se compState = 2 => chiedi motivazione"
    },
    dom4t: {
      type : DataTypes.STRING,
      comment : "Se answer = 6 => specificare"
    },
    dom5: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
    },
    dom6: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 6},
      comment : "Se compState = 2 => chiedi motivazione"
    },
    dom6t: {
      type : DataTypes.STRING,
      comment : "Se answer = 6 => specificare"
    },


  }, {
    classMethods: {
      associate: function(models) {
      }
    },
  });

  return T1Reporting;
};
