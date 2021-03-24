const { fetchStaticData: fetchStaticData } = require('./fetchStaticData');

module.exports.staticStorage = (jo, socket) => {
  switch (jo.type) {
    case 'fetch':
      fetchStaticData(jo, socket);
      break;

    default:
      break;
  }
};
