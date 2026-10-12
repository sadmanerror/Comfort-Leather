const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  excerpt: { type: String, trim: true },
  content: { type: String, required: true },
  coverImage: { type: String },
  author: { type: String, default: 'StepUp Editorial' },
  tags: [{ type: String, trim: true }],
  isPublished: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

blogPostSchema.index({ slug: 1, isPublished: 1 });
blogPostSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
