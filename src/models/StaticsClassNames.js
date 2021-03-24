const mongoose = require('mongoose');

const StaticClassNamesSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      require: true,
    },
    columns: {
      type: Object,
      require: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ClassNames = mongoose.model('StaticClassName', StaticClassNamesSchema);

module.exports = ClassNames;
