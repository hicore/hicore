const mongoose = require('mongoose');

const StaticSchema = new mongoose.Schema(
  {},
  {
    timestamps: true,
  }
);

function StaticData(className) {
  var collectionName = className;
  this.Custom = mongoose.model(className, StaticSchema, collectionName);
}

module.exports = {
  StaticData,
  StaticSchema,
};
