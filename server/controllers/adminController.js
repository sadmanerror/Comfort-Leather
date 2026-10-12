const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Collection = require('../models/Collection');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const BlogPost = require('../models/BlogPost');
const Setting = require('../models/Setting');
const Menu = require('../models/Menu');
const Store = require('../models/Store');
const Newsletter = require('../models/Newsletter');
const { formatBDT } = require('../services/pricingService');
const { uploadImage, uploadVideo, deleteMedia } = require('../services/cloudinaryService');

// 1. Dashboard
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // KPI 1: Today's orders
    const todayOrdersCount = await Order.countDocuments({ createdAt: { $gte: today } });

    // KPI 2: Revenue
    const todayRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    const sevenDaysRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const revenue7d = sevenDaysRevenueAgg[0]?.total || 0;

    const thirtyDaysRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const revenue30d = thirtyDaysRevenueAgg[0]?.total || 0;

    // KPI 3: Pending Orders
    const pendingOrdersCount = await Order.countDocuments({ status: 'Pending' });

    // KPI 4: New customers (last 30d)
    const newCustomersCount = await User.countDocuments({ role: 'customer', createdAt: { $gte: thirtyDaysAgo } });

    // Low stock products (< 5 total stock or any size stock < 2)
    const allProducts = await Product.find({ status: 'Published' }).select('name slug price colors');
    const lowStockAlerts = allProducts.filter(p => p.totalStock <= 5).slice(0, 10);
    const lowStockCount = allProducts.filter(p => p.totalStock <= 5).length;

    // Latest 10 orders
    const latestOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');

    // Chart data: Sales over last 7 days
    const dailySalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Chart data: Orders by status
    const ordersByStatusAgg = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      activeTab: 'dashboard',
      kpis: {
        todayOrdersCount,
        todayRevenue,
        revenue7d,
        revenue30d,
        pendingOrdersCount,
        lowStockCount,
        newCustomersCount
      },
      latestOrders,
      lowStockAlerts,
      chartData: {
        dailySales: dailySalesAgg,
        ordersByStatus: ordersByStatusAgg
      },
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

// 2. Products Management
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = 20;
    const query = {};

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } },
        { 'colors.sizes.sku': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) query.status = req.query.status;
    if (req.query.gender) query.gender = req.query.gender;
    if (req.query.brand) query.brand = req.query.brand;
    if (req.query.category) query.category = req.query.category;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('brand', 'name')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const brands = await Brand.find({ isActive: true }).select('name');
    const categories = await Category.find({ isActive: true }).select('name');

    res.render('admin/products/list', {
      title: 'Products Management',
      layout: 'layouts/admin',
      activeTab: 'products',
      products,
      brands,
      categories,
      page,
      pages: Math.ceil(total / limit),
      total,
      query: req.query,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

const getProductForm = async (req, res, next) => {
  try {
    const isEdit = !!req.params.id;
    let product = null;

    if (isEdit) {
      product = await Product.findById(req.params.id);
      if (!product) return res.status(404).render('pages/error', { message: 'Product not found' });
    }

    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    const collections = await Collection.find({ isActive: true }).sort({ name: 1 });

    res.render('admin/products/form', {
      title: isEdit ? `Edit Product: ${product.name}` : 'Add New Product',
      layout: 'layouts/admin',
      activeTab: 'products',
      isEdit,
      product: product || {
        name: '',
        slug: '',
        gender: 'Men',
        price: '',
        salePrice: '',
        shortDesc: '',
        description: '',
        flags: {},
        specs: {},
        seo: {},
        colors: [
          {
            name: 'Black',
            hex: '#000000',
            images: [],
            sizes: [
              { size: '7', stock: 10, sku: '' },
              { size: '8', stock: 10, sku: '' },
              { size: '9', stock: 10, sku: '' },
              { size: '10', stock: 10, sku: '' }
            ]
          }
        ]
      },
      brands,
      categories,
      collections,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

const saveProduct = async (req, res, next) => {
  try {
    const isEdit = !!req.params.id;
    const body = req.body;

    // Generate slug if not provided
    let slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Parse variants JSON if submitted from client-side matrix builder
    let colors = [];
    if (typeof body.colors === 'string') {
      try {
        colors = JSON.parse(body.colors);
      } catch (e) {
        colors = [];
      }
    } else if (Array.isArray(body.colors)) {
      colors = body.colors;
    }

    // Process uploaded images/video if any
    if (req.files && req.files.length) {
      for (const file of req.files) {
        if (file.mimetype.startsWith('video/')) {
          const videoRes = await uploadVideo(file);
          body.video = { url: videoRes.url, publicId: videoRes.publicId };
        }
      }
    }

    const productData = {
      name: body.name.trim(),
      slug,
      brand: body.brand,
      gender: body.gender,
      category: body.category,
      subCategory: body.subCategory || null,
      shortDesc: body.shortDesc,
      description: body.description,
      price: parseFloat(body.price),
      salePrice: body.salePrice ? parseFloat(body.salePrice) : null,
      saleStart: body.saleStart ? new Date(body.saleStart) : null,
      saleEnd: body.saleEnd ? new Date(body.saleEnd) : null,
      colors,
      video: body.video || undefined,
      tags: body.tags ? body.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      flags: {
        bestSeller: body.bestSeller === 'on' || body.bestSeller === true,
        justLanded: body.justLanded === 'on' || body.justLanded === true,
        featured: body.featured === 'on' || body.featured === true,
        discounted: !!(body.salePrice && parseFloat(body.salePrice) < parseFloat(body.price))
      },
      specs: {
        material: body.material,
        sole: body.sole,
        closure: body.closure,
        occasion: body.occasion,
        careInstructions: body.careInstructions,
        sizeChartUrl: body.sizeChartUrl
      },
      seo: {
        title: body.seoTitle || body.name,
        description: body.seoDescription || body.shortDesc
      },
      status: body.status || 'Published'
    };

    let product;
    if (isEdit) {
      product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
    } else {
      product = await Product.create(productData);
    }

    if (req.xhr || req.originalUrl.startsWith('/api/')) {
      return res.json({ success: true, product, message: 'Product saved successfully' });
    }

    if (body.action === 'save_and_add') {
      return res.redirect('/admin/products/new?success=Product+saved');
    }
    if (body.action === 'save_and_view') {
      return res.redirect(`/products/${product.slug}`);
    }

    res.redirect('/admin/products?success=Product+saved+successfully');
  } catch (err) {
    next(err);
  }
};

const quickEditProduct = async (req, res, next) => {
  try {
    const { price, salePrice, status, stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (price !== undefined) product.price = parseFloat(price);
    if (salePrice !== undefined) product.salePrice = salePrice ? parseFloat(salePrice) : null;
    if (status !== undefined) product.status = status;

    if (stock !== undefined && product.colors?.length && product.colors[0]?.sizes?.length) {
      // Apply stock evenly to primary variant
      product.colors[0].sizes[0].stock = parseInt(stock, 10);
    }

    await product.save();
    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (err) {
    next(err);
  }
};

const duplicateProduct = async (req, res, next) => {
  try {
    const source = await Product.findById(req.params.id);
    if (!source) return res.status(404).redirect('/admin/products?error=Product+not+found');

    const copyObj = source.toObject();
    delete copyObj._id;
    delete copyObj.createdAt;
    delete copyObj.updatedAt;
    copyObj.name = `${copyObj.name} (Copy)`;
    copyObj.slug = `${copyObj.slug}-copy-${Date.now().toString().slice(-4)}`;
    copyObj.status = 'Draft';

    const newProduct = await Product.create(copyObj);
    res.redirect(`/admin/products/${newProduct._id}/edit?success=Product+duplicated+as+draft`);
  } catch (err) {
    next(err);
  }
};

const bulkProductAction = async (req, res, next) => {
  try {
    const { action, ids, discountPercent } = req.body;
    if (!ids || !ids.length) return res.redirect('/admin/products?error=No+products+selected');

    const idList = Array.isArray(ids) ? ids : ids.split(',');

    if (action === 'publish') {
      await Product.updateMany({ _id: { $in: idList } }, { status: 'Published' });
    } else if (action === 'unpublish') {
      await Product.updateMany({ _id: { $in: idList } }, { status: 'Draft' });
    } else if (action === 'delete') {
      await Product.deleteMany({ _id: { $in: idList } });
    } else if (action === 'set_discount' && discountPercent) {
      const pct = parseFloat(discountPercent);
      const prods = await Product.find({ _id: { $in: idList } });
      for (const p of prods) {
        p.salePrice = Math.round(p.price * (1 - pct / 100));
        p.flags.discounted = true;
        await p.save();
      }
    }

    res.redirect('/admin/products?success=Bulk+action+completed');
  } catch (err) {
    next(err);
  }
};

// 3. Orders Management
const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = 20;
    const query = {};

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    if (req.query.paymentStatus) {
      query['payment.status'] = req.query.paymentStatus;
    }
    if (req.query.search) {
      query.$or = [
        { orderNo: { $regex: req.query.search, $options: 'i' } },
        { 'address.phone': { $regex: req.query.search, $options: 'i' } },
        { 'address.fullName': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Counts per status
    const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    const counts = {};
    for (const st of statuses) {
      counts[st] = await Order.countDocuments({ status: st });
    }
    counts.all = await Order.countDocuments({});

    res.render('admin/orders/list', {
      title: 'Orders Management',
      layout: 'layouts/admin',
      activeTab: 'orders',
      orders,
      counts,
      page,
      pages: Math.ceil(total / limit),
      total,
      query: req.query,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

const getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).render('pages/error', { message: 'Order not found' });

    res.render('admin/orders/detail', {
      title: `Order #${order.orderNo}`,
      layout: 'layouts/admin',
      activeTab: 'orders',
      order,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, paymentStatus, trxId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (status && status !== order.status) {
      order.status = status;
      order.statusHistory.push({
        status,
        note: note || `Status updated to ${status}`,
        changedAt: new Date(),
        changedBy: req.user ? req.user.name : 'Admin'
      });

      // If cancelled or returned, restore stock
      if (status === 'Cancelled' || status === 'Returned') {
        const { restoreStock } = require('../services/orderService');
        await restoreStock(order.items);
      }
      // If delivered and was not paid, mark paid and award loyalty points
      if (status === 'Delivered') {
        if (order.payment.status !== 'paid') {
          order.payment.status = 'paid';
          order.payment.paidAt = new Date();
        }
        const { awardLoyaltyPoints } = require('../services/orderService');
        await awardLoyaltyPoints(order);
      }
    }

    if (paymentStatus) {
      order.payment.status = paymentStatus;
      if (paymentStatus === 'paid' && !order.payment.paidAt) {
        order.payment.paidAt = new Date();
      }
    }

    if (trxId) {
      order.payment.trxId = trxId;
    }

    if (note && !status) {
      order.note = (order.note ? order.note + '\n' : '') + `[${new Date().toLocaleDateString()}] ${note}`;
    }

    await order.save();

    if (req.xhr || req.originalUrl.startsWith('/api/')) {
      return res.json({ success: true, message: 'Order updated successfully', order });
    }

    res.redirect(`/admin/orders/${order._id}?success=Order+updated+successfully`);
  } catch (err) {
    next(err);
  }
};

const printOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).render('pages/error', { message: 'Order not found' });

    const settings = await Setting.getSettings();

    res.render('admin/orders/invoice', {
      title: `Invoice #${order.orderNo}`,
      layout: false, // Clean printable layout without sidebars
      order,
      settings,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

const printPackingSlip = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).render('pages/error', { message: 'Order not found' });

    const settings = await Setting.getSettings();

    res.render('admin/orders/packing-slip', {
      title: `Packing Slip #${order.orderNo}`,
      layout: false,
      order,
      settings,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

// 4. Categories Management
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('parent', 'name')
      .sort({ gender: 1, displayOrder: 1, name: 1 });

    res.render('admin/categories/index', {
      title: 'Categories Management',
      layout: 'layouts/admin',
      activeTab: 'categories',
      categories
    });
  } catch (err) {
    next(err);
  }
};

const saveCategory = async (req, res, next) => {
  try {
    const { id, name, slug, parent, gender, description, image, bannerImage, displayOrder, isActive } = req.body;
    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const data = {
      name: name.trim(),
      slug: catSlug,
      parent: parent || null,
      gender: gender || 'All',
      description,
      image,
      bannerImage,
      displayOrder: parseInt(displayOrder || '0', 10),
      isActive: isActive === 'on' || isActive === true
    };

    if (id) {
      await Category.findByIdAndUpdate(id, data);
    } else {
      await Category.create(data);
    }

    res.redirect('/admin/categories?success=Category+saved');
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/admin/categories?success=Category+deleted');
  } catch (err) {
    next(err);
  }
};

// 5. Brands Management
const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort({ displayOrder: 1, name: 1 });
    res.render('admin/brands/index', {
      title: 'Brands Management',
      layout: 'layouts/admin',
      activeTab: 'brands',
      brands
    });
  } catch (err) {
    next(err);
  }
};

const saveBrand = async (req, res, next) => {
  try {
    const { id, name, slug, logo, description, displayOrder, isActive } = req.body;
    const brandSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const data = {
      name: name.trim(),
      slug: brandSlug,
      logo,
      description,
      displayOrder: parseInt(displayOrder || '0', 10),
      isActive: isActive === 'on' || isActive === true
    };

    if (id) {
      await Brand.findByIdAndUpdate(id, data);
    } else {
      await Brand.create(data);
    }

    res.redirect('/admin/brands?success=Brand+saved');
  } catch (err) {
    next(err);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.redirect('/admin/brands?success=Brand+deleted');
  } catch (err) {
    next(err);
  }
};

// 6. Collections Management
const getCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find().sort({ displayOrder: 1 });
    const brands = await Brand.find({ isActive: true });
    const categories = await Category.find({ isActive: true });
    const products = await Product.find({ status: 'Published' }).select('name slug price');

    res.render('admin/collections/index', {
      title: 'Collections Management',
      layout: 'layouts/admin',
      activeTab: 'collections',
      collections,
      brands,
      categories,
      products,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

const saveCollection = async (req, res, next) => {
  try {
    const { id, name, slug, title, description, bannerImage, isRuleBased, ruleBrand, ruleCategory, ruleGender, ruleMinPrice, ruleMaxPrice, manualProducts, isActive } = req.body;
    const collSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const data = {
      name: name.trim(),
      slug: collSlug,
      title,
      description,
      bannerImage,
      isRuleBased: isRuleBased === 'true' || isRuleBased === true,
      rules: {
        brand: ruleBrand || null,
        category: ruleCategory || null,
        gender: ruleGender || null,
        minPrice: ruleMinPrice ? parseFloat(ruleMinPrice) : null,
        maxPrice: ruleMaxPrice ? parseFloat(ruleMaxPrice) : null
      },
      manualProducts: manualProducts ? (Array.isArray(manualProducts) ? manualProducts : [manualProducts]) : [],
      isActive: isActive === 'on' || isActive === true
    };

    if (id) {
      await Collection.findByIdAndUpdate(id, data);
    } else {
      await Collection.create(data);
    }

    res.redirect('/admin/collections?success=Collection+saved');
  } catch (err) {
    next(err);
  }
};

const deleteCollection = async (req, res, next) => {
  try {
    await Collection.findByIdAndDelete(req.params.id);
    res.redirect('/admin/collections?success=Collection+deleted');
  } catch (err) {
    next(err);
  }
};

// 7. Banners Management
const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ position: 1, displayOrder: 1 });
    res.render('admin/banners/index', {
      title: 'Banners & Sliders',
      layout: 'layouts/admin',
      activeTab: 'banners',
      banners
    });
  } catch (err) {
    next(err);
  }
};

const saveBanner = async (req, res, next) => {
  try {
    const { id, title, subtitle, buttonText, link, desktopImage, mobileImage, videoUrl, position, displayOrder, isActive } = req.body;
    const data = {
      title,
      subtitle,
      buttonText: buttonText || 'Shop Now',
      link: link || '/collections/all',
      desktopImage,
      mobileImage,
      videoUrl,
      position: position || 'hero',
      displayOrder: parseInt(displayOrder || '0', 10),
      isActive: isActive === 'on' || isActive === true
    };

    if (id) {
      await Banner.findByIdAndUpdate(id, data);
    } else {
      await Banner.create(data);
    }

    res.redirect('/admin/banners?success=Banner+saved');
  } catch (err) {
    next(err);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.redirect('/admin/banners?success=Banner+deleted');
  } catch (err) {
    next(err);
  }
};

// 8. Coupons Management
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.render('admin/coupons/index', {
      title: 'Coupons & Discounts',
      layout: 'layouts/admin',
      activeTab: 'coupons',
      coupons,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

const saveCoupon = async (req, res, next) => {
  try {
    const { id, code, type, value, minOrder, maxDiscount, maxUses, startDate, endDate, isActive } = req.body;
    const data = {
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      minOrder: parseFloat(minOrder || '0'),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      maxUses: parseInt(maxUses || '0', 10),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive === 'on' || isActive === true
    };

    if (id) {
      await Coupon.findByIdAndUpdate(id, data);
    } else {
      await Coupon.create(data);
    }

    res.redirect('/admin/coupons?success=Coupon+saved');
  } catch (err) {
    next(err);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.redirect('/admin/coupons?success=Coupon+deleted');
  } catch (err) {
    next(err);
  }
};

// 9. Customers Management
const getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
    
    // Enrich with order count and spend
    const customerData = await Promise.all(customers.map(async (c) => {
      const orders = await Order.find({ user: c._id });
      const totalSpent = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0);
      return {
        ...c.toObject(),
        orderCount: orders.length,
        totalSpent
      };
    }));

    res.render('admin/customers/index', {
      title: 'Customers Management',
      layout: 'layouts/admin',
      activeTab: 'customers',
      customers: customerData,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

// 10. Reviews Moderation
const getReviews = async (req, res, next) => {
  try {
    const status = req.query.status || 'all';
    const query = status === 'all' ? {} : { status };
    const reviews = await Review.find(query).populate('product', 'name slug').sort({ createdAt: -1 });

    res.render('admin/reviews/index', {
      title: 'Reviews Moderation',
      layout: 'layouts/admin',
      activeTab: 'reviews',
      reviews,
      currentStatus: status
    });
  } catch (err) {
    next(err);
  }
};

const updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await Review.findByIdAndUpdate(req.params.id, { status });
    res.redirect('/admin/reviews?success=Review+updated');
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.redirect('/admin/reviews?success=Review+deleted');
  } catch (err) {
    next(err);
  }
};

// 11. Menu Builder
const getMenuBuilder = async (req, res, next) => {
  try {
    const menuItems = await Menu.find().sort({ displayOrder: 1 });
    res.render('admin/menu/index', {
      title: 'Mega-Menu Builder',
      layout: 'layouts/admin',
      activeTab: 'menu',
      menuItems
    });
  } catch (err) {
    next(err);
  }
};

const saveMenuItem = async (req, res, next) => {
  try {
    const { id, title, slug, link, badge, badgeColor, displayOrder, isActive, columnsJson } = req.body;
    let columns = [];
    if (columnsJson) {
      try {
        columns = JSON.parse(columnsJson);
      } catch (e) {}
    }

    const data = {
      title: title.trim(),
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      link: link || '#',
      badge,
      badgeColor: badgeColor || '#D6001C',
      displayOrder: parseInt(displayOrder || '0', 10),
      isActive: isActive === 'on' || isActive === true,
      columns
    };

    if (id) {
      await Menu.findByIdAndUpdate(id, data);
    } else {
      await Menu.create(data);
    }

    res.redirect('/admin/menu?success=Menu+item+saved');
  } catch (err) {
    next(err);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.redirect('/admin/menu?success=Menu+item+deleted');
  } catch (err) {
    next(err);
  }
};

// 12. Storefront Settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.getSettings();
    const staffMembers = await User.find({ role: { $in: ['admin', 'staff'] } });

    res.render('admin/settings/index', {
      title: 'Store Settings',
      layout: 'layouts/admin',
      activeTab: 'settings',
      settings,
      staffMembers,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

const saveSettings = async (req, res, next) => {
  try {
    const body = req.body;
    let settings = await Setting.findOne();
    if (!settings) settings = new Setting();

    settings.storeName = body.storeName || settings.storeName;
    settings.storeTagline = body.storeTagline;
    if (body.logoUrl) settings.logoUrl = body.logoUrl.trim();
    settings.contactPhone = body.contactPhone;
    settings.whatsappNumber = body.whatsappNumber;
    settings.contactEmail = body.contactEmail;
    settings.address = body.address;
    settings.announcementBarText = body.announcementBarText;
    settings.announcementBarActive = body.announcementBarActive === 'on' || body.announcementBarActive === true;
    
    settings.shippingInsideDhaka = parseFloat(body.shippingInsideDhaka || '60');
    settings.shippingOutsideDhaka = parseFloat(body.shippingOutsideDhaka || '120');
    settings.freeShippingThreshold = parseFloat(body.freeShippingThreshold || '2500');

    settings.codEnabled = body.codEnabled === 'on' || body.codEnabled === true;
    settings.bkashEnabled = body.bkashEnabled === 'on' || body.bkashEnabled === true;
    settings.bkashNumber = body.bkashNumber;
    settings.nagadEnabled = body.nagadEnabled === 'on' || body.nagadEnabled === true;
    settings.nagadNumber = body.nagadNumber;
    settings.sslcommerzEnabled = body.sslcommerzEnabled === 'on' || body.sslcommerzEnabled === true;

    settings.loyaltyPointsPer100Tk = parseFloat(body.loyaltyPointsPer100Tk || '1');
    settings.loyaltyRedeemRate = parseFloat(body.loyaltyRedeemRate || '1');
    settings.maintenanceMode = body.maintenanceMode === 'on' || body.maintenanceMode === true;

    if (body.trendingTerms) {
      settings.trendingSearchTerms = body.trendingTerms.split(',').map(t => t.trim()).filter(Boolean);
    }

    await settings.save();
    res.redirect('/admin/settings?success=Settings+saved+successfully');
  } catch (err) {
    next(err);
  }
};

// 13. Staff & User Management in Admin
const saveStaffMember = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.redirect('/admin/settings?error=User+already+exists+with+this+email');
    }

    const passwordHash = await User.hashPassword(password || 'Staff123456');
    await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: role || 'staff'
    });

    res.redirect('/admin/settings?success=Staff+member+created');
  } catch (err) {
    next(err);
  }
};

// 14. Static Pages, Blogs & Store Locator
const getStaticPages = async (req, res, next) => {
  try {
    const StaticPage = require('../models/StaticPage');
    const pages = await StaticPage.find();
    res.render('admin/pages/index', {
      title: 'Static Pages',
      layout: 'layouts/admin',
      activeTab: 'pages',
      pages
    });
  } catch (err) {
    next(err);
  }
};

const saveStaticPage = async (req, res, next) => {
  try {
    const StaticPage = require('../models/StaticPage');
    const { id, title, slug, content, isPublished } = req.body;
    const data = {
      title: title.trim(),
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content,
      isPublished: isPublished === 'on' || isPublished === true
    };
    if (id) {
      await StaticPage.findByIdAndUpdate(id, data);
    } else {
      await StaticPage.create(data);
    }
    res.redirect('/admin/pages?success=Page+saved');
  } catch (err) {
    next(err);
  }
};

const getBlogPosts = async (req, res, next) => {
  try {
    const posts = await BlogPost.find().sort({ publishedAt: -1 });
    res.render('admin/blogs/index', {
      title: 'Blog Articles',
      layout: 'layouts/admin',
      activeTab: 'blogs',
      posts
    });
  } catch (err) {
    next(err);
  }
};

const saveBlogPost = async (req, res, next) => {
  try {
    const { id, title, slug, excerpt, content, coverImage, author, tags, isPublished } = req.body;
    const data = {
      title: title.trim(),
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt,
      content,
      coverImage,
      author: author || 'StepUp Editorial',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      isPublished: isPublished === 'on' || isPublished === true
    };
    if (id) {
      await BlogPost.findByIdAndUpdate(id, data);
    } else {
      await BlogPost.create(data);
    }
    res.redirect('/admin/blogs?success=Blog+post+saved');
  } catch (err) {
    next(err);
  }
};

const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find().sort({ city: 1, name: 1 });
    res.render('admin/stores/index', {
      title: 'Store Locator Entries',
      layout: 'layouts/admin',
      activeTab: 'stores',
      stores
    });
  } catch (err) {
    next(err);
  }
};

const saveStore = async (req, res, next) => {
  try {
    const { id, name, city, address, phone, hours, mapUrl, isActive } = req.body;
    const data = {
      name,
      city,
      address,
      phone,
      hours: hours || '10:00 AM - 9:00 PM',
      mapUrl,
      isActive: isActive === 'on' || isActive === true
    };
    if (id) {
      await Store.findByIdAndUpdate(id, data);
    } else {
      await Store.create(data);
    }
    res.redirect('/admin/stores?success=Store+entry+saved');
  } catch (err) {
    next(err);
  }
};

const deleteStore = async (req, res, next) => {
  try {
    await Store.findByIdAndDelete(req.params.id);
    res.redirect('/admin/stores?success=Store+deleted');
  } catch (err) {
    next(err);
  }
};

// 15. CSV Export & Signed Upload API
const exportProductsCSV = async (req, res, next) => {
  try {
    const products = await Product.find().populate('brand', 'name').populate('category', 'name');
    let csv = 'SKU,Name,Brand,Category,Gender,Price,SalePrice,TotalStock,Status\n';
    for (const p of products) {
      const primarySku = p.colors?.[0]?.sizes?.[0]?.sku || p.slug;
      csv += `"${primarySku}","${p.name.replace(/"/g, '""')}","${p.brand?.name || ''}","${p.category?.name || ''}","${p.gender}","${p.price}","${p.salePrice || ''}","${p.totalStock}","${p.status}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

const exportOrdersCSV = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    let csv = 'OrderNo,Date,CustomerName,Phone,ItemsCount,Subtotal,Discount,Shipping,Total,PaymentMethod,PaymentStatus,OrderStatus\n';
    for (const o of orders) {
      const date = o.createdAt.toISOString().slice(0, 10);
      csv += `"${o.orderNo}","${date}","${o.address.fullName}","${o.address.phone}","${o.items.length}","${o.subtotal}","${o.discount}","${o.shipping}","${o.total}","${o.payment.method}","${o.payment.status}","${o.status}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// Upload media API
const uploadMediaApi = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const isVideo = req.file.mimetype.startsWith('video/');
    const result = isVideo
      ? await uploadVideo(req.file)
      : await uploadImage(req.file);

    res.json({
      success: true,
      url: result.url,
      publicId: result.publicId
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getProducts,
  getProductForm,
  saveProduct,
  quickEditProduct,
  duplicateProduct,
  bulkProductAction,
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  printOrderInvoice,
  printPackingSlip,
  getCategories,
  saveCategory,
  deleteCategory,
  getBrands,
  saveBrand,
  deleteBrand,
  getCollections,
  saveCollection,
  deleteCollection,
  getBanners,
  saveBanner,
  deleteBanner,
  getCoupons,
  saveCoupon,
  deleteCoupon,
  getCustomers,
  getReviews,
  updateReviewStatus,
  deleteReview,
  getMenuBuilder,
  saveMenuItem,
  deleteMenuItem,
  getSettings,
  saveSettings,
  saveStaffMember,
  getStaticPages,
  saveStaticPage,
  getBlogPosts,
  saveBlogPost,
  getStores,
  saveStore,
  deleteStore,
  exportProductsCSV,
  exportOrdersCSV,
  uploadMediaApi
};
