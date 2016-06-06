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
      type : DataTypes.ENUM('1','2','3','4','5','6','7','8','9','10','11','12'),
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
    typetreatment1: {
      type : DataTypes.ENUM('1','2'),
    },
    typetreatment2: {
      type : DataTypes.ENUM('1','2'),
    },
    typetreatment3: {
      type : DataTypes.ENUM('1','2'),
    },
    typetreatment4: {
      type : DataTypes.ENUM('1','2'),
    },
    typetreatment5: {
      type : DataTypes.ENUM('1','2'),
    },
    T0Date: {
      type : DataTypes.DATE,
    },
    T1Date: {
      type : DataTypes.DATE,
    },
    finalized: {
      type : DataTypes.BOOLEAN,
    }

  }, {
    classMethods: {
      associate: function(models) {
        Patient.belongsTo(models.Screening);
        Patient.belongsTo(models.T0Eortc);
        Patient.belongsTo(models.T1Eortc);
        Patient.belongsTo(models.T0Hads,{as: 'T0Hads'});
        Patient.belongsTo(models.T1Hads,{as: 'T1Hads'});
        Patient.belongsTo(models.T0Neq);
        Patient.belongsTo(models.T1Neq);
        Patient.belongsTo(models.T0Reporting);
        Patient.belongsTo(models.T1Reporting);
        Patient.belongsTo(models.Evaluation);
      }
    },
  });

  return Patient;
};
