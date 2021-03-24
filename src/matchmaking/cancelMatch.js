const verifyToken = require('../token/verifyToken');
const userManager = require('../users/userManager');

const CANCEL = 5;

const ONLINE = 1,
  IN_PLAYMATE_MATCH = 4;

function cancelMatch(jo, io, socket) {
  let success = [];
  let errors = [];

  var event = 'cancelMatch';
  var playmateResultEvent = 'playmateResult'; // 0 = invite, 1 = accept, 2 = deny, leave = 3, queue = 4, cancel = 5, destroy = 6

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      if (jo.playmateId != null) {
        var inPlaymateMatch = userManager.getInPlaymateMatchUsers(jo.playmateId);

        inPlaymateMatch.forEach((inPlaymate) => {
          // change user and other playmates status
          userManager.changeStatus(IN_PLAYMATE_MATCH, inPlaymate.userId); //   inPlaymateMatch
          inPlaymate.playmateId = '';
          inPlaymate.roomCapacity = 0;
          inPlaymate.requestType = '';
          inPlaymate.requestTime = 0;
          inPlaymate.queueId = '';
          inPlaymate.range = 0;
        });

        success.push({
          msg: 'Searching for playmate match canceled successfully',
          type: 'cancel',
          code: CANCEL, // 0 = invite, 1 = accept, 2 = deny, leave = 3, queue = 4, cancel = 5, destroy = 6
        });
        io.to(jo.playmateId).emit(playmateResultEvent, success.pop());
      } else {
        var user = userManager.getUserData(userData.userId);
        //         C:\Users\Farzad\Documents\Projects\JavaScript\hicore\src\matchmaker.js:544
        //         user.queueId = ''; // TODO:  error: Cannot set property 'queueId' of null
        //                      ^

        // TypeError: Cannot set property 'queueId' of undefined
        //     at C:\Users\Farzad\Documents\Projects\JavaScript\hicore\src\matchmaker.js:544:22
        //     at C:\Users\Farzad\Documents\Projects\JavaScript\hicore\src\verifyToken.js:15:7
        //     at C:\Users\Farzad\Documents\Projects\JavaScript\hicore\node_modules\jsonwebtoken\verify.js:223:12
        //     at getSecret (C:\Users\Farzad\Documents\Projects\JavaScript\hicore\node_modules\jsonwebtoken\verify.js:90:14)
        //     at Object.module.exports [as verify] (C:\Users\Farzad\Documents\Projects\JavaScript\hicore\node_modules\jsonwebtoken\verify.js:94:10)
        //     at Object.checkToken (C:\Users\Farzad\Documents\Projects\JavaScript\hicore\src\verifyToken.js:7:7)
        //     at cancelMatch (C:\Users\Farzad\Documents\Projects\JavaScript\hicore\src\matchmaker.js:514:15)
        //     at Object.module.exports.matchmaker (C:\Users\Farzad\Documents\Projects\JavaScript\hicore\src\matchmaker.js:37:7)
        //     at Socket.<anonymous> (C:\Users\Farzad\Documents\Projects\JavaScript\hicore\src\server.js:101:16)
        //     at Socket.emit (events.js:314:20)
        //     at C:\Users\Farzad\Documents\Projects\JavaScript\hicore\node_modules\socket.io\lib\socket.js:528:12
        //     at processTicksAndRejections (internal/process/task_queues.js:75:11)
        user.queueId = ''; // TODO:  error: Cannot set property 'queueId' of null
        user.roomCapacity = 0;
        user.requestType = '';
        user.requestTime = 0;
        user.range = 0;

        userManager.changeStatus(ONLINE, userData.userId); // change status to online

        success.push({
          type: 'success',
          msg: 'Searching for match canceled successfully',
          code: 1,
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

exports.cancelMatch = cancelMatch;
