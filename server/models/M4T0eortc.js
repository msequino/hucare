"use strict";

module.exports = function(sequelize, DataTypes) {
  var T0Eortc = sequelize.define("T0Eortc", {
    date: {
      type : DataTypes.DATEONLY,
    },
    compiletime: {
      type : DataTypes.INTEGER,
      comment : "Tempo per la compilazione  (in secondi)"
    },
    dom1: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom2: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom3: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom4: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom5: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom6: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom7: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom8: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom9: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom10: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom11: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom12: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom13: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom14: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom15: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom16: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom17: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom18: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom19: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom20: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom21: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom22: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom23: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom24: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom25: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom26: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom27: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom28: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 4},
    },
    dom29: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 7},
    },
    dom30: {
      type : DataTypes.INTEGER(1),
      validate : {min : 0 , max : 7},
    },

  }, {
    classMethods: {
      associate: function(models) {
      }
    },
  });

  return T0Eortc;
};
