const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true }, // e.g. Dhaka, Chittagong, Sylhet
  address: { type: String, required: true },
  phone: { type: String },
  hours: { type: String, default: '10:00 AM - 9:00 PM' },
  mapUrl: { type: String },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

storeSchema.index({ city: 1, isActive: 1 });

module.exports = mongoose.model('Store', storeSchema);
