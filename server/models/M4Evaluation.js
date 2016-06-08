"use strict";

module.exports = function(sequelize, DataTypes) {
  var Evaluation = sequelize.define("Evaluation", {
    date: {
      type : DataTypes.DATEONLY,
    },
    dom1: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom2: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },

  }, {
    classMethods: {
      associate: function(models) {
      }
    },
  });

  return Evaluation;
};
