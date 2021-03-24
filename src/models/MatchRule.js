const mongoose = require('mongoose');

const matchRuleSchema = mongoose.Schema(
  {
    mode: {
      type: String,
      require: true,
    },
    key: {
      type: String,
      require: true,
    },
    value: {},
  },
  {
    timestamps: true,
  }
);

const RuleMode = mongoose.model('MatchRule', matchRuleSchema);

module.exports = RuleMode;
