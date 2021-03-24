const User = require('../models/User');
const query = require('array-query');
const verifyToken = require('../token/verifyToken');
const childServer = require('../childServer');
const matchController = require('../matchController');

var users = [];
var queueIds = [];

const OFFLINE = 0,
  ONLINE = 1,
  IN_MATCHMAKING = 2,
  IN_GAME = 3,
  IN_PLAYMATE_MATCH = 4,
  IN_WAITING_LIST = 5;

module.exports.setOnline = (user, socket) => {
  // check if we have that user in our array or not
  // -1 means we cant find that user by index so add to array
  if (users.findIndex((v) => v.userId === user._id.toString()) === -1) {
    users.push({
      userId: user._id.toString(),
      username: user.username,
      socket: socket,
      socketId: socket.id,
      matchId: '',
      queueId: '',
      playmateId: '',
      roomCapacity: 0,
      level: user.level,
      rank: user.rank,
      requestType: '', // normal, by level, by rank
      requestTime: 0,
      requestTeamNumber: 0,
      matchMode: '',
      team: 0, //
      range: 0, //
      location: user.location, // TODO: it's need refactoring
      status: ONLINE, // 1 => online
      equipments: {}, // like weapons, clothes and
    });

    childServer.csUserOnline(user);
  }

  // console.log(query('status').is(1).on(users));
  //temp(2, user._id);
  //console.log(query('status').is(2).on(users).length);
};

module.exports.getOnlineUsers = () => {
  var onlineUsers = query('status').is(ONLINE).on(users);

  return onlineUsers.length;
};

// param = status 0 is offline
module.exports.setOffline = (socket) => {
  // find user and update user status in mongoDB
  var findUserBySocketId = query('socketId').is(socket.id).on(users);

  if (findUserBySocketId.length > 0) {
    var user = findUserBySocketId[0];

    User.updateOne(
      {
        _id: user.userId,
      },
      {
        status: OFFLINE, // 0 => offline
        socketId: '',
      },
      (err, result) => {}
    );

    // remove a user from match if that user is in a match
    matchController.removeOfflineUserFromMatch(user);
    // emit to Child Server
    childServer.csUserOffline(user.userId);

    // remove user form array with socket id
    users.splice(
      users.findIndex((v) => v.socketId === socket.id), // find index
      1
    );
  }
};

module.exports.changeStatus = (status, userId) => {
  var findUserIndex = users.findIndex((v) => v.userId === userId);

  if (findUserIndex !== -1) {
    let user = users[findUserIndex];
    // 0 is offline
    switch (status) {
      case ONLINE: // online
        user.status = ONLINE;
        break;
      case IN_MATCHMAKING: // inMatchmaking
        user.status = IN_MATCHMAKING;
        break;
      case IN_GAME: // inGame
        user.status = IN_GAME;
        break;
      case IN_PLAYMATE_MATCH: // inPlaymateMatch
        user.status = IN_PLAYMATE_MATCH;
        break;
      case IN_WAITING_LIST: // inWaitingList
        user.status = IN_WAITING_LIST;
        break;
      default:
        break;
    }

    User.updateOne(
      {
        _id: userId,
      },
      {
        status: status,
      },
      (err, result) => {
        // if(!err){
        //     if(result.nModified){
        //         return [queryResult , true];
        //     }
        // }
      }
    );
  }
};

module.exports.queryFromMatchmakingUsers = (jo, level, rank) => {
  var inMatchmakingUsersByRoomCap;

  if (jo.requestType === 'normal') {
    inMatchmakingUsersByRoomCap = query('status')
      .is(IN_MATCHMAKING)
      .and('roomCapacity')
      .is(jo.roomCapacity)
      .and('requestType')
      .is(jo.requestType)
      .and('matchMode')
      .is(jo.matchMode)
      .and('requestTeamNumber')
      .is(jo.requestTeamNumber)
      .sort('requestTime')
      .asc()
      .on(users);
  } else if (jo.requestType === 'level') {
    inMatchmakingUsersByRoomCap = query('status')
      .is(IN_MATCHMAKING)
      .and('roomCapacity')
      .is(jo.roomCapacity)
      .and('requestType')
      .is(jo.requestType)
      .and('matchMode')
      .is(jo.matchMode)
      .and('requestTeamNumber')
      .is(jo.requestTeamNumber)
      .and(jo.requestType)
      .gte(level - jo.range)
      .and(jo.requestType)
      .lte(level + jo.range)
      .sort('requestTime')
      .asc()
      .on(users);
  } else if (jo.requestType === 'rank') {
    inMatchmakingUsersByRoomCap = query('status')
      .is(IN_MATCHMAKING)
      .and('roomCapacity')
      .is(jo.roomCapacity)
      .and('requestType')
      .is(jo.requestType)
      .and('matchMode')
      .is(jo.matchMode)
      .and('requestTeamNumber')
      .is(jo.requestTeamNumber)
      .and(jo.requestType)
      .gte(rank - jo.range)
      .and(jo.requestType)
      .lte(rank + jo.range)
      .sort('requestTime')
      .asc()
      .on(users);
  }

  return inMatchmakingUsersByRoomCap;
};

module.exports.getInPlaymateMatchUsers = (playmateId) => {
  var inPlaymateMatch = query('playmateId').is(playmateId).on(users);

  return inPlaymateMatch;
};

module.exports.getInWaitingListUser = () => {
  var inWaitingList = query('status').is(IN_WAITING_LIST).limit(1).on(users);

  return inWaitingList;
};

module.exports.getInMatchmaking = () => {
  var inMatchmakingUsers = query('status').is(IN_MATCHMAKING).on(users);

  return inMatchmakingUsers.length;
};

module.exports.getUserData = (userId) => {
  var user = users.findIndex((v) => v.userId === userId);

  if (user !== -1) {
    return users[user];
  }
  return;
};

module.exports.setMatchId = (userId, matchId) => {
  var userIndex = users.findIndex((v) => v.userId === userId);

  if (userIndex !== -1) {
    let user = users[userIndex];
    user.matchId = matchId;
  }
};

module.exports.setUserInfoForQuery = (jo, u, queueId, requestTime) => {
  var findUserIndex = users.findIndex((v) => v.userId === u.userId);

  if (findUserIndex !== -1) {
    let user = users[findUserIndex];
    user.queueId = queueId;
    user.roomCapacity = jo.roomCapacity;
    user.requestType = jo.requestType;
    user.matchMode = jo.matchMode;
    user.requestTime = requestTime;
    user.requestTeamNumber = jo.requestTeamNumber;
    user.range = jo.range != null ? jo.range : 0;
  }
};

module.exports.setToDefaultValue = (userId) => {
  //TODO set all user info for searching for match to default
  //like
  // user.queueId = "";
  // user.roomCapacity = 0;
  // user.requestType = "";
  // user.requestTime = 0;
  // user.range = 0;
};

module.exports.setUserEquipments = (userId, equipments) => {};

function statusForFriends(params) {}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}
