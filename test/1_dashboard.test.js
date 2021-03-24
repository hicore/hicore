process.env.DB_NAME = 'test';

let { app, server } = require('../src/app');

let mongoose = require('mongoose');
let chai = require('chai');
let chaiHttp = require('chai-http');

const expect = require('chai').expect;

chai.use(chaiHttp);

let serverStart = false;
let dbStart = false;

let token = '';
let testModeId = '';
let testRuleId = '';
let testCollectionId = '';
let column = {};
let row = {};
let xp = {};
let skill = {};

after((done) => {
  server.close(function () {
    mongoose.connection.db.dropDatabase().then((r) => {
      mongoose.connection.close();
      done();
    });
  });
});

describe('/ login', () => {
  // it('should confirm the server is started', (done) => {
  //   app.on('ready', function () {
  //     done();
  //   });
  // });

  it('it should create new admin', (done) => {
    chai
      .request(app)
      .post('/register')
      .end((err, res) => {
        expect(res).to.have.status(201);
        done();
      });
  });

  it('it should login failed', (done) => {
    user = {
      username: 'wrong',
      password: 'wrong',
    };
    chai
      .request(app)
      .post('/login')
      .send(user)
      .end((err, res) => {
        expect(res).to.have.status(401);
        done();
      });
  });
  it('it should login success', (done) => {
    user = {
      username: 'admin',
      password: 'admin',
    };
    chai
      .request(app)
      .post('/login')
      .send(user)
      .end((err, res) => {
        expect(res).to.have.status(201);
        token = res.body.token;
        done();
      });
  });
});

describe('/ match mode', () => {
  it('it should add new match mode', (done) => {
    mode = {
      token,
      mode: 'testMode',
    };
    chai
      .request(app)
      .post('/match-mode')
      .send(mode)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should add match mode which is exist', (done) => {
    mode = {
      token,
      mode: 'testMode',
    };
    chai
      .request(app)
      .post('/match-mode')
      .send(mode)
      .end((err, res) => {
        expect(res).to.have.status(406);
        done();
      });
  });

  it('it should get match modes', (done) => {
    chai
      .request(app)
      .get('/match-mode')
      .query({
        token,
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        res.body.modes.forEach((element) => {
          if (element.mode === 'testMode') {
            testModeId = element._id;
          }
        });

        expect(res.body.modes).to.be.not.empty;
        done();
      });
  });

  it('it should delete match mode', (done) => {
    chai
      .request(app)
      .delete('/match-mode')
      .send({ token, modes: [testModeId] })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});

describe('/ match rule', () => {
  it('it should add match rule', (done) => {
    rule = {
      token,
      mode: 'testMode',
      key: 'kill',
      value: 20,
    };
    chai
      .request(app)
      .post('/match-rule')
      .send(rule)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should add match rule which is exist', (done) => {
    rule = {
      token,
      mode: 'testMode',
      key: 'kill',
      value: 20,
    };
    chai
      .request(app)
      .post('/match-rule')
      .send(rule)
      .end((err, res) => {
        expect(res).to.have.status(403);
        done();
      });
  });

  it('it should get match rules', (done) => {
    chai
      .request(app)
      .get('/match-rule')
      .query({
        token,
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        res.body.rules.forEach((element) => {
          if (element.mode === 'testMode') {
            testRuleId = element._id;
          }
        });

        expect(res.body.rules).to.be.not.empty;
        done();
      });
  });

  it('it should delete match rule', (done) => {
    chai
      .request(app)
      .delete('/match-rule')
      .send({ token, rules: [testRuleId] })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});

describe('/ statics', () => {
  it('it should add collection', (done) => {
    collection = {
      token,
      name: 'shopItems',
    };
    chai
      .request(app)
      .post('/static-class')
      .send(collection)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should add collection which is exist', (done) => {
    collection = {
      token,
      name: 'shopItems',
    };
    chai
      .request(app)
      .post('/static-class')
      .send(collection)
      .end((err, res) => {
        expect(res).to.have.status(406);
        done();
      });
  });

  it('it should get collections', (done) => {
    chai
      .request(app)
      .get('/static-class')
      .query({
        token,
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        res.body.classes.forEach((element) => {
          if (element.className === 'shopItems') {
            testCollectionId = element._id;
          }
        });

        expect(res.body.classes).to.be.not.empty;
        done();
      });
  });

  it('it should add column to collection', (done) => {
    let column = {
      token,
      collection: { _id: testCollectionId, className: 'shopItems' },
      columnName: 'item1',
      value: '',
    };
    chai
      .request(app)
      .post('/static-class-column')
      .send(column)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should get columns', (done) => {
    chai
      .request(app)
      .get('/static-class-column')
      .query({
        token,
        collectionName: 'shopItems',
      })
      .end((err, res) => {
        column = res.body.columns[0];
        expect(res).to.have.status(200);
        expect(res.body.columns).to.be.not.empty;
        done();
      });
  });

  it('it should add row', (done) => {
    let row = {
      token,
      columns: [column],
      collectionName: 'shopItems',
    };
    chai
      .request(app)
      .post('/static-class-row')
      .send(row)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should get rows', (done) => {
    chai
      .request(app)
      .get('/static-class-row')
      .query({
        token,
        collectionName: 'shopItems',
      })
      .end((err, res) => {
        row = res.body.rows[0];
        expect(res).to.have.status(200);
        expect(res.body.rows).to.be.not.empty;
        done();
      });
  });

  it('it should update row', (done) => {
    let updateRow = {
      token,
      collectionName: 'shopItems',
      rowId: row._id,
      columnName: 'item1',
      value: 'newStringValue',
    };
    chai
      .request(app)
      .post('/static-class-row-update')
      .send(updateRow)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should delete column', (done) => {
    chai
      .request(app)
      .delete('/static-class-column')
      .send({
        token,
        collection: { _id: testCollectionId, className: 'shopItems' },
        column: column,
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should delete row', (done) => {
    chai
      .request(app)
      .delete('/static-class-row')
      .send({
        token,
        collectionName: 'shopItems',
        rows: [row._id],
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should delete collection', (done) => {
    chai
      .request(app)
      .delete('/static-class')
      .send({
        token,
        class: { _id: testCollectionId, className: 'shopItems' },
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should create collection for testing static storage', (done) => {
    let collection = {
      token,
      name: 'weapon',
    };
    chai
      .request(app)
      .post('/static-class')
      .send(collection)
      .end((err, res) => {
        let column = {
          token,
          collection: { _id: testCollectionId, className: 'weapon' },
          columnName: 'weaponName',
          value: '',
        };
        chai
          .request(app)
          .post('/static-class-column')
          .send(column)
          .end((err, res) => {
            let row = {
              token,
              columns: [column],
              collectionName: 'weapon',
            };
            chai
              .request(app)
              .post('/static-class-row')
              .send(row)
              .end((err, res) => {
                expect(res).to.have.status(200);
                done();
              });
          });
      });
  });
});

describe('/ progress rules', () => {
  it('it should add xp for level', (done) => {
    let levelXp = {
      token,
      xpFrom: 0,
      to: 100,
      level: 1,
    };
    chai
      .request(app)
      .post('/progress-level')
      .send(levelXp)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should get xps', (done) => {
    chai
      .request(app)
      .get('/progress-level')
      .query({
        token,
      })
      .end((err, res) => {
        xp = res.body.xps[res.body.xps.length - 1];
        expect(res).to.have.status(200);
        expect(res.body.xps).to.be.not.empty;
        done();
      });
  });

  it('it should update xp ', (done) => {
    let levelXp = {
      token,
      xpId: xp._id,
      xpColumn: 'to',
      value: 23000,
    };
    chai
      .request(app)
      .post('/progress-level-update')
      .send(levelXp)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should delete xp', (done) => {
    chai
      .request(app)
      .delete('/progress-level')
      .send({ token, xps: [xp._id] })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should add skill for rank', (done) => {
    let rankSkill = {
      token,
      skillFrom: 0,
      to: 100,
      rank: 1,
    };
    chai
      .request(app)
      .post('/progress-rank')
      .send(rankSkill)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should get skills', (done) => {
    chai
      .request(app)
      .get('/progress-rank')
      .query({
        token,
      })
      .end((err, res) => {
        skill = res.body.skills[res.body.skills.length - 1];
        expect(res).to.have.status(200);
        expect(res.body.skills).to.be.not.empty;
        done();
      });
  });

  it('it should update skill ', (done) => {
    let rankSkill = {
      token,
      skillId: skill._id,
      skillColumn: 'to',
      value: 23000,
    };
    chai
      .request(app)
      .post('/progress-rank-update')
      .send(rankSkill)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should delete skill', (done) => {
    chai
      .request(app)
      .delete('/progress-rank')
      .send({ token, skills: [skill._id] })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should add xp for level for updating user progress test', (done) => {
    let levelXp = {
      token,
      xpFrom: 0,
      to: 100,
      level: 1,
    };
    chai
      .request(app)
      .post('/progress-level')
      .send(levelXp)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('it should add skill for rank for updating user progress test', (done) => {
    let rankSkill = {
      token,
      skillFrom: 0,
      to: 100,
      rank: 1,
    };
    chai
      .request(app)
      .post('/progress-rank')
      .send(rankSkill)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});
