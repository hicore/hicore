const expect = require('chai').expect;
const io = require('socket.io-client');

var socketUrl = 'http://localhost:7192?type=client&socketKey=defaultKey';

var client1;
var tokenClient1;

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
    }, 50);
  });
});

describe('Authenticate for testing ' + 'STORAGE'.green, function () {
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
        done();
      }
    });
  });
});

describe('Storage', function () {
  it('should create class for saving custom data (client 1)', function (done) {
    var createClass = {
      type: 'create',
      token: tokenClient1,
      class: 'infos',
      data: { xp: 1, gameWins: 2, gameLose: 1, totalGame: 3 },
    };

    client1.emit('storage', JSON.stringify(createClass));
    client1.on('createClass', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      done();
    });
  });

  it('should update class with new values (client 1)', function (done) {
    var updateClass = {
      type: 'update',
      token: tokenClient1,
      class: 'infos',
      data: { totalTimePlayed: 10, isActive: true },
    };

    client1.emit('storage', JSON.stringify(updateClass));
    client1.on('updateClass', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      done();
    });
  });

  it('should increment numeric values (client 1)', function (done) {
    var incrementValue = {
      type: 'increment',
      token: tokenClient1,
      class: 'infos',
      data: { xp: 1 },
    };

    client1.emit('storage', JSON.stringify(incrementValue));
    client1.on('incrementValue', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(1);
      done();
    });
  });

  it('should get data from class (client 1)', function (done) {
    var getData = {
      type: 'get',
      token: tokenClient1,
      class: 'infos',
      data: { xp: 1 },
    };

    client1.emit('storage', JSON.stringify(getData));
    client1.on('catchData', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      done();
    });
  });

  it('should delete object from class (client 1)', function (done) {
    var getData = {
      type: 'delete',
      token: tokenClient1,
      class: 'infos',
    };

    client1.emit('storage', JSON.stringify(getData));
    client1.on('deleteObject', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);

      if (client1.connected) {
        client1.disconnect();
      }

      done();
    });
  });
});
