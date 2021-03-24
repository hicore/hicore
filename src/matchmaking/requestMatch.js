const uniqId = require('uniqid');
const moment = require('moment');
const query = require('array-query');
const matchController = require('../matchController');
const verifyToken = require('../token/verifyToken');
const userManager = require('../users/userManager');

var matchId;
var queueId;
var playmateId;

const MINIMUM_PLAYMATE = 2;

const QUEUE = 4;

const ONLINE = 1,
  IN_MATCHMAKING = 2,
  IN_GAME = 3,
  IN_PLAYMATE_MATCH = 4;

const ALL_IS_ENEMY = 0,
  TEAM_NUMBER_START_FROM = 1;

const JOIN = 1;

function requestMatch(jo, socket) {
  let message = [];
  let success = [];
  let errors = [];
  let warning = [];

  var event = 'requestMatch';
  var matchmakingResultEvent = 'matchmakingResult';
  var playmateResultEvent = 'playmateResult'; // 0 = invite, 1 = accept, 2 = deny, leave = 3, queue = 4, cancel = 5, destroy = 6

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      var user = userManager.getUserData(userData.userId);
      var searchTime = uniqId('search');
      console.time(searchTime);
      if (user != null) {
        // user status for game request should be online(1) or in PlaymateMatch room (4).to check user can't request a game more than one's
        if (user.status === ONLINE || user.status === IN_PLAYMATE_MATCH) {
          if (jo.playmateId != undefined) {
            var inPlaymate = userManager.getInPlaymateMatchUsers(jo.playmateId);

            if (inPlaymate.length >= MINIMUM_PLAYMATE) {
              var playmates = checkPlayableLevelOrRank(user, inPlaymate, jo);

              if (playmates.isPlayable) {
                queueId = uniqId('qid-');
                var reqTime = moment.utc().valueOf();
                inPlaymate.forEach((user) => {
                  // set other playmate queueId
                  userManager.changeStatus(IN_MATCHMAKING, user.userId); //  inMatchmaking
                  userManager.setUserInfoForQuery(jo, user, queueId, reqTime);
                });

                message.push({
                  msg: `User and playmate are in ${jo.requestType} match queue`,
                  type: 'queue',
                  data: {
                    queueId: queueId,
                  },
                  code: QUEUE,
                });
                io.to(jo.playmateId).emit(playmateResultEvent, message.pop());

                if (inPlaymate.length === jo.roomCapacity) {
                  matchId = uniqId('mid-');
                  var usersInThisRoom = readyUsers(matchId, [inPlaymate]);
                  console.log('In full playmate', usersInThisRoom);
                  matchController.createMatch(matchId, usersInThisRoom);
                  console.timeEnd(searchTime);
                }
              } else {
                warning.push({
                  type: 'warning',
                  msg: `${playmates.whichUser} ${jo.requestType} isn't in same range`,
                  data: {},
                  code: 0,
                });

                emit(event, socket, warning.pop());
              }
            } else {
              warning.push({
                type: 'warning',
                msg: 'The minimum of playmate capacity is 2, invite your playmates',
                data: {},
                code: 0,
              });

              emit(event, socket, warning.pop());
            }
          } else {
            queueId = uniqId('qid-');
            var reqTime = moment.utc().valueOf();
            userManager.changeStatus(IN_MATCHMAKING, user.userId); // to inMatchmaking
            userManager.setUserInfoForQuery(jo, user, queueId, reqTime);

            success.push({
              type: 'success',
              msg: `User is in ${jo.requestType} match queue`,
              data: {
                queueId: queueId,
              },
              code: 1,
            });

            emit(event, socket, success.pop());
          }

          // search for opponents

          var inMatchmaking = userManager.queryFromMatchmakingUsers(jo, user.level, user.rank);
          var numberOfTeams = searchForOpponents(jo, inMatchmaking);

          if (isRoomReady(numberOfTeams, jo.roomCapacity)) {
            matchId = uniqId('mid-');
            var usersInThisRoom = readyUsers(matchId, numberOfTeams);
            console.log('In match ready ', usersInThisRoom);

            matchController.createMatch(matchId, usersInThisRoom);
            console.timeEnd(searchTime);
          }
        }
      } else {
        // reconnect user
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

function checkPlayableLevelOrRank(user, inPlaymateMatch, jo) {
  // check level and rank before insert them in match query
  var cantPlayWithEachOther = [];

  if (jo.requestType === 'level') {
    inPlaymateMatch.forEach((inPlaymate) => {
      if (!between(inPlaymate.level, user.level - jo.range, user.level + jo.range)) {
        // they can't play to each other there level is not the same
        cantPlayWithEachOther.push(inPlaymate.username);
      }
    });
  }
  if (jo.requestType === 'rank') {
    inPlaymateMatch.forEach((inPlaymate) => {
      if (!between(inPlaymate.rank, user.rank - jo.range, user.rank + jo.range)) {
        // they can't play to each other their rank is not the same
        cantPlayWithEachOther.push(inPlaymate.username);
      }
    });
  }

  if (cantPlayWithEachOther.length === 0) {
    return { isPlayable: true };
  } else {
    return { isPlayable: false, whichUser: cantPlayWithEachOther };
  }
}

function chunk(array, teamNumber) {
  if (teamNumber < 2) return [array];

  var len = array.length,
    out = [],
    i = 0,
    size;

  if (len % teamNumber === 0) {
    size = Math.floor(len / teamNumber);
    while (i < len) {
      out.push(array.slice(i, (i += size)));
    }
  }
  return out;
}

function searchForOpponents(jo, inMatchmaking) {
  var room = createRoomByCapacity(jo.roomCapacity);

  var teams = chunk(room, jo.requestTeamNumber);
  // get all users queue ids,map returns an array with all queueId,
  var queueIds = findAllQueueIds(inMatchmaking);

  for (let qidIndex = 0; qidIndex < queueIds.length; qidIndex++) {
    // find playmates which have same queue id
    var playmates = query('queueId').is(queueIds[qidIndex]).on(inMatchmaking);
    // loop each team to find which one has space for user and users which have the same playmateId
    for (let i = 0; i < teams.length; i++) {
      let remainingCapacity = findRemindingCapacity(teams[i]);

      if (remainingCapacity.length > 0 && playmates.length != 0) {
        if (playmates.length <= remainingCapacity.length) {
          let eachTeamCapacitySize = teams[i].length;
          let startIndexFrom = eachTeamCapacitySize - remainingCapacity.length;
          while (playmates.length) {
            for (let j = startIndexFrom; j < eachTeamCapacitySize; j++) {
              let user = playmates.shift();
              if (user !== undefined) {
                if (teams.length === 1) {
                  user.team = ALL_IS_ENEMY;
                  teams[i][j] = user;
                } else {
                  user.team = i + TEAM_NUMBER_START_FROM;
                  teams[i][j] = user;
                }
              }
            }
          }
        }
      }
    }
  }
  return teams;
}

function createRoomByCapacity(roomCapacity) {
  var room = Array.from(new Array(roomCapacity), function (val, i) {
    return i;
  });
  return room;
}

function findAllQueueIds(inMatchmaking) {
  var queueIds = [...new Set(inMatchmaking.map((u) => u.queueId))].filter(function (qId) {
    return qId !== undefined;
  });
  return queueIds;
}

function findRemindingCapacity(numberOfTeams) {
  let remainingCapacity = numberOfTeams.filter(function (element) {
    return typeof element === 'number';
  });
  return remainingCapacity;
}

function isRoomReady(teams, roomCapacity) {
  var countUsers = 0;
  for (let i = 0; i < teams.length; i++) {
    let capacity = teams[i].filter(function (element) {
      return typeof element === 'object';
    });
    countUsers += capacity.length;
  }
  if (countUsers === roomCapacity) {
    return true;
  } else {
    return false;
  }
}

function readyUsers(matchId, numberOfTeams) {
  let usersInThisRoom = [];

  for (let i = 0; i < numberOfTeams.length; i++) {
    for (let j = 0; j < numberOfTeams[i].length; j++) {
      let user = numberOfTeams[i][j];
      userManager.changeStatus(IN_GAME, user.userId); //  inGame
      userManager.setMatchId(user.userId, matchId);

      user.socket.join(matchId);

      usersInThisRoom.push({
        matchId: matchId,
        userId: user.userId,
        username: user.username,
        playmateId: user.playmateId,
        socketId: user.socketId,
        level: user.level,
        rank: user.rank,
        team: user.team,
        matchMode: user.matchMode,
        status: JOIN,
      });
    }
  }
  return usersInThisRoom;
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

function between(x, min, max) {
  return x >= min && x <= max;
}

exports.requestMatch = requestMatch;
