const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Sensitive auth limiter (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Checkout limiter (prevent spam order creation)
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Order submission limit reached. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  checkoutLimiter
};
