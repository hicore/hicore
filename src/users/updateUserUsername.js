const User = require('../models/User');
const mongoose = require('mongoose');
const config = require('config');
const verifyToken = require('../token/verifyToken');
const tokenAlgorithm = config.get('token.algorithm');
const tokenExpireTime = config.get('token.expiresIn');
const fs = require('fs');
const jwt = require('jsonwebtoken');
// use in jwt
var privateKEY = fs.readFileSync('./keys/private.key', 'utf8');

function updateUserUsername(jo, socket) {
  let success = [];
  let errors = [];

  var event = 'updateUserUsername';
  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;
      if (mongoose.Types.ObjectId.isValid(userData.userId)) {
        User.findById(userData.userId)
          .then((user) => {
            if (user) {
              // to check if is exist or not with that username
              User.findOne({
                username: jo.username,
              })
                .then((username) => {
                  if (username) {
                    //console.log("user exist with this username please try another one!".yellow);
                    errors.push({
                      type: 'error',
                      msg: 'User exist with this username please try another one!',
                      code: 0,
                    });
                    emit(event, socket, errors.pop());
                  } else {
                    //console.log("you can change your username".yellow);
                    user.username = jo.username;
                    user
                      .save()
                      .then((newUserUpdate) => {
                        success.push({
                          type: 'success',
                          msg: 'Username successfully updated',
                          data: {
                            token: jwtSign(newUserUpdate),
                          },
                          code: 0,
                        });
                        emit(event, socket, success.pop());
                      })
                      .catch((err) => {
                        errors.push({
                          type: 'error',
                          msg: err.toString(),
                          code: 1,
                        });
                        emit(event, socket, errors.pop());
                      });
                  }
                })
                .catch((err) => {
                  errors.push({
                    type: 'error',
                    msg: err.toString(),
                    code: 2,
                  });
                  emit(event, socket, errors.pop());
                });
            } else {
              //If User not exist
              errors.push({
                type: 'error',
                msg: 'User not exist with this user Id',
                code: 3,
              });
              emit(event, socket, errors.pop());
            }
          })
          .catch((err) => {
            errors.push({
              type: 'error',
              msg: err.toString(),
              code: 4,
            });
            emit(event, socket, errors.pop());
          });
      } else {
        // TODO: can show in admin dashboard
        console.log('Please provide correct Id');
      }
    } else {
      console.log('false ', data);
      errors.push({
        type: 'error',
        msg: jwt.message,
        code: 5,
      });
      emit(event, socket, errors.pop());
    }
  });
}

function jwtSign(user) {
  var token;
  const userPayload = {
    userId: user._id,
    username: user.username,
  };
  token = jwt.sign(
    {
      user: userPayload,
    },
    privateKEY,
    {
      algorithm: tokenAlgorithm,
      expiresIn: tokenExpireTime,
    }
  );

  return token;
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.updateUserUsername = updateUserUsername;
