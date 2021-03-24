const { requestMatch: requestMatch } = require('./requestMatch');
const { cancelMatch: cancelMatch } = require('./cancelMatch');
const { createPlaymateMatch: createPlaymateMatch } = require('./createPlaymateMatch');
const { destroyPlaymateMatch: destroyPlaymateMatch } = require('./destroyPlaymateMatch');
const { invitePlaymate: invitePlaymate } = require('./invitePlaymate');
const { acceptPlaymate: acceptPlaymate } = require('./acceptPlaymate');
const { denyPlaymate: denyPlaymate } = require('./denyPlaymate');
const { leavePlaymate: leavePlaymate } = require('./leavePlaymate');

module.exports.matchmaker = (jo, io, socket) => {
  switch (jo.type) {
    case 'request':
      requestMatch(jo, socket);
      break;
    case 'cancel':
      cancelMatch(jo, io, socket);
      break;
    case 'createPlaymate':
      createPlaymateMatch(jo, socket);
      break;
    case 'destroyPlaymate':
      destroyPlaymateMatch(jo, io, socket);
      break;
    case 'invite':
      invitePlaymate(jo, socket);
      break;
    case 'accept':
      acceptPlaymate(jo, socket);
      break;
    case 'deny':
      denyPlaymate(jo, socket);
      break;
    case 'leave':
      leavePlaymate(jo, socket);
      break;
    default:
      break;
  }
};

// INVITE = 0,
// ACCEPT = 1,
// DENY = 2,
// LEAVE = 3,
// QUEUE = 4,
// CANCEL = 5,
// DESTROY = 6;

// ONLINE = 1,
// IN_MATCHMAKING = 2,
// IN_GAME = 3,
// IN_PLAYMATE_MATCH = 4,
// IN_WAITING_LIST = 5;
