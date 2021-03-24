const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');

function updateUserEmail(jo, socket) {
  let success = [];
  let errors = [];
  var event = 'updateUserEmail';

  // check email validation
  if (!validateEmail(jo.email)) {
    errors.push({
      type: 'error',
      code: 0,
      msg: 'Email address is not valid',
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
                User.findOne({
                  email: jo.email,
                })
                  .then((email) => {
                    if (email) {
                      //console.log("user exist with this email please try another one!".yellow);
                      errors.push({
                        type: 'error',
                        msg: 'User exist with this email please try another one!',
                        code: 1,
                      });
                      emit(event, socket, errors.pop());
                    } else {
                      //console.log("you can change your email".yellow);
                      user.email = jo.email;
                      user
                        .save()
                        .then((newUserUpdate) => {
                          success.push({
                            type: 'success',
                            msg: 'Email successfully updated',
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
                    }
                  })
                  .catch((err) => {
                    errors.push({
                      type: 'error',
                      msg: err.toString(),
                      code: 3,
                    });
                    emit(event, socket, errors.pop());
                  });
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

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

exports.updateUserEmail = updateUserEmail;
