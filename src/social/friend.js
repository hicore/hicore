const { searchFriend: searchFriend } = require('./searchFriend');
const { requestFriend: requestFriend } = require('./requestFriend');
const { acceptFriend: acceptFriend } = require('./acceptFriend');
const { rejectFriend: rejectFriend } = require('./rejectFriend');
const { removeFriend: removeFriend } = require('./removeFriend');

module.exports.friend = (jo, socket) => {
  switch (jo.type) {
    case 'search':
      searchFriend(jo, socket);
      break;
    case 'request':
      requestFriend(jo, socket);
      break;
    case 'accept':
      acceptFriend(jo, socket);
      break;
    case 'reject':
      rejectFriend(jo, socket);
      break;
    case 'remove':
      removeFriend(jo, socket);
      break;

    default:
      break;
  }
};
