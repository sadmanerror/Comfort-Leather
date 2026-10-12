const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const contentController = require('../controllers/contentController');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { authLimiter, checkoutLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Rate limiting
router.use(apiLimiter);

// Products & Search
router.get('/products', productController.getProductsAjax);
router.get('/products/:id/quick-view', productController.getQuickView);
router.get('/search', productController.search);

// Cart & Coupons
router.post('/cart/coupon', optionalAuth, orderController.checkCouponApi);

// Orders / Checkout
router.post('/orders', checkoutLimiter, optionalAuth, orderController.processCheckout);

// Auth endpoints
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/logout', authController.logout);
router.post('/auth/forgot-password', authLimiter, authController.forgotPassword);

// Reviews & Newsletter
router.post('/reviews', optionalAuth, contentController.submitReview);
router.post('/newsletter', contentController.subscribeNewsletter);

// Wishlist
router.post('/wishlist/toggle', optionalAuth, contentController.toggleWishlist);

module.exports = router;
