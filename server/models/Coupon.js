const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'percentage'
  },
  value: { type: Number, required: true, min: 0 },
  minOrder: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: null },
  maxUses: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableBrands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }]
}, {
  timestamps: true
});

couponSchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
