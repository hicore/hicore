const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');
const userManager = require('../users/userManager');

module.exports.communication = (jo, socket) => {
  switch (jo.type) {
    case 'toId':
      sendMessageToId(jo, socket);
      break;
    case 'toGroup':
      sendMessageToGroup(jo, socket);
      break;

    default:
      break;
  }
};

function sendMessageToId(jo, socket) {
  let message = [];
  let success = [];
  let errors = [];

  var event = 'messageToId';
  var messageEvent = 'message';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      if (mongoose.Types.ObjectId.isValid(userData.userId)) {
        var userReceiver = userManager.getUserData(jo.receiverUserId);

        if (userReceiver != null) {
          message.push({
            type: 'toId',
            text: jo.text,
            senderId: userData.userId,
            senderUsername: userData.username,
            senderSocketId: socket.id,
          });

          socket.broadcast.to(userReceiver.socketId).emit(messageEvent, message.pop());

          // result to user itself
          success.push({
            type: 'success',
            msg: 'Message sent',
            data: {},
            code: 0,
          });

          emit(event, socket, success.pop());
        } else {
          success.push({
            type: 'success',
            msg: 'User is offline',
            data: {
              status: 0,
            },
            code: 1,
          });

          emit(event, socket, success.pop());
        }
      } else {
        errors.push({
          type: 'error',
          msg: 'Please provide correct Id',
          data: {},
          code: 0,
        });
        emit(event, socket, errors.pop());
      }
    } else {
      console.log('false ', data);
      errors.push({
        type: 'error',
        msg: jwt.message,
        data: {},
        code: 1,
      });
      emit(event, socket, errors.pop());
    }
  });
}

function sendMessageToGroup(jo, socket) {
  let message = [];
  let success = [];
  let errors = [];

  var event = 'messageToGroup';
  var messageEvent = 'message';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      if (mongoose.Types.ObjectId.isValid(userData.userId)) {
        var userReceiver = userManager.getUserData(jo.receiverUserId);

        var inPlaymateMatch = userManager.getInPlaymateMatchUsers(jo.playmateId);

        if (inPlaymateMatch.length > 0) {
          message.push({
            type: 'toGroup',
            text: jo.text,
            senderId: userData.userId,
            senderUsername: userData.username,
            senderSocketId: socket.id,
          });

          socket.to(jo.playmateId).emit(messageEvent, message.pop());
          // result to user itself
          success.push({
            type: 'success',
            msg: 'Message sent',
            data: {},
            code: 0,
          });

          emit(event, socket, success.pop());
        } else {
          success.push({
            type: 'success',
            msg: 'Playmate game not available anymore',
            data: {},
            code: 1,
          });
          emit(event, socket, success.pop());
        }
      } else {
        errors.push({
          type: 'error',
          msg: 'Please provide correct Id',
          data: {},
          code: 0,
        });
        emit(event, socket, errors.pop());
      }
    } else {
      console.log('false ', data);
      errors.push({
        type: 'error',
        msg: jwt.message,
        data: {},
        code: 1,
      });
      emit(event, socket, errors.pop());
    }
  });
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}
