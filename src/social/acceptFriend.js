const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');
require('colors');
const async = require('async');

function acceptFriend(jo, socket) {
  let success = [];
  let errors = [];

  var event = 'acceptFriend';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;
      if (
        mongoose.Types.ObjectId.isValid(userData.userId) &&
        mongoose.Types.ObjectId.isValid(jo.applicantUserId)
      ) {
        async.parallel(
          [
            function (callback) {
              User.findOneAndUpdate(
                {
                  _id: userData.userId,
                  'friend_list.friend_id': {
                    $ne: jo.applicantUserId,
                  },
                },
                {
                  $push: {
                    friend_list: {
                      friend_id: jo.applicantUserId,
                      friend_username: jo.applicantUsername,
                    },
                  },
                  $pull: {
                    friend_request: {
                      user_id: jo.applicantUserId,
                      username: jo.applicantUsername,
                    },
                  },
                  $inc: {
                    total_friend_request: -1,
                  },
                },
                {
                  new: true,
                  useFindAndModify: false,
                },
                (err, result) => {
                  callback(err, result);
                }
              );
            },
            function (callback) {
              User.updateOne(
                {
                  _id: jo.applicantUserId,
                  'friend_list.friend_id': {
                    $ne: userData.userId,
                  },
                },
                {
                  $push: {
                    friend_list: {
                      friend_id: userData.userId,
                      friend_username: userData.username,
                    },
                  },
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
            function (callback) {
              User.updateOne(
                {
                  _id: userData.userId,
                  'friend_request.user_id': {
                    $eq: jo.applicantUserId,
                  },
                },
                {
                  $pull: {
                    friend_request: {
                      user_id: jo.applicantUserId,
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
                  _id: jo.applicantUserId,
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
              // send new friend list data after accept

              let userFriendList = [];
              User.populate(
                results[0],
                {
                  path: 'friend_list.friend_id',
                  select: ['username', 'socketId', 'status'],
                },
                function (err, friend) {
                  if (!err) {
                    if (friend != null) {
                      friend.friend_list.forEach((fids) => {
                        userFriendList.push({
                          friend_id: fids.friend_id._id,
                          friend_username: fids.friend_id.username,
                          friend_socketId: fids.friend_id.socketId,
                          friend_status: fids.friend_id.status,
                        });
                      });
                    } else {
                      userFriendList = [];
                    }

                    success.push({
                      type: 'success',
                      msg: 'Friend request accepted',
                      data: userFriendList,
                      code: 0,
                    });
                    emit(event, socket, success.pop());
                  }
                }
              );
            } else {
              errors.push({
                type: 'error',
                msg: 'Accept friend request failed',
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

exports.acceptFriend = acceptFriend;
