"use strict";

module.exports = function(sequelize, DataTypes) {
  var Neq = sequelize.define("Neq", {
    time: {
        type : DataTypes.STRING(2)
    },
    patientid: {
        type : DataTypes.STRING(6)
    },
    userid: {
        type : DataTypes.STRING
    },
    dom1: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom2: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom3: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom4: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom5: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom6: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom7: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom8: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom9: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom10: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom11: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom12: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom13: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom14: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom15: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom16: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom17: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom18: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom19: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom20: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom21: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom22: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },
    dom23: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 2},
    },

  }, {
    classMethods: {
      associate: function(models) {
      }
    },
  });

  return Neq;
};
