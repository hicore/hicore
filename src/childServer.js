const matchController = require('../src/matchController');

var childServer = []; // cs == child server

module.exports.csSetOnline = (query, socket) => {
  childServer.push({
    status: 'online',
    socket: socket,
    socketId: socket.id,
    serverId: query.serverId,
    serverCode: query.serverCode,
    serverLocation: query.serverLocation,
  });
};

module.exports.csSetOffline = (socket) => {
  var serverIndex = childServer.findIndex((v) => v.socketId !== socket.id);
  if (serverIndex !== -1) {
    childServer.splice(
      serverIndex, // remove by index
      1
    );
  }
};

module.exports.csUserOnline = (user) => {
  // change status of user to online in  Child Server
  if (childServer.length > 0) {
    var onUser = {
      status: 1,
      userId: user._id.toString(),
      username: user.username,
    };
    io.sockets.to(childServer[0].socketId).emit('MssUserStatus', onUser);
  } else {
    //console.info("we don't have any child server running");
  }
};
module.exports.csUserOffline = (userId) => {
  // change status of user to offline in  Child Server
  if (childServer.length > 0) {
    var offUser = {
      status: 0,
      userId: userId,
    };
    io.sockets.to(childServer[0].socketId).emit('MssUserStatus', offUser);
  } else {
    //console.info("we don't have any child server running");
  }
};

module.exports.csMatchmaker = (data) => {
  if (childServer.length > 0) {
    // TODO find best server for user then emit to that server for creating a game room

    io.sockets.to(childServer[0].socketId).emit('MssMatchmaker', data);
  } else {
    //console.info("we don't have any child server running");
  }
};

module.exports.csJoinToMatch = (data) => {
  if (childServer.length > 0) {
    // TODO find best server for user then emit to that server for creating a game room

    var socket = io.sockets.connected[childServer[0].socketId];
    socket.emit('MssJoinToMatch', data);
  } else {
    //console.info("we don't have any child server running");
  }
};

module.exports.csLeaveMatch = (data) => {
  if (childServer.length > 0) {
    // TODO find best server for user then emit to that server for creating a game room

    var socket = io.sockets.connected[childServer[0].socketId];
    socket.emit('MssLeaveMatch', data);
  } else {
    //console.info("we don't have any child server running");
  }
};
module.exports.csLeaveAll = (data) => {
  if (childServer.length > 0) {
    // TODO find best server for user then emit to that server for creating a game room

    var socket = io.sockets.connected[childServer[0].socketId];
    socket.emit('MssLeaveAll', data);
  } else {
    // console.info("we don't have any child server running");
  }
};

module.exports.csMatchRules = async () => {
  if (childServer.length > 0) {
    // TODO find best server for user then emit to that server for creating a game room

    let rules = await matchController.getMatchRollsFromDB();

    var socket = io.sockets.connected[childServer[0].socketId];
    socket.emit('MssMatchRules', rules);
  } else {
    // console.info("we don't have any child server running");
  }
};

// find server socket for communication between motherShipServer and Child Server
var serverData = {
  socket: function () {
    return childServer[0].socket;
  },
  socketId: function (id) {
    return childServer[0].socketId;
  },
};

exports.server = serverData;
