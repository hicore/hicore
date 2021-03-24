const verifyToken = require('../token/verifyToken');
const CustomData = require('../models/CustomData');

function catchData(jo, socket) {
  let success = [];
  let errors = [];

  var event = 'catchData'; // FIXME change catchData name to get or fetch

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      const classObject = new CustomData(jo.class);

      classObject.Custom.findOne({
        'user.id': userData.userId,
      })
        .then((user) => {
          if (user) {
            success.push({
              type: 'success',
              msg: 'Catch Data successfully',
              data: user.data,
              code: 0,
            });

            emit(event, socket, success.pop());
          } else {
            errors.push({
              type: 'error',
              code: 2,
              msg: `User don't have any class with this name: ${jo.class}`,
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

exports.catchData = catchData;
