const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  isDefault: { type: Boolean, default: false },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  division: { type: String, required: true },
  district: { type: String, required: true },
  area: { type: String, required: true },
  addressDetails: { type: String, required: true }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'customer'
  },
  addresses: [addressSchema],
  points: { type: Number, default: 0 },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, {
  timestamps: true
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', userSchema);
