const mongoose = require('mongoose');

const staticPageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  content: { type: String, required: true },
  isPublished: { type: Boolean, default: true },
  seo: {
    title: { type: String },
    description: { type: String }
  }
}, {
  timestamps: true
});

staticPageSchema.index({ slug: 1, isPublished: 1 });

module.exports = mongoose.model('StaticPage', staticPageSchema);
