"use strict";

module.exports = function(sequelize, DataTypes) {
  var Clinic = sequelize.define("Clinic", {
    name: DataTypes.STRING,
    abbr: DataTypes.STRING(2),
  },
  {
      timestamps : false
  });

  return Clinic;
};
