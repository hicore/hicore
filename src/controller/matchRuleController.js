const MatchRule = require('../models/MatchRule');
const verifyToken = require('../token/verifyToken');
const childServer = require('../childServer');

exports.getMatchRules = (req, res) => {
  try {
    verifyToken.checkToken(req.query.token, async (result, data) => {
      if (result) {
        const rules = await MatchRule.find({});
        if (!rules) {
          return res.status(403).json({ err: 'Dont have any rule ' });
        }
        return res.status(200).json({ rules: rules.reverse() });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.addRule = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const mode = req.body.mode;
        const key = req.body.key;
        const value = req.body.value;
        const isExist = await MatchRule.findOne({ mode });
        if (!isExist) {
          const matchRule = new MatchRule({
            mode,
            key,
            value,
          });
          const r = await matchRule.save();
          // send new rules to child server
          childServer.csMatchRules();

          return res.status(200).json({ msg: 'Successfully added' });
        }
        return res.status(403).json({ err: 'Rule is exist for this mode' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteRule = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const rules = req.body.rules;
        const isDeleted = await MatchRule.deleteMany({ _id: { $in: rules } });
        if (!isDeleted) {
          return res.status(406).json({ err: 'Failed' });
        }
        return res.status(200).json({ msg: 'Successfully deleted' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};
