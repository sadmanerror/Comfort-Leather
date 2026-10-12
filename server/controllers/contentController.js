const StaticPage = require('../models/StaticPage');
const Store = require('../models/Store');
const BlogPost = require('../models/BlogPost');
const Newsletter = require('../models/Newsletter');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');
const Product = require('../models/Product');
const PointsLedger = require('../models/PointsLedger');
const { formatBDT } = require('../services/pricingService');

// 1. Static Pages
const getStaticPage = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const page = await StaticPage.findOne({ slug, isPublished: true });

    if (!page) {
      return res.status(404).render('pages/error', {
        title: 'Page Not Found',
        message: 'The requested information page was not found.'
      });
    }

    res.render('pages/static-page', {
      title: `${page.title} | StepUp Shoes`,
      page
    });
  } catch (err) {
    next(err);
  }
};

// 2. Store Locator
const getStoreLocator = async (req, res, next) => {
  try {
    const cityFilter = req.query.city;
    const query = { isActive: true };
    if (cityFilter && cityFilter !== 'all') {
      query.city = cityFilter;
    }

    const stores = await Store.find(query).sort({ city: 1, displayOrder: 1 });
    const allCities = await Store.distinct('city', { isActive: true });

    res.render('pages/store-locator', {
      title: 'Store Locator | StepUp Shoes Bangladesh',
      stores,
      allCities,
      currentCity: cityFilter || 'all'
    });
  } catch (err) {
    next(err);
  }
};

// 3. Blog Stories
const getBlogList = async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ isPublished: true }).sort({ publishedAt: -1 });
    res.render('pages/blog/list', {
      title: 'Stories & Shoe Style Guides | StepUp Shoes',
      posts
    });
  } catch (err) {
    next(err);
  }
};

const getBlogDetail = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true });
    if (!post) {
      return res.status(404).render('pages/error', {
        title: 'Article Not Found',
        message: 'The requested story does not exist.'
      });
    }

    const recentPosts = await BlogPost.find({ _id: { $ne: post._id }, isPublished: true }).limit(3);

    res.render('pages/blog/detail', {
      title: `${post.title} | StepUp Shoes`,
      post,
      recentPosts
    });
  } catch (err) {
    next(err);
  }
};

// 4. Newsletter Signup
const subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (!existing) {
      await Newsletter.create({ email: email.toLowerCase() });
    }

    res.json({ success: true, message: 'Thank you for subscribing to StepUp Shoes newsletter!' });
  } catch (err) {
    next(err);
  }
};

// 5. Submit Product Review
const submitReview = async (req, res, next) => {
  try {
    const { productId, name, email, rating, title, comment } = req.body;
    if (!productId || !name || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please fill in all required review fields.' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user ? req.user._id : null,
      name: name.trim(),
      email: email ? email.trim() : '',
      rating: parseInt(rating, 10),
      title: title ? title.trim() : '',
      comment: comment.trim(),
      isVerifiedBuyer: !!req.user,
      status: 'approved' // auto-approve or admin moderated
    });

    // Update Product review averages
    const allReviews = await Review.find({ product: productId, status: 'approved' });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      ratingAvg: Math.round(avg * 10) / 10,
      ratingCount: allReviews.length
    });

    res.json({ success: true, message: 'Your review has been submitted. Thank you!', review });
  } catch (err) {
    next(err);
  }
};

// 6. Wishlist Toggle & Page
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' });

    if (!req.user) {
      // Guest: instruct client to keep in localStorage
      return res.json({ success: true, guest: true, message: 'Updated in local wishlist' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
      return res.json({ success: true, added: true, count: 1 });
    }

    const index = wishlist.products.indexOf(productId);
    let added = false;
    if (index > -1) {
      wishlist.products.splice(index, 1);
      added = false;
    } else {
      wishlist.products.push(productId);
      added = true;
    }

    await wishlist.save();
    res.json({ success: true, added, count: wishlist.products.length });
  } catch (err) {
    next(err);
  }
};

const getWishlistPage = async (req, res, next) => {
  try {
    let products = [];
    if (req.user) {
      const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
        path: 'products',
        populate: { path: 'brand', select: 'name slug' }
      });
      if (wishlist) {
        products = wishlist.products.filter(Boolean);
      }
    }

    res.render('pages/wishlist', {
      title: 'My Wishlist | StepUp Shoes',
      products,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

// 7. Customer Account Dashboard
const getAccountDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
    const pointsHistory = await PointsLedger.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);

    res.render('pages/account/dashboard', {
      title: 'My Account | StepUp Shoes',
      user,
      orders,
      pointsHistory,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStaticPage,
  getStoreLocator,
  getBlogList,
  getBlogDetail,
  subscribeNewsletter,
  submitReview,
  toggleWishlist,
  getWishlistPage,
  getAccountDashboard
};
