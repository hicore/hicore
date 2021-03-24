const verifyToken = require('../token/verifyToken');

const userManager = require('../users/userManager');

const DESTROY = 6;

const ONLINE = 1;

function destroyPlaymateMatch(jo, io, socket) {
  let message = [];
  let success = [];
  let errors = [];

  var event = 'destroyPlaymateMatch';
  var playmateResultEvent = 'playmateResult'; // 0 = invite, 1 = accept, 2 = deny, leave = 3, queue = 4, cancel = 5, destroy = 6

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      var user = userManager.getUserData(userData.userId);

      var inPlaymateMatch = userManager.getInPlaymateMatchUsers(jo.playmateId);

      inPlaymateMatch.forEach((inPlaymate) => {
        // change user and other playmates status
        userManager.changeStatus(ONLINE, inPlaymate.userId); //   online
        inPlaymate.playmateId = '';
        inPlaymate.roomCapacity = 0;
        inPlaymate.requestType = '';
        inPlaymate.requestTime = 0;
        inPlaymate.queueId = '';
        inPlaymate.range = 0;
      });

      success.push({
        type: 'success',
        msg: 'Your playmate match destroyed successfully',
        code: 0,
      });

      emit(event, socket, success.pop());
      // broadcast to other users in this room
      message.push({
        msg: 'Your playmate match room destroyed',
        type: 'destroy',
        code: DESTROY, // 0 = invite, 1 = accept, 2 = deny, leave = 3, queue = 4, cancel = 5, destroy = 6
      });
      socket.to(jo.playmateId).emit(playmateResultEvent, message.pop());
      //leave all playmates from this room
      io.of('/')
        .in(user.playmateId)
        .clients((error, socketIds) => {
          if (error) throw error;
          socketIds.forEach((socketId) => io.sockets.sockets[socketId].leave(jo.playmateId));
        });
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

exports.destroyPlaymateMatch = destroyPlaymateMatch;
