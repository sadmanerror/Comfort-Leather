const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const env = require('../config/env');
const mailService = require('../services/mailService');

const sendTokenResponse = (user, statusCode, res, isJson = false, redirectUrl = '/') => {
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.cookie('token', token, cookieOptions);

  if (isJson) {
    return res.status(statusCode).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points
      }
    });
  }

  res.redirect(redirectUrl);
};

// Customer / General Register
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const isJson = req.xhr || req.originalUrl.startsWith('/api/');

    if (!name || !email || !password) {
      if (isJson) return res.status(400).json({ success: false, message: 'Please provide all required fields' });
      return res.render('pages/account/register', { title: 'Register', error: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (isJson) return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      return res.render('pages/account/register', { title: 'Register', error: 'An account with this email already exists' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'customer'
    });

    sendTokenResponse(user, 201, res, isJson, '/account');
  } catch (err) {
    next(err);
  }
};

// Admin Register / Signup
const adminRegister = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;
    const isJson = req.xhr || req.originalUrl.startsWith('/api/');

    if (!name || !email || !password) {
      const msg = 'Please fill in all required fields';
      if (isJson) return res.status(400).json({ success: false, message: msg });
      return res.render('admin/register', { title: 'Admin Sign Up', layout: false, error: msg, formData: req.body });
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long';
      if (isJson) return res.status(400).json({ success: false, message: msg });
      return res.render('admin/register', { title: 'Admin Sign Up', layout: false, error: msg, formData: req.body });
    }

    if (confirmPassword && password !== confirmPassword) {
      const msg = 'Passwords do not match';
      if (isJson) return res.status(400).json({ success: false, message: msg });
      return res.render('admin/register', { title: 'Admin Sign Up', layout: false, error: msg, formData: req.body });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const msg = 'An account with this email already exists';
      if (isJson) return res.status(400).json({ success: false, message: msg });
      return res.render('admin/register', { title: 'Admin Sign Up', layout: false, error: msg, formData: req.body });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: (phone || '').trim(),
      passwordHash,
      role: 'admin'
    });

    sendTokenResponse(user, 201, res, isJson, '/admin');
  } catch (err) {
    next(err);
  }
};

// Customer / Admin Login
const login = async (req, res, next) => {
  try {
    const { email, password, returnUrl } = req.body;
    const isJson = req.xhr || req.originalUrl.startsWith('/api/');
    const isAdminLogin = req.originalUrl.includes('/admin');

    if (!email || !password) {
      const msg = 'Please enter your email and password';
      if (isJson) return res.status(400).json({ success: false, message: msg });
      const view = isAdminLogin ? 'admin/login' : 'pages/account/login';
      return res.render(view, { title: 'Login', error: msg, returnUrl });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const msg = 'Invalid email or password';
      if (isJson) return res.status(401).json({ success: false, message: msg });
      const view = isAdminLogin ? 'admin/login' : 'pages/account/login';
      return res.render(view, { title: 'Login', error: msg, returnUrl });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const msg = 'Invalid email or password';
      if (isJson) return res.status(401).json({ success: false, message: msg });
      const view = isAdminLogin ? 'admin/login' : 'pages/account/login';
      return res.render(view, { title: 'Login', error: msg, returnUrl });
    }

    if (isAdminLogin && user.role !== 'admin' && user.role !== 'staff') {
      const msg = 'You do not have administrative access';
      if (isJson) return res.status(403).json({ success: false, message: msg });
      return res.render('admin/login', { title: 'Admin Login', error: msg });
    }

    let targetUrl = returnUrl || (user.role === 'admin' || user.role === 'staff' ? (isAdminLogin ? '/admin' : '/account') : '/account');
    sendTokenResponse(user, 200, res, isJson, targetUrl);
  } catch (err) {
    next(err);
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie('token');
  if (req.xhr || req.originalUrl.startsWith('/api/')) {
    return res.json({ success: true, message: 'Logged out successfully' });
  }
  const redirectUrl = req.originalUrl.includes('/admin') ? '/admin/login' : '/';
  res.redirect(redirectUrl);
};

// Forgot Password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const isJson = req.xhr || req.originalUrl.startsWith('/api/');

    if (!email) {
      if (isJson) return res.status(400).json({ success: false, message: 'Email is required' });
      return res.render('pages/account/forgot-password', { title: 'Forgot Password', error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success to avoid email enumeration
      if (isJson) return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
      return res.render('pages/account/forgot-password', { title: 'Forgot Password', success: 'If an account exists with that email, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${env.BASE_URL}/account/reset-password/${resetToken}`;
    await mailService.sendPasswordReset(user, resetUrl);

    if (isJson) {
      return res.json({ success: true, message: 'Password reset link sent to your email.' });
    }
    res.render('pages/account/forgot-password', {
      title: 'Forgot Password',
      success: 'Password reset link sent to your email.'
    });
  } catch (err) {
    next(err);
  }
};

// Reset Password
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('pages/account/reset-password', {
        title: 'Reset Password',
        token,
        error: 'Passwords do not match'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('pages/account/reset-password', {
        title: 'Reset Password',
        token,
        error: 'Password reset token is invalid or has expired'
      });
    }

    user.passwordHash = await User.hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.redirect('/account/login?reset=success');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  adminRegister,
  login,
  logout,
  forgotPassword,
  resetPassword
};
