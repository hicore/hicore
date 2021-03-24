const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');

function updateUserPassword(jo, socket) {
  let success = [];
  let errors = [];
  var event = 'updateUserPassword';
  // check required fields
  if (!jo.newPassword || !jo.oldPassword) {
    errors.push({
      type: 'error',
      code: 0,
      msg: 'Fields cant be empty',
    });
  }
  // check for pass length
  if (jo.newPassword.length < 6) {
    errors.push({
      type: 'error',
      code: 1,
      msg: 'Password should be at least 6 characters',
    });
  }
  if (errors.length > 0) {
    // send errors to the client
    errors.forEach((error) => {
      emit(event, socket, error);
    });
  } else {
    verifyToken.checkToken(jo.token, (result, data) => {
      var jwt = JSON.parse(data);

      if (result) {
        var userData = jwt.user;
        if (mongoose.Types.ObjectId.isValid(userData.userId)) {
          User.findById(userData.userId)
            .then((user) => {
              if (user) {
                if (user.password) {
                  // in some case like DeviceID we don't have password field so we should check it
                  // match password
                  bcrypt.compare(jo.oldPassword.toString(), user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                      // encrypted  password and save it
                      bcrypt.genSalt(10, (err, salt) =>
                        bcrypt.hash(jo.newPassword, salt, (err, hash) => {
                          if (err) throw err;
                          // set password to encrypted hash
                          user.password = hash;
                          //save user in database
                          user
                            .save()
                            .then((password) => {
                              success.push({
                                type: 'success',
                                msg: 'Password successfully updated',
                                code: 0,
                              });
                              emit(event, socket, success.pop());
                            })
                            .catch((err) => {
                              errors.push({
                                type: 'error',
                                msg: err.toString(),
                                code: 2,
                              });
                              emit(event, socket, errors.pop());
                            });
                        })
                      );
                    } else {
                      errors.push({
                        type: 'error',
                        msg: 'Password is not correct',
                        code: 3,
                      });
                      emit(event, socket, errors.pop());
                    }
                  });
                }
              } else {
                //If User not exist at all
                errors.push({
                  type: 'error',
                  msg: 'User not exist with this user Id',
                  code: 4,
                });
                emit(event, socket, errors.pop());
              }
            })
            .catch((err) => {
              errors.push({
                type: 'error',
                msg: err.toString(),
                code: 5,
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
          code: 6,
        });
        emit(event, socket, errors.pop());
      }
    });
  }
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.updateUserPassword = updateUserPassword;
