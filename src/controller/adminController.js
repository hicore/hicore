const Admin = require('../models/Admin');
const config = require('../../config/config');

const {
  dashboard: { username, password },
} = config;

exports.registerNewAdmin = async (req, res) => {
  try {
    let isAdmin = await Admin.find({ username });

    if (isAdmin.length >= 1) {
      return res.status(200).json({ msg: 'Admin exist' });
    }
    const admin = new Admin({
      username: username,
      password: password,
    });
    await admin.save();
    await admin.generateAuthToken();
    res.status(201).json();
    console.log('----- Admin user is created -----'.green);
  } catch (error) {
    console.log(error);
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const admin = await Admin.findByCredentials(username, password);
    const token = await admin.generateAuthToken();
    res.status(201).json({ admin, token });
  } catch (error) {
    res.status(401).json({ err: 'Login failed. Check your username and password' });
  }
};
exports.getAdminDetails = async (req, res) => {
  await res.json(req.adminData);
};
