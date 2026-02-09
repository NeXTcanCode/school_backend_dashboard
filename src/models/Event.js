const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
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
    type: String,
  }],
  attachment: {
    type: String,
  }
}, {
  timestamps: true
});

eventSchema.index({ schoolCode: 1, fromDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
