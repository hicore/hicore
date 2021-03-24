require('colors');

var expect = require('chai').expect;
var io = require('socket.io-client');

var socketUrl = 'http://localhost:7192?type=client&socketKey=defaultKey';

var client1, client2;
var tokenClient1, tokenClient2;

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
    }, 150);
  });
});

describe('Authenticate by deviceId', function () {
  it('login by deviceId', function (done) {
    var user = {
      type: 'deviceId',
      deviceId: 'saturnDeviceId',
      location: 'Galaxy',
      timezone_utc_offset: '00:00:00',
    };
    client1.emit('authenticate', JSON.stringify(user));

    client1.on('authenticateDeviceId', (data) => {
      expect(data.code).to.equal(1);
      done();
    });
  });
});

describe('Authenticate by email', function () {
  it('login by email', function (done) {
    var user = {
      type: 'email',
      email: 'jupiter@server.com',
      password: '12345678',
      location: 'Galaxy',
      timezone_utc_offset: '00:00:00',
    };
    client2.emit('authenticate', JSON.stringify(user));
    client2.on('authenticateEmail', (data) => {
      expect(data.code).to.equal(1);
      done();
    });
  });
  afterEach(function (done) {
    if (client1.connected) {
      client1.disconnect();
    }
    if (client2.connected) {
      client2.disconnect();
    }
    done();
  });
});
