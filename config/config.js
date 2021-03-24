const conf = {
  socket: {
    port: parseInt(process.env.SERVER_PORT) || 7192,
    serverKey: process.env.SOCKET_SERVER_KEY || 'defaultKey',
    socketKey: process.env.SOCKET_KEY || 'defaultKey',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 27017,
    name: process.env.DB_NAME || 'db',
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
  },
  child: {
    childServerKey: process.env.CHILD_SERVER_KEY || 'defaultChildServerKey',
  },
  dashboard: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
  },
  token: {},
  shortid: '',
};

module.exports = conf;
