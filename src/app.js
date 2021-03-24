const socket = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const config = require('../config/config');

require('colors');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

let isDBStarted = false;
let isExpressStared = false;

if (process.env.NODE_ENV === 'test') {
  app.use(morgan('test'));
}
// Dashboard
const dashboard = require('./routes/dashboard');
app.use('/', dashboard);
// Config

const {
  db: { host, port, name, username, password },
} = config;

// Connect to the MongoDB
const connectionString = `mongodb://${host}:${port}/${name}?authSource=admin`;

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    user: username,
    pass: password,
  })
  .then(() => app.emit('started', 'db'))
  .catch((err) => console.log(err));

// Setup port
const PORT = config.socket.port;
const server = app.listen(PORT, () => app.emit('started', 'server'));

// Socket Io
global.io = socket(server);

app.on('started', function (data) {
  // Create admin

  if (data === 'server') {
    console.log(`----- Mother Ship server started on port ${PORT} -----`.yellow);
    isExpressStared = true;
  }
  if (data === 'db') {
    console.log('----- MongoDB connected -----'.yellow);
    isDBStarted = true;
  }
  if (isExpressStared && isDBStarted) {
    app.emit('ready');
  }
});

require('./server/server');

module.exports = { app, server };
