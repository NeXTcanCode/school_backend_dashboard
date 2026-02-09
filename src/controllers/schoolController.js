const School = require('../models/School');
const News = require('../models/News');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');

/**
 * @desc    Get dashboard stats
 * @route   GET /api/school/stats
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    const newsCount = await News.countDocuments({ schoolCode: req.schoolCode });
    const eventsCount = await Event.countDocuments({ schoolCode: req.schoolCode });
    const galleryCount = await Gallery.countDocuments({ schoolCode: req.schoolCode });

    res.status(200).json({
      success: true,
      data: {
        newsCount,
        eventsCount,
        galleryCount,
      }
    });
  } catch (error) {
    console.error(`Get Stats Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

/**
 * @desc    Get school profile
 * @route   GET /api/school/me
 * @access  Private
 */
exports.getSchoolProfile = async (req, res) => {
  try {
    const school = await School.findOne({ schoolCode: req.user.schoolCode }).select('-password');
    res.status(200).json(school);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

/**
 * @desc    Update school features
 * @route   PATCH /api/school/features
 * @access  Private
 */
exports.updateFeatures = async (req, res) => {
  try {
    const { features } = req.body;

    const school = await School.findOneAndUpdate(
      { schoolCode: req.user.schoolCode },
      {
        $set: {
          features: features
        }
      },
      { new: true }
    ).select('-password');

    res.status(200).json({ success: true, data: school });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update features' });
  }
};
