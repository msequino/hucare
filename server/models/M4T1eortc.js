"use strict";

module.exports = function(sequelize, DataTypes) {
  var T1Eortc = sequelize.define("T1Eortc", {
    date: {
      type : DataTypes.DATEONLY,
    },
    compiletime: {
      type : DataTypes.INTEGER,
      comment : "Tempo per la compilazione  (in secondi)"
    },
    dom1: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom2: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom3: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom4: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom5: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom6: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom7: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom8: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom9: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom10: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom11: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom12: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom13: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom14: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom15: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom16: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom17: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom18: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom19: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom20: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom21: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom22: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom23: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom24: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom25: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom26: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom27: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom28: {
      type : DataTypes.ENUM('0','1','2','3','4'),
    },
    dom29: {
      type : DataTypes.ENUM('0','1','2','3','4','5','6','7'),
    },
    dom30: {
      type : DataTypes.ENUM('0','1','2','3','4','5','6','7'),
    },

  }, {
    classMethods: {
      associate: function(models) {
        T1Eortc.belongsTo(models.Patient);
      }
    },
  });

  return T1Eortc;
};
