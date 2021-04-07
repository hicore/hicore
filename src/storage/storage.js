const { addObject: addObject } = require('./addObject');
const { updateClass: updateClass } = require('./updateClass');
const { incrementValue: incrementValue } = require('./incrementValue');
const { fetchData: fetchData } = require('./fetchData');
const { deleteObject: deleteObject } = require('./deleteObject');

module.exports.storage = (jo, socket) => {
  switch (jo.type) {
    case 'add':
      addObject(jo, socket);
      break;
    case 'increment':
      incrementValue(jo, socket);
      break;
    case 'fetch':
      fetchData(jo, socket);
      break;
    case 'delete':
      deleteObject(jo, socket);
      break;
    default:
      break;
  }
};
