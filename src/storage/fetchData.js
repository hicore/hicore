const verifyToken = require('../token/verifyToken');
const { CustomData, CustomSchema } = require('../models/CustomData');

function fetchData(jo, socket) {
  let success = [];
  let errors = [];

  var event = 'fetchData';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      const collectionObject = new CustomData(jo.class);

      collectionObject.Custom.findOne({
        userId: userData.userId,
      })
        .then((user) => {
          if (user) {
            success.push({
              type: 'success',
              msg: 'Fetch Data successfully',
              data: user,
              code: 0,
            });

            emit(event, socket, success.pop());
          } else {
            errors.push({
              type: 'error',
              code: 2,
              msg: `User don't have any collection with this name: ${jo.class}`,
            });
            emit(event, socket, errors.pop());
          }
        })
        .catch((err) => {
          errors.push({
            type: 'error',
            code: 1,
            msg: err.toString(),
          });
          emit(event, socket, errors.pop());
          console.log(err.toString().red);
        });
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

exports.fetchData = fetchData;
