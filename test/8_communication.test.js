const expect = require('chai').expect;
const io = require('socket.io-client');

var socketUrl = 'http://localhost:7192?type=client&socketKey=defaultKey';

var client1, client2;
var tokenClient1, tokenClient2;

var counterForSendMassageToId = 0;

const SEND_MESSAGE_TO_OFFLINE_FRIEND = 0;

var playmateId;

var saturnUserId, jupiterUserId;

describe('Create sockets', function () {
  it('should create sockets', function (done) {
    var isClient1Connect = false;
    var isClient2Connect = false;
    // Setup
    client1 = io.connect(socketUrl);
    client2 = io.connect(socketUrl);
    client1.on('connect', () => {
      isClient1Connect = true;
    });
    client2.on('connect', () => {
      isClient2Connect = true;
    });
    setTimeout(function () {
      expect(isClient1Connect).to.equal(true);
      expect(isClient2Connect).to.equal(true);

      done();
    }, 100);
  });
});

describe('Authenticate for testing ' + 'COMMUNICATION'.green, function () {
  it('login by deviceId (Saturn)', function (done) {
    var userSaturn = {
      type: 'deviceId',
      deviceId: 'saturnDeviceId',
      location: 'Galaxy',
      timezone_utc_offset: '00:00:00',
    };
    client1.emit('authenticate', JSON.stringify(userSaturn));
    client1.on('authenticateDeviceId', (data) => {
      if (data.msg == 'Login successfully') {
        tokenClient1 = data.token;
        saturnUserId = data.userId;
        done();
      }
    });
  });
  it('login by email  (Jupiter)', function (done) {
    var userJupiter = {
      type: 'email',
      email: 'jupiter@server.com',
      password: '12345678',
      location: 'Galaxy',
      timezone_utc_offset: '00:00:00',
    };
    client2.emit('authenticate', JSON.stringify(userJupiter));
    client2.on('authenticateEmail', (data) => {
      if (data.msg == 'Login successfully') {
        tokenClient2 = data.token;
        jupiterUserId = data.userId;
        done();
      }
    });
  });
});

describe('Communication', function () {
  it('should send message to user by Id (client 1)', function (done) {
    var message = {
      type: 'toId',
      token: tokenClient1,
      receiverUserId: 'offlineUserId',
      text: 'Hello',
    };

    client1.emit('communication', JSON.stringify(message));
    client1.on('messageToId', (data) => {
      if (counterForSendMassageToId == SEND_MESSAGE_TO_OFFLINE_FRIEND) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(1);

        // send message to online user
        var message = {
          type: 'toId',
          token: tokenClient1,
          receiverUserId: jupiterUserId,
          text: 'Hello :)',
        };
        client1.emit('communication', JSON.stringify(message));
        client2.on('message', (data) => {
          expect(data.text).to.equal('Hello :)');

          done();
        });
      }

      counterForSendMassageToId++;
    });
  });

  it('should send message to group of playmate which not available or exists (client 1)', function (done) {
    var message = {
      type: 'toGroup',
      token: tokenClient1,
      playmateId: 'notExistPlaymateId',
      text: 'Hello all',
    };

    client1.emit('communication', JSON.stringify(message));
    client1.on('messageToGroup', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(1);

      // disconnect for next test
      client1.disconnect();
      client2.disconnect();

      done();
    });
  });

  it('should create playmate for testing group communication', function (done) {
    shouldCreatePlaymateMatchRoom(done);
  });

  it('should send message to group of playmates (client 1)', function (done) {
    var message = {
      type: 'toGroup',
      token: tokenClient1,
      playmateId: playmateId,
      text: 'Hello all :)',
    };

    client1.emit('communication', JSON.stringify(message));
    client1.on('messageToGroup', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
    });
    client2.on('message', (data) => {
      expect(data.text).to.equal('Hello all :)');

      client1.disconnect();
      client2.disconnect();

      done();
    });
  });
});

function shouldCreatePlaymateMatchRoom(done) {
  client1 = io.connect(socketUrl);

  var userSaturn = {
    type: 'deviceId',
    deviceId: 'saturnDeviceId',
    location: 'Galaxy',
    timezone_utc_offset: '00:00:00',
  };
  client1.emit('authenticate', JSON.stringify(userSaturn));
  client1.on('authenticateDeviceId', (data) => {
    if (data.msg == 'Login successfully') {
      tokenClient1 = data.token;
      saturnUserId = data.userId;
      client2 = io.connect(socketUrl);

      var userJupiter = {
        type: 'email',
        email: 'jupiter@server.com',
        password: '12345678',
        location: 'Galaxy',
        timezone_utc_offset: '00:00:00',
      };
      client2.emit('authenticate', JSON.stringify(userJupiter));
      client2.on('authenticateEmail', (data) => {
        if (data.msg == 'Login successfully') {
          tokenClient2 = data.token;
          jupiterUserId = data.userId;

          var createPlaymateMatch = {
            type: 'createPlaymate',
            token: tokenClient1,
          };
          client1.emit('matchmaker', JSON.stringify(createPlaymateMatch));
          client1.on('createPlaymateMatch', (data) => {
            saturnPlaymateId = data.data.playmateId;

            var invitePlaymate = {
              type: 'invite',
              token: tokenClient1,
              friendUserId: jupiterUserId,
              playmateId: saturnPlaymateId,
            };
            client1.emit('matchmaker', JSON.stringify(invitePlaymate));
            client1.on('invitePlaymate', (data) => {
              // accept playmate match
              var acceptPlaymate = {
                type: 'accept',
                token: tokenClient2,
                friendUserId: saturnUserId,
                playmateId: saturnPlaymateId,
              };

              client2.emit('matchmaker', JSON.stringify(acceptPlaymate));
              client2.on('acceptPlaymate', (data) => {
                playmateId = data.data.playmateId;
                done();
              });
            });
          });
        }
      });
    }
  });
}
