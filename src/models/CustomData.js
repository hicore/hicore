const mongoose = require('mongoose');

const CustomSchema = new mongoose.Schema(
  {},
  {
    timestamps: true,
  }
);

function CustomData(collection) {
  var collectionName = collection;
  this.Custom = mongoose.model(collection, CustomSchema);
}

module.exports = {
  CustomData,
  CustomSchema,
};

// user: [{
//     id: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     },
//     username: {
//         type: String,
//         default: ''
//     }
// }],
// data: {} // mongoose.Schema.Types.Mixed
