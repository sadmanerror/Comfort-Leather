const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

/**
 * Enforces authenticated user
 */
const requireAuth = async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    if (req.originalUrl.startsWith('/api/') || req.xhr) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    return res.redirect(`/account/login?returnUrl=${encodeURIComponent(req.originalUrl)}`);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      res.clearCookie('token');
      if (req.originalUrl.startsWith('/api/') || req.xhr) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      return res.redirect('/account/login');
    }
    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.originalUrl.startsWith('/api/') || req.xhr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }
    return res.redirect('/account/login');
  }
};

/**
 * Optional authentication: attaches user if token exists, but proceeds anyway
 */
const optionalAuth = async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = user;
        res.locals.currentUser = user;
      }
    } catch (err) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth
};
