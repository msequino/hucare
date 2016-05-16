"use strict";

module.exports = function(sequelize, DataTypes) {
  var Evaluation = sequelize.define("Evaluation", {
    date: {
      type : DataTypes.DATEONLY,
    },
    dom1: {
      type : DataTypes.ENUM('1','2','3','4','5'),
    },
    dom2: {
      type : DataTypes.ENUM('1','2','3','4','5'),
    },

  }, {
    classMethods: {
      associate: function(models) {
          Evaluation.belongsTo(models.Patient);
      }
    },
  });

  return Evaluation;
};
