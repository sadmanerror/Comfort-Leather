const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Children', 'Accessories', 'Unisex', 'All'],
    default: 'All'
  },
  description: { type: String },
  image: { type: String },
  bannerImage: { type: String },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  seo: {
    title: { type: String },
    description: { type: String }
  }
}, {
  timestamps: true
});

categorySchema.index({ parent: 1, displayOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
