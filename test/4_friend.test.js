const expect = require('chai').expect;
const io = require('socket.io-client');

var socketUrl = 'http://localhost:7192?type=client&socketKey=defaultKey';

var client1, client2;
var tokenClient1, tokenClient2;

const SEND_REQUEST_ONCE = 0,
  SEND_REQUEST_TWICE = 1;

var counterForSendRequest = 0;

var earthUserId, marsUserId;

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

describe('Authenticate for testing ' + 'FRIEND'.green, function () {
  it('login by deviceId (Earth)', function (done) {
    var userEarth = {
      type: 'deviceId',
      deviceId: 'earthDeviceId',
      location: 'Galaxy',
      timezone_utc_offset: '00:00:00',
    };
    client1.emit('authenticate', JSON.stringify(userEarth));
    client1.on('authenticateDeviceId', (data) => {
      if (data.msg == 'Login successfully') {
        tokenClient1 = data.token;
        earthUserId = data.userId;
        done();
      }
    });
  });
  it('login by email  (Mars)', function (done) {
    var userMars = {
      type: 'email',
      email: 'mars@server.com',
      password: '12345678',
      location: 'Galaxy',
      timezone_utc_offset: '00:00:00',
    };
    client2.emit('authenticate', JSON.stringify(userMars));
    client2.on('authenticateEmail', (data) => {
      if (data.msg == 'Login successfully') {
        tokenClient2 = data.token;
        marsUserId = data.userId;
        done();
      }
    });
  });
});

describe('Friend', function () {
  // update profile info
  it('should find friend by username (Earth)', function (done) {
    var findFriend = {
      type: 'search',
      token: tokenClient1,
      searchUsername: 'mars',
    };
    client1.emit('friend', JSON.stringify(findFriend));
    client1.on('searchFriend', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      done();
    });
  });

  it('should send friend request (Earth)', function (done) {
    var sendRequest = {
      type: 'request',
      token: tokenClient1,
      receiverUserId: marsUserId,
    };
    // send friend request to that user
    client1.emit('friend', JSON.stringify(sendRequest));
    client1.on('requestFriend', (data) => {
      if (counterForSendRequest == SEND_REQUEST_ONCE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);

        client1.emit('friend', JSON.stringify(sendRequest));
      } else if (counterForSendRequest == SEND_REQUEST_TWICE) {
        expect(data.type).to.equal('warning');
        expect(data.code).to.equal(0);

        done();
      }

      counterForSendRequest++;
    });
  });

  it('should reject friend request (Mars)', function (done) {
    var rejectUser = {
      type: 'reject',
      token: tokenClient2,
      rejectId: earthUserId,
    };
    // reject friend request
    client2.emit('friend', JSON.stringify(rejectUser));
    client2.on('rejectFriend', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      //  send friend request again to test accept request
      var sendRequest = {
        type: 'request',
        token: tokenClient1,
        receiverUserId: marsUserId,
      };
      // send friend request to that user
      client1.emit('friend', JSON.stringify(sendRequest));

      done();
    });
  });
  it('should accept friend request (Mars)', function (done) {
    var acceptUser = {
      type: 'accept',
      token: tokenClient2,
      applicantUserId: earthUserId,
      applicantUsername: 'earth',
    };
    // accept friend request
    client2.emit('friend', JSON.stringify(acceptUser));
    client2.on('acceptFriend', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      done();
    });
  });

  it('should remove friend from friends (Mars)', function (done) {
    var acceptUser = {
      type: 'remove',
      token: tokenClient2,
      friendId: earthUserId,
    };
    // remove friend request
    client2.emit('friend', JSON.stringify(acceptUser));
    client2.on('removeFriend', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);

      if (client1.connected) {
        client1.disconnect();
      }
      if (client2.connected) {
        client2.disconnect();
      }

      done();
    });
  });
});
