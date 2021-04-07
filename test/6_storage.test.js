const expect = require('chai').expect;
const io = require('socket.io-client');

var socketUrl = 'http://localhost:7192?type=client&socketKey=defaultKey';

var client1;
var tokenClient1;

const STORAGE_CREATE = 0,
  STORAGE_UPDATE = 1;

var counterForStorage = 0;

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
  it('should create and update collection for saving custom data (client 1)', function (done) {
    var addObject = {
      type: 'add',
      token: tokenClient1,
      collection: 'infos',
      data: { xp: 1, gameWins: 2, gameLose: 1, totalGame: 3 },
    };

    client1.emit('storage', JSON.stringify(addObject));
    client1.on('addObject', (data) => {
      if (counterForStorage == STORAGE_CREATE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);
        // test update if collection is exist
        var addObject = {
          type: 'add',
          token: tokenClient1,
          collection: 'infos',
          data: { xp: 2, gameWins: 3 },
        };

        client1.emit('storage', JSON.stringify(addObject));
      } else if (counterForStorage == STORAGE_UPDATE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);

        done();
      }
      counterForStorage++;
    });
  });

  it('should increment numeric values (client 1)', function (done) {
    var incrementValue = {
      type: 'increment',
      token: tokenClient1,
      collection: 'infos',
      data: { xp: 1 },
    };

    client1.emit('storage', JSON.stringify(incrementValue));
    client1.on('incrementValue', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(1);

      done();
    });
  });

  it('should fetch data from collection (client 1)', function (done) {
    var fetchData = {
      type: 'fetch',
      token: tokenClient1,
      collection: 'infos',
      data: { xp: 1 },
    };

    client1.emit('storage', JSON.stringify(fetchData));
    client1.on('fetchData', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);

      done();
    });
  });

  it('should delete object from collection (client 1)', function (done) {
    var getData = {
      type: 'delete',
      token: tokenClient1,
      keys: { xp: 1 },
      collection: 'infos',
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
