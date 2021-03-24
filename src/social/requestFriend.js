const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');
require('colors');
const async = require('async');

function requestFriend(jo, socket) {
  let success = [];
  let errors = [];
  let warning = [];

  var event = 'requestFriend';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      if (
        mongoose.Types.ObjectId.isValid(userData.userId) &&
        mongoose.Types.ObjectId.isValid(jo.receiverUserId)
      ) {
        async.parallel(
          [
            function (callback) {
              User.updateOne(
                {
                  _id: jo.receiverUserId,
                  'friend_request.user_id': {
                    $ne: userData.userId,
                  },
                  'friend_list.friend_id': {
                    $ne: userData.userId,
                  },
                  'sent_friend_request.user_id': {
                    // check if not sent request to that user before
                    $ne: userData.userId,
                  },
                },
                {
                  $push: {
                    friend_request: {
                      user_id: userData.userId,
                      username: userData.username,
                    },
                  },
                  $inc: {
                    total_friend_request: 1,
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
                  _id: userData.userId,
                  'sent_friend_request.user_id': {
                    $ne: jo.receiverUserId,
                  },
                  'friend_list.friend_id': {
                    $ne: jo.receiverUserId,
                  },
                  'friend_request.user_id': {
                    // check if not sent request to that user before
                    $ne: jo.receiverUserId,
                  },
                },
                {
                  $push: {
                    sent_friend_request: {
                      user_id: jo.receiverUserId,
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
                    msg: 'Friend request sent',
                    code: 0,
                  });
                  emit(event, socket, success.pop());
                } else {
                  warning.push({
                    type: 'warning',
                    msg:
                      'It looks like you sent a request to this user or this user sent you a request',
                    code: 0,
                  });
                  emit(event, socket, warning.pop());
                }
              }
            } else {
              errors.push({
                type: 'error',
                msg: 'Friend request failed',
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
          data: {},
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

exports.requestFriend = requestFriend;
