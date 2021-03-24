const fs = require('fs');
const jwt = require('jsonwebtoken');
// use in jwt
var publicKEY = fs.readFileSync('./keys/public.key', 'utf8');

let checkToken = (token, callback) => {
  jwt.verify(token, publicKEY, {
    algorithm: ["RS256"]
  }, (err, authData) => {
    if (err) {
      // TODO: WE CAN SHOW IN ADMIN DASHBOARD JSON.stringify(err)

      callback(false, JSON.stringify(err));
    } else {
      callback(true, JSON.stringify(authData));
    }

  });
}


module.exports = {
  checkToken: checkToken
}