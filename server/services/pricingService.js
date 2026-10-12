const Coupon = require('../models/Coupon');

/**
 * Formats a numeric amount into Bangladeshi Taka string format: Tk 1,299.00
 */
const formatBDT = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Tk 0.00';
  }
  const num = Number(amount);
  return 'Tk ' + num.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Calculates discount percent
 */
const calculateDiscountPercent = (price, salePrice) => {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
};

/**
 * Validates a coupon code against subtotal, items, and current date
 */
const validateCoupon = async (code, subtotal, userId = null) => {
  if (!code) return { valid: false, message: 'Please provide a coupon code' };

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true
  });

  if (!coupon) {
    return { valid: false, message: 'Invalid or expired coupon code' };
  }

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) {
    return { valid: false, message: 'This coupon is not active yet' };
  }
  if (coupon.endDate && now > coupon.endDate) {
    return { valid: false, message: 'This coupon has expired' };
  }

  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'This coupon has reached its maximum usage limit' };
  }

  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      message: `Minimum order amount for this coupon is ${formatBDT(coupon.minOrder)}`
    };
  }

  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = coupon.value;
  }

  // Ensure discount does not exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    valid: true,
    coupon,
    discountAmount: Math.round(discountAmount),
    message: `Coupon applied! You save ${formatBDT(discountAmount)}`
  };
};

module.exports = {
  formatBDT,
  calculateDiscountPercent,
  validateCoupon
};
