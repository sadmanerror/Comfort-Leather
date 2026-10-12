const Product = require('../models/Product');
const User = require('../models/User');
const PointsLedger = require('../models/PointsLedger');
const Setting = require('../models/Setting');

/**
 * Generates unique order number in format: ORD-YYYYMMDD-XXXX
 */
const generateOrderNo = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${yyyy}${mm}${dd}-${randomSuffix}`;
};

/**
 * Decrement stock for purchased items
 */
const decrementStock = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    // Find the specific color and size
    let updated = false;
    for (const color of product.colors) {
      if (color.name.toLowerCase() === item.color.toLowerCase()) {
        const sizeVariant = color.sizes.find(s => s.size === item.size);
        if (sizeVariant) {
          sizeVariant.stock = Math.max(0, sizeVariant.stock - item.qty);
          updated = true;
          break;
        }
      }
    }

    if (updated) {
      product.soldCount = (product.soldCount || 0) + item.qty;
      await product.save();
    }
  }
};

/**
 * Restore stock when order is cancelled or returned
 */
const restoreStock = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    for (const color of product.colors) {
      if (color.name.toLowerCase() === item.color.toLowerCase()) {
        const sizeVariant = color.sizes.find(s => s.size === item.size);
        if (sizeVariant) {
          sizeVariant.stock += item.qty;
          break;
        }
      }
    }

    product.soldCount = Math.max(0, (product.soldCount || 0) - item.qty);
    await product.save();
  }
};

/**
 * Awards loyalty club points based on paid/delivered order
 */
const awardLoyaltyPoints = async (order) => {
  if (!order.user) return 0;

  const settings = await Setting.getSettings();
  const rate = settings.loyaltyPointsPer100Tk || 1;
  const pointsToAward = Math.floor((order.subtotal / 100) * rate);

  if (pointsToAward > 0) {
    await PointsLedger.create({
      user: order.user,
      points: pointsToAward,
      type: 'earn',
      orderNo: order.orderNo,
      description: `Earned from Order #${order.orderNo}`
    });

    await User.findByIdAndUpdate(order.user, {
      $inc: { points: pointsToAward }
    });

    order.pointsEarned = pointsToAward;
    await order.save();
  }

  return pointsToAward;
};

module.exports = {
  generateOrderNo,
  decrementStock,
  restoreStock,
  awardLoyaltyPoints
};
