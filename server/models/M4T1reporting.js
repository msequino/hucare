"use strict";

module.exports = function(sequelize, DataTypes) {
  var T1Reporting = sequelize.define("T1Reporting", {
    time: {
      type : DataTypes.ENUM('1','2'),
      comment : "Tempo di compilazione (basale => 1 ;dopo 3 mesi => 2)"
    },
    ecog: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 5},
      comment : "compState = 1 => questionari compilati; compSta = 2 => almeno un questionario risulta non compilato "
    },
    progression: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 3},
      comment : "Se compState = 2 => chiedi motivazione"
    },
    answer: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 6},
      comment : "Se compState = 2 => chiedi motivazione"
    },
    answerSpec: {
      type : DataTypes.STRING,
      comment : "Se answer = 6 => specificare"
    },
    finalized: {
      type : DataTypes.BOOLEAN,
      allowNull : false,
      defaultValue : false
    },

  }, {
    classMethods: {
      associate: function(models) {
          T1Reporting.belongsTo(models.Patient);
      }
    },
  });

  return T1Reporting;
};
