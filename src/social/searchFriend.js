const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');

function searchFriend(jo, socket) {
  let success = [];
  let errors = [];
  let jsonData = [];

  var event = 'searchFriend';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      if (mongoose.Types.ObjectId.isValid(userData.userId)) {
        User.findOne(
          {
            _id: {
              $ne: userData.userId,
            },
            username: jo.searchUsername,
          },
          (err, result) => {
            if (err) throw err;

            if (result) {
              jsonData.push({
                user_id: result._id,
                username: result.username,
              });
              success.push({
                type: 'success',
                msg: 'User found',
                data: jsonData.pop(),
                code: 0,
              });
              emit(event, socket, success.pop());
            } else {
              errors.push({
                type: 'error',
                msg: 'User not found',
                data: {},
                code: 0,
              });
              emit(event, socket, errors.pop());
            }
          }
        ).catch((err) => {
          errors.push({
            type: 'error',
            msg: err,
            data: {},
            code: 1,
          });
          emit(event, socket, errors.pop());
        });
      } else {
        errors.push({
          type: 'error',
          msg: 'Please provide correct Id', //TODO change message to "user id is not valid"
          data: {},
          code: 2,
        });
        emit(event, socket, errors.pop());
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

exports.searchFriend = searchFriend;
