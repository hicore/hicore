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

describe('Authenticate for testing ' + 'STATIC STORAGE'.green, function () {
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

describe('Static Storage', function () {
  it('should fetch static data', function (done) {
    var fetchStaticData = {
      type: 'fetch',
      token: tokenClient1,
      collection: 'weapon',
    };

    client1.emit('staticStorage', JSON.stringify(fetchStaticData));
    client1.on('fetchStaticData', (data) => {
      expect(data.type).to.equal('success');
      expect(data.data).to.be.not.empty;
      if (client1.connected) {
        client1.disconnect();
      }

      done();
    });
  });
});
