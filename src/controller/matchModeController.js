const MatchMode = require('../models/MatchMode');
const verifyToken = require('../token/verifyToken');

exports.getMatchModes = (req, res) => {
  try {
    verifyToken.checkToken(req.query.token, async (result, data) => {
      if (result) {
        const modes = await MatchMode.find({});

        if (!modes) {
          return res.status(403).json({ err: 'Dont have any mode ' });
        }
        return res.status(200).json({ modes: modes.reverse() });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};
exports.addMode = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const mode = req.body.mode;
        const isExist = await MatchMode.findOne({ mode });
        if (!isExist) {
          const matchMode = new MatchMode({
            mode,
          });
          const r = await matchMode.save();
          return res.status(200).json({ msg: 'Successfully added' });
        }
        return res.status(406).json({ err: 'This mode is exist' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};
exports.deleteMode = async (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const modes = req.body.modes;
        const isDeleted = await MatchMode.deleteMany({ _id: { $in: modes } });
        if (!isDeleted) {
          return res.status(403).json({ err: 'Failed' });
        }
        return res.status(200).json({ msg: 'Successfully deleted' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};
