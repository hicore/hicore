const verifyToken = require('../token/verifyToken');
const { CustomData, CustomSchema } = require('../models/CustomData');

function addObject(jo, socket) {
  verifyToken.checkToken(jo.token, (result, data) => {
    var jwt = JSON.parse(data);

    if (result) {
      var userData = jwt.user;

      const collectionObject = new CustomData(jo.collection);

      collectionObject.Custom.findOne({
        userId: userData.userId,
      }).then((user) => {
        if (!user) {
          createNewCollection(socket, userData, collectionObject, jo.data);
        } else {
          updateExistingCollection(socket, userData, collectionObject, jo.data);
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

function createNewCollection(socket, userData, collectionObject, data) {
  let success = [];
  let errors = [];

  var event = 'addObject';

  let newRow = {};
  // add user to schema
  CustomSchema.add({ ['userId']: {} });
  newRow = Object.assign({ ['userId']: userData.userId }, newRow);
  // add data to schema
  for (var key in data) {
    CustomSchema.add({ [key]: {} });
    newRow = Object.assign({ [key]: data[key] }, newRow);
  }

  const newCustom = collectionObject.Custom(newRow);
  newCustom
    .save()
    .then(() => {
      success.push({
        type: 'success',
        msg: 'Create collection successfully',
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
function updateExistingCollection(socket, userData, collectionObject, data) {
  let success = [];
  let errors = [];

  var event = 'addObject';
  // add user to schema
  CustomSchema.add({ ['userId']: {} });
  // add data to schema
  for (var key in data) {
    CustomSchema.add({ [key]: {} });
  }

  collectionObject.Custom.updateOne({ userId: userData.userId }, { $set: data }, (err, result) => {
    if (!err) {
      success.push({
        type: 'success',
        msg: 'Collection updated successfully',
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
  });
}

function emit(event, socket, msg) {
  socket.emit(event, msg);
}

exports.addObject = addObject;
