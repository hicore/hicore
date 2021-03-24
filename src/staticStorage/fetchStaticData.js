const verifyToken = require('../token/verifyToken');
const { StaticData } = require('../models/StaticsData');

function fetchStaticData(jo, socket) {
  let success = [];
  let errors = [];

  var event = 'fetchStaticData';

  verifyToken.checkToken(jo.token, (result, data) => {
    if (result) {
      const collection = new StaticData(jo.collection);

      collection.Custom.find({})
        .then((storage) => {
          if (storage.length > 0) {
            success.push({
              type: 'success',
              msg: 'Fetch Data successfully',
              data: storage,
              code: 0,
            });
            emit(event, socket, success.pop());
          } else {
            errors.push({
              type: 'error',
              code: 1,
              msg: `Storage is empty`,
            });
            emit(event, socket, errors.pop());
          }
        })
        .catch((err) => {});
    } else {
      errors.push({
        type: 'error',
        msg: jwt.message,
        code: 0,
      });
      emit(event, socket, errors.pop());
    }
  });
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.fetchStaticData = fetchStaticData;
