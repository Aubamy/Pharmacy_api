const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).send('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).send('Invalid token format');
    }

    const decoded = jwt.verify(token, 'secretkey123');

    req.user = decoded; // attach user info to request

    next();

  } catch (err) {
    return res.status(401).send('Invalid token');
  }
};

module.exports = auth;