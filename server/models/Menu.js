const mongoose = require('mongoose');

const menuLinkSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  isHighlighted: { type: Boolean, default: false }
}, { _id: false });

const menuColumnSchema = new mongoose.Schema({
  columnTitle: { type: String, required: true },
  links: [menuLinkSchema]
}, { _id: false });

const menuSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, lowercase: true, trim: true },
  link: { type: String, default: '#' },
  badge: { type: String },
  badgeColor: { type: String, default: '#D6001C' },
  isMega: { type: Boolean, default: true },
  columns: [menuColumnSchema],
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

menuSchema.index({ displayOrder: 1, isActive: 1 });

module.exports = mongoose.model('Menu', menuSchema);
