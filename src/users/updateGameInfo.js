const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');

function updateGameInfo(jo, socket) {
  let success = [];
  let errors = [];
  var event = 'updateGameInfo';
  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);
    if (result) {
      var userData = jwt.user;
      if (mongoose.Types.ObjectId.isValid(userData.userId)) {
        User.findById(userData.userId)
          .then((user) => {
            if (user) {
              if (jo.playerWin) {
                // if player win a game
                user.updateOne(
                  {
                    $inc: {
                      'game_info.0.game_played': 1,
                      'game_info.0.game_wins': 1,
                    },
                  },
                  (err, result) => {
                    if (!err) {
                      console.log(err, result);
                      success.push({
                        type: 'success',
                        msg: 'Game info successfully updated',
                        code: 0,
                      });
                      emit(event, socket, success.pop());
                    } else {
                      errors.push({
                        type: 'error',
                        msg: err.toString(),
                        code: 0,
                      });
                      emit(event, socket, errors.pop());
                    }
                  }
                );
              } else {
                // if player lose a game
                user.updateOne(
                  {
                    $inc: {
                      'game_info.0.game_played': 1,
                      'game_info.0.game_losses': 1,
                    },
                  },
                  (err, result) => {
                    if (!err) {
                      console.log(err, result);
                      success.push({
                        type: 'success',
                        msg: 'Game info successfully updated',
                        code: 0,
                      });
                      emit(event, socket, success.pop());
                    } else {
                      errors.push({
                        type: 'error',
                        msg: err.toString(),
                        code: 0,
                      });
                      emit(event, socket, errors.pop());
                    }
                  }
                );
              }
            } else {
              //If User not exist
              errors.push({
                type: 'error',
                msg: 'User not exist with this user Id',
                code: 1,
              });
              emit(event, socket, errors.pop());
            }
          })
          .catch((err) => {
            errors.push({
              type: 'error',
              msg: err.toString(),
              code: 2,
            });
            emit(event, socket, errors.pop());
          });
      } else {
        // TODO: can show in admin dashboard
        console.log('Please provide correct Id');
      }
    } else {
      console.log('false '.red, data);
      errors.push({
        type: 'error',
        msg: jwt.message,
        code: 3,
      });
      emit(event, socket, errors.pop());
    }
  });
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.updateGameInfo = updateGameInfo;
