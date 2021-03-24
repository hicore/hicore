const childServer = require('./childServer');
const verifyToken = require('./token/verifyToken');
const moment = require('moment');
const userManager = require('./users/userManager');
const MatchRule = require('../src/models/MatchRule');

var matches = [];

const ONLINE = 1,
  IN_GAME = 3;

const LEAVE = 0,
  JOIN = 1;

module.exports.matchController = (jo, socket) => {
  switch (jo.type) {
    case 'isMatchInProgress':
      isMatchInProgress(jo, socket);
      break;
    case 'joinToMatch':
      joinToMatch(jo, socket);
      break;
    case 'leaveMatch':
      leaveMatch(jo, socket);
      break;
  }
};

module.exports.childServerResult = (data) => {
  switch (data.FromClass) {
    case 'match.Join':
      CSMatchJoinResult(data);
      break;
    case 'match.GetMatchData':
      CSMatchGetMatchDataResult(data);
      break;
    case 'match.Leave':
      CSMatchLeaveResult(data);
      break;
    case 'match.LeaveAll':
      CSMatchLeaveAllResult(data);
      break;
    case 'matchState.':
      finalResult(data);
      break;
  }
};

module.exports.createMatch = (matchId, usersInThisRoom) => {
  var matchmakingResultEvent = 'matchmakingResult';

  // TODO: get match rules form db and send them to users

  io.to(matchId).emit(matchmakingResultEvent, usersInThisRoom);

  //send data to match server(golang server) to create match
  var finalRoomData = {
    matchId: matchId,
    matchMode: usersInThisRoom[0].matchMode,
    data: usersInThisRoom,
  };
  childServer.csMatchmaker(finalRoomData);

  // save match room
  matches.push(finalRoomData);
};

module.exports.getMatchRollsFromDB = async () => {
  try {
    const rules = await MatchRule.find({});

    if (rules) {
      return rules;
    }
  } catch (error) {
    console.error('get match rules from db', error);
  }
};

function finalResult(data) {
  var matchFinalResult = eval('(' + data.Data + ')');

  var matchId = matchFinalResult[0].matchId;

  //TODO Store game information in a database such as points and playmates. The number of kills, etc.

  //broadcast to all players which is match is finished
  endBroadcast(matchId, matchFinalResult);

  // leave from matches and child server
  leaveAll(matchId);
}

function isMatchInProgress(jo, socket) {
  let message = [];
  let success = [];
  let errors = [];

  var event = 'isMatchInProgress';

  console.log(jo);

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);
    if (result) {
      var userData = jwt.user;

      var matchIndex = matches.findIndex((v) => v.matchId === jo.matchId);

      if (matchIndex !== -1) {
        message.push({
          type: 'message',
          msg: 'Match in progress',
          data: {
            inProgress: true,
            match: matches[matchIndex],
          },
          code: 1,
        });

        emit(event, socket, message.pop());

        let time = moment.utc().valueOf();
      } else {
        message.push({
          type: 'message',
          msg: 'Match has finished or not exist anymore',
          data: {
            inProgress: false,
          },
          code: 0,
        });

        emit(event, socket, message.pop());
      }
    }
  });
}

function joinToMatch(jo, socket) {
  // send data to child server to join that user to the match by matchId and userId

  let message = [];
  let success = [];
  let errors = [];

  var event = 'joinToMatch';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      changeUserMatchStatus(jo.matchId, userData.userId, JOIN);

      childServer.csJoinToMatch({
        matchId: jo.matchId,
        userId: userData.userId,
        socketId: socket.id, // to send data back to this id after retrieve match data
      });

      message.push({
        msg: 'Request sent to Child Server',
        type: 'joinToMatch',
        code: JOIN, // 0 = leave, 1 = join
      });

      socket.join(jo.matchId);

      emit(event, socket, message.pop());

      // TODO:  callback 1- check if child server is up or not?
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

function CSMatchJoinResult(data) {
  let message = [];

  var event = 'joinToMatch';

  var socket = io.sockets.connected[data.ToSocketId];

  if (socket != undefined) {
    message.push({
      type: data.Type,
      msg: data.Message,
      code: data.Code,
    });

    socket.emit(event, message.pop());
  } else {
    console.log('Socket not connected');
  }
}

function CSMatchGetMatchDataResult(data) {
  console.log(data);
  let message = [];

  var event = 'joinToMatch';

  var socket = io.sockets.connected[data.ToSocketId];

  if (socket != undefined) {
    message.push({
      type: data.Type,
      msg: data.Message,
      code: data.Code,
      data: data.Data ? JSON.parse(data.Data) : '',
    });

    socket.emit(event, message.pop());
  } else {
    console.log('Socket not connected');
  }
}

function leaveMatch(jo, socket) {
  // send data to child server to leave that user from the match by matchId and userId

  let message = [];
  let success = [];
  let errors = [];

  var event = 'leaveMatch';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      userManager.changeStatus(ONLINE, userData.userId);
      changeUserMatchStatus(jo.matchId, userData.userId, LEAVE);

      childServer.csLeaveMatch({
        matchId: jo.matchId,
        userId: userData.userId,
        socketId: socket.id, // to send data back to this id after retrieve match data
      });

      message.push({
        msg: 'Request sent to Child Server',
        type: 'leaveMatch',
        code: LEAVE, // 0 = leave, 1 = join
      });

      socket.leave(jo.matchId);

      emit(event, socket, message.pop());

      // TODO:  callback 1- check if child server is up or not?
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

function CSMatchLeaveResult(data) {
  let message = [];

  var event = 'leaveMatch';

  var socket = io.sockets.connected[data.ToSocketId];

  if (socket != undefined) {
    message.push({
      type: data.Type,
      msg: data.Message,
      code: data.Code,
    });

    socket.emit(event, message.pop());
  } else {
    console.log('Socket not connected');
  }
}

function leaveAll(matchId) {
  var matchIndex = matches.findIndex((v) => v.matchId === matchId);

  if (matchIndex !== -1) {
    childServer.csLeaveAll({
      matchId: matchId,
    });

    var matchData = matches[matchIndex].data;
    matchData.forEach((user) => userManager.changeStatus(ONLINE, user.userId));

    // remove match from array
    matches.splice(matchIndex, 1);
  }
}

function endBroadcast(matchId, finalInfo) {
  let message = [];

  var endMessage = 'endOfMatch';

  var matchIndex = matches.findIndex((v) => v.matchId === matchId);

  if (matchIndex !== -1) {
    message.push({
      msg: 'Match finished',
      data: finalInfo,
    });
    console.log(finalInfo);
    io.to(matchId).emit(endMessage, message.pop());
  }
}

function changeUserMatchStatus(matchId, userId, status) {
  var matchIndex = matches.findIndex((v) => v.matchId === matchId);

  if (matchIndex !== -1) {
    var matchData = matches[matchIndex].data;
    var userIndex = matchData.findIndex((v) => v.userId === userId);
    if (status === LEAVE) {
      matchData[userIndex].status = LEAVE;
    } else {
      matchData[userIndex].status = JOIN;
    }
  }
}

module.exports.removeOfflineUserFromMatch = (user) => {
  var matchIndex = matches.findIndex((v) => v.matchId === user.matchId);

  if (matchIndex !== -1) {
    var matchData = matches[matchIndex].data;
    var userIndex = matchData.findIndex((v) => v.userId === user.userId);
    matchData[userIndex].status = LEAVE;
  }
};

function CSMatchLeaveAllResult(data) {
  console.log(data.Message);
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}
