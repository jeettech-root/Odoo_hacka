const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

/**
 * JWT authentication middleware
 * - expects `Authorization: Bearer <token>` header
 * - verifies token, fetches user, attaches `req.user`
 * - responds 401 on missing/invalid/expired token
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else {
      return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }
    let payload;
    try {
      // use same default secret as signing in auth controller when JWT_SECRET isn't provided (dev mode)
      const secret = config.JWT_SECRET || 'dev_secret';
      payload = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const user = await User.findById(payload.sub).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // attach minimal user info to request
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
