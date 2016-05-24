"use strict";

module.exports = function(sequelize, DataTypes) {
  var T0Reporting = sequelize.define("T0Reporting", {
    date: {
      type : DataTypes.DATEONLY,
    },
    dom3: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 3},
      comment : "Se compState = 2 => chiedi motivazione"
    },
    dom3t: {
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
