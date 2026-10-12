const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: { type: String, trim: true },
  description: { type: String },
  bannerImage: { type: String },
  isRuleBased: { type: Boolean, default: false },
  rules: {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    gender: { type: String, default: null },
    minPrice: { type: Number, default: null },
    maxPrice: { type: Number, default: null },
    tag: { type: String, default: null }
  },
  manualProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});


module.exports = mongoose.model('Collection', collectionSchema);
