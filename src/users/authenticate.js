const User = require('../models/User');
const bcrypt = require('bcryptjs');
const colors = require('colors');
const shortid = require('shortid');
const config = require('config');
const async = require('async');
const userManager = require('./userManager');

//token config
const tokenAlgorithm = config.get('token.algorithm');
const tokenExpireTime = config.get('token.expiresIn');

//
const fs = require('fs');
const jwt = require('jsonwebtoken');
// use in jwt
var privateKEY = fs.readFileSync('./keys/private.key', 'utf8');

// short id
const char = config.get('shortid.characters');
shortid.characters(char);

module.exports.authentication = (jo, socket) => {
  switch (jo.type) {
    case 'deviceId':
      authenticateDeviceId(jo, socket);
      break;
    case 'email':
      authenticateEmail(jo, socket);
      break;
    default:
      break;
  }
};

function authenticateDeviceId(jo, socket) {
  let errors = [];
  let success = [];
  let warning = [];

  var deviceId = jo.deviceId;
  var location = jo.location;
  var timezone_utc_offset = jo.timezone_utc_offset;

  var event = 'authenticateDeviceId';

  // check required fields
  if (!deviceId) {
    errors.push({
      type: 'error',
      code: 0,
      msg: 'DeviceId cant be empty',
    });
  }

  if (errors.length > 0) {
    // send errors to the client
    errors.forEach((error) => {
      console.log(error);
      emit(event, socket, error);
    });
  } else {
    // validation passed
    User.findOne({
      deviceId: deviceId,
    }).then((user) => {
      if (user) {
        // user exists
        warning.push({
          type: 'warning',
          code: 0,
          msg: 'deviceId is already registered',
        });
        emit(event, socket, warning.pop());

        //change user status to online
        user.status = 1;
        // socket id change every time when user connect to the server. so we update it
        user.socketId = socket.id;
        user.save();
        // create JWT
        jwtSign(user, event, socket);
      } else {
        const newUser = new User({
          deviceId,
          username: 'moon_' + shortid.generate(),
          socketId: socket.id,
          location: location,
          timezone_utc_offset: timezone_utc_offset,
        });

        // create new user
        newUser
          .save()
          .then((user) => {
            // create JWT

            jwtSign(user, event, socket);
          })
          .catch((err) => {
            errors.push({
              type: 'error',
              code: 1,
              msg: err.toString(),
            });
            emit(event, socket, errors.pop());
            console.log(err.toString().red);
          });
      }
    });
  }
}

function authenticateEmail(jo, socket) {
  let errors = [];
  let success = [];
  let warning = [];

  var email = jo.email;
  var password = jo.password;
  var location = jo.location;
  var timezone_utc_offset = jo.timezone_utc_offset;

  var event = 'authenticateEmail';

  // check required fields
  if (!email || !password || password === '') {
    errors.push({
      type: 'error',
      code: 0,
      msg: 'Fields cant be empty',
    });
  }
  // check email validation
  if (!validateEmail(email)) {
    errors.push({
      type: 'error',
      code: 1,
      msg: 'Email address is not valid',
    });
  } else {
    var generateUsername = email.substring(0, email.lastIndexOf('@'));
  }

  // check for pass length
  if (password.length < 6) {
    errors.push({
      type: 'error',
      code: 2,
      msg: 'Password should be at least 6 characters',
    });
  }

  if (errors.length > 0) {
    // send errors to the client
    errors.forEach((error) => {
      console.log(error);
      emit(event, socket, error);
    });
  } else {
    // validation passed
    User.findOne({
      email: email,
    }).then((user) => {
      if (user) {
        if (user.password) {
          // in some case like DeviceID we don't have password field in our db so we should check it
          // if user exists
          warning.push({
            type: 'warning',
            code: 0,
            msg: 'Email is already registered',
          });

          emit(event, socket, warning.pop());

          // match password
          bcrypt.compare(password.toString(), user.password, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
              //change user status to online
              user.status = 1;
              // socket id change every time when user connect to the server. so we update it
              user.socketId = socket.id;
              user.save();
              // create JWT
              jwtSign(user, event, socket);
            } else {
              errors.push({
                type: 'error',
                code: 3,
                msg: 'Password is not correct',
              });
              emit(event, socket, errors.pop());
            }
          });
        }
      } else {
        // if user not exists
        const newUser = new User({
          email,
          username: generateUsername,
          password,
          socketId: socket.id,
          location,
          timezone_utc_offset,
        });

        // encrypted  password
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;

            // set password to encrypted hash
            newUser.password = hash;
            //save user in database
            newUser
              .save()
              .then((user) => {
                // create JWT
                jwtSign(user, event, socket);
              })
              .catch((err) => {
                errors.push({
                  type: 'error',
                  code: 4,
                  msg: err.toString(),
                });
                emit(event, socket, errors.pop());
                console.log(err.toString().red);
              });
          })
        );
      }
    });
  }
}

function jwtSign(user, event, socket) {
  let success = [];
  let friendList = [];

  const userPayload = {
    userId: user._id,
    username: user.username,
  };

  jwt.sign(
    {
      user: userPayload,
    },
    privateKEY,
    {
      algorithm: tokenAlgorithm,
      expiresIn: tokenExpireTime,
    },
    (err, token) => {
      if (!err) {
        // find user friends username,socketId and status which user can assess to his/her friends so we use populate
        User.populate(
          user,
          {
            path: 'friend_list.friend_id',
            select: ['username', 'socketId', 'status'], // we just need this information in friend_list, so we tell to mongodb separate them in this way
          },
          function (err, friend) {
            if (!err) {
              if (friend != null) {
                friend.friend_list.forEach((fids) => {
                  friendList.push({
                    friend_id: fids.friend_id._id,
                    friend_username: fids.friend_id.username,
                    friend_socketId: fids.friend_id.socketId,
                    friend_status: fids.friend_id.status,
                  });
                  //console.log(fids);
                });
              } else {
                friendList = [];
              }

              success.push({
                type: 'success',
                code: 1,
                msg: 'Login successfully',
                userId: user._id,
                username: user.username,
                gameInfo: user.game_info,
                friendList: friendList,
                friendRequest: user.friend_request,
                totalFriendRequest: user.total_friend_request,
                token: token,
              });

              emit(event, socket, success.pop());

              userManager.setOnline(user, socket);
            }
          }
        );
      }
    }
  );
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
