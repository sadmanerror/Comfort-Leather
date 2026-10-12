const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String },
  color: { type: String, required: true },
  size: { type: String, required: true },
  sku: { type: String },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }
}, { _id: true });

const orderStatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String, default: 'System' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestInfo: {
    fullName: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
  coupon: {
    code: { type: String },
    discountAmount: { type: Number, default: 0 }
  },
  pointsUsed: { type: Number, default: 0 },
  pointsDiscount: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  payment: {
    method: {
      type: String,
      enum: ['cod', 'bkash_nagad', 'sslcommerz'],
      default: 'cod'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    trxId: { type: String },
    paidAt: { type: Date }
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  statusHistory: [orderStatusHistorySchema],
  address: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    division: { type: String, required: true },
    district: { type: String, required: true },
    area: { type: String, required: true },
    addressDetails: { type: String, required: true }
  },
  note: { type: String },
  cancelReason: { type: String }
}, {
  timestamps: true
});

orderSchema.index({ 'address.phone': 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
