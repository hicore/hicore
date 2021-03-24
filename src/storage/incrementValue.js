const verifyToken = require('../token/verifyToken');
const CustomData = require('../models/CustomData');

function incrementValue(jo, socket) {
  let success = [];
  let errors = [];
  let setNewValue = [];

  var event = 'incrementValue';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      const classObject = new CustomData(jo.class);
      // Generate the keys for using in $set => data.$.key for update or set new value to db;
      for (var key in jo.data) {
        var theKey = 'data' + '.$.' + key.toString();
        setNewValue.push({ [theKey]: jo.data[key] });
      }
      // Merge multiple objects inside the setNewValue
      var finalNewValues = setNewValue.reduce((r, c) => Object.assign(r, c), {});

      classObject.Custom.updateOne(
        {
          'user.id': userData.userId,
        },
        {
          $inc: finalNewValues,
        },
        (err, result) => {
          console.log(err, result);

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
