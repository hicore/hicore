const verifyToken = require('../token/verifyToken');
const CustomData = require('../models/CustomData');

function updateClass(jo, socket) {
  let success = [];
  let errors = [];
  let setNewValue = [];

  var event = 'updateClass';

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

      console.log(jo.data);
      console.log(finalNewValues);

      classObject.Custom.updateOne(
        {
          'user.id': userData.userId,
        },
        {
          $set: finalNewValues,
        },
        (err, result) => {
          console.log(err, result);

          if (!err) {
            success.push({
              type: 'success',
              msg: 'Class updated successfully',
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

exports.updateClass = updateClass;
