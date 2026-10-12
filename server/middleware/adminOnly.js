const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const adminOnly = async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    if (req.originalUrl.startsWith('/api/') || req.xhr) {
      return res.status(401).json({ success: false, message: 'Admin login required' });
    }
    return res.redirect(`/admin/login?returnUrl=${encodeURIComponent(req.originalUrl)}`);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      if (req.originalUrl.startsWith('/api/') || req.xhr) {
        return res.status(403).json({ success: false, message: 'Forbidden: Admin access only' });
      }
      return res.redirect('/admin/login?error=Your+account+does+not+have+admin+permissions.+Please+log+in+with+an+admin+account+or+sign+up+as+admin.');
    }

    req.user = user;
    res.locals.currentUser = user;
    res.locals.isAdmin = user.role === 'admin';
    res.locals.isStaff = user.role === 'staff';
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.originalUrl.startsWith('/api/') || req.xhr) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }
    return res.redirect('/admin/login');
  }
};

const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Requires Super Admin privileges' });
};

module.exports = {
  adminOnly,
  superAdminOnly
};
