"use strict";

module.exports = function(sequelize, DataTypes) {
  var T0Reporting = sequelize.define("T0Reporting", {
    date: {
      type : DataTypes.DATEONLY,
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
    dom4_1: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Se compState = 2 => chiedi motivazione"
    },
    dom4_1t: {
      type : DataTypes.STRING,
      comment : "Se answer = 6 => specificare"
    },
    dom5: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 3},
    },
    dom6: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 3},
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

  return T0Reporting;
};
