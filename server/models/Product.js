const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  alt: { type: String },
  isPrimary: { type: Boolean, default: false },
  isHover: { type: Boolean, default: false }
}, { _id: true });

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String }
}, { _id: true });

const colorVariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hex: { type: String, default: '#000000' },
  images: [imageSchema],
  sizes: [sizeSchema]
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Boys', 'Girls', 'Unisex'],
    required: true
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  shortDesc: { type: String, trim: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, default: null, min: 0 },
  saleStart: { type: Date, default: null },
  saleEnd: { type: Date, default: null },
  colors: [colorVariantSchema],
  video: {
    url: { type: String },
    publicId: { type: String }
  },
  tags: [{ type: String, trim: true }],
  flags: {
    bestSeller: { type: Boolean, default: false },
    justLanded: { type: Boolean, default: false },
    justLandedExpires: { type: Date },
    featured: { type: Boolean, default: false },
    discounted: { type: Boolean, default: false }
  },
  specs: {
    material: { type: String },
    sole: { type: String },
    closure: { type: String },
    occasion: { type: String },
    careInstructions: { type: String },
    sizeChartUrl: { type: String }
  },
  seo: {
    title: { type: String },
    description: { type: String }
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Published'
  },
  ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },
  soldCount: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate total stock across all colors and sizes
productSchema.virtual('totalStock').get(function() {
  if (!this.colors || !this.colors.length) return 0;
  return this.colors.reduce((sum, color) => {
    if (!color.sizes) return sum;
    return sum + color.sizes.reduce((sSum, sz) => sSum + (sz.stock || 0), 0);
  }, 0);
});

// Primary image virtual
productSchema.virtual('primaryImage').get(function() {
  if (!this.colors || !this.colors.length) return '/img/placeholder-shoe.svg';
  for (const c of this.colors) {
    if (c.images && c.images.length) {
      const primary = c.images.find(img => img.isPrimary);
      if (primary) return primary.url;
      return c.images[0].url;
    }
  }
  return '/img/placeholder-shoe.svg';
});

// Hover image virtual
productSchema.virtual('hoverImage').get(function() {
  if (!this.colors || !this.colors.length) return this.primaryImage;
  for (const c of this.colors) {
    if (c.images && c.images.length > 1) {
      const hover = c.images.find(img => img.isHover);
      if (hover) return hover.url;
      return c.images[1].url;
    }
  }
  return this.primaryImage;
});

// Effective on-sale check
productSchema.virtual('isOnSale').get(function() {
  if (!this.salePrice || this.salePrice >= this.price) return false;
  const now = new Date();
  if (this.saleStart && now < this.saleStart) return false;
  if (this.saleEnd && now > this.saleEnd) return false;
  return true;
});

// Discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (!this.isOnSale) return 0;
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

// Text index for search
productSchema.index({ name: 'text', shortDesc: 'text', tags: 'text' });
productSchema.index({ category: 1, brand: 1, gender: 1, price: 1 });
productSchema.index({ 'flags.bestSeller': 1, 'flags.justLanded': 1, 'flags.featured': 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);
