const mongoose = require('mongoose');

const pointsLedgerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'adjust'],
    required: true
  },
  orderNo: { type: String },
  description: { type: String, required: true }
}, {
  timestamps: true
});

pointsLedgerSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PointsLedger', pointsLedgerSchema);
