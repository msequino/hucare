"use strict";

module.exports = function(sequelize, DataTypes) {
  var Patient = sequelize.define("Patient", {
    name: {
      type : DataTypes.STRING(6),
    },
    birth: {
      type : DataTypes.DATEONLY,
    },
    sex: {
      type : DataTypes.ENUM('1','2'),
    },
    marital: {
      type : DataTypes.ENUM('1','2'),
    },
    scholar: {
      type : DataTypes.ENUM('1','2','3'),
    },
    date: {
      type : DataTypes.DATEONLY,
    },
    firstdatemonth: {
      type : DataTypes.INTEGER,
      validate : {
        min : 1,
        max : 12
      }
    },
    firstdateyear: {
      type : DataTypes.INTEGER,
      validate : {
        min : 1990,
        max : 2018
      }
    },
    metastatic: {
      type : DataTypes.ENUM('1','2'),
    },
    place: {
      type : DataTypes.ENUM('1','2','3','4','5','6','7','8','9','10','11'),
    },
    metastatic1: {
      type : DataTypes.ENUM('1','2'),
    },
    metastatic2: {
      type : DataTypes.ENUM('1','2'),
    },
    metastatic3: {
      type : DataTypes.ENUM('1','2'),
    },
    metastatic4: {
      type : DataTypes.ENUM('1','2'),
    },
    metastatic5: {
      type : DataTypes.ENUM('1','2'),
    },
    metastatic6: {
      type : DataTypes.ENUM('1','2'),
    },
    metastatic7: {
      type : DataTypes.ENUM('1','2'),
    },
    metastaticother: {
      type : DataTypes.STRING,
    },
    ecog: {
      type : DataTypes.ENUM('0','1','2','3','4','5'),
    },
    typetreatment: {
      type : DataTypes.ENUM('1','2','3'),
    },
    finalized: {
      type : DataTypes.BOOLEAN,
    }

  }, {
    classMethods: {
      associate: function(models) {
        Patient.belongsTo(models.Screening);
      }
    },
  });

  return Patient;
};
