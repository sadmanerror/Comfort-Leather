const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true },
  comment: { type: String, required: true, trim: true },
  isVerifiedBuyer: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // default approved or pending based on admin settings
  }
}, {
  timestamps: true
});

reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
