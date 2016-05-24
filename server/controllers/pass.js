var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('../models');
var log = require('../config/winston');

module.exports = function(req,res,next){

  // Configure the local strategy for use by Passport.
  //
  // The local strategy require a `verify` function which receives the credentials
  // (`username` and `password`) submitted by the user.  The function must verify
  // that the password is correct and then invoke `cb` with a user object, which
  // will be set at `req.user` in route handlers after authentication.
  passport.use('local-login', new Strategy({
      passReqToCallback : true
    },
    function(req, username, password, done) {
      // check in mongo if a user with username exists or not
      console.log(req.query);
      db.User.findOne({where : { 'username' :  username }}).then(
        function(user) {
          // Username does not exist, log error & redirect back
          if (!user){
            log.log('error','LOGIN '+ username + ' NOT FOUND');
            return done(null, false, {message : "Username not found"});
          }
          // User exists but wrong password, log the error
          if (!user.isValidPassword(password)){
            log.log('error','LOGIN '+username + ' INVALID password');
            return done(null, false, {message : "Invalid password"});
          }
          log.log('info','LOGIN '+username + ' log IN');
          // User and password both match, return user from
          // done method which will be treated like success
          return done(null, user);
        }
      ).catch(function(err){
        // In case of any error, return using the done method
        log.log('error',err);
        return done(err);

      });
  }));

  passport.use('local-signup', new Strategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        console.log(username);
        db.User.findOne({ where : { 'username' :  username }}).then(function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = db.User.build({username : username,password:password});
                // save the user

                newUser.save().then(function() {
                  log.log('info','SIGNUP '+username + ' by ' + req.user.id);
                  return done(null, newUser);
                }).catch(function(err) {
                    return done(err);
                });
            }

        });

        });

    }));

  // Configure Passport authenticated session persistence.
  //
  // In order to restore authentication state across HTTP requests, Passport needs
  // to serialize users into and deserialize users out of the session.  The
  // typical implementation of this is as simple as supplying the user ID when
  // serializing, and querying the user record by ID from the database when
  // deserializing.
  passport.serializeUser(function(user, cb) {
    cb(null, user.id);
  });

  passport.deserializeUser(function(id, cb) {
    db.User.findOne({where : {id : id}}).then(function (user) {
      cb(false,user);
    }).catch(function(err){
      cb(err);
    });
  });
};
