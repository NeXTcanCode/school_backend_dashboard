const News = require('../models/News');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');
const School = require('../models/School');

// Helper to check if a feature is enabled for a school
const isFeatureEnabled = async (schoolCode, feature) => {
  const school = await School.findOne({ schoolCode });
  return school && school.features[feature];
};

exports.getPublicNews = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    if (!(await isFeatureEnabled(schoolCode, 'news'))) {
      return res.status(403).json({ success: false, message: 'News feature is disabled' });
    }
    const news = await News.find({ schoolCode }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getPublicEvents = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    if (!(await isFeatureEnabled(schoolCode, 'events'))) {
      return res.status(403).json({ success: false, message: 'Events feature is disabled' });
    }
    const events = await Event.find({ schoolCode }).sort({ fromDate: 1 });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getPublicGallery = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    if (!(await isFeatureEnabled(schoolCode, 'gallery'))) {
      return res.status(403).json({ success: false, message: 'Gallery feature is disabled' });
    }
    const galleries = await Gallery.find({ schoolCode }).sort({ date: -1 });
    res.status(200).json({ success: true, data: galleries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
