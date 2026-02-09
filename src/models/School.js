const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schoolSchema = new mongoose.Schema({
  schoolCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  schoolName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  features: {
    news: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    gallery: { type: Boolean, default: true },
  }
}, {
  timestamps: true
});

// Hash password before saving
schoolSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
schoolSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('School', schoolSchema);
