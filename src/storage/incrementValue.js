const verifyToken = require('../token/verifyToken');
const { CustomData, CustomSchema } = require('../models/CustomData');

function incrementValue(jo, socket) {
  let success = [];
  let errors = [];
  let setNewValue = [];

  var event = 'incrementValue';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      // add user to schema
      CustomSchema.add({ ['userId']: {} });
      // add data to schema
      for (var key in jo.data) {
        CustomSchema.add({ [key]: {} });
      }

      const collectionObject = new CustomData(jo.class);

      collectionObject.Custom.updateOne(
        {
          userId: userData.userId,
        },
        {
          $inc: jo.data,
        },
        (err, result) => {
          if (!err) {
            success.push({
              type: 'success',
              msg: 'Value increment successfully',
              data: {},
              code: 1,
            });

            emit(event, socket, success.pop());
          } else {
            errors.push({
              type: 'error',
              msg: err.message,
              code: 1,
            });
            emit(event, socket, errors.pop());
          }
        }
      );
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

exports.incrementValue = incrementValue;
