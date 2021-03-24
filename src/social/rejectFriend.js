const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');
require('colors');
const async = require('async');

function rejectFriend(jo, socket) {
  let success = [];
  let errors = [];
  let warning = [];

  var event = 'rejectFriend';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      if (
        mongoose.Types.ObjectId.isValid(userData.userId) &&
        mongoose.Types.ObjectId.isValid(jo.rejectId)
      ) {
        async.parallel(
          [
            function (callback) {
              User.updateOne(
                {
                  _id: userData.userId,
                  'friend_request.user_id': {
                    $eq: jo.rejectId,
                  },
                },
                {
                  $pull: {
                    friend_request: {
                      user_id: jo.rejectId,
                    },
                  },
                  $inc: {
                    total_friend_request: -1,
                  },
                },
                (err, result) => {
                  callback(err, result);
                }
              );
            },
            function (callback) {
              User.updateOne(
                {
                  _id: jo.rejectId,
                  'sent_friend_request.user_id': {
                    $eq: userData.userId,
                  },
                },
                {
                  $pull: {
                    sent_friend_request: {
                      user_id: userData.userId,
                    },
                  },
                },
                (err, result) => {
                  callback(err, result);
                }
              );
            },
          ],
          (err, results) => {
            if (!err) {
              if (results.length > 0) {
                if (results[0].nModified + results[1].nModified == 2) {
                  success.push({
                    type: 'success',
                    msg: 'Reject user successfully',
                    code: 0,
                  });
                  emit(event, socket, success.pop());
                } else {
                  warning.push({
                    type: 'warning',
                    msg: 'It looks like you are not have any request from this user',
                    code: 0,
                  });
                  emit(event, socket, warning.pop());
                }
              }
            } else {
              errors.push({
                type: 'error',
                msg: 'Reject failed',
                code: 0,
              });
              emit(event, socket, errors.pop());
            }
          }
        );
      } else {
        errors.push({
          type: 'error',
          msg: 'Please provide correct Id',
          code: 1,
        });
        emit(event, socket, errors.pop());
      }
    } else {
      console.log('false ', data);

      errors.push({
        type: 'error',
        msg: jwt.message,
        code: 2,
      });
      emit(event, socket, errors.pop());
    }
  });
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.rejectFriend = rejectFriend;
