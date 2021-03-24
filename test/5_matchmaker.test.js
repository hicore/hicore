const expect = require('chai').expect;
const c = require('config');
const io = require('socket.io-client');

var socketUrl = 'http://localhost:7192?type=client&socketKey=defaultKey';

var client1, client2, client3, client4;
var tokenClient1, tokenClient2, tokenClient3, tokenClient4;
var saturnUserId, jupiterUserId;
var saturnPlaymateId;

var counterForInvite = 0,
  counterForDeny = 0,
  counterForAccept = 0,
  counterForLeave = 0;

const INVITE_OFFLINE_FRIEND = 0,
  INVITE_NOT_AVAILABLE_FRIEND = 1,
  INVITE_ONLINE_FRIEND = 2;

const DENY_NOT_AVAILABLE_PLAYMATE = 0,
  DENY_EXISTING_PLAYMATE = 1;

const ACCEPT_NOT_AVAILABLE_PLAYMATE = 0,
  ACCEPT_EXISTING_PLAYMATE = 1;

const LEAVE_NOT_AVAILABLE_PLAYMATE = 0,
  LEAVE_EXISTING_PLAYMATE = 1;

describe('Authenticate for testing ' + 'MATCHMAKER'.green, function () {
  it('login by deviceId (Saturn)', function (done) {
    loginClient1(done);
  });
  it('login by email (Jupiter)', function (done) {
    loginClient2(done);
  });
  it('login by deviceId (Sun)', function (done) {
    loginClient3(done);
  });
  it('login by deviceId (Neptune)', function (done) {
    loginClient4(done);
  });
});

describe('Matchmaker', function () {
  it('should request match without playmate for room capacity of 1 (free for all)', function (done) {
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
      expect(data).to.have.lengthOf(1);
      client1.disconnect();
      loginClient1(done);
    });
  });

  it('should request match without playmate for room capacity of 2 (free for all)', function (done) {
    var requestMatch = {
      type: 'request',
      token: tokenClient1,
      roomCapacity: 2,
      requestType: 'normal',
      matchMode: 'TDM1',
      requestTeamNumber: 1,
    };

    client1.emit('matchmaker', JSON.stringify(requestMatch));
    client1.on('requestMatch', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(1);
      done();
    });
  });

  it('should cancel match without playmate ', function (done) {
    var cancelMatch = {
      type: 'cancel',
      token: tokenClient1,
    };
    client1.emit('matchmaker', JSON.stringify(cancelMatch));
    client1.on('cancelMatch', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(1);
      done();
    });
  });

  it('should create playmate match ', function (done) {
    var createPlaymateMatch = {
      type: 'createPlaymate',
      token: tokenClient1,
    };
    client1.emit('matchmaker', JSON.stringify(createPlaymateMatch));
    client1.on('createPlaymateMatch', (data) => {
      saturnPlaymateId = data.data.playmateId;
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      // set client2 offline to test invite offline user
      client2.disconnect();
      done();
    });
  });

  it('should invite offline, not available and online friend to match ', function (done) {
    var invitePlaymate = {
      type: 'invite',
      token: tokenClient1,
      friendUserId: jupiterUserId,
      playmateId: saturnPlaymateId,
    };
    client1.emit('matchmaker', JSON.stringify(invitePlaymate));
    client1.on('invitePlaymate', (data) => {
      if (counterForInvite == INVITE_OFFLINE_FRIEND) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(2);
        expect(data.data).to.deep.equal({ status: 0 });
        // back online client2 for next test
        putClient2InMatchmakingToTestNotAvailable();
        // invite for testing not available user
        setTimeout(function () {
          client1.emit('matchmaker', JSON.stringify(invitePlaymate));
        }, 350);
      } else if (counterForInvite == INVITE_NOT_AVAILABLE_FRIEND) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(1);
        expect(data.data).to.deep.equal({ status: 2 });
        // cancel client2 match for testing online user
        var cancelMatch = {
          type: 'cancel',
          token: tokenClient2,
        };
        client2.emit('matchmaker', JSON.stringify(cancelMatch));
        setTimeout(function () {
          // send another invitation to client2
          client1.emit('matchmaker', JSON.stringify(invitePlaymate));
        }, 150);
      } else if (counterForInvite == INVITE_ONLINE_FRIEND) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);
        done();
      }
      counterForInvite++;
    });
  });

  it('should deny playmate match with not available and available playmate', function (done) {
    var denyPlaymate = {
      type: 'deny',
      token: tokenClient2,
      friendUserId: saturnUserId,
      playmateId: 'notAvailable',
    };
    client2.emit('matchmaker', JSON.stringify(denyPlaymate));
    client2.on('denyPlaymate', (data) => {
      if (counterForDeny == DENY_NOT_AVAILABLE_PLAYMATE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(1);
        // deny existing playmate match
        var denyPlaymate = {
          type: 'deny',
          token: tokenClient2,
          friendUserId: saturnUserId,
          playmateId: saturnPlaymateId,
        };
        client2.emit('matchmaker', JSON.stringify(denyPlaymate));
      } else if (counterForDeny == DENY_EXISTING_PLAYMATE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);

        // send another invitation to client2 for testing accept playmate
        var invitePlaymate = {
          type: 'invite',
          token: tokenClient1,
          friendUserId: jupiterUserId,
          playmateId: saturnPlaymateId,
        };
        client1.emit('matchmaker', JSON.stringify(invitePlaymate));

        done();
      }
      counterForDeny++;
    });
  });

  it('should accept playmate match with not available and available playmate', function (done) {
    var acceptPlaymate = {
      type: 'accept',
      token: tokenClient2,
      friendUserId: saturnUserId,
      playmateId: 'notAvailable',
    };
    client2.emit('matchmaker', JSON.stringify(acceptPlaymate));
    client2.on('acceptPlaymate', (data) => {
      if (counterForAccept == ACCEPT_NOT_AVAILABLE_PLAYMATE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(1);
        // accept existing playmate match
        var acceptPlaymate = {
          type: 'accept',
          token: tokenClient2,
          friendUserId: saturnUserId,
          playmateId: saturnPlaymateId,
        };
        client2.emit('matchmaker', JSON.stringify(acceptPlaymate));
      } else if (counterForAccept == ACCEPT_EXISTING_PLAYMATE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);
        done();
      }
      counterForAccept++;
    });
  });

  it('should leave playmate match with not available and available playmate', function (done) {
    var leavePlaymate = {
      type: 'leave',
      token: tokenClient2,
      friendUserId: saturnUserId,
      playmateId: 'notAvailable',
    };
    client2.emit('matchmaker', JSON.stringify(leavePlaymate));
    client2.on('leavePlaymate', (data) => {
      if (counterForLeave == LEAVE_NOT_AVAILABLE_PLAYMATE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(1);
        // accept existing playmate match
        var leavePlaymate = {
          type: 'leave',
          token: tokenClient2,
          friendUserId: saturnUserId,
          playmateId: saturnPlaymateId,
        };
        client2.emit('matchmaker', JSON.stringify(leavePlaymate));
      } else if (counterForLeave == LEAVE_EXISTING_PLAYMATE) {
        expect(data.type).to.equal('success');
        expect(data.code).to.equal(0);

        // accept existing playmate again for next test
        var acceptPlaymate = {
          type: 'accept',
          token: tokenClient2,
          friendUserId: saturnUserId,
          playmateId: saturnPlaymateId,
        };
        client2.emit('matchmaker', JSON.stringify(acceptPlaymate));

        done();
      }
      counterForLeave++;
    });
  });

  it('should request match for full playmate for room capacity of 2 and normal match type (free for all)', function (done) {
    var requestMatch = {
      type: 'request',
      token: tokenClient1,
      playmateId: saturnPlaymateId,
      roomCapacity: 2,
      requestType: 'normal',
      matchMode: 'TDM1',
      requestTeamNumber: 1,
    };

    client1.emit('matchmaker', JSON.stringify(requestMatch));
    client1.on('matchmakingResult', (data) => {
      expect(data).to.have.lengthOf(2);
      done();
    });
  });

  it('should destroy match with playmate ', function (done) {
    var requestMatch = {
      type: 'destroyPlaymate',
      token: tokenClient1,
      playmateId: saturnPlaymateId,
    };

    client1.emit('matchmaker', JSON.stringify(requestMatch));
    client1.on('destroyPlaymateMatch', (data) => {
      expect(data.type).to.equal('success');
      expect(data.code).to.equal(0);
      // disconnect for next test
      client1.disconnect();
      client2.disconnect();

      done();
    });
  });

  it('should create another playmate for testing room capacity of 3 (free for all)', function (done) {
    shouldCreatePlaymateMatchRoom(done, 3);
  });

  it('should create a match for the capacity of 3 ', function (done) {
    var requestMatch = {
      type: 'request',
      token: tokenClient3,
      roomCapacity: 3,
      requestType: 'normal',
      matchMode: 'TDM1',
      requestTeamNumber: 1,
    };

    client3.emit('matchmaker', JSON.stringify(requestMatch));
    client3.on('matchmakingResult', (data) => {
      expect(data).to.have.lengthOf(3);
      expect(data[0].team).to.equal(0); // client 1
      expect(data[1].team).to.equal(0); // client 2
      expect(data[2].team).to.equal(0); // client 3
      client1.disconnect();
      client2.disconnect();
      client3.disconnect();

      done();
    });
  });

  it('should check not playable level range', function (done) {
    shouldCheckForNotPlayableLevel(done);
  });

  it('should check not playable rank range', function (done) {
    shouldCheckForNotPlayableRank(done);
  });

  it('should create two teams for room capacity of 4 (team death match)', function (done) {
    shouldCreateTwoTeams(done, 4, 2);
  });
});

function loginClient1(done) {
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
      done();
    }
  });
}

function loginClient2(done) {
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
      done();
    }
  });
}

function loginClient3(done) {
  client3 = io.connect(socketUrl);

  var userSun = {
    type: 'deviceId',
    deviceId: 'sunDeviceId',
    location: 'Galaxy',
    timezone_utc_offset: '00:00:00',
  };
  client3.emit('authenticate', JSON.stringify(userSun));
  client3.on('authenticateDeviceId', (data) => {
    if (data.msg == 'Login successfully') {
      tokenClient3 = data.token;
      done();
    }
  });
}

function loginClient4(done) {
  client4 = io.connect(socketUrl);

  var userNeptune = {
    type: 'deviceId',
    deviceId: 'neptuneDeviceId',
    location: 'Galaxy',
    timezone_utc_offset: '00:00:00',
  };
  client4.emit('authenticate', JSON.stringify(userNeptune));
  client4.on('authenticateDeviceId', (data) => {
    if (data.msg == 'Login successfully') {
      tokenClient4 = data.token;
      done();
    }
  });
}

function makeSaturnAndJupiterFriend(done) {
  var sendRequest = {
    type: 'request',
    token: tokenClient1,
    receiverUserId: jupiterUserId,
  };
  // send friend request to that user
  client1.emit('friend', JSON.stringify(sendRequest));
  client1.on('requestFriend', (data) => {
    console.log(data);

    var acceptUser = {
      type: 'accept',
      token: tokenClient2,
      applicantUserId: saturnUserId,
      applicantUsername: 'saturn',
    };
    // accept friend request
    client2.emit('friend', JSON.stringify(acceptUser));
    client2.on('acceptFriend', (data) => {
      console.log(data);
      done();
    });
  });
}

function putClient2InMatchmakingToTestNotAvailable() {
  setTimeout(function () {
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

        var requestMatch = {
          type: 'request',
          token: tokenClient2,
          roomCapacity: 2,
          requestType: 'normal',
          matchMode: 'TDM1',
        };

        client2.emit('matchmaker', JSON.stringify(requestMatch));
        client2.on('requestMatch', (data) => {
          expect(data.type).to.equal('success');
          expect(data.code).to.equal(1);
        });
      }
    });
  }, 200);
}

function shouldCreatePlaymateMatchRoom(done, roomCapacity) {
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
                var requestMatch = {
                  type: 'request',
                  token: tokenClient1,
                  playmateId: saturnPlaymateId,
                  roomCapacity: roomCapacity,
                  requestType: 'normal',
                  matchMode: 'TDM1',
                  requestTeamNumber: 1,
                };

                client1.emit('matchmaker', JSON.stringify(requestMatch));
                done();
              });
            });
          });
        }
      });
    }
  });
}

function shouldCheckForNotPlayableLevel(done) {
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
                var requestMatch = {
                  type: 'request',
                  token: tokenClient1,
                  playmateId: saturnPlaymateId,
                  roomCapacity: 2,
                  requestType: 'level',
                  matchMode: 'TDM1',
                  range: -1,
                  requestTeamNumber: 1,
                };

                client1.emit('matchmaker', JSON.stringify(requestMatch));
                client1.on('requestMatch', (data) => {
                  expect(data.type).to.equal('warning');
                  expect(data.code).to.equal(0);
                  expect(data.msg).to.include("level isn't in same range");
                  client1.disconnect();
                  client2.disconnect();
                  done();
                });
              });
            });
          });
        }
      });
    }
  });
}

function shouldCheckForNotPlayableRank(done) {
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
                var requestMatch = {
                  type: 'request',
                  token: tokenClient1,
                  playmateId: saturnPlaymateId,
                  roomCapacity: 2,
                  requestType: 'rank',
                  matchMode: 'TDM1',
                  range: -1,
                  requestTeamNumber: 1,
                };

                client1.emit('matchmaker', JSON.stringify(requestMatch));
                client1.on('requestMatch', (data) => {
                  expect(data.type).to.equal('warning');
                  expect(data.code).to.equal(0);
                  expect(data.msg).to.include("rank isn't in same range");

                  client1.disconnect();
                  client2.disconnect();
                  done();
                });
              });
            });
          });
        }
      });
    }
  });
}

function shouldCreateTwoTeams(done, roomCapacity, numberOfTeams) {
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

          client3 = io.connect(socketUrl);

          var userSun = {
            type: 'deviceId',
            deviceId: 'sunDeviceId',
            location: 'Galaxy',
            timezone_utc_offset: '00:00:00',
          };
          client3.emit('authenticate', JSON.stringify(userSun));
          client3.on('authenticateDeviceId', (data) => {
            if (data.msg == 'Login successfully') {
              tokenClient3 = data.token;

              var requestMatch = {
                type: 'request',
                token: tokenClient3,
                roomCapacity: roomCapacity,
                requestType: 'normal',
                matchMode: 'TDM1',
                requestTeamNumber: numberOfTeams,
              };

              client3.emit('matchmaker', JSON.stringify(requestMatch));
              client3.on('requestMatch', (data) => {
                var requestMatch = {
                  type: 'request',
                  token: tokenClient4,
                  roomCapacity: roomCapacity,
                  requestType: 'normal',
                  matchMode: 'TDM1',
                  requestTeamNumber: numberOfTeams,
                };

                client4.emit('matchmaker', JSON.stringify(requestMatch));
                client4.on('requestMatch', (data) => {
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
                        var requestMatch = {
                          type: 'request',
                          token: tokenClient1,
                          playmateId: saturnPlaymateId,
                          roomCapacity: roomCapacity,
                          requestType: 'normal',
                          matchMode: 'TDM1',
                          requestTeamNumber: numberOfTeams,
                        };
                        client1.emit('matchmaker', JSON.stringify(requestMatch));
                        client1.on('matchmakingResult', (data) => {
                          expect(data[0].team).to.equal(1); // client 2 -Team 1
                          expect(data[1].team).to.equal(1); // client 3 -Team 1
                          expect(data[2].team).to.equal(2); // client 1 -Team 2
                          expect(data[3].team).to.equal(2); // client 2 -Team 2

                          if (client1.connected) {
                            client1.disconnect();
                          }
                          if (client2.connected) {
                            client2.disconnect();
                          }
                          if (client3.connected) {
                            client3.disconnect();
                          }
                          if (client4.connected) {
                            client4.disconnect();
                          }

                          done();
                        });
                      });
                    });
                  });
                });
              });
            }
          });
        }
      });
    }
  });
}
