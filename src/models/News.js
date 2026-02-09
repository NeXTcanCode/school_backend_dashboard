const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  schoolCode: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
  },
  images: [{
    type: String, // Cloudinary URLs
  }],
  attachment: {
    type: String, // Cloudinary PDF URL
  }
}, {
  timestamps: true
});

// Compound index for fast retrieval by school and date
newsSchema.index({ schoolCode: 1, createdAt: -1 });

module.exports = mongoose.model('News', newsSchema);
