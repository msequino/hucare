"use strict";

module.exports = function(sequelize, DataTypes) {
  var T0Reporting = sequelize.define("T0Reporting", {
    answer: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 3},
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
          T0Reporting.belongsTo(models.Patient);
      }
    },
  });

  return T0Reporting;
};
