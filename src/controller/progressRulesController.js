const LevelProgress = require('../models/LevelProgress');
const RankProgress = require('../models/RankProgress');
const verifyToken = require('../token/verifyToken');
const updateUserProgress = require('../users/updateUserProgress');

exports.getXps = (req, res) => {
  try {
    verifyToken.checkToken(req.query.token, async (result, data) => {
      if (result) {
        const xps = await LevelProgress.find({});

        if (!xps) {
          return res.status(403).json({ err: 'Dont have any xp' });
        }
        return res.status(200).json({ xps: xps });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.addXp = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const xpFrom = req.body.xpFrom;
        const to = req.body.to;
        const level = req.body.level;
        const progress = new LevelProgress({
          xpFrom,
          to,
          level,
        });
        const result = await progress.save();

        if (result != null) {
          updateUserProgress.getLevelRangeNewDataAfterUpdate();
          return res.status(200).json({ msg: 'Successfully added' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteXps = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const xps = req.body.xps;
        const isDeleted = await LevelProgress.deleteMany({ _id: { $in: xps } });

        if (isDeleted.deletedCount > 0) {
          return res.status(200).json({ msg: 'Successfully deleted' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.updateXpRow = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const xpId = req.body.xpId;
        const xpColumn = req.body.xpColumn;
        const value = req.body.value;

        const isUpdateRow = await LevelProgress.updateMany(
          { _id: xpId },
          { $set: { [xpColumn]: parseFloat(value) } }
        );

        if (isUpdateRow.nModified === 1) {
          return res.status(200).json({ msg: 'Successfully Updated' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.getSkills = (req, res) => {
  try {
    verifyToken.checkToken(req.query.token, async (result, data) => {
      if (result) {
        const skills = await RankProgress.find({});

        if (!skills) {
          return res.status(403).json({ err: 'Dont have any skill' });
        }
        return res.status(200).json({ skills: skills });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.addSkill = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const skillFrom = req.body.skillFrom;
        const to = req.body.to;
        const rank = req.body.rank;
        const progress = new RankProgress({
          skillFrom,
          to,
          rank,
        });
        const result = await progress.save();

        if (result != null) {
          updateUserProgress.getRankRangeNewDataAfterUpdate();
          return res.status(200).json({ msg: 'Successfully added' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteSkills = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const skills = req.body.skills;
        const isDeleted = await RankProgress.deleteMany({ _id: { $in: skills } });
        if (isDeleted.deletedCount > 0) {
          return res.status(200).json({ msg: 'Successfully deleted' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.updateSkillRow = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const skillId = req.body.skillId;
        const skillColumn = req.body.skillColumn;
        const value = req.body.value;

        const isUpdateRow = await RankProgress.updateMany(
          { _id: skillId },
          { $set: { [skillColumn]: parseFloat(value) } }
        );

        if (isUpdateRow.nModified === 1) {
          return res.status(200).json({ msg: 'Successfully Updated' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};
