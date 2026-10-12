const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const contentController = require('../controllers/contentController');
const { requireAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Home
router.get('/', productController.getHome);

// Collections & Search
router.get('/collections/:slug', productController.getCollection);
router.get('/collections', (req, res) => res.redirect('/collections/all'));
router.get('/search', productController.search);

// Product Detail
router.get('/products/:slug', productController.getProductDetail);

// Cart & Checkout
router.get('/cart', orderController.getCart);
router.get('/checkout', orderController.getCheckout);
router.get('/orders/confirmed/:orderNo', orderController.getOrderConfirmation);
router.get('/track-order', orderController.trackOrder);

// Wishlist
router.get('/wishlist', contentController.getWishlistPage);

// Customer Account
router.get('/account/login', (req, res) => {
  if (req.user) return res.redirect('/account');
  res.render('pages/account/login', { title: 'Login | StepUp Shoes', returnUrl: req.query.returnUrl, error: null });
});
router.post('/account/login', authController.login);

router.get('/account/register', (req, res) => {
  if (req.user) return res.redirect('/account');
  res.render('pages/account/register', { title: 'Create Account | StepUp Shoes', error: null });
});
router.post('/account/register', authController.register);
router.get('/account/logout', authController.logout);

router.get('/account/forgot-password', (req, res) => {
  res.render('pages/account/forgot-password', { title: 'Forgot Password | StepUp Shoes', error: null, success: null });
});
router.post('/account/forgot-password', authController.forgotPassword);
router.get('/account/reset-password/:token', (req, res) => {
  res.render('pages/account/reset-password', { title: 'Reset Password | StepUp Shoes', token: req.params.token, error: null });
});
router.post('/account/reset-password/:token', authController.resetPassword);

router.get('/account', requireAuth, contentController.getAccountDashboard);

// Content Pages, Store Locator, Blog
router.get('/stores', contentController.getStoreLocator);
router.get('/blogs/stories', contentController.getBlogList);
router.get('/blogs/stories/:slug', contentController.getBlogDetail);
router.get('/pages/:slug', contentController.getStaticPage);

// SEO: robots.txt
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /account/\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
});

// SEO: sitemap.xml
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const products = await Product.find({ status: 'Published' }).select('slug updatedAt');
    const categories = await Category.find({ isActive: true }).select('slug updatedAt');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static URLs
    const staticUrls = ['/', '/collections/all', '/collections/men', '/collections/women', '/collections/kids', '/stores', '/blogs/stories'];
    staticUrls.forEach(url => {
      xml += `  <url><loc>${host}${url}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
    });

    // Categories
    categories.forEach(c => {
      xml += `  <url><loc>${host}/collections/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    });

    // Products
    products.forEach(p => {
      xml += `  <url><loc>${host}/products/${p.slug}</loc><lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
    });

    xml += `</urlset>`;
    res.type('application/xml');
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
