const childServer = require('../childServer');
const authenticate = require('../users/authenticate');
const update = require('../users/update');
const friend = require('../social/friend');
const userManager = require('../users/userManager');
const matchmaker = require('../matchmaking/matchmaker');
const communication = require('../social/communication');
const storage = require('../storage/storage');
const staticStorage = require('../staticStorage/staticStorage');
const matchController = require('../matchController');
const config = require('../../config/config');
// Config
const {
  socket: { serverKey, socketKey },
} = config;

const {
  child: { childServerKey },
} = config;

const { json } = require('body-parser');

// Implement socket io
io.on('connection', (socket) => {
  if (socket.handshake.query['type'] === 'client') {
    if (socket.handshake.query['socketKey'] !== socketKey) {
      console.log('Your socket key is wrong '.red);
      socket.emit('close', 'The key is wrong');
      socket.disconnect();
      return;
    } else {
      console.info(`client connected [id=${socket.id}]`);
    }
  } else if (socket.handshake.query['type'] === 'server') {
    if (
      socket.handshake.query['childServerKey'] !== childServerKey &&
      socket.handshake.query['type'] === 'server'
    ) {
      console.log('Your game server key is wrong '.red);
      socket.emit('close', 'The key is wrong');
      socket.disconnect();
      return;
    } else {
      console.log(
        `----- Child server -${socket.handshake.query['serverLocation']}- connected successfully -----`
          .yellow
      );
      childServer.csSetOnline(socket.handshake.query, socket);
      childServer.csMatchRules();
    }
  } else {
    console.log('The type must be set'.red);
    socket.emit('close', 'Socket key is wrong');
    socket.disconnect();
    return;
  }

  socket.on('disconnect', function (reason) {
    if (socket.handshake.query['type'] === 'client') {
      console.info(`client gone [id=${socket.id}]`);
      userManager.setOffline(socket);
    } else if (socket.handshake.query['type'] === 'server') {
      childServer.csSetOffline(socket.id);
      console.info(`child server gone [id=${socket.id}]`, reason);
    }
  });

  socket.on('close', (data) => {
    if (data === 'close') {
      socket.disconnect();
    }
  });

  socket.on('closeAll', (data) => {
    console.log('close all');
    io.close();
  });

  socket.on('ChildServer', function (data) {
    if (data.ToClass == 'matchController') {
      matchController.childServerResult(data);
    }
  });

  socket.on('authenticate', function (data) {
    var jo = JSON.parse(data);
    authenticate.authentication(jo, socket);
  });

  socket.on('update', function (data) {
    var jo = JSON.parse(data);
    update.updateUser(jo, socket);
  });

  socket.on('friend', function (data) {
    var jo = JSON.parse(data);
    friend.friend(jo, socket);
  });

  socket.on('communication', function (data) {
    var jo = JSON.parse(data);
    communication.communication(jo, socket);
  });

  socket.on('matchmaker', function (data) {
    var jo = JSON.parse(data);
    matchmaker.matchmaker(jo, io, socket);
  });
  socket.on('storage', function (data) {
    var jo = JSON.parse(data);
    storage.storage(jo, socket);
  });

  socket.on('staticStorage', function (data) {
    var jo = JSON.parse(data);
    staticStorage.staticStorage(jo, socket);
  });

  socket.on('matchController', function (data) {
    var jo = JSON.parse(data);
    matchController.matchController(jo, socket);
  });

  socket.on('CsJoinToGame', function (data) {
    console.log(data);
  });
});
