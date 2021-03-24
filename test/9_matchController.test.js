const expect = require('chai').expect;
const io = require('socket.io-client');

var socketUrl = 'http://localhost:7192?type=client&socketKey=defaultKey';

var client1;
var tokenClient1;
var matchId;

var saturnUserId;

describe('Create sockets', function () {
  it('should create sockets', function (done) {
    var isClient1Connect = false;

    // Setup
    client1 = io.connect(socketUrl);
    client1.on('connect', () => {
      isClient1Connect = true;
    });

    setTimeout(function () {
      expect(isClient1Connect).to.equal(true);

      done();
    }, 100);
  });
});

describe('Authenticate for testing ' + 'MATCH_CONTROLLER'.green, function () {
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
});

describe('MatchController', function () {
  it('should request match without playmate for room capacity of 1', function (done) {
    var requestMatch = {
      type: 'request',
      token: tokenClient1,
      roomCapacity: 1,
      requestType: 'normal',
      matchMode: 'TDM1',
      requestTeamNumber: 1,
    };

    client1.emit('matchmaker', JSON.stringify(requestMatch));
    client1.on('requestMatch', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(1);
    });
    client1.on('matchmakingResult', (data) => {
      matchId = data[0].matchId;
      expect(data).to.have.lengthOf(1);
      done();
    });
  });

  it('should check is match in progress or not', function (done) {
    var isMatchInProgress = {
      type: 'isMatchInProgress',
      token: tokenClient1,
      matchId: matchId,
    };

    client1.emit('matchController', JSON.stringify(isMatchInProgress));
    client1.on('isMatchInProgress', (data) => {
      expect(data.data.inProgress).to.equal(true);
      done();
    });
  });

  it('should leave match', function (done) {
    var leaveMatch = {
      type: 'leaveMatch',
      token: tokenClient1,
      matchId: matchId,
    };

    client1.emit('matchController', JSON.stringify(leaveMatch));
    client1.on('leaveMatch', (data) => {
      expect(data.type).to.equal('leaveMatch');
      expect(data.code).to.equal(0);
      done();
    });
  });

  it('should join to match', function (done) {
    var joinToMatch = {
      type: 'joinToMatch',
      token: tokenClient1,
      matchId: matchId,
    };

    client1.emit('matchController', JSON.stringify(joinToMatch));
    client1.on('joinToMatch', (data) => {
      expect(data.type).to.equal('joinToMatch');
      expect(data.code).to.equal(1);

      client1.disconnect();

      done();
    });
  });
});
