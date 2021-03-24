const mongoose = require('mongoose');

const RankSchema = new mongoose.Schema(
  {
    skillFrom: {
      type: Number,
      default: 0,
    },
    to: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
const Rank = mongoose.model('rank', RankSchema);

module.exports = Rank;
