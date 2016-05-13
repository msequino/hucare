"use strict";

module.exports = function(sequelize, DataTypes) {
  var Group = sequelize.define("Group", {
    name: DataTypes.STRING
  },{
    timestamps : false
  });

  return Group;
};
