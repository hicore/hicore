const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../token/verifyToken');
const LevelProgress = require('../models/LevelProgress');
const RankProgress = require('../models/RankProgress');

let levels = [];
let ranks = [];
getLevelRange();
getRankRange();

function updateUserProgress(jo, socket) {
  let success = [];
  let errors = [];
  var xpEvent = 'updateUserXpProgress';
  var skillEvent = 'updateUserSkillProgress';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);
    if (result) {
      var userData = jwt.user;
      if (mongoose.Types.ObjectId.isValid(userData.userId)) {
        if (jo.xp) {
          User.findOneAndUpdate(
            {
              _id: userData.userId,
            },
            {
              $inc: {
                xp: jo.xp,
              },
            },
            { new: true, useFindAndModify: false },
            (err, result) => {
              if (!err) {
                updateLevel(socket, result, userData.userId);
                success.push({
                  type: 'success',
                  msg: 'XP successfully updated',
                  data: { xp: result.xp, level: result.level },
                  code: 0,
                });
                emit(xpEvent, socket, success.pop());
              } else {
                errors.push({
                  type: 'error',
                  msg: err.toString(),
                  code: 0,
                });
                emit(xpEvent, socket, errors.pop());
              }
            }
          );
        } else {
          User.findOneAndUpdate(
            {
              _id: userData.userId,
            },
            {
              $inc: {
                skill: jo.skill,
              },
            },
            { new: true, useFindAndModify: false },
            (err, result) => {
              updateRank(socket, result, userData.userId);

              if (!err) {
                success.push({
                  type: 'success',
                  msg: 'Skill successfully updated',
                  data: { skill: result.skill, rank: result.rank },
                  code: 0,
                });
                emit(skillEvent, socket, success.pop());
              } else {
                errors.push({
                  type: 'error',
                  msg: err.toString(),
                  code: 0,
                });
                emit(skillEvent, socket, errors.pop());
              }
            }
          );
        }
      } else {
        // TODO: can show in admin dashboard
        console.log('Please provide correct Id');
      }
    } else {
      errors.push({
        type: 'error',
        msg: jwt.message,
        code: 3,
      });
      emit(event, socket, errors.pop());
    }
  });
}

async function getLevelRange() {
  levels = await LevelProgress.find({});
}

async function getRankRange() {
  ranks = await RankProgress.find({});
}

module.exports.getLevelRangeNewDataAfterUpdate = () => {
  getLevelRange();
};

module.exports.getRankRangeNewDataAfterUpdate = () => {
  getRankRange();
};

function updateLevel(socket, result, userId) {
  let success = [];
  let errors = [];
  var xpEvent = 'updateUserXpProgress';
  levels.forEach((item) => {
    if (between(result.xp, item.xpFrom, item.to)) {
      if (item.level != result.level) {
        User.findOneAndUpdate(
          {
            _id: userId,
          },
          {
            $set: {
              level: item.level,
            },
          },
          { useFindAndModify: false },
          (err, result) => {
            if (!err) {
              success.push({
                type: 'success',
                msg: 'Level successfully updated',
                data: { level: item.level },
                code: 1,
              });
              emit(xpEvent, socket, success.pop());
            } else {
              errors.push({
                type: 'error',
                msg: err.toString(),
                code: 0,
              });
              emit(xpEvent, socket, errors.pop());
            }
          }
        );
      }
    }
  });
}

function updateRank(socket, result, userId) {
  let success = [];
  let errors = [];
  var skillEvent = 'updateUserSkillProgress';
  ranks.forEach((item) => {
    if (between(result.skill, item.skillFrom, item.to)) {
      console.log(item.rank, result.rank);
      if (item.rank != result.rank) {
        User.findOneAndUpdate(
          {
            _id: userId,
          },
          {
            $set: {
              rank: item.rank,
            },
          },
          { useFindAndModify: false },
          (err, result) => {
            if (!err) {
              success.push({
                type: 'success',
                msg: 'Rank successfully updated',
                data: { rank: item.rank },
                code: 1,
              });
              emit(skillEvent, socket, success.pop());
            } else {
              errors.push({
                type: 'error',
                msg: err.toString(),
                code: 0,
              });
              emit(skillEvent, socket, errors.pop());
            }
          }
        );
      }
    }
  });
}

function between(x, min, max) {
  return x >= min && x < max;
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.updateUserProgress = updateUserProgress;
