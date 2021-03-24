const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

//token config
const tokenAlgorithm = config.get('token.algorithm');
const tokenExpireTime = config.get('token.expiresIn');

const fs = require('fs');
// use in jwt
var privateKEY = fs.readFileSync('./keys/private.key', 'utf8');

const adminSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

adminSchema.pre('save', async function (next) {
  const admin = this;
  if (admin.isModified('password')) {
    admin.password = await bcrypt.hash(admin.password, 8);
  }
  next();
});

adminSchema.methods.generateAuthToken = async function () {
  const admin = this;
  const token = jwt.sign({ _id: admin._id, username: admin.username }, privateKEY, {
    algorithm: tokenAlgorithm,
    expiresIn: tokenExpireTime,
  });

  admin.tokens = admin.tokens.concat({ token });
  await admin.save();
  return token;
};

adminSchema.statics.findByCredentials = async (username, password) => {
  const admin = await Admin.findOne({ username: username });
  if (!admin) {
    throw new Error({ error: 'Invalid login details' });
  }
  const isPasswordMatch = await bcrypt.compare(password, admin.password);

  if (!isPasswordMatch) {
    throw new Error({ error: 'Invalid login details' });
  }
  return admin;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
