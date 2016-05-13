"use strict";

module.exports = function(sequelize, DataTypes) {
  var T1Hads = sequelize.define("T1Hads", {
    date: {
      type : DataTypes.DATEONLY,
    },
    compiletime: {
      type : DataTypes.INTEGER,
      comment : "Tempo per la compilazione (in secondi)"
    },
    dom1: {
      type : DataTypes.ENUM('0','1','2','3','4'),
      comment : "Mi sono sentito/a teso/a o molto nervoso/a"
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
      comment : "Mi sono sentito/a come rallentato/a"
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
  }, {
    classMethods: {
      associate: function(models) {
        T1Hads.belongsTo(models.Patient);
      }
    },
  });

  return T1Hads;
};
