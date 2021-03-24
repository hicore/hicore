const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');

function updateUserProfile(jo, socket) {
  let success = [];
  let errors = [];
  var event = 'updateUserProfile';
  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;
      if (mongoose.Types.ObjectId.isValid(userData.userId)) {
        User.findById(userData.userId)
          .then((user) => {
            if (user) {
              if (jo.timezone_utc_offset) user.timezone_utc_offset = jo.timezone_utc_offset;
              if (jo.display_name) user.display_name = jo.display_name;
              if (jo.avatar_url) user.avatar_url = jo.avatar_url;
              if (jo.lang) user.lang = jo.lang;
              if (jo.location) user.location = jo.location;
              user
                .save()
                .then((newUserUpdate) => {
                  success.push({
                    type: 'success',
                    msg: 'Successfully updated',
                    code: 0,
                  });
                  emit(event, socket, success.pop());
                })
                .catch((err) => {
                  errors.push({
                    type: 'error',
                    msg: err.toString(),
                    code: 0,
                  });
                  emit(event, socket, errors.pop());
                });
            } else {
              //If User not exist
              errors.push({
                type: 'error',
                msg: 'User not exist with this user Id',
                code: 1,
              });
              emit(event, socket, errors.pop());
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
        // TODO: can show in admin dashboard
        console.log('Please provide correct Id');
      }
    } else {
      console.log('false ', data);
      errors.push({
        type: 'error',
        msg: jwt.message,
        code: 3,
      });
      emit(event, socket, errors.pop());
    }
  });
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.updateUserProfile = updateUserProfile;
