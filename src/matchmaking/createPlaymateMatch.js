const verifyToken = require('../token/verifyToken');
const uniqId = require('uniqid');
const userManager = require('../users/userManager');

var playmateId;

const IN_PLAYMATE_MATCH = 4;

function createPlaymateMatch(jo, socket) {
  let success = [];
  let errors = [];

  var event = 'createPlaymateMatch';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      playmateId = uniqId('pid-'); //

      var user = userManager.getUserData(userData.userId);

      socket.join(playmateId);
      user.playmateId = playmateId;

      userManager.changeStatus(IN_PLAYMATE_MATCH, userData.userId); //   inPlaymateMatch

      success.push({
        type: 'success',
        msg: 'Your playmate match create successfully',
        data: {
          playmateId: playmateId,
        },
        code: 0,
      });

      emit(event, socket, success.pop());
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

exports.createPlaymateMatch = createPlaymateMatch;
