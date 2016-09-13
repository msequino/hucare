"use strict";
var bcrypt   = require('bcrypt-nodejs');

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {

    name: {
      type : DataTypes.STRING,
    },
    surname: {
      type : DataTypes.STRING,
    },
    mail: {
      type : DataTypes.STRING,
    },
    username: {
      type : DataTypes.STRING,
      unique : true
    },
    password: {
      type : DataTypes.STRING,
      set : function(password){
        this.setDataValue('password',bcrypt.hashSync(password, bcrypt.genSaltSync(8), null));
      }
    },
    rand_date: {
      type : DataTypes.DATEONLY
    },

  }, {
    classMethods: {
      associate: function(models) {
        User.belongsTo(models.Group);
        User.belongsTo(models.Clinic);
      }
    },
    instanceMethods : {
      isValidPassword : function(pass){
        return bcrypt.compareSync(pass, this.getDataValue('password'));
      },
      read_info : function(){
        return {
          id : this.getDataValue("id"),
          username : this.getDataValue("username"),
          mail : this.getDataValue("mail"),
          ClinicId : this.getDataValue("ClinicId"),
          GroupId : this.getDataValue("GroupId"),
          rand_date : this.getDataValue("rand_date"),
        };
      },
      isNotUser : function(){
        return this.getDataValue('GroupId') < 3;
      },
      getUsername : function(){
        return this.getDataValue('username');
      },
    },
  });

  return User;
};
