const Order = require('../models/Order');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const User = require('../models/User');
const { generateOrderNo, decrementStock } = require('../services/orderService');
const { formatBDT, validateCoupon } = require('../services/pricingService');
const mailService = require('../services/mailService');

// Bangladesh Geographic Divisions and Districts for checkout dropdowns
const BD_GEOGRAPHY = {
  'Dhaka': ['Dhaka City', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Rajbari', 'Shariatpur'],
  'Chittagong': ['Chittagong City', "Cox's Bazar", 'Comilla', 'Feni', 'Brahmanbaria', 'Noakhali', 'Chandpur', 'Lakshmipur', 'Khagrachhari', 'Rangamati', 'Bandarban'],
  'Rajshahi': ['Rajshahi City', 'Bogra', 'Pabna', 'Sirajganj', 'Naogaon', 'Natore', 'Chapai Nawabganj', 'Joypurhat'],
  'Khulna': ['Khulna City', 'Jessore', 'Kushtia', 'Satkhira', 'Bagerhat', 'Jhenaidah', 'Chuadanga', 'Magura', 'Meherpur', 'Narail'],
  'Sylhet': ['Sylhet City', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  'Barisal': ['Barisal City', 'Patuakhali', 'Bhola', 'Pirojpur', 'Barguna', 'Jhalokati'],
  'Rangpur': ['Rangpur City', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari', 'Thakurgaon', 'Lalmonirhat', 'Panchagarh'],
  'Mymensingh': ['Mymensingh City', 'Jamalpur', 'Netrokona', 'Sherpur']
};

// 1. Cart Page
const getCart = async (req, res, next) => {
  try {
    const settings = await Setting.getSettings();
    res.render('pages/cart', {
      title: 'Shopping Cart | StepUp Shoes',
      settings,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

// 2. Checkout Page
const getCheckout = async (req, res, next) => {
  try {
    const settings = await Setting.getSettings();
    res.render('pages/checkout', {
      title: 'Secure Checkout | StepUp Shoes',
      settings,
      divisions: Object.keys(BD_GEOGRAPHY),
      bdGeographyJson: JSON.stringify(BD_GEOGRAPHY),
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

// 3. Coupon Validation API
const checkCouponApi = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const sub = parseFloat(subtotal || 0);
    const userId = req.user ? req.user._id : null;

    const result = await validateCoupon(code, sub, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// 4. Create Order / Submit Checkout
const processCheckout = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      email,
      division,
      district,
      area,
      addressDetails,
      note,
      paymentMethod,
      trxId,
      couponCode,
      pointsToRedeem,
      itemsJson
    } = req.body;

    // Validate customer info
    if (!fullName || !phone || !division || !district || !area || !addressDetails) {
      return res.status(400).json({ success: false, message: 'Please fill in all required shipping address fields.' });
    }

    // Phone validation (Bangladesh format: 01XXXXXXXXX)
    const phoneClean = phone.replace(/[\s-]/g, '');
    const phoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX).' });
    }

    // Parse items
    let cartItems = [];
    try {
      cartItems = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid cart contents.' });
    }

    if (!cartItems || !cartItems.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    // Server-side inventory verification and price calculation
    let calculatedSubtotal = 0;
    const verifiedOrderItems = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'Published') {
        return res.status(400).json({ success: false, message: `Product "${item.name}" is no longer available.` });
      }

      // Check specific variant stock
      const colorVariant = product.colors.find(c => c.name.toLowerCase() === item.color.toLowerCase());
      if (!colorVariant) {
        return res.status(400).json({ success: false, message: `Color ${item.color} is not available for ${product.name}.` });
      }

      const sizeVariant = colorVariant.sizes.find(s => s.size === item.size);
      if (!sizeVariant || sizeVariant.stock < item.qty) {
        const availableStock = sizeVariant ? sizeVariant.stock : 0;
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (Size: ${item.size}). Only ${availableStock} in stock.`
        });
      }

      const unitPrice = product.isOnSale ? product.salePrice : product.price;
      calculatedSubtotal += unitPrice * item.qty;

      verifiedOrderItems.push({
        product: product._id,
        name: product.name,
        image: item.image || product.primaryImage,
        color: item.color,
        size: item.size,
        sku: sizeVariant.sku || `${product.slug}-${item.size}`,
        qty: item.qty,
        price: unitPrice
      });
    }

    // Shipping calculation
    const settings = await Setting.getSettings();
    let shipping = division.toLowerCase() === 'dhaka' && district.toLowerCase().includes('dhaka')
      ? settings.shippingInsideDhaka
      : settings.shippingOutsideDhaka;

    if (settings.freeShippingThreshold && calculatedSubtotal >= settings.freeShippingThreshold) {
      shipping = 0;
    }

    // Coupon discount
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const couponCheck = await validateCoupon(couponCode, calculatedSubtotal, req.user ? req.user._id : null);
      if (couponCheck.valid) {
        couponDiscount = couponCheck.discountAmount;
        appliedCoupon = { code: couponCheck.coupon.code, discountAmount: couponDiscount };
        // Increment coupon use count
        couponCheck.coupon.usedCount += 1;
        await couponCheck.coupon.save();
      }
    }

    // Loyalty points redemption
    let pointsDiscount = 0;
    let usedPoints = 0;
    if (req.user && pointsToRedeem) {
      const redeemCount = parseInt(pointsToRedeem, 10);
      if (redeemCount > 0 && req.user.points >= redeemCount) {
        pointsDiscount = redeemCount * (settings.loyaltyRedeemRate || 1);
        usedPoints = redeemCount;
        // Decrement user points
        await User.findByIdAndUpdate(req.user._id, { $inc: { points: -usedPoints } });
      }
    }

    const totalDiscount = couponDiscount + pointsDiscount;
    const finalTotal = Math.max(0, calculatedSubtotal - totalDiscount + shipping);

    const orderNo = generateOrderNo();

    // Create Order
    const order = await Order.create({
      orderNo,
      user: req.user ? req.user._id : null,
      guestInfo: {
        fullName,
        phone: phoneClean,
        email: email || ''
      },
      items: verifiedOrderItems,
      subtotal: calculatedSubtotal,
      discount: totalDiscount,
      shipping,
      total: finalTotal,
      coupon: appliedCoupon,
      pointsUsed: usedPoints,
      pointsDiscount,
      payment: {
        method: paymentMethod || 'cod',
        status: (paymentMethod === 'bkash_nagad' && trxId) ? 'pending' : 'pending',
        trxId: trxId || ''
      },
      status: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          note: 'Order placed by customer',
          changedAt: new Date(),
          changedBy: fullName
        }
      ],
      address: {
        fullName,
        phone: phoneClean,
        division,
        district,
        area,
        addressDetails
      },
      note: note || ''
    });

    // Decrement inventory stock
    await decrementStock(verifiedOrderItems);

    // Send confirmation email asynchronously
    mailService.sendOrderConfirmation(order).catch(err => {
      console.error('[Order Email Error]', err.message);
    });

    res.json({
      success: true,
      orderNo: order.orderNo,
      redirectUrl: `/orders/confirmed/${order.orderNo}`
    });
  } catch (err) {
    next(err);
  }
};

// 5. Order Confirmation Page
const getOrderConfirmation = async (req, res, next) => {
  try {
    const orderNo = req.params.orderNo;
    const order = await Order.findOne({ orderNo }).populate('items.product', 'slug');

    if (!order) {
      return res.status(404).render('pages/error', {
        title: 'Order Not Found',
        message: 'Could not find the specified order.'
      });
    }

    const settings = await Setting.getSettings();

    res.render('pages/order-confirmation', {
      title: `Order Confirmed: #${order.orderNo} | StepUp Shoes`,
      order,
      settings,
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

// 6. Track Order Page
const trackOrder = async (req, res, next) => {
  try {
    const { orderNo, phone } = req.query;
    let order = null;
    let searched = false;

    if (orderNo && phone) {
      searched = true;
      const phoneClean = phone.trim().replace(/[\s-]/g, '');
      order = await Order.findOne({
        orderNo: orderNo.trim().toUpperCase(),
        'address.phone': { $regex: phoneClean.slice(-10) }
      });
    }

    res.render('pages/track-order', {
      title: 'Track Your Order | StepUp Shoes',
      order,
      searched,
      orderNo: orderNo || '',
      phone: phone || '',
      formatBDT
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  getCheckout,
  checkCouponApi,
  processCheckout,
  getOrderConfirmation,
  trackOrder
};
