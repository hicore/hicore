const mongoose = require('mongoose');

const matchModeSchema = mongoose.Schema(
  {
    mode: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const MatchMode = mongoose.model('MatchMode', matchModeSchema);

module.exports = MatchMode;
