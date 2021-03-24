const expect = require('chai').expect;
const io = require('socket.io-client');

var socketUrl = 'http://localhost:7192?type=client&socketKey=defaultKey';

var client1, client2;
var tokenClient1, tokenClient2;

const UPDATE_USERNAME_EXIST = 0,
  UPDATE_USERNAME = 1,
  UPDATE_USERNAME_TO_DEFAULT_FOR_NEXT_TEST = 2;

const UPDATE_EMAIL_EXIST = 0,
  UPDATE_EMAIL = 1,
  UPDATE_EMAIL_TO_DEFAULT_FOR_NEXT_TEST = 2;

const WRONG_PASS = 0,
  WRONG_PASS_LENGTH = 1,
  UPDATE_PASSWORD = 2,
  UPDATE_PASSWORD_TO_DEFAULT_FOR_NEXT_TEST = 3;

const UPDATE_USER_XP_PROGRESS = 0,
  UPDATE_USER_LEVEL = 1;

const UPDATE_USER_SKILL_PROGRESS = 0,
  UPDATE_USER_RANK = 1;

var counterForUpdateUsername = 0,
  counterForUpdateEmail = 0,
  counterForUpdatePassword = 0,
  counterForUpdateXpProgress = 0,
  counterForUpdateSkillProgress = 0;

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

describe('Authenticate for testing ' + 'UPDATE'.green, function () {
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
        done();
      }
    });
  });
});

describe('Update account', function () {
  // update profile info
  it('should update user profile (client 1)', function (done) {
    var profile = {
      type: 'profile',
      token: tokenClient1,
      lang: 'en',
      location: 'Galaxy',
      timezone_utc_offset: '00:00:00',
      avatar_url: 'www.jupiterserver.io/JupiterDeviceId',
      display_name: 'JupiterDeviceId',
    };

    client1.emit('update', JSON.stringify(profile));
    client1.on('updateUserProfile', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      done();
    });
  });
  // update username with an existing  username
  it('should update username (client 1)', function (done) {
    var usernameExist = {
      type: 'username',
      token: tokenClient1,
      username: 'jupiter',
    };

    client1.emit('update', JSON.stringify(usernameExist));
    client1.on('updateUserUsername', (data) => {
      if (counterForUpdateUsername == UPDATE_USERNAME_EXIST) {
        expect(data.type).to.equal('error'); // TODO: it should be warning
        expect(data.code).to.equal(0);

        var newUsername = {
          type: 'username',
          token: tokenClient1,
          username: 'saturnMoon',
        };
        client1.emit('update', JSON.stringify(newUsername));
      } else if (counterForUpdateUsername == UPDATE_USERNAME) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);

        // setup for next test
        var defaultUsername = {
          type: 'username',
          token: tokenClient1,
          username: 'saturn',
        };
        client1.emit('update', JSON.stringify(defaultUsername));
      } else if (counterForUpdateUsername == UPDATE_USERNAME_TO_DEFAULT_FOR_NEXT_TEST) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);
        counterForUpdateUsername = 0;
        done();
      }
      counterForUpdateUsername++;
    });
  });
  // update email
  it('should update email (client 1)', function (done) {
    var emailExist = {
      type: 'email',
      token: tokenClient1,
      email: 'jupiter@server.com',
    };

    client1.emit('update', JSON.stringify(emailExist));
    client1.on('updateUserEmail', (data) => {
      if (counterForUpdateEmail == UPDATE_EMAIL_EXIST) {
        expect(data.type).to.equal('error'); // TODO: it should be warning
        expect(data.code).to.equal(1);

        var newEmail = {
          type: 'email',
          token: tokenClient1,
          email: 'jupitermoon@server.com',
        };

        client1.emit('update', JSON.stringify(newEmail));
      } else if (counterForUpdateEmail == UPDATE_EMAIL) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);

        //setup for next test
        var defaultEmail = {
          type: 'email',
          token: tokenClient1,
          email: 'saturn@server.com',
        };

        client1.emit('update', JSON.stringify(defaultEmail));
      } else if (counterForUpdateEmail == UPDATE_EMAIL_TO_DEFAULT_FOR_NEXT_TEST) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);
        counterForUpdateEmail = 0;
        done();
      }

      counterForUpdateEmail++;
    });
  });
  // update password
  it('should update password (client 2)', function (done) {
    var wrongPass = {
      type: 'password',
      token: tokenClient2,
      oldPassword: 'wrongpass',
      newPassword: '87654321',
    };

    client2.emit('update', JSON.stringify(wrongPass));
    client2.on('updateUserPassword', (data) => {
      if (counterForUpdatePassword == WRONG_PASS) {
        expect(data.type).to.equal('error'); // TODO: it should be warning
        expect(data.code).to.equal(3);

        var wrongLength = {
          type: 'password',
          token: tokenClient2,
          oldPassword: '12345678',
          newPassword: 'wrong',
        };

        client2.emit('update', JSON.stringify(wrongLength));
      } else if (counterForUpdatePassword == WRONG_PASS_LENGTH) {
        expect(data.type).to.equal('error'); // TODO: it should be warning
        expect(data.code).to.equal(1);

        var newPassword = {
          type: 'password',
          token: tokenClient2,
          oldPassword: '12345678',
          newPassword: '87654321',
        };

        client2.emit('update', JSON.stringify(newPassword));
      } else if (counterForUpdatePassword == UPDATE_PASSWORD) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);

        // setup for next text
        var defaultPassword = {
          type: 'password',
          token: tokenClient2,
          oldPassword: '87654321',
          newPassword: '12345678',
        };

        client2.emit('update', JSON.stringify(defaultPassword));
      } else if (counterForUpdatePassword == UPDATE_PASSWORD_TO_DEFAULT_FOR_NEXT_TEST) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);
        counterForUpdatePassword = 0;

        done();
      }
      counterForUpdatePassword++;
    });
  });
});

describe('Update user progress', function () {
  it('should update user xp', function (done) {
    var progress = {
      type: 'progress',
      token: tokenClient1,
      xp: 50,
    };

    client1.emit('update', JSON.stringify(progress));
    client1.on('updateUserXpProgress', (data) => {
      if (counterForUpdateXpProgress == UPDATE_USER_XP_PROGRESS) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);
      } else if (counterForUpdateXpProgress == UPDATE_USER_LEVEL) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(1);

        done();
      }
      counterForUpdateXpProgress++;
    });
  });

  it('should update user skill', function (done) {
    var progress = {
      type: 'progress',
      token: tokenClient2,
      skill: 50,
    };

    client2.emit('update', JSON.stringify(progress));
    client2.on('updateUserSkillProgress', (data) => {
      if (counterForUpdateSkillProgress == UPDATE_USER_SKILL_PROGRESS) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);
      } else if (counterForUpdateSkillProgress == UPDATE_USER_RANK) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(1);

        if (client1.connected) {
          client1.disconnect();
        }

        if (client2.connected) {
          client2.disconnect();
        }

        done();
      }
      counterForUpdateSkillProgress++;
    });
  });
});
