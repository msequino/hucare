"use strict";

module.exports = function(sequelize, DataTypes) {
  var Hads = sequelize.define("Hads", {
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
      comment : "Mi sono sentito/a come rallentato/a"
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
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
  });

  return Hads;
};
