var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('../models');

module.exports.getSession = function(req, res) {
  res.send(req.user.read_info());
};

module.exports.login = function(req, res) {
  res.json({code : 200 , data : req.user.read_info()});
};

module.exports.signup = function(req, res) {
  res.send(req.user);
};

module.exports.logout = function(req, res){
  req.logOut();
  res.sendStatus(200);
};
