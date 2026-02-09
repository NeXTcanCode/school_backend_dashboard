const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  schoolCode: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  images: {
    type: [String],
    required: true,
    validate: [v => v.length > 0, 'At least one image is required'],
  },
  attachment: {
    type: String,
  }
}, {
  timestamps: true
});

gallerySchema.index({ schoolCode: 1, date: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);
