const verifyToken = require('../token/verifyToken');
const userManager = require('../users/userManager');

const ACCEPT = 1;

const IN_PLAYMATE_MATCH = 4;

function acceptPlaymate(jo, socket) {
  let message = [];
  let success = [];
  let errors = [];

  var event = 'acceptPlaymate';
  var playmateResultEvent = 'playmateResult';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      var playmateUser = userManager.getUserData(jo.friendUserId); // sender user id

      var user = userManager.getUserData(userData.userId);

      if (user == null) {
        return;
      }

      if (playmateUser != null) {
        if (playmateUser.playmateId === jo.playmateId) {
          // send message to friend
          message.push({
            userId: userData.userId,
            username: userData.username,
            type: 'accept',
            code: ACCEPT, // 0 = invite, 1 = accept, 2 = deny, leave = 3, queue = 4, cancel = 5, destroy = 6
          });

          socket.broadcast.to(playmateUser.socketId).emit(playmateResultEvent, message.pop());

          // then join to playmate room
          socket.join(jo.playmateId);
          user.playmateId = jo.playmateId;
          userManager.changeStatus(IN_PLAYMATE_MATCH, userData.userId); //   inPlaymateMatch

          // send message to user itself
          success.push({
            type: 'success',
            msg: 'User join to playmate match successfully',
            data: {
              playmateId: playmateUser.playmateId,
            },
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

exports.acceptPlaymate = acceptPlaymate;
