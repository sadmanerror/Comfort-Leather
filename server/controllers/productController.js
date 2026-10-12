const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Banner = require('../models/Banner');
const Collection = require('../models/Collection');
const BlogPost = require('../models/BlogPost');
const Review = require('../models/Review');
const Setting = require('../models/Setting');
const { formatBDT, calculateDiscountPercent } = require('../services/pricingService');

// 1. Home Page
const getHome = async (req, res, next) => {
  try {
    // 1. Hero sliders
    const heroBanners = await Banner.find({ position: 'hero', isActive: true }).sort({ displayOrder: 1 });

    // 2. Gender category tiles
    const genderCategories = [
      { name: 'Men', slug: 'men', image: '/img/cat-men.jpg', subtitle: 'Step up with sophistication' },
      { name: 'Women', slug: 'women', image: '/img/cat-women.jpg', subtitle: 'Elegance & effortless style' },
      { name: 'Kids', slug: 'kids', image: '/img/cat-kids.jpg', subtitle: 'Fun, active & durable' }
    ];

    // 3. Section banners
    const accessoriesBanner = await Banner.findOne({ position: 'accessories', isActive: true }) || {
      title: 'Premium Leather Accessories',
      subtitle: 'Wallets, Belts & Handbags crafted to perfection',
      link: '/collections/accessories',
      desktopImage: '/img/banner-accessories.jpg',
      buttonText: 'Explore Accessories'
    };

    const voucherBanner = await Banner.findOne({ position: 'voucher', isActive: true }) || {
      title: 'Digital Gift Vouchers',
      subtitle: 'Give the gift of choice with instant email delivery',
      link: '/collections/gift-cards',
      desktopImage: '/img/banner-voucher.jpg',
      buttonText: 'Buy Voucher'
    };

    // 5. Best Sellers
    const bestSellers = await Product.find({ 'flags.bestSeller': true, status: 'Published' })
      .populate('brand', 'name slug')
      .limit(10);

    // 6. Initial Just Landed (Casuals default)
    const justLandedProducts = await Product.find({ 'flags.justLanded': true, status: 'Published' })
      .populate('brand', 'name slug')
      .limit(8);

    // 7. Hand-picked promo cards
    const handPickedCards = [
      {
        title: 'Sneaker Lab Curated',
        badge: 'Trending Now',
        copy: 'Engineered for lightweight comfort and streetwear aesthetics.',
        link: '/collections/sneakers',
        image: '/img/promo-sneaker.jpg'
      },
      {
        title: "Gentlemen's Formal Range",
        badge: 'Crafted Leather',
        copy: 'Pure top-grain leather formal dress shoes and moccasins.',
        link: '/collections/formal-shoes',
        image: '/img/promo-formal.jpg'
      }
    ];

    // 8. Featured Products Grid
    const featuredProducts = await Product.find({ 'flags.featured': true, status: 'Published' })
      .populate('brand', 'name slug')
      .limit(12);

    // 9. Pick Your Favourites (3 feature cards)
    const favouritesCards = [
      {
        label: "Ladies Casual & Flats",
        heading: "Effortless Comfort",
        description: "Soft cushioned insoles designed for all-day city walks.",
        link: "/collections/women",
        image: "/img/fav-ladies.jpg",
        buttonText: "Shop Women"
      },
      {
        label: "Men's Italian Formals",
        heading: "Executive Elegance",
        description: "Handcrafted burnished brogues and modern slip-on loafers.",
        link: "/collections/men",
        image: "/img/fav-men.jpg",
        buttonText: "Shop Men"
      },
      {
        label: "Genuine Leather Bags",
        heading: "Timeless Carryalls",
        description: "Executive briefcases, backpacks and luxury tote bags.",
        link: "/collections/accessories",
        image: "/img/fav-bags.jpg",
        buttonText: "Shop Bags"
      }
    ];

    // 10. Recent Blog Posts
    const recentPosts = await BlogPost.find({ isPublished: true })
      .sort({ publishedAt: -1 })
      .limit(3);

    // 11. Instagram Strip (from settings)
    const settings = await Setting.getSettings();
    const instagramPosts = settings.instagramStrip?.length ? settings.instagramStrip : [
      { imageUrl: '/img/insta-1.jpg', postUrl: 'https://instagram.com' },
      { imageUrl: '/img/insta-2.jpg', postUrl: 'https://instagram.com' },
      { imageUrl: '/img/insta-3.jpg', postUrl: 'https://instagram.com' },
      { imageUrl: '/img/insta-4.jpg', postUrl: 'https://instagram.com' },
      { imageUrl: '/img/insta-5.jpg', postUrl: 'https://instagram.com' },
      { imageUrl: '/img/insta-6.jpg', postUrl: 'https://instagram.com' }
    ];

    res.render('pages/home', {
      title: 'StepUp Shoes Bangladesh | Official Online Store',
      heroBanners,
      genderCategories,
      accessoriesBanner,
      voucherBanner,
      bestSellers,
      justLandedProducts,
      handPickedCards,
      featuredProducts,
      favouritesCards,
      recentPosts,
      instagramPosts,
      formatBDT,
      calculateDiscountPercent
    });
  } catch (err) {
    next(err);
  }
};

// 2. Collection Listing Page
const getCollection = async (req, res, next) => {
  try {
    const slug = req.params.slug || 'all';
    const page = parseInt(req.query.page || '1', 10);
    const limit = 24;

    const filter = { status: 'Published' };

    // Collection metadata
    let collectionTitle = 'All Shoes & Accessories';
    let collectionBanner = null;
    let collectionDesc = '';

    // Handle slug mapping
    if (slug === 'men') {
      filter.gender = 'Men';
      collectionTitle = "Men's Collection";
      collectionBanner = '/img/banner-men.jpg';
    } else if (slug === 'women') {
      filter.gender = 'Women';
      collectionTitle = "Women's Collection";
      collectionBanner = '/img/banner-women.jpg';
    } else if (slug === 'kids' || slug === 'children') {
      filter.gender = { $in: ['Boys', 'Girls', 'Children'] };
      collectionTitle = "Kids' Collection";
      collectionBanner = '/img/banner-kids.jpg';
    } else if (slug === 'discounted' || slug === 'sale') {
      filter['flags.discounted'] = true;
      collectionTitle = "Special Discount Offers";
    } else if (slug !== 'all') {
      // Check if it's a specific Category, Brand, or Collection
      const cat = await Category.findOne({ slug });
      if (cat) {
        filter.$or = [{ category: cat._id }, { subCategory: cat._id }];
        collectionTitle = cat.name;
        collectionBanner = cat.bannerImage;
        collectionDesc = cat.description;
      } else {
        const brand = await Brand.findOne({ slug });
        if (brand) {
          filter.brand = brand._id;
          collectionTitle = `${brand.name} Collection`;
          collectionDesc = brand.description;
        } else {
          const coll = await Collection.findOne({ slug, isActive: true });
          if (coll) {
            collectionTitle = coll.title || coll.name;
            collectionBanner = coll.bannerImage;
            collectionDesc = coll.description;
            if (coll.isRuleBased && coll.rules) {
              if (coll.rules.brand) filter.brand = coll.rules.brand;
              if (coll.rules.category) filter.category = coll.rules.category;
              if (coll.rules.gender) filter.gender = coll.rules.gender;
              if (coll.rules.minPrice) filter.price = { ...(filter.price || {}), $gte: coll.rules.minPrice };
              if (coll.rules.maxPrice) filter.price = { ...(filter.price || {}), $lte: coll.rules.maxPrice };
            } else if (coll.manualProducts?.length) {
              filter._id = { $in: coll.manualProducts };
            }
          }
        }
      }
    }

    // Query filter overrides
    if (req.query.brand) {
      const b = await Brand.findOne({ slug: req.query.brand });
      if (b) filter.brand = b._id;
    }
    if (req.query.gender) {
      filter.gender = req.query.gender;
    }
    if (req.query.color) {
      filter['colors.name'] = { $regex: req.query.color, $options: 'i' };
    }
    if (req.query.size) {
      filter['colors.sizes.size'] = req.query.size;
    }
    if (req.query.onSale === 'true') {
      filter['flags.discounted'] = true;
    }

    // Price range filters
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    } else if (req.query.priceRange) {
      const ranges = {
        'under-1000': { $lt: 1000 },
        '1001-1500': { $gte: 1001, $lte: 1500 },
        '1501-2000': { $gte: 1501, $lte: 2000 },
        '2001-3000': { $gte: 2001, $lte: 3000 },
        '3001-4000': { $gte: 3001, $lte: 4000 },
        '4001-5000': { $gte: 4001, $lte: 5000 },
        'above-5000': { $gt: 5000 }
      };
      if (ranges[req.query.priceRange]) {
        filter.price = ranges[req.query.priceRange];
      }
    }

    // Sort order
    let sort = { createdAt: -1 };
    const sortParam = req.query.sort;
    if (sortParam === 'price-low') sort = { price: 1 };
    else if (sortParam === 'price-high') sort = { price: -1 };
    else if (sortParam === 'newest') sort = { createdAt: -1 };
    else if (sortParam === 'best-selling') sort = { soldCount: -1 };
    else if (sortParam === 'discount') sort = { discountPercent: -1 };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    // Sidebar filter options data
    const allBrands = await Brand.find({ isActive: true }).select('name slug');
    const allCategories = await Category.find({ isActive: true }).select('name slug gender');
    const colorOptions = ['Black', 'Brown', 'Blue', 'White', 'Gray', 'Tan', 'Red', 'Green', 'Pink'];
    const sizeOptions = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

    res.render('pages/collection', {
      title: `${collectionTitle} | StepUp Shoes`,
      slug,
      collectionTitle,
      collectionBanner,
      collectionDesc,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
      allBrands,
      allCategories,
      colorOptions,
      sizeOptions,
      query: req.query,
      formatBDT,
      calculateDiscountPercent
    });
  } catch (err) {
    next(err);
  }
};

// 3. Product Detail Page
const getProductDetail = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const product = await Product.findOne({ slug, status: 'Published' })
      .populate('brand')
      .populate('category')
      .populate('subCategory');

    if (!product) {
      return res.status(404).render('pages/error', {
        title: 'Product Not Found',
        statusCode: 404,
        message: 'The requested product could not be found or has been discontinued.'
      });
    }

    // Reviews
    const reviews = await Review.find({ product: product._id, status: 'approved' }).sort({ createdAt: -1 });

    // Related products (same category or brand)
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category._id,
      status: 'Published'
    })
      .populate('brand', 'name slug')
      .limit(8);

    const settings = await Setting.getSettings();

    res.render('pages/product', {
      title: `${product.name} | StepUp Shoes`,
      product,
      reviews,
      relatedProducts,
      settings,
      formatBDT,
      calculateDiscountPercent
    });
  } catch (err) {
    next(err);
  }
};

// 4. Live Search suggestions API & Search Page
const search = async (req, res, next) => {
  try {
    const queryStr = (req.query.q || '').trim();
    const isApi = req.xhr || req.originalUrl.startsWith('/api/');

    if (!queryStr) {
      if (isApi) return res.json({ products: [] });
      return res.render('pages/search', {
        title: 'Search Products',
        queryStr: '',
        products: [],
        total: 0,
        formatBDT,
        calculateDiscountPercent
      });
    }

    // Text search or regex match
    const filter = {
      status: 'Published',
      $or: [
        { name: { $regex: queryStr, $options: 'i' } },
        { tags: { $regex: queryStr, $options: 'i' } },
        { shortDesc: { $regex: queryStr, $options: 'i' } }
      ]
    };

    if (isApi) {
      // Live suggestions: top 6 matches
      const products = await Product.find(filter)
        .populate('brand', 'name')
        .select('name slug price salePrice colors primaryImage')
        .limit(6);

      const formatted = products.map(p => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        brand: p.brand?.name || '',
        priceFormatted: formatBDT(p.price),
        salePriceFormatted: p.salePrice ? formatBDT(p.salePrice) : null,
        image: p.primaryImage,
        url: `/products/${p.slug}`
      }));

      return res.json({ products: formatted });
    }

    const page = parseInt(req.query.page || '1', 10);
    const limit = 24;
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('brand', 'name slug')
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('pages/search', {
      title: `Search: "${queryStr}" | StepUp Shoes`,
      queryStr,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
      formatBDT,
      calculateDiscountPercent
    });
  } catch (err) {
    next(err);
  }
};

// 5. AJAX endpoint for Just Landed tabs & collection load-more
const getProductsAjax = async (req, res, next) => {
  try {
    const filter = { status: 'Published' };

    if (req.query.tag === 'just-landed') {
      filter['flags.justLanded'] = true;
    }
    if (req.query.tag === 'best-seller') {
      filter['flags.bestSeller'] = true;
    }
    if (req.query.tag === 'featured') {
      filter['flags.featured'] = true;
    }
    if (req.query.category) {
      const cat = await Category.findOne({ slug: req.query.category });
      if (cat) filter.category = cat._id;
    }
    if (req.query.gender) {
      filter.gender = req.query.gender;
    }

    const limit = parseInt(req.query.limit || '8', 10);
    const products = await Product.find(filter)
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .limit(limit);

    res.json({
      success: true,
      products: products.map(p => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        brand: p.brand ? { name: p.brand.name, slug: p.brand.slug } : null,
        price: p.price,
        salePrice: p.salePrice,
        priceFormatted: formatBDT(p.price),
        salePriceFormatted: p.salePrice ? formatBDT(p.salePrice) : null,
        discountPercent: p.discountPercent,
        isOnSale: p.isOnSale,
        primaryImage: p.primaryImage,
        hoverImage: p.hoverImage,
        colors: p.colors.map(c => ({
          name: c.name,
          hex: c.hex,
          sizes: c.sizes.map(s => ({ size: s.size, stock: s.stock }))
        }))
      }))
    });
  } catch (err) {
    next(err);
  }
};

// 6. Quick View Modal AJAX
const getQuickView = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand')
      .populate('category');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        brandName: product.brand?.name || '',
        price: product.price,
        salePrice: product.salePrice,
        priceFormatted: formatBDT(product.price),
        salePriceFormatted: product.salePrice ? formatBDT(product.salePrice) : null,
        discountPercent: product.discountPercent,
        isOnSale: product.isOnSale,
        shortDesc: product.shortDesc,
        primaryImage: product.primaryImage,
        colors: product.colors
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHome,
  getCollection,
  getProductDetail,
  search,
  getProductsAjax,
  getQuickView
};
