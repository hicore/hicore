const verifyToken = require('../token/verifyToken');
const userManager = require('../users/userManager');

const LEAVE = 3;

const ONLINE = 1;

function leavePlaymate(jo, socket) {
  let message = [];
  let success = [];
  let errors = [];

  var event = 'leavePlaymate';
  var playmateResultEvent = 'playmateResult';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      var user = userManager.getUserData(userData.userId);

      var playmateUser = userManager.getUserData(jo.friendUserId);

      if (playmateUser != null) {
        if (playmateUser.playmateId === jo.playmateId) {
          // send message to friend
          message.push({
            userId: userData.userId,
            username: userData.username,
            type: 'leave',
            code: LEAVE, // 0 = invite, 1 = accept, 2 = deny, leave = 3, queue = 4, cancel = 5, destroy = 6
          });

          socket.to(jo.playmateId).emit(playmateResultEvent, message.pop());

          socket.leave(jo.playmateId);
          userManager.changeStatus(ONLINE, userData.userId); //   online
          user.playmateId = '';
          user.roomCapacity = 0;
          user.requestType = '';
          user.range = 0;

          // send message to user itself
          success.push({
            type: 'success',
            msg: 'User left playmate match successfully',
            code: 0,
          });

          emit(event, socket, success.pop());
        } else {
          success.push({
            type: 'success',
            msg: 'Playmate game not available anymore',
            code: 1,
          });
          emit(event, socket, success.pop());
        }
      } else {
        // send message to user itself
        success.push({
          type: 'success',
          msg: 'User is offline',
          data: {
            status: 0,
          },
          code: 2,
        });

        emit(event, socket, success.pop());
      }
    } else {
      errors.push({
        type: 'error',
        msg: jwt.message,
        code: 0,
      });
      emit(event, socket, errors.pop());
    }
  });
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.leavePlaymate = leavePlaymate;
