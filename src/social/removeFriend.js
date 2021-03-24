const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');
require('colors');
const async = require('async');

function removeFriend(jo, socket) {
  let success = [];
  let errors = [];
  let warning = [];

  var event = 'removeFriend';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      if (
        mongoose.Types.ObjectId.isValid(userData.userId) &&
        mongoose.Types.ObjectId.isValid(jo.friendId)
      ) {
        async.parallel(
          [
            function (callback) {
              User.findOneAndUpdate(
                {
                  _id: userData.userId,
                  'friend_list.friend_id': {
                    $eq: jo.friendId,
                  },
                },
                {
                  $pull: {
                    friend_list: {
                      friend_id: jo.friendId,
                    },
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
                  _id: jo.friendId,
                  'friend_list.friend_id': {
                    $eq: userData.userId,
                  },
                },
                {
                  $pull: {
                    friend_list: {
                      friend_id: userData.userId,
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
                if (results[1].nModified == 1) {
                  // send new friend list data after remove
                  let userFriendList = [];
                  User.populate(
                    results[0],
                    {
                      path: 'friend_list.friend_id',
                      select: ['username', 'online'],
                    },
                    function (err, friend) {
                      if (!err) {
                        friend.friend_list.forEach((fids) => {
                          userFriendList.push({
                            friend_id: fids.friend_id._id,
                            friend_username: fids.friend_id.username,
                            online: fids.friend_id.online,
                          });
                        });
                        success.push({
                          type: 'success',
                          msg: 'Remove user successfully',
                          data: userFriendList,
                          code: 0,
                        });
                        emit(event, socket, success.pop());
                      }
                    }
                  );
                } else {
                  warning.push({
                    type: 'warning',
                    msg: 'It looks like you are not friend with this user',
                    code: 0,
                  });
                  emit(event, socket, warning.pop());
                }
              }
            } else {
              errors.push({
                type: 'error',
                msg: 'Remove failed',
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

exports.removeFriend = removeFriend;
