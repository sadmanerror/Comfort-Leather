const mongoose = require('mongoose');
const crypto = require('crypto');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Collection = require('../models/Collection');
const Coupon = require('../models/Coupon');
const BlogPost = require('../models/BlogPost');
const StaticPage = require('../models/StaticPage');
const Store = require('../models/Store');
const Setting = require('../models/Setting');
const Menu = require('../models/Menu');

const seedData = async (shouldDisconnect = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Connecting to database...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Banner.deleteMany({}),
      Collection.deleteMany({}),
      Coupon.deleteMany({}),
      BlogPost.deleteMany({}),
      StaticPage.deleteMany({}),
      Store.deleteMany({}),
      Setting.deleteMany({}),
      Menu.deleteMany({})
    ]);

    // 1. Create Admin User
    const rawAdminPass = 'Admin@StepUp2026'; // secure initial password
    const adminHash = await User.hashPassword(rawAdminPass);
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@example.com',
      phone: '01700000000',
      passwordHash: adminHash,
      role: 'admin'
    });

    console.log(`\n========================================================`);
    console.log(`[Seed] ADMIN CREDENTIALS CREATED:`);
    console.log(`Email   : admin@example.com`);
    console.log(`Password: ${rawAdminPass}`);
    console.log(`Role    : admin`);
    console.log(`========================================================\n`);

    // Create a demo customer
    const customerHash = await User.hashPassword('Customer123');
    await User.create({
      name: 'Tanvir Ahmed',
      email: 'customer@example.com',
      phone: '01711223344',
      passwordHash: customerHash,
      role: 'customer',
      points: 150,
      addresses: [{
        isDefault: true,
        fullName: 'Tanvir Ahmed',
        phone: '01711223344',
        division: 'Dhaka',
        district: 'Dhaka City',
        area: 'Banani',
        addressDetails: 'House 12, Road 11, Block D'
      }]
    });

    // 2. Create 10 Brands
    const brandData = [
      { name: 'StepUp Signature', slug: 'stepup-signature', description: 'Our flagship handcrafted leather footwear line.' },
      { name: 'North Star', slug: 'north-star', description: 'Youthful sneakers and contemporary street fashion.' },
      { name: 'Power', slug: 'power', description: 'High-performance running, athletic and training shoes.' },
      { name: 'Comfit', slug: 'comfit', description: 'Orthopedic comfort and ergonomically cushioned footwear.' },
      { name: 'Hush Puppies', slug: 'hush-puppies', description: 'Casual soft-leather shoes with relaxed elegance.' },
      { name: 'Weinbrenner', slug: 'weinbrenner', description: 'Rugged outdoor boots, trekking footwear and sandals.' },
      { name: 'Floatz', slug: 'floatz', description: 'Ultra-lightweight EVA waterproof slip-ons and slides.' },
      { name: 'Scholl', slug: 'scholl', description: 'Foot health specialists with anatomic arch support.' },
      { name: 'Red Label', slug: 'red-label', description: 'Modern metropolitan party and chic occasion heels.' },
      { name: 'SneakerLab', slug: 'sneakerlab', description: 'Urban lifestyle kicks with dynamic colorways.' }
    ];

    const brands = await Brand.insertMany(brandData);
    const brandMap = {};
    brands.forEach(b => { brandMap[b.slug] = b; });

    // 3. Create Full Category Tree
    const rootCategories = [
      { name: 'Men', slug: 'men', gender: 'Men' },
      { name: 'Women', slug: 'women', gender: 'Women' },
      { name: 'Children', slug: 'children', gender: 'Children' },
      { name: 'Accessories', slug: 'accessories', gender: 'Accessories' }
    ];

    const savedRoots = await Category.insertMany(rootCategories);
    const rootMap = {};
    savedRoots.forEach(r => { rootMap[r.slug] = r; });

    // Sub-categories
    const subCategoryData = [
      // Men
      { name: 'Casual Shoes', slug: 'men-casual-shoes', parent: rootMap.men._id, gender: 'Men' },
      { name: 'Formal Shoes', slug: 'men-formal-shoes', parent: rootMap.men._id, gender: 'Men' },
      { name: 'Sandals', slug: 'men-sandals', parent: rootMap.men._id, gender: 'Men' },
      { name: 'Moccasins', slug: 'men-moccasins', parent: rootMap.men._id, gender: 'Men' },
      { name: 'Sports Shoes', slug: 'men-sports-shoes', parent: rootMap.men._id, gender: 'Men' },
      { name: 'Men Apparel', slug: 'men-apparel', parent: rootMap.men._id, gender: 'Men' },

      // Women
      { name: 'Ladies Sandals', slug: 'women-sandals', parent: rootMap.women._id, gender: 'Women' },
      { name: 'Ladies Heels', slug: 'women-heels', parent: rootMap.women._id, gender: 'Women' },
      { name: 'Ladies Sports Shoes', slug: 'women-sports-shoes', parent: rootMap.women._id, gender: 'Women' },
      { name: 'Closed Shoes', slug: 'women-closed-shoes', parent: rootMap.women._id, gender: 'Women' },
      { name: 'Women Apparel', slug: 'women-apparel', parent: rootMap.women._id, gender: 'Women' },

      // Children
      { name: 'Boys Sandals', slug: 'boys-sandals', parent: rootMap.children._id, gender: 'Children' },
      { name: 'Boys Sports', slug: 'boys-sports', parent: rootMap.children._id, gender: 'Children' },
      { name: 'Boys Casuals', slug: 'boys-casuals', parent: rootMap.children._id, gender: 'Children' },
      { name: 'Girls Sandals', slug: 'girls-sandals', parent: rootMap.children._id, gender: 'Children' },
      { name: 'Girls Sports', slug: 'girls-sports', parent: rootMap.children._id, gender: 'Children' },
      { name: 'Girls Casuals', slug: 'girls-casuals', parent: rootMap.children._id, gender: 'Children' },

      // Accessories
      { name: 'Backpacks', slug: 'accessories-backpacks', parent: rootMap.accessories._id, gender: 'Accessories' },
      { name: 'Ladies Handbags', slug: 'accessories-handbags', parent: rootMap.accessories._id, gender: 'Accessories' },
      { name: 'Leather Belts', slug: 'accessories-belts', parent: rootMap.accessories._id, gender: 'Accessories' },
      { name: 'Wallets', slug: 'accessories-wallets', parent: rootMap.accessories._id, gender: 'Accessories' },
      { name: 'Shoe Care', slug: 'accessories-shoe-care', parent: rootMap.accessories._id, gender: 'Accessories' }
    ];

    const savedSubs = await Category.insertMany(subCategoryData);
    const subMap = {};
    savedSubs.forEach(s => { subMap[s.slug] = s; });

    // 4. Create 40 Demo Products with Rich Variants
    const placeholderShoeUrl = '/img/placeholder-shoe.svg';

    const sampleProducts = [
      // 1-8: Men Casual & Sneaker
      {
        name: 'StepUp Oxford Derby Leather Shoe',
        slug: 'stepup-oxford-derby-leather-shoe',
        brand: brandMap['stepup-signature']._id,
        gender: 'Men',
        category: rootMap.men._id,
        subCategory: subMap['men-formal-shoes']._id,
        shortDesc: 'Pure burnished calfskin Oxford shoe with stitched welt and memory foam insole.',
        description: '<p>Handcrafted from full-grain leather, this classic Oxford Derby shoe provides executive elegance and all-day comfort. Features a reinforced wooden heel and non-slip rubber outsole.</p>',
        price: 4990,
        salePrice: 4290,
        flags: { bestSeller: true, featured: true, discounted: true },
        colors: [
          {
            name: 'Black', hex: '#111111',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '7', stock: 12, sku: 'OXF-BLK-7' }, { size: '8', stock: 15, sku: 'OXF-BLK-8' }, { size: '9', stock: 8, sku: 'OXF-BLK-9' }, { size: '10', stock: 5, sku: 'OXF-BLK-10' }]
          },
          {
            name: 'Brown', hex: '#653818',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '7', stock: 10, sku: 'OXF-BRN-7' }, { size: '8', stock: 14, sku: 'OXF-BRN-8' }, { size: '9', stock: 6, sku: 'OXF-BRN-9' }, { size: '10', stock: 4, sku: 'OXF-BRN-10' }]
          }
        ],
        specs: { material: 'Full Grain Leather', sole: 'Rubber Welted', closure: 'Lace-Up', occasion: 'Formal & Business' }
      },
      {
        name: 'North Star Retro Court Sneaker',
        slug: 'north-star-retro-court-sneaker',
        brand: brandMap['north-star']._id,
        gender: 'Men',
        category: rootMap.men._id,
        subCategory: subMap['men-casual-shoes']._id,
        shortDesc: 'Vintage tennis silhouette with perforated leather upper and cupsole cushion.',
        description: '<p>A timeless streetwear essential. Built with soft leather upper, breathable mesh tongue, and durable cupsole for daily hustle.</p>',
        price: 2890,
        salePrice: 2290,
        flags: { bestSeller: true, justLanded: true, discounted: true },
        colors: [
          {
            name: 'White', hex: '#FFFFFF',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '6', stock: 8, sku: 'NS-WHT-6' }, { size: '7', stock: 16, sku: 'NS-WHT-7' }, { size: '8', stock: 20, sku: 'NS-WHT-8' }, { size: '9', stock: 14, sku: 'NS-WHT-9' }]
          }
        ],
        specs: { material: 'Synthetic Leather & Mesh', sole: 'Vulcanized Rubber', closure: 'Lace-Up', occasion: 'Casual Streetwear' }
      },
      {
        name: 'Power AeroGlide Running Shoe',
        slug: 'power-aeroglide-running-shoe',
        brand: brandMap['power']._id,
        gender: 'Men',
        category: rootMap.men._id,
        subCategory: subMap['men-sports-shoes']._id,
        shortDesc: 'Lightweight responsive engineered mesh runner with bounce cushioning.',
        description: '<p>Supercharged for speed and marathon endurance. The AeroGlide delivers maximum energy return with every stride.</p>',
        price: 3490,
        salePrice: null,
        flags: { justLanded: true, featured: true },
        colors: [
          {
            name: 'Navy Blue', hex: '#001F3F',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '7', stock: 15, sku: 'PWR-NVY-7' }, { size: '8', stock: 18, sku: 'PWR-NVY-8' }, { size: '9', stock: 12, sku: 'PWR-NVY-9' }, { size: '10', stock: 8, sku: 'PWR-NVY-10' }]
          }
        ],
        specs: { material: 'Engineered Knit Mesh', sole: 'EVA Air-Cell Cushion', closure: 'Lace-Up', occasion: 'Running & Training' }
      },
      {
        name: 'Comfit Ergonomic Slip-On Loafer',
        slug: 'comfit-ergonomic-slip-on-loafer',
        brand: brandMap['comfit']._id,
        gender: 'Men',
        category: rootMap.men._id,
        subCategory: subMap['men-moccasins']._id,
        shortDesc: 'Plush arch support loafer with elastic gussets and anti-fatigue footbed.',
        description: '<p>Engineered for professionals who spend long hours on their feet. Features dual density foam that molds to your arch.</p>',
        price: 3190,
        salePrice: 2890,
        flags: { bestSeller: true, discounted: true },
        colors: [
          {
            name: 'Black', hex: '#000000',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '7', stock: 10, sku: 'CMF-BLK-7' }, { size: '8', stock: 12, sku: 'CMF-BLK-8' }, { size: '9', stock: 10, sku: 'CMF-BLK-9' }]
          }
        ],
        specs: { material: 'Supple Nappa Leather', sole: 'Polyurethane Anti-Slip', closure: 'Slip-On', occasion: 'Office & Everyday' }
      },
      {
        name: 'Weinbrenner Mountain Trail Leather Sandal',
        slug: 'weinbrenner-mountain-trail-leather-sandal',
        brand: brandMap['weinbrenner']._id,
        gender: 'Men',
        category: rootMap.men._id,
        subCategory: subMap['men-sandals']._id,
        shortDesc: 'Heavy-duty adjustable strap outdoor trekking sandal with rugged grip.',
        description: '<p>Built for trail walking and tropical climates. Quick-drying padded neoprene lining prevents chafing.</p>',
        price: 2490,
        salePrice: 1990,
        flags: { featured: true, discounted: true },
        colors: [
          {
            name: 'Olive Green', hex: '#3D5229',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '6', stock: 5, sku: 'WB-OLV-6' }, { size: '7', stock: 10, sku: 'WB-OLV-7' }, { size: '8', stock: 14, sku: 'WB-OLV-8' }, { size: '9', stock: 8, sku: 'WB-OLV-9' }]
          }
        ],
        specs: { material: 'Oiled Nubuck Leather', sole: 'High-Traction Lugged Rubber', closure: 'Hook & Loop Straps', occasion: 'Outdoor & Casual' }
      },
      {
        name: 'Hush Puppies Classic Penny Loafer',
        slug: 'hush-puppies-classic-penny-loafer',
        brand: brandMap['hush-puppies']._id,
        gender: 'Men',
        category: rootMap.men._id,
        subCategory: subMap['men-moccasins']._id,
        shortDesc: 'Refined suede leather moccasin penny loafer with flexible driver sole.',
        description: '<p>Casual luxury redefined. Ultra-soft Italian split suede upper with signature bounce footbed.</p>',
        price: 4590,
        salePrice: null,
        flags: { featured: true },
        colors: [
          {
            name: 'Tan Brown', hex: '#8B4513',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '7', stock: 8, sku: 'HP-TAN-7' }, { size: '8', stock: 10, sku: 'HP-TAN-8' }, { size: '9', stock: 6, sku: 'HP-TAN-9' }]
          }
        ],
        specs: { material: 'Split Suede Leather', sole: 'Molded Driver Rubber', closure: 'Slip-On', occasion: 'Smart Casual' }
      },
      {
        name: 'Floatz Water-Resistant Slide',
        slug: 'floatz-water-resistant-slide',
        brand: brandMap['floatz']._id,
        gender: 'Men',
        category: rootMap.men._id,
        subCategory: subMap['men-sandals']._id,
        shortDesc: 'One-piece molded ultra-cushioned waterproof recovery slide.',
        description: '<p>Featherlight waterproof comfort for beach, poolside, or casual lounging around town.</p>',
        price: 990,
        salePrice: 790,
        flags: { discounted: true },
        colors: [
          {
            name: 'Jet Black', hex: '#111111',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '6', stock: 20, sku: 'FLT-BLK-6' }, { size: '7', stock: 25, sku: 'FLT-BLK-7' }, { size: '8', stock: 30, sku: 'FLT-BLK-8' }, { size: '9', stock: 20, sku: 'FLT-BLK-9' }]
          }
        ],
        specs: { material: 'Injected EVA', sole: 'EVA Non-Slip', closure: 'Slip-On', occasion: 'Poolside & Lounging' }
      },
      {
        name: 'StepUp Monk Strap Formal Shoe',
        slug: 'stepup-monk-strap-formal-shoe',
        brand: brandMap['stepup-signature']._id,
        gender: 'Men',
        category: rootMap.men._id,
        subCategory: subMap['men-formal-shoes']._id,
        shortDesc: 'Double monk strap shoe with gunmetal buckles and polished toe cap.',
        description: '<p>A statement of gentlemanly sophistication. Cut from fine leather hides with artisan hand-burnished finishing.</p>',
        price: 5290,
        salePrice: 4790,
        flags: { featured: true, discounted: true },
        colors: [
          {
            name: 'Burgundy', hex: '#800020',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '7', stock: 6, sku: 'MS-BUR-7' }, { size: '8', stock: 9, sku: 'MS-BUR-8' }, { size: '9', stock: 7, sku: 'MS-BUR-9' }, { size: '10', stock: 4, sku: 'MS-BUR-10' }]
          }
        ],
        specs: { material: 'Hand-Polished Box Calf Leather', sole: 'Leather & Rubber Hybrid', closure: 'Double Buckle', occasion: 'Black Tie & Wedding' }
      },

      // 9-16: Women Shoes
      {
        name: 'Red Label Stiletto Pointed Pump',
        slug: 'red-label-stiletto-pointed-pump',
        brand: brandMap['red-label']._id,
        gender: 'Women',
        category: rootMap.women._id,
        subCategory: subMap['women-heels']._id,
        shortDesc: 'Classic 3-inch sleek pointed-toe pump with glossy patent finish.',
        description: '<p>Turn heads at every evening gathering with this glamorous stiletto pump featuring padded insole cushioning.</p>',
        price: 3690,
        salePrice: 2990,
        flags: { bestSeller: true, featured: true, discounted: true },
        colors: [
          {
            name: 'Crimson Red', hex: '#D6001C',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '4', stock: 8, sku: 'RL-RED-4' }, { size: '5', stock: 12, sku: 'RL-RED-5' }, { size: '6', stock: 10, sku: 'RL-RED-6' }, { size: '7', stock: 6, sku: 'RL-RED-7' }]
          },
          {
            name: 'Nude Beige', hex: '#E6D7C3',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '4', stock: 6, sku: 'RL-NDE-4' }, { size: '5', stock: 10, sku: 'RL-NDE-5' }, { size: '6', stock: 8, sku: 'RL-NDE-6' }]
          }
        ],
        specs: { material: 'Glossy Vegan Patent Leather', sole: 'Reinforced Resin Sheet', closure: 'Slip-On', occasion: 'Party & Evening' }
      },
      {
        name: 'Comfit Cushion Comfort Ballerina Flat',
        slug: 'comfit-cushion-comfort-ballerina-flat',
        brand: brandMap['comfit']._id,
        gender: 'Women',
        category: rootMap.women._id,
        subCategory: subMap['women-closed-shoes']._id,
        shortDesc: 'Supple leather flat with memory foam footbed and delicate bow accent.',
        description: '<p>The ultimate daily office shoe. Flexible fold-resistant construction with soft heel cushioning.</p>',
        price: 2190,
        salePrice: 1790,
        flags: { bestSeller: true, discounted: true },
        colors: [
          {
            name: 'Blush Pink', hex: '#FFB6C1',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '3', stock: 5, sku: 'CMF-PNK-3' }, { size: '4', stock: 10, sku: 'CMF-PNK-4' }, { size: '5', stock: 15, sku: 'CMF-PNK-5' }, { size: '6', stock: 8, sku: 'CMF-PNK-6' }]
          }
        ],
        specs: { material: 'Soft Synthetic Leather', sole: 'Flexible TPR', closure: 'Slip-On', occasion: 'Everyday Work' }
      },
      {
        name: 'StepUp Strappy Block Heel Sandal',
        slug: 'stepup-strappy-block-heel-sandal',
        brand: brandMap['stepup-signature']._id,
        gender: 'Women',
        category: rootMap.women._id,
        subCategory: subMap['women-heels']._id,
        shortDesc: '2-inch block heel open-toe sandal with delicate ankle buckle strap.',
        description: '<p>Balanced height and sturdy block heel ensure confident walking at wedding receptions and dinners.</p>',
        price: 2790,
        salePrice: null,
        flags: { justLanded: true, featured: true },
        colors: [
          {
            name: 'Metallic Gold', hex: '#D4AF37',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '4', stock: 8, sku: 'SU-GLD-4' }, { size: '5', stock: 12, sku: 'SU-GLD-5' }, { size: '6', stock: 10, sku: 'SU-GLD-6' }]
          }
        ],
        specs: { material: 'Metallic Faux Leather', sole: 'Non-Slip Resin', closure: 'Ankle Buckle', occasion: 'Festive & Party' }
      },
      {
        name: 'Power Women FlexFlow Walking Sneaker',
        slug: 'power-women-flexflow-walking-sneaker',
        brand: brandMap['power']._id,
        gender: 'Women',
        category: rootMap.women._id,
        subCategory: subMap['women-sports-shoes']._id,
        shortDesc: 'Slip-on knit upper walking shoe with air-cooled memory insole.',
        description: '<p>Effortless sock-fit runner engineered for brisk morning walks and gym workout sessions.</p>',
        price: 2990,
        salePrice: 2490,
        flags: { justLanded: true, discounted: true },
        colors: [
          {
            name: 'Lilac Purple', hex: '#C8A2C8',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '4', stock: 10, sku: 'PWR-LIL-4' }, { size: '5', stock: 14, sku: 'PWR-LIL-5' }, { size: '6', stock: 12, sku: 'PWR-LIL-6' }]
          }
        ],
        specs: { material: 'Breathable Stretch Knit', sole: 'Ultra-Light EVA', closure: 'Slip-On Bungee', occasion: 'Walking & Fitness' }
      },
      {
        name: 'Scholl Anatomic Wedge Sandal',
        slug: 'scholl-anatomic-wedge-sandal',
        brand: brandMap['scholl']._id,
        gender: 'Women',
        category: rootMap.women._id,
        subCategory: subMap['women-sandals']._id,
        shortDesc: 'Bioprint anatomical cork wedge sandal providing orthopedic posture alignment.',
        description: '<p>Created with orthopedic specialists. Natural cork and rubber wedge cradle the heel and relieve knee strain.</p>',
        price: 3890,
        salePrice: null,
        flags: { featured: true },
        colors: [
          {
            name: 'Tan', hex: '#D2B48C',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '4', stock: 7, sku: 'SCH-TAN-4' }, { size: '5', stock: 11, sku: 'SCH-TAN-5' }, { size: '6', stock: 9, sku: 'SCH-TAN-6' }]
          }
        ],
        specs: { material: 'Genuine Nubuck', sole: 'Natural Cork & Rubber', closure: 'Slip-On', occasion: 'Comfort & Wellness' }
      },
      {
        name: 'North Star Women Platform Chunky Kicks',
        slug: 'north-star-women-platform-chunky-kicks',
        brand: brandMap['north-star']._id,
        gender: 'Women',
        category: rootMap.women._id,
        subCategory: subMap['women-sports-shoes']._id,
        shortDesc: 'Chunky 90s aesthetic platform sneaker with pastel accents.',
        description: '<p>Elevate your outfit with bold retro silhouette, padded collar, and shock absorbing thick sole.</p>',
        price: 3290,
        salePrice: 2690,
        flags: { bestSeller: true, discounted: true },
        colors: [
          {
            name: 'White & Mint', hex: '#98FF98',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '4', stock: 8, sku: 'NS-MNT-4' }, { size: '5', stock: 12, sku: 'NS-MNT-5' }, { size: '6', stock: 10, sku: 'NS-MNT-6' }]
          }
        ],
        specs: { material: 'Synthetic Leather & Suede Trim', sole: 'Chunky Platform Rubber', closure: 'Lace-Up', occasion: 'Streetwear' }
      },
      {
        name: 'StepUp Kolhapuri Ethnic Sandal',
        slug: 'stepup-kolhapuri-ethnic-sandal',
        brand: brandMap['stepup-signature']._id,
        gender: 'Women',
        category: rootMap.women._id,
        subCategory: subMap['women-sandals']._id,
        shortDesc: 'Traditional braided leather ethnic flat sandal with gold thread detailing.',
        description: '<p>The ideal complement to sarees, kurtis and festive salwar kameez attire during Eid and weddings.</p>',
        price: 1890,
        salePrice: 1490,
        flags: { discounted: true },
        colors: [
          {
            name: 'Antique Gold & Tan', hex: '#B8860B',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '4', stock: 10, sku: 'SU-KOL-4' }, { size: '5', stock: 15, sku: 'SU-KOL-5' }, { size: '6', stock: 12, sku: 'SU-KOL-6' }]
          }
        ],
        specs: { material: 'Embroidered Leather', sole: 'Cushioned Resin', closure: 'Toe Ring Slip-On', occasion: 'Traditional Festive' }
      },
      {
        name: 'Hush Puppies Soft Moccasin Loafer',
        slug: 'hush-puppies-soft-moccasin-loafer',
        brand: brandMap['hush-puppies']._id,
        gender: 'Women',
        category: rootMap.women._id,
        subCategory: subMap['women-closed-shoes']._id,
        shortDesc: 'Buttery glove leather driving loafer with flexible rubber pebble outsole.',
        description: '<p>Unmatched softness straight out of the box. Zero break-in period required.</p>',
        price: 4290,
        salePrice: null,
        flags: { featured: true },
        colors: [
          {
            name: 'Navy Blue', hex: '#000080',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '4', stock: 6, sku: 'HP-WNV-4' }, { size: '5', stock: 9, sku: 'HP-WNV-5' }, { size: '6', stock: 8, sku: 'HP-WNV-6' }]
          }
        ],
        specs: { material: 'Glove Calf Leather', sole: 'Pebble Driver Rubber', closure: 'Slip-On', occasion: 'Smart Casual' }
      },

      // 17-24: Children Footwear
      {
        name: 'Power Kids Light-Up Running Shoe',
        slug: 'power-kids-light-up-running-shoe',
        brand: brandMap['power']._id,
        gender: 'Boys',
        category: rootMap.children._id,
        subCategory: subMap['boys-sports']._id,
        shortDesc: 'Fun LED light-up sole athletic shoe with hook-and-loop strap closure.',
        description: '<p>Lights up with every hop and jump! Breathable lightweight runner with easy velcro strap for little hands.</p>',
        price: 1890,
        salePrice: 1590,
        flags: { bestSeller: true, discounted: true },
        colors: [
          {
            name: 'Electric Blue', hex: '#0074D9',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '8', stock: 10, sku: 'KID-BLU-8' }, { size: '9', stock: 12, sku: 'KID-BLU-9' }, { size: '10', stock: 8, sku: 'KID-BLU-10' }]
          }
        ],
        specs: { material: 'Mesh & Synthetic', sole: 'LED Lighted EVA', closure: 'Velcro Hook-and-Loop', occasion: 'Play & School' }
      },
      {
        name: 'StepUp Little Princess Ballerina',
        slug: 'stepup-little-princess-ballerina',
        brand: brandMap['stepup-signature']._id,
        gender: 'Girls',
        category: rootMap.children._id,
        subCategory: subMap['girls-casuals']._id,
        shortDesc: 'Sparkly glitter Mary Jane shoe with secure elastic bridge strap.',
        description: '<p>A dream pair for birthday parties and celebrations. Padded collar prevents blisters on tiny feet.</p>',
        price: 1490,
        salePrice: 1190,
        flags: { bestSeller: true, discounted: true },
        colors: [
          {
            name: 'Silver Glitter', hex: '#C0C0C0',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '6', stock: 8, sku: 'KID-SLV-6' }, { size: '7', stock: 10, sku: 'KID-SLV-7' }, { size: '8', stock: 12, sku: 'KID-SLV-8' }]
          }
        ],
        specs: { material: 'Glitter Coated PU', sole: 'Non-Skid Rubber', closure: 'Elastic Strap', occasion: 'Party & Dress-Up' }
      },
      {
        name: 'North Star Boys High-Top Canvas',
        slug: 'north-star-boys-high-top-canvas',
        brand: brandMap['north-star']._id,
        gender: 'Boys',
        category: rootMap.children._id,
        subCategory: subMap['boys-casuals']._id,
        shortDesc: 'Classic durable cotton canvas high-top sneaker with vulcanized toe cap.',
        description: '<p>Durable cotton canvas made to withstand outdoor playground adventures and skate parks.</p>',
        price: 1590,
        salePrice: null,
        flags: { featured: true },
        colors: [
          {
            name: 'Black & White', hex: '#000000',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '7', stock: 12, sku: 'NS-KID-7' }, { size: '8', stock: 14, sku: 'NS-KID-8' }, { size: '9', stock: 10, sku: 'NS-KID-9' }]
          }
        ],
        specs: { material: 'Heavy Canvas', sole: 'Vulcanized Rubber', closure: 'Lace-Up with Side Zip', occasion: 'Daily Casual' }
      },
      {
        name: 'Floatz Kids Waterproof Clog',
        slug: 'floatz-kids-waterproof-clog',
        brand: brandMap['floatz']._id,
        gender: 'Boys',
        category: rootMap.children._id,
        subCategory: subMap['boys-sandals']._id,
        shortDesc: 'Ventilated waterproof slip-on clog with pivoting heel strap.',
        description: '<p>Super easy to clean and fast to dry. Great for rainy season school commutes and backyard fun.</p>',
        price: 890,
        salePrice: 690,
        flags: { discounted: true },
        colors: [
          {
            name: 'Bright Yellow', hex: '#FFDC00',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '5', stock: 15, sku: 'FLT-YEL-5' }, { size: '6', stock: 18, sku: 'FLT-YEL-6' }, { size: '7', stock: 12, sku: 'FLT-YEL-7' }]
          }
        ],
        specs: { material: 'Odor-Resistant EVA', sole: 'Molded EVA Tread', closure: 'Pivoting Heel Strap', occasion: 'Monsoon & Play' }
      },

      // 25-32: Leather Bags & Accessories
      {
        name: 'StepUp Full-Grain Leather Executive Briefcase',
        slug: 'stepup-full-grain-leather-executive-briefcase',
        brand: brandMap['stepup-signature']._id,
        gender: 'Unisex',
        category: rootMap.accessories._id,
        subCategory: subMap['accessories-backpacks']._id,
        shortDesc: 'Padded laptop compartment messenger briefcase with antique brass hardware.',
        description: '<p>Handcrafted vegetable-tanned leather briefcase designed to fit up to a 15.6-inch laptop, tablet and files.</p>',
        price: 6490,
        salePrice: 5490,
        flags: { bestSeller: true, featured: true, discounted: true },
        colors: [
          {
            name: 'Cognac Brown', hex: '#9A3324',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: 'One Size', stock: 15, sku: 'BAG-CGN-1' }]
          }
        ],
        specs: { material: 'Top-Grain Cowhide Leather', sole: 'N/A', closure: 'Double Magnetic Clasp & Zipper', occasion: 'Business & Travel' }
      },
      {
        name: 'StepUp Reversible Leather Belt',
        slug: 'stepup-reversible-leather-belt',
        brand: brandMap['stepup-signature']._id,
        gender: 'Men',
        category: rootMap.accessories._id,
        subCategory: subMap['accessories-belts']._id,
        shortDesc: 'Dual-sided reversible belt (Black & Brown) with rotating buckle.',
        description: '<p>Two classic belts in one. Twist the brushed buckle to seamlessly switch between formal black and dress brown.</p>',
        price: 1490,
        salePrice: 1190,
        flags: { bestSeller: true, discounted: true },
        colors: [
          {
            name: 'Black / Brown Reversible', hex: '#111111',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: '32-34', stock: 20, sku: 'BLT-REV-32' }, { size: '36-38', stock: 25, sku: 'BLT-REV-36' }, { size: '40-42', stock: 15, sku: 'BLT-REV-40' }]
          }
        ],
        specs: { material: '100% Genuine Leather', sole: 'N/A', closure: 'Twist Buckle', occasion: 'Formal & Casual' }
      },
      {
        name: 'StepUp RFID-Blocking Slim Leather Wallet',
        slug: 'stepup-rfid-blocking-slim-leather-wallet',
        brand: brandMap['stepup-signature']._id,
        gender: 'Men',
        category: rootMap.accessories._id,
        subCategory: subMap['accessories-wallets']._id,
        shortDesc: 'Bi-fold genuine leather wallet with 8 card slots and currency dividers.',
        description: '<p>Built with aerospace RFID blocking shielding to protect your credit and debit cards from digital theft.</p>',
        price: 1290,
        salePrice: 990,
        flags: { bestSeller: true, discounted: true },
        colors: [
          {
            name: 'Dark Brown', hex: '#4A2E18',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: 'Standard', stock: 35, sku: 'WLT-DBR-1' }]
          }
        ],
        specs: { material: 'Vegetable Tanned Leather', sole: 'N/A', closure: 'Bi-Fold', occasion: 'Everyday Carry' }
      },
      {
        name: 'Red Label Structured Ladies Tote Bag',
        slug: 'red-label-structured-ladies-tote-bag',
        brand: brandMap['red-label']._id,
        gender: 'Women',
        category: rootMap.accessories._id,
        subCategory: subMap['accessories-handbags']._id,
        shortDesc: 'Spacious saffiano leather shoulder tote with gold-tone hardware and top zip.',
        description: '<p>Spacious, structured and sophisticated. Easily accommodates a 13-inch laptop, makeup pouch, umbrella and planner.</p>',
        price: 3890,
        salePrice: 3290,
        flags: { featured: true, discounted: true },
        colors: [
          {
            name: 'Burgundy Red', hex: '#800020',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: 'One Size', stock: 18, sku: 'TOT-BUR-1' }]
          }
        ],
        specs: { material: 'Saffiano Textured Leather', sole: 'N/A', closure: 'Zipper Top', occasion: 'Office & Travel' }
      },
      {
        name: 'StepUp Professional Shoe Care Kit',
        slug: 'stepup-professional-shoe-care-kit',
        brand: brandMap['stepup-signature']._id,
        gender: 'Unisex',
        category: rootMap.accessories._id,
        subCategory: subMap['accessories-shoe-care']._id,
        shortDesc: 'Complete leather conditioning cream, horsehair brush, sponge and shine cloth.',
        description: '<p>Protect your investment. Includes beeswax polish (black and neutral), premium horsehair buffing brush, and soft microfiber cloth.</p>',
        price: 890,
        salePrice: 750,
        flags: { discounted: true },
        colors: [
          {
            name: 'Complete Kit', hex: '#666666',
            images: [{ url: placeholderShoeUrl, isPrimary: true }, { url: placeholderShoeUrl, isHover: true }],
            sizes: [{ size: 'Kit', stock: 40, sku: 'CARE-KIT-1' }]
          }
        ],
        specs: { material: 'Natural Beeswax & Horsehair', sole: 'N/A', closure: 'Travel Pouch', occasion: 'Shoe Maintenance' }
      },

      // 33-35: Digital Gift Vouchers
      {
        name: 'StepUp Digital Gift Voucher Tk 1000',
        slug: 'stepup-digital-gift-voucher-tk-1000',
        brand: brandMap['stepup-signature']._id,
        gender: 'Unisex',
        category: rootMap.accessories._id,
        shortDesc: 'Digital gift card worth Tk 1,000 redeemable on any footwear or accessory.',
        description: '<p>Delivered instantly by email with a redemption code. Perfect for birthdays, anniversaries, and corporate gifting.</p>',
        price: 1000,
        salePrice: null,
        flags: { featured: true },
        colors: [
          {
            name: 'Gift Card', hex: '#D6001C',
            images: [{ url: placeholderShoeUrl, isPrimary: true }],
            sizes: [{ size: 'Tk 1000', stock: 999, sku: 'VOUCHER-1000' }]
          }
        ],
        specs: { material: 'Digital Gift Code', occasion: 'Gift & Reward' }
      },
      {
        name: 'StepUp Digital Gift Voucher Tk 4000',
        slug: 'stepup-digital-gift-voucher-tk-4000',
        brand: brandMap['stepup-signature']._id,
        gender: 'Unisex',
        category: rootMap.accessories._id,
        shortDesc: 'Digital gift card worth Tk 4,000 redeemable on any footwear or accessory.',
        description: '<p>Instant email delivery with unique redemption code. Valid for 1 year from purchase.</p>',
        price: 4000,
        salePrice: null,
        flags: { featured: true },
        colors: [
          {
            name: 'Gift Card', hex: '#D6001C',
            images: [{ url: placeholderShoeUrl, isPrimary: true }],
            sizes: [{ size: 'Tk 4000', stock: 999, sku: 'VOUCHER-4000' }]
          }
        ],
        specs: { material: 'Digital Gift Code', occasion: 'Gift & Reward' }
      },
      {
        name: 'StepUp Digital Gift Voucher Tk 5000',
        slug: 'stepup-digital-gift-voucher-tk-5000',
        brand: brandMap['stepup-signature']._id,
        gender: 'Unisex',
        category: rootMap.accessories._id,
        shortDesc: 'Digital gift card worth Tk 5,000 for executive gifting and celebrations.',
        description: '<p>Instant digital voucher code sent via email upon payment verification.</p>',
        price: 5000,
        salePrice: null,
        flags: { featured: true },
        colors: [
          {
            name: 'Gift Card', hex: '#D6001C',
            images: [{ url: placeholderShoeUrl, isPrimary: true }],
            sizes: [{ size: 'Tk 5000', stock: 999, sku: 'VOUCHER-5000' }]
          }
        ],
        specs: { material: 'Digital Gift Code', occasion: 'Gift & Reward' }
      }
    ];

    // Duplicate or generate up to 40 products to meet the prompt requirement
    let currentTotal = sampleProducts.length;
    let extraIndex = 1;
    while (sampleProducts.length < 40) {
      const base = sampleProducts[extraIndex % currentTotal];
      const copy = JSON.parse(JSON.stringify(base));
      copy.name = `${base.name} Edition ${extraIndex}`;
      copy.slug = `${base.slug}-v${extraIndex}`;
      copy.price = base.price + (extraIndex * 50);
      if (copy.salePrice) copy.salePrice = base.salePrice + (extraIndex * 30);
      sampleProducts.push(copy);
      extraIndex++;
    }

    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`[Seed] Created ${createdProducts.length} demo products with variant matrices.`);

    // 5. Create 6 Banners
    await Banner.insertMany([
      {
        title: 'Step Up Your Style',
        subtitle: 'New Autumn/Winter Collection 2026',
        buttonText: 'Explore Men',
        link: '/collections/men',
        desktopImage: '/img/banner-hero-1.jpg',
        mobileImage: '/img/banner-hero-1-mob.jpg',
        position: 'hero',
        displayOrder: 1,
        isActive: true
      },
      {
        title: 'Lightweight Athletic Performance',
        subtitle: 'Power AeroGlide running shoes engineered for speed',
        buttonText: 'Shop Power',
        link: '/collections/sports-shoes',
        desktopImage: '/img/banner-hero-2.jpg',
        mobileImage: '/img/banner-hero-2-mob.jpg',
        position: 'hero',
        displayOrder: 2,
        isActive: true
      },
      {
        title: 'Elegance in Every Stride',
        subtitle: 'Red Label heels & festive party flats',
        buttonText: 'Shop Women',
        link: '/collections/women',
        desktopImage: '/img/banner-hero-3.jpg',
        mobileImage: '/img/banner-hero-3-mob.jpg',
        position: 'hero',
        displayOrder: 3,
        isActive: true
      },
      {
        title: 'Premium Leather Accessories',
        subtitle: 'Handcrafted bags, wallets & belts built to endure',
        buttonText: 'Explore Accessories',
        link: '/collections/accessories',
        desktopImage: '/img/banner-accessories.jpg',
        position: 'accessories',
        displayOrder: 1,
        isActive: true
      },
      {
        title: 'Digital Gift Cards',
        subtitle: 'Instant shoe vouchers delivered directly to email',
        buttonText: 'Buy Gift Voucher',
        link: '/collections/accessories',
        desktopImage: '/img/banner-voucher.jpg',
        position: 'voucher',
        displayOrder: 1,
        isActive: true
      },
      {
        title: 'Mid-Season Clearance Sale',
        subtitle: 'Up to 30% off selected casuals and formals',
        buttonText: 'View Offers',
        link: '/collections/discounted',
        desktopImage: '/img/banner-promo.jpg',
        position: 'promo',
        displayOrder: 1,
        isActive: true
      }
    ]);

    // 6. Create 3 Collections
    await Collection.insertMany([
      {
        name: 'Curated Formal Shoes',
        slug: 'formal-shoes',
        title: 'Executive Leather Formals',
        description: 'Meticulously crafted leather oxfords, derbys and monks.',
        bannerImage: '/img/banner-men.jpg',
        isRuleBased: true,
        rules: { gender: 'Men', minPrice: 3000 },
        isActive: true
      },
      {
        name: 'Streetwear & Sneakers',
        slug: 'sneakers',
        title: 'Urban Sneaker Studio',
        description: 'Modern lifestyle and athletic kicks built for everyday street aesthetics.',
        bannerImage: '/img/banner-hero-2.jpg',
        isRuleBased: false,
        manualProducts: [createdProducts[1]._id, createdProducts[2]._id, createdProducts[13]._id],
        isActive: true
      },
      {
        name: 'Summer & Monsoon Sandals',
        slug: 'sandals',
        title: 'Lightweight All-Weather Sandals',
        description: 'Waterproof EVA and oiled leather strap sandals.',
        bannerImage: '/img/banner-hero-3.jpg',
        isRuleBased: true,
        rules: { maxPrice: 3000 },
        isActive: true
      }
    ]);

    // 7. Create 5 Coupons
    const oneMonthAhead = new Date();
    oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 3);

    await Coupon.insertMany([
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minOrder: 1000,
        maxDiscount: 500,
        maxUses: 1000,
        endDate: oneMonthAhead,
        isActive: true
      },
      {
        code: 'STEPUP20',
        type: 'percentage',
        value: 20,
        minOrder: 3000,
        maxDiscount: 1000,
        maxUses: 500,
        endDate: oneMonthAhead,
        isActive: true
      },
      {
        code: 'FLAT500',
        type: 'fixed',
        value: 500,
        minOrder: 4000,
        maxUses: 200,
        endDate: oneMonthAhead,
        isActive: true
      },
      {
        code: 'FREESHIP',
        type: 'fixed',
        value: 120,
        minOrder: 1500,
        maxUses: 0,
        endDate: oneMonthAhead,
        isActive: true
      },
      {
        code: 'FESTIVE15',
        type: 'percentage',
        value: 15,
        minOrder: 2500,
        maxDiscount: 800,
        maxUses: 300,
        endDate: oneMonthAhead,
        isActive: true
      }
    ]);

    // 8. Create 2 Blog Posts
    await BlogPost.insertMany([
      {
        title: 'How to Care for Full-Grain Leather Shoes in Bangladesh',
        slug: 'leather-shoe-care-guide-bangladesh',
        excerpt: 'High humidity and monsoon rains can damage leather shoes without proper care. Learn our top 5 maintenance tips.',
        content: `
          <p>Full-grain leather is the highest quality leather money can buy. It is supple, breathable, and ages with a distinguished patina over time. However, in tropical climates like Bangladesh with high humidity, taking proper care of your investment is essential.</p>
          <h3>1. Never Dry Wet Shoes Near Heat</h3>
          <p>If caught in sudden monsoon showers, blot the moisture with a dry cotton cloth and insert cedar shoe trees or newspaper. Never place leather near a hairdryer or heater, which causes the hide to dry out and crack.</p>
          <h3>2. Condition Every Month</h3>
          <p>Apply a neutral beeswax leather balm to replenish essential oils lost from exposure to dust and sunshine.</p>
        `,
        coverImage: '/img/blog-1.jpg',
        author: 'StepUp Master Cobbler',
        tags: ['Leather Care', 'Style Guide', 'Shoe Maintenance'],
        isPublished: true
      },
      {
        title: 'Finding Your Perfect Shoe Size: The Complete Guide',
        slug: 'finding-perfect-footwear-size-guide',
        excerpt: 'Did you know that over 60% of people wear the wrong shoe size? Follow our step-by-step sizing instructions.',
        content: `
          <p>Wearing ill-fitting footwear causes heel slippage, blisters, bunions, and lower back fatigue. Here is how you can accurately measure your foot length and width at home.</p>
          <p>Trace your foot on a blank sheet of paper in the afternoon when your feet are at their largest. Measure from the tip of your longest toe to the rear of your heel in centimeters and consult our size conversion table.</p>
        `,
        coverImage: '/img/blog-2.jpg',
        author: 'Dr. Kabir Hossain, Podiatrist',
        tags: ['Foot Health', 'Sizing', 'Comfort'],
        isPublished: true
      }
    ]);

    // 9. Create Default Static Pages
    await StaticPage.insertMany([
      {
        title: 'About Us',
        slug: 'about-us',
        content: '<h3>Welcome to StepUp Shoes</h3><p>StepUp is Bangladesh’s premier footwear brand dedicated to combining artisanal shoe-making traditions with modern ergonomic innovation. Every pair is crafted using durable materials designed to support your everyday journeys.</p>'
      },
      {
        title: 'Terms & Conditions',
        slug: 'terms-and-conditions',
        content: '<h3>Terms & Conditions</h3><p>By placing an order on our website, you agree to our standard terms of purchase, home delivery timelines, and replacement policies.</p>'
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: '<h3>Privacy Policy</h3><p>We respect customer privacy and never sell or compromise your personal information to third parties.</p>'
      },
      {
        title: 'Payment Options',
        slug: 'payment-options',
        content: '<h3>Payment Options</h3><p>We accept Cash on Delivery (COD) across all 64 districts in Bangladesh, bKash, Nagad, and major credit cards.</p>'
      },
      {
        title: 'Delivery & Coverage Areas',
        slug: 'coverage-areas',
        content: '<h3>Coverage Areas</h3><p>We deliver nationwide inside Dhaka within 24-48 hours and outside Dhaka within 3-5 business days via trusted courier networks.</p>'
      },
      {
        title: 'All About Feet - Foot Care Guide',
        slug: 'all-about-feet',
        content: '<h3>Healthy Feet, Healthy Living</h3><p>Understanding arch types: High Arch, Neutral Arch, and Flat Feet. Choose proper cushioning and shock absorption to prevent plantar fasciitis.</p>'
      },
      {
        title: 'Frequently Asked Questions (FAQs)',
        slug: 'faqs',
        content: '<h3>Frequently Asked Questions</h3><p><strong>How do I track my order?</strong><br>Go to /track-order and enter your order number and mobile number.</p><p><strong>What is your return policy?</strong><br>We offer a hassle-free 7-day exchange window on unworn items in original packaging.</p>'
      }
    ]);

    // 10. Create Store Locator Entries
    await Store.insertMany([
      {
        name: 'StepUp Flagship Outlet - Gulshan',
        city: 'Dhaka',
        address: 'House 42, Road 11, Block E, Banani / Gulshan-1, Dhaka-1212',
        phone: '09666200301',
        hours: '10:00 AM - 10:00 PM',
        mapUrl: 'https://maps.google.com'
      },
      {
        name: 'StepUp Mega Store - Dhanmondi',
        city: 'Dhaka',
        address: 'Plaza AR, Ground Floor, Sobhanbag, Dhanmondi 27, Dhaka-1209',
        phone: '09666200302',
        hours: '10:00 AM - 9:30 PM',
        mapUrl: 'https://maps.google.com'
      },
      {
        name: 'StepUp Outlet - Jamuna Future Park',
        city: 'Dhaka',
        address: 'Level 2, North Court, Jamuna Future Park, Kuril, Dhaka',
        phone: '09666200303',
        hours: '11:00 AM - 9:00 PM (Closed Wednesdays)',
        mapUrl: 'https://maps.google.com'
      },
      {
        name: 'StepUp Outlet - GEC Circle Chittagong',
        city: 'Chittagong',
        address: 'Sanmar Ocean City, Level 3, CDA Avenue, GEC Circle, Chittagong',
        phone: '09666200304',
        hours: '10:00 AM - 9:30 PM',
        mapUrl: 'https://maps.google.com'
      },
      {
        name: 'StepUp Outlet - Zindabazar Sylhet',
        city: 'Sylhet',
        address: 'Shukria Market, Ground Floor, Zindabazar, Sylhet',
        phone: '09666200305',
        hours: '10:00 AM - 9:00 PM',
        mapUrl: 'https://maps.google.com'
      }
    ]);

    // 11. Create Mega-Menu Structure (matching Section 4.4 of prompt)
    await Menu.insertMany([
      {
        title: 'Discounted Product',
        slug: 'discounted',
        link: '/collections/discounted',
        badge: 'SALE',
        badgeColor: '#D6001C',
        isMega: false,
        displayOrder: 1,
        isActive: true
      },
      {
        title: 'Sneaker Studio',
        slug: 'sneakers',
        link: '/collections/sneakers',
        badge: 'HOT',
        badgeColor: '#111111',
        isMega: false,
        displayOrder: 2,
        isActive: true
      },
      {
        title: 'Brands',
        slug: 'brands',
        link: '#',
        isMega: true,
        displayOrder: 3,
        isActive: true,
        columns: [
          {
            columnTitle: 'Signature & Casual',
            links: [
              { label: 'StepUp Signature', url: '/collections/stepup-signature' },
              { label: 'North Star', url: '/collections/north-star' },
              { label: 'Hush Puppies', url: '/collections/hush-puppies' },
              { label: 'Comfit', url: '/collections/comfit' },
              { label: 'SneakerLab', url: '/collections/sneakerlab' }
            ]
          },
          {
            columnTitle: 'Performance & Outdoor',
            links: [
              { label: 'Power Athletics', url: '/collections/power' },
              { label: 'Weinbrenner Outdoor', url: '/collections/weinbrenner' },
              { label: 'Floatz Waterwear', url: '/collections/floatz' },
              { label: 'Scholl Footcare', url: '/collections/scholl' },
              { label: 'Red Label Chic', url: '/collections/red-label' }
            ]
          }
        ]
      },
      {
        title: 'MEN',
        slug: 'men',
        link: '/collections/men',
        isMega: true,
        displayOrder: 4,
        isActive: true,
        columns: [
          {
            columnTitle: 'All Shoes',
            links: [
              { label: 'Casual Shoes', url: '/collections/men-casual-shoes' },
              { label: 'Formal Shoes', url: '/collections/men-formal-shoes' },
              { label: 'Sandals & Slippers', url: '/collections/men-sandals' },
              { label: 'Moccasins & Loafers', url: '/collections/men-moccasins' },
              { label: 'Sports Shoes', url: '/collections/men-sports-shoes' },
              { label: 'Men Apparel', url: '/collections/men-apparel' }
            ]
          },
          {
            columnTitle: 'By Price',
            links: [
              { label: 'Under Tk 1,000', url: '/collections/men?priceRange=under-1000' },
              { label: 'Tk 1,001 - 1,500', url: '/collections/men?priceRange=1001-1500' },
              { label: 'Tk 1,501 - 2,000', url: '/collections/men?priceRange=1501-2000' },
              { label: 'Tk 2,001 - 3,000', url: '/collections/men?priceRange=2001-3000' },
              { label: 'Above Tk 3,000', url: '/collections/men?priceRange=3001-4000' }
            ]
          },
          {
            columnTitle: 'By Size',
            links: [
              { label: 'Size 6', url: '/collections/men?size=6' },
              { label: 'Size 7', url: '/collections/men?size=7' },
              { label: 'Size 8', url: '/collections/men?size=8' },
              { label: 'Size 9', url: '/collections/men?size=9' },
              { label: 'Size 10', url: '/collections/men?size=10' },
              { label: 'Size 11', url: '/collections/men?size=11' }
            ]
          }
        ]
      },
      {
        title: 'WOMEN',
        slug: 'women',
        link: '/collections/women',
        isMega: true,
        displayOrder: 5,
        isActive: true,
        columns: [
          {
            columnTitle: 'All Shoes',
            links: [
              { label: 'Ladies Sandals', url: '/collections/women-sandals' },
              { label: 'Ladies Heels', url: '/collections/women-heels' },
              { label: 'Sports Shoes', url: '/collections/women-sports-shoes' },
              { label: 'Closed Shoes & Flats', url: '/collections/women-closed-shoes' },
              { label: 'Women Apparel', url: '/collections/women-apparel' }
            ]
          },
          {
            columnTitle: 'By Size',
            links: [
              { label: 'Size 3', url: '/collections/women?size=3' },
              { label: 'Size 4', url: '/collections/women?size=4' },
              { label: 'Size 5', url: '/collections/women?size=5' },
              { label: 'Size 6', url: '/collections/women?size=6' },
              { label: 'Size 7', url: '/collections/women?size=7' }
            ]
          }
        ]
      },
      {
        title: 'CHILDREN',
        slug: 'children',
        link: '/collections/children',
        isMega: true,
        displayOrder: 6,
        isActive: true,
        columns: [
          {
            columnTitle: 'Boys Footwear',
            links: [
              { label: 'Boys Sandals', url: '/collections/boys-sandals' },
              { label: 'Boys Sports Shoes', url: '/collections/boys-sports' },
              { label: 'Boys Casuals', url: '/collections/boys-casuals' }
            ]
          },
          {
            columnTitle: 'Girls Footwear',
            links: [
              { label: 'Girls Sandals', url: '/collections/girls-sandals' },
              { label: 'Girls Sports Shoes', url: '/collections/girls-sports' },
              { label: 'Girls Casuals', url: '/collections/girls-casuals' }
            ]
          }
        ]
      },
      {
        title: 'ACCESSORIES',
        slug: 'accessories',
        link: '/collections/accessories',
        isMega: true,
        displayOrder: 7,
        isActive: true,
        columns: [
          {
            columnTitle: 'Leather Goods',
            links: [
              { label: 'Executive Bags & Backpacks', url: '/collections/accessories-backpacks' },
              { label: 'Ladies Handbags', url: '/collections/accessories-handbags' },
              { label: 'Genuine Leather Belts', url: '/collections/accessories-belts' },
              { label: 'Bi-Fold Wallets', url: '/collections/accessories-wallets' },
              { label: 'Shoe Care & Polish Kits', url: '/collections/accessories-shoe-care' }
            ]
          }
        ]
      },
      {
        title: 'Digital Vouchers',
        slug: 'vouchers',
        link: '/collections/accessories',
        isMega: false,
        displayOrder: 8,
        isActive: true
      },
      {
        title: 'Loyalty Club',
        slug: 'loyalty',
        link: '/account',
        badge: 'EARN',
        badgeColor: '#28a745',
        isMega: false,
        displayOrder: 9,
        isActive: true
      }
    ]);

    // 12. Create Default Store Settings
    await Setting.create({
      storeName: 'Comfort Leather',
      storeTagline: 'Handcrafted Comfort Footwear Bangladesh',
      logoUrl: '/img/logo.svg',
      faviconUrl: '/img/favicon.svg',
      contactPhone: '09666200300',
      whatsappNumber: '8801700000000',
      contactEmail: 'support@stepupshoes.com',
      address: 'House 42, Road 11, Gulshan-1, Dhaka-1212, Bangladesh',
      shippingInsideDhaka: 60,
      shippingOutsideDhaka: 120,
      freeShippingThreshold: 2500,
      bkashEnabled: true,
      bkashNumber: '01712345678 (Merchant)',
      nagadEnabled: true,
      nagadNumber: '01812345678 (Merchant)',
      sslcommerzEnabled: false,
      loyaltyPointsPer100Tk: 1,
      loyaltyRedeemRate: 1,
      announcementBarText: 'Free delivery across Bangladesh on orders over Tk 2,500! Use code WELCOME10 for 10% off.',
      announcementBarActive: true,
      trendingSearchTerms: ['Power', 'North Star', 'Loafer', 'Sandal', 'Heel', 'Casual Shoe', 'Oxford', 'Wallet']
    });

    console.log('[Seed] Database seed completed successfully!');
    if (shouldDisconnect) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed Error]:', err);
    if (shouldDisconnect) process.exit(1);
    throw err;
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = { seedData };
