const mongoose = require('mongoose');


const CustomSchema = new mongoose.Schema({

    user: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: {
            type: String,
            default: ''
        }
    }],
    data: {} // mongoose.Schema.Types.Mixed

},{
    timestamps: true
});

function User(className) {
      this.Custom = mongoose.model(className, CustomSchema);
  }
  
module.exports = User;