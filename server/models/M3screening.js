"use strict";

module.exports = function(sequelize, DataTypes) {
  var Screening = sequelize.define("Screening", {
    incl1: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Età > 18"
    },
    incl2: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Diagnosi di tumore solido da non più di due mesi"
    },
    incl3: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Che devono iniziare un nuovo trattamento medico: chemioterapia, (sia e.v. Che con farmaci orali), farmaci a target molecolare, ormonoterapia, immunoterapia"
    },
    incl4: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Sopravvivenza attesa > 3 mesi"
    },
    incl5: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Buona comprensione lingua italiana"
    },
    excl1: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Pregressa chemioterapia o altro trattamento medico per tumore"
    },
    excl2: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Arruolato nel medesimo trial in un periodo precedente"
    },
    excl3: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Partecipazione in atto ad altri trial"
    },
    excl4: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "In trattamento da uno psicologo o da uno psichiatra"
    },
    excl5: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Ricoverato in degenza ordinaria"
    },
    excl6: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Presenza di condizioni patologiche mentali o psichiatriche"
    },
    excl7: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Impossibilità a completare il questionario o a garantire il follow-up a 3 mesi"
    },
    signed: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Ha firmato il consenso informato?"
    },
    tablet: {
      type : DataTypes.INTEGER(1),
      validate : {min : 1 , max : 2},
      comment : "Motivazione non partecipazione allo studio"
    },
    consenso : {
      type : DataTypes.STRING(10)
    }

  },
  {
    classMethods: {
      associate: function(models) {
        Screening.belongsTo(models.Clinic);
      }
    },
  });

  return Screening;
};
