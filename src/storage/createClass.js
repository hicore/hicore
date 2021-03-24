const verifyToken = require('../token/verifyToken');
const CustomData = require('../models/CustomData');

function createClass(jo, socket) {
  let success = [];
  let errors = [];

  var event = 'createClass';

  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      const classObject = new CustomData(jo.class);

      classObject.Custom.findOne({
        'user.id': userData.userId,
      }).then((user) => {
        if (user) {
          success.push({
            type: 'success',
            msg: 'Class exist, if you want update or add new value, you should use update method',
            data: {},
            code: 1,
          });

          emit(event, socket, success.pop());
        } else {
          var newData = new classObject.Custom({
            user: {
              id: userData.userId,
              username: userData.username,
            },
            data: [jo.data],
          });
          newData
            .save()
            .then((user) => {
              success.push({
                type: 'success',
                msg: 'Class create successfully',
                data: {},
                code: 0,
              });

              emit(event, socket, success.pop());
            })
            .catch((err) => {
              errors.push({
                type: 'error',
                code: 1,
                msg: err.toString(),
              });
              emit(event, socket, errors.pop());
            });
        }
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

exports.createClass = createClass;
