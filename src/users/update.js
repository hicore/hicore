const { updateUserPassword: updateUserPassword } = require('./updateUserPassword');

const { updateUserEmail: updateUserEmail } = require('./updateUserEmail');

const { updateUserProfile: updateUserProfile } = require('./updateUserProfile');

const { updateUserUsername: updateUserUsername } = require('./updateUserUsername');

const { updateGameInfo: updateGameInfo } = require('./updateGameInfo');

const { updateUserProgress: updateUserProgress } = require('./updateUserProgress');

module.exports.updateUser = (jo, socket) => {
  switch (jo.type) {
    case 'profile':
      updateUserProfile(jo, socket);
      break;
    case 'password':
      updateUserPassword(jo, socket);
      break;
    case 'username':
      updateUserUsername(jo, socket);
      break;
    case 'email':
      updateUserEmail(jo, socket);
      break;
    case 'gameInfo':
      updateGameInfo(jo, socket);
      break;
    case 'progress':
      updateUserProgress(jo, socket);
      break;
    default:
      break;
  }
};
