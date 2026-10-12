const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const { adminOnly } = require('../middleware/adminOnly');
const upload = require('../middleware/upload');

// Admin Auth Routes (unprotected)
router.get('/login', (req, res) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { 
    title: 'CL Admin Portal Login', 
    layout: false, 
    error: req.query.error || null, 
    returnUrl: req.query.returnUrl 
  });
});
router.post('/login', authController.login);

// Admin Sign Up / Registration
router.get('/register', (req, res) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    return res.redirect('/admin');
  }
  res.render('admin/register', { title: 'CL Admin Sign Up', layout: false, error: null, formData: {} });
});
router.post('/register', authController.adminRegister);

router.get('/logout', authController.logout);

// Protected Admin Routes
router.use(adminOnly);

// Dashboard
router.get('/', adminController.getDashboard);

// Products
router.get('/products', adminController.getProducts);
router.get('/products/new', adminController.getProductForm);
router.get('/products/export', adminController.exportProductsCSV);
router.get('/products/:id/edit', adminController.getProductForm);
router.post('/products', upload.array('files', 10), adminController.saveProduct);
router.post('/products/bulk', adminController.bulkProductAction);
router.post('/products/:id', upload.array('files', 10), adminController.saveProduct);
router.post('/products/:id/quick-edit', adminController.quickEditProduct);
router.post('/products/:id/duplicate', adminController.duplicateProduct);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.saveCategory);
router.post('/categories/:id/delete', adminController.deleteCategory);

// Brands
router.get('/brands', adminController.getBrands);
router.post('/brands', adminController.saveBrand);
router.post('/brands/:id/delete', adminController.deleteBrand);

// Collections
router.get('/collections', adminController.getCollections);
router.post('/collections', adminController.saveCollection);
router.post('/collections/:id/delete', adminController.deleteCollection);

// Orders
router.get('/orders', adminController.getOrders);
router.get('/orders/export', adminController.exportOrdersCSV);
router.get('/orders/:id', adminController.getOrderDetail);
router.post('/orders/:id/status', adminController.updateOrderStatus);
router.get('/orders/:id/invoice', adminController.printOrderInvoice);
router.get('/orders/:id/packing-slip', adminController.printPackingSlip);

// Banners
router.get('/banners', adminController.getBanners);
router.post('/banners', adminController.saveBanner);
router.post('/banners/:id/delete', adminController.deleteBanner);

// Coupons
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.saveCoupon);
router.post('/coupons/:id/delete', adminController.deleteCoupon);

// Customers
router.get('/customers', adminController.getCustomers);

// Reviews
router.get('/reviews', adminController.getReviews);
router.post('/reviews/:id/status', adminController.updateReviewStatus);
router.post('/reviews/:id/delete', adminController.deleteReview);

// Menu Builder
router.get('/menu', adminController.getMenuBuilder);
router.post('/menu', adminController.saveMenuItem);
router.post('/menu/:id/delete', adminController.deleteMenuItem);

// Storefront Settings
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.saveSettings);
router.post('/settings/staff', adminController.saveStaffMember);

// Static Pages, Blogs & Store Locator
router.get('/pages', adminController.getStaticPages);
router.post('/pages', adminController.saveStaticPage);

router.get('/blogs', adminController.getBlogPosts);
router.post('/blogs', adminController.saveBlogPost);

router.get('/stores', adminController.getStores);
router.post('/stores', adminController.saveStore);
router.post('/stores/:id/delete', adminController.deleteStore);

// Media Upload API
router.post('/upload', upload.single('file'), adminController.uploadMediaApi);

module.exports = router;
