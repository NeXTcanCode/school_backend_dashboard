const Gallery = require('../models/Gallery');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

/**
 * @desc    Get all gallery entries for the school
 * @route   GET /api/gallery
 * @access  Private
 */
exports.getGallery = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const gallery = await Gallery.find({ schoolCode: req.schoolCode })
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Gallery.countDocuments({ schoolCode: req.schoolCode });

    res.status(200).json({
      success: true,
      data: gallery,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`Get Gallery Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
  }
};

/**
 * @desc    Create new gallery entry
 * @route   POST /api/gallery
 * @access  Private
 */
exports.createGallery = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    let imageUrls = [];
    let attachmentUrl = null;

    // 1. Handle Images (Required: 1-5)
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.path, 'gallery/images');
        imageUrls.push(result);
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required for gallery',
      });
    }

    // 2. Handle PDF Attachment (Optional)
    if (req.files && req.files.attachment) {
      const result = await uploadToCloudinary(req.files.attachment[0].path, 'gallery/docs');
      attachmentUrl = result;
    }

    // 3. Save to MongoDB
    const gallery = await Gallery.create({
      schoolCode: req.schoolCode,
      title: title || '',
      description: description || '',
      date: date || Date.now(),
      images: imageUrls,
      attachment: attachmentUrl,
    });

    res.status(201).json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    console.error(`Create Gallery Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to create gallery' });
  }
};

/**
 * @desc    Delete gallery entry
 * @route   DELETE /api/gallery/:id
 * @access  Private
 */
exports.deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ _id: req.params.id, schoolCode: req.schoolCode });

    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery entry not found' });
    }

    await gallery.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Gallery entry deleted successfully',
    });
  } catch (error) {
    console.error(`Delete Gallery Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to delete gallery' });
  }
};
