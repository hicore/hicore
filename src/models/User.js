const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    display_name: {
      type: String,
      required: false,
    },
    deviceId: {
      type: String,
      required: false,
      default: '',
      unique: false,
    },
    username: {
      type: String,
      required: false,
      lowercase: true,
      default: '',
      unique: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      unique: false,
    },
    password: {
      type: String,
      required: false,
    },
    avatar_url: {
      type: String,
      required: false,
    },
    status: {
      type: Number,
      default: 0, // 0 => offline - 1 => online - 2 => inMatchmaking - 3 => inGame
    },
    level: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    lang: {
      type: String,
      required: false,
      default: 'en',
    },
    location: {
      type: String,
      required: true,
    },
    xp: {
      type: Number,
      default: 0,
    },
    skill: {
      type: Number,
      default: 0,
    },
    game_info: [
      {
        game_played: {
          type: Number,
          default: 0,
        },
        game_wins: {
          type: Number,
          default: 0,
        },
        game_losses: {
          type: Number,
          default: 0,
        },
      },
    ],
    timezone_utc_offset: {
      type: String,
      required: true,
    },
    sent_friend_request: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    friend_request: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        username: {
          type: String,
          default: '',
        },
      },
    ],
    friend_list: [
      {
        friend_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        friend_username: {
          type: String,
          default: '',
        },
      },
    ],
    total_friend_request: {
      type: Number,
      default: 0,
    },
    facebook_id: {
      type: String,
      required: false,
    },
    google_id: {
      type: String,
      required: false,
    },
    socketId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model('User', UserSchema);

module.exports = User;
