const { createClass: createClass } = require('./createClass');
const { updateClass: updateClass } = require('./updateClass');
const { incrementValue: incrementValue } = require('./incrementValue');
const { catchData: catchData } = require('./catchData');
const { deleteObject: deleteObject } = require('./deleteObject');

module.exports.storage = (jo, socket) => {
  switch (jo.type) {
    case 'create':
      createClass(jo, socket);
      break;
    case 'update':
      updateClass(jo, socket);
      break;
    case 'increment':
      incrementValue(jo, socket);
      break;
    case 'get':
      catchData(jo, socket);
      break;
    case 'delete':
      deleteObject(jo, socket);
      break;
    default:
      break;
  }
};
