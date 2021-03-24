const mongoose = require('mongoose');

const LevelSchema = new mongoose.Schema(
  {
    xpFrom: {
      type: Number,
      default: 0,
    },
    to: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
const Level = mongoose.model('level', LevelSchema);

module.exports = Level;
