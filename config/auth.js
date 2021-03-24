const jwt = require('jsonwebtoken');
const fs = require('fs');

var publicKEY = fs.readFileSync('./keys/public.key', 'utf8');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.replace('Bearer ', '');
    console.log(token);

    const decoded = jwt.verify(token, publicKEY, {
      algorithm: ['RS256'],
    });
    req.adminData = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Authentication Failed',
    });
  }
};
