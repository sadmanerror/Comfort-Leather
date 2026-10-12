const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Comfort Leather' },
  storeTagline: { type: String, default: 'Handcrafted Comfort Footwear' },
  logoUrl: { type: String, default: '/img/logo.svg' },
  faviconUrl: { type: String, default: '/img/favicon.svg' },
  contactPhone: { type: String, default: '09666200300' },
  whatsappNumber: { type: String, default: '8801700000000' },
  contactEmail: { type: String, default: 'support@stepupshoes.com' },
  address: { type: String, default: 'Gulshan-1, Dhaka-1212, Bangladesh' },
  storeLocatorLink: { type: String, default: '/stores' },
  announcementBarText: { type: String, default: 'Free delivery on orders over Tk 2,500 across Bangladesh!' },
  announcementBarActive: { type: Boolean, default: true },
  
  // Shipping rates in BDT
  shippingInsideDhaka: { type: Number, default: 60 },
  shippingOutsideDhaka: { type: Number, default: 120 },
  freeShippingThreshold: { type: Number, default: 2500 },
  
  // Payment methods
  codEnabled: { type: Boolean, default: true },
  bkashEnabled: { type: Boolean, default: true },
  bkashNumber: { type: String, default: '01712345678 (Merchant)' },
  nagadEnabled: { type: Boolean, default: true },
  nagadNumber: { type: String, default: '01812345678 (Merchant)' },
  sslcommerzEnabled: { type: Boolean, default: false },

  // Loyalty Program
  loyaltyPointsPer100Tk: { type: Number, default: 1 },
  loyaltyRedeemRate: { type: Number, default: 1 }, // 1 point = Tk 1

  // Search & Social
  trendingSearchTerms: {
    type: [String],
    default: ['Power', 'North Star', 'Loafer', 'Sandal', 'Heel', 'Casual Shoe']
  },
  instagramStrip: [{
    imageUrl: { type: String },
    postUrl: { type: String }
  }],
  socialLinks: {
    facebook: { type: String, default: 'https://facebook.com' },
    instagram: { type: String, default: 'https://instagram.com' },
    youtube: { type: String, default: 'https://youtube.com' },
    twitter: { type: String, default: 'https://twitter.com' }
  },

  defaultSizeChartUrl: { type: String, default: '/img/size-chart.svg' },
  maintenanceMode: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Helper to get singleton setting
settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Setting', settingSchema);
