'use strict'
const express = require('express');
const router = express.Router();


const configDB = require('../config/database');
const configUsers = require('../config/users');

// Login/Register Setup
const passport = require('passport');
const jwt = require('jsonwebtoken');

/************************************/
/***** LOGIN, REGISTER & UPDATE *****/
/************************************/

// Root /users
router.get('/', (req, res, next) => {
  configUsers.getUserById();
  res.send('Nothing to see here');
});

// /users/register GET
router.get('/profile', passport.authenticate('jwt', { session:false }), (req, res, next) => {
  res.json({
    name: req.user.name,
    username: req.user.username,
    email: req.user.email,
    addresses: req.user.addresses
  });
});

// /users/getAuthToken, This gets the ebay Auth and Refresh tokens. 
// This may not be needed anymore. We no longer want to send sensitive information to the client
router.get('/getAuth', passport.authenticate('jwt', { session:false }), (req, res, next) => {
  res.json({authTk: req.user.ebayauthtoken, refTk: req.user.ebayreftoken});
  
});

// /users/register POST
router.post('/register', (req, res, next) => {
  let regUser = {
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    ebayauthtoken: '',
    ebayreftoken: '',
    addresses: [],
  }

  configUsers.addUser(regUser, (err, user) => {
    err ? res.json({success: false, msg:'Failed to register user'}) : res.json({success: true, msg:'User registered'});
  });

});

// /users/authenticate POST
router.post('/authenticate', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  configUsers.getUserByUsername(username, (err, user) => {
    if(err) throw err;

    if(!user) {
      return res.json({success: false, msg: 'User was not found.'});
    }

    configUsers.comparePassword(password, user.password, (err, isMatch) => {
      if(err) throw err;

      if(isMatch) {
        const token = jwt.sign({ data: user }, configDB.getDbConnectionString().secret, {
          expiresIn: 604800 // 1 week
        });

        res.json({
          success: true,
          token: 'Bearer ' +token,
          user: {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email
          }
        })
      } else {
        return res.json({success: false, msg: 'Wrong password.'});
      }
    });
  });
});

// /users/update
router.post('/update', passport.authenticate('jwt', { session:false }), (req, res, next) => {
  const updateUser = {
    name: req.body.updateUser.name,
    username: req.body.updateUser.username,
    email: req.body.updateUser.email
  }
  const user = req.user;
  // console.log(updateUser);
  
  configUsers.updateUser(user, updateUser, (err, user) => {
    err ? res.json({success: false, msg:'Failed to update user: ' + err}) : res.json({success: true, msg:'User has been updated'});

  });

});

router.post('/addUpdateAddress', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  const address = req.body.addresses;
  const userId = req.user._id;

  // console.log(address);

  configUsers.addUpdateAddress(address, userId, (err, result) => {
    err ? res.json({error: `You have an error: ${err}`}) : res.json({success: `Success: ${result}`});
  });

});

router.post('/deleteAddress', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  const addressId = req.body.addressId;
  const userId = req.user._id;

  // console.log(addressId);
  // console.log(userId);

  configUsers.deleteAddress(addressId, userId, (err, deleted) => {
    err ? res.json({error: `You have an error: ${err}`}) : res.json({success: `Address has been deleted: ${JSON.stringify(deleted)}`});
  });

});

// /users/updatepw PASSWORD
router.post('/updatepw', passport.authenticate('jwt', { session:false }), (req, res, next) => {

  const user = req.user;
  const password = req.body.passwords.password;
  const updateUser = {
    password: req.body.passwords.newPassword
  }

  configUsers.getUserByUsername(user.username, (err, user) => {
    if(err) throw err;

    if(!user) {
      return res.json({success: false, msg: 'User was not found.'});
    }

    configUsers.comparePassword(password, user.password, (err, isMatch) => {
      if(err) throw err;

      if(isMatch) {
        configUsers.updatePassword(user, updateUser, (err, updated) => {
          err ? res.json({success: false, msg: 'Your password was not able to update.'}) : res.json({success: true, msg: 'Your password has been updated.'});

        });

      } else {
        return res.json({success: false, msg: 'Wrong password.'});
      }
    });
  });
  
});

router.delete('/deleteUser', passport.authenticate('jwt', { session:false }), (req, res, next) => {

  // We pass in the entire user object
  const userId = req.user._id;

  configUsers.deleteUser(userId, (err, deleted) => {
    err ? res.json({success: false, msg:'Failed to delete user: ' + err}) : res.json({success: true, msg:'User has been deleted'});
  });

});

/****************************/
/***** SETUP SEED DATA *****/
/****************************/

// Configure a seed data setup route

module.exports = router;
