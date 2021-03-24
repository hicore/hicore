const mongoose = require('mongoose');


const UserDataSchema = new mongoose.Schema({

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
const UserData = mongoose.model('UserData', UserDataSchema);

module.exports = UserData;