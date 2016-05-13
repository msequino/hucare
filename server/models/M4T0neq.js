"use strict";

module.exports = function(sequelize, DataTypes) {
  var T0Neq = sequelize.define("T0Neq", {
    date: {
      type : DataTypes.DATEONLY,
    },
    time: {
      type : DataTypes.ENUM('1','2'),
      comment : "Tempo di compilazione (basale => 1; dopo 3 mesi => 2)"
    },
    compiletime: {
      type : DataTypes.INTEGER,
      comment : "Tempo per la compilazione (in secondi)"
    },
    dom1: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom2: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom3: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom4: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom5: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom6: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom7: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom8: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom9: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom10: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom11: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom12: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom13: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom14: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom15: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom16: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom17: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom18: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom19: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom20: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom21: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom22: {
      type : DataTypes.ENUM('0','1','2'),
    },
    dom23: {
      type : DataTypes.ENUM('0','1','2'),
    },

  }, {
    classMethods: {
      associate: function(models) {
        T0Neq.belongsTo(models.Patient);
      }
    },
  });

  return T0Neq;
};
