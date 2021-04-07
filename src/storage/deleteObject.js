const verifyToken = require('../token/verifyToken');
const { CustomData, CustomSchema } = require('../models/CustomData');

function deleteObject(jo, socket) {
  let success = [];
  let errors = [];

  var event = 'deleteObject';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      // add user to schema
      CustomSchema.add({ ['userId']: {} });
      // add data to schema
      for (var key in jo.keys) {
        CustomSchema.add({ [key]: {} });
      }

      const classObject = new CustomData(jo.class);
      console.log(jo.keys);
      classObject.Custom.updateOne(
        {
          userId: userData.userId,
        },
        { $unset: jo.keys },
        (err, result) => {
          console.log(err, result);

          if (!err) {
            success.push({
              type: 'success',
              msg: 'Object deleted successfully',
              data: {},
              code: 0,
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
    }
  });
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.deleteObject = deleteObject;
