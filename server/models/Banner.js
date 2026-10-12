const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  subtitle: { type: String, trim: true },
  buttonText: { type: String, default: 'Shop Now' },
  link: { type: String, default: '/collections/all' },
  desktopImage: { type: String, required: true },
  mobileImage: { type: String },
  videoUrl: { type: String },
  altText: { type: String },
  position: {
    type: String,
    enum: ['hero', 'promo', 'voucher', 'accessories'],
    default: 'hero'
  },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null }
}, {
  timestamps: true
});

bannerSchema.index({ position: 1, displayOrder: 1, isActive: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
