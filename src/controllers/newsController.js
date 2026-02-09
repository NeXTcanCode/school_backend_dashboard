const News = require('../models/News');
const { uploadToCloudinary, removeFromCloudinary } = require('../utils/cloudinaryUpload');

/**
 * @desc    Get all news for the school
 * @route   GET /api/news
 * @access  Private
 */
exports.getNews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const news = await News.find({ schoolCode: req.schoolCode })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await News.countDocuments({ schoolCode: req.schoolCode });

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`Get News Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
};

/**
 * @desc    Create new news
 * @route   POST /api/news
 * @access  Private
 */
exports.createNews = async (req, res) => {
  try {
    const { title, description, fromDate, toDate } = req.body;
    let imageUrls = [];
    let attachmentUrl = null;

    // 1. Handle Multiple Images
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.path, 'news/images');
        imageUrls.push(result);
      }
    }

    // 2. Handle Single PDF Attachment
    if (req.files && req.files.attachment) {
      const result = await uploadToCloudinary(req.files.attachment[0].path, 'news/docs');
      attachmentUrl = result;
    }

    // 3. Save to MongoDB
    const news = await News.create({
      schoolCode: req.schoolCode,
      title,
      description,
      fromDate,
      toDate: toDate || null,
      images: imageUrls,
      attachment: attachmentUrl,
    });

    res.status(201).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error(`Create News Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to create news' });
  }
};

/**
 * @desc    Update news
 * @route   PATCH /api/news/:id
 * @access  Private
 */
exports.updateNews = async (req, res) => {
  try {
    const { title, description, fromDate, toDate, existingImages } = req.body;

    const news = await News.findOne({ _id: req.params.id, schoolCode: req.schoolCode });

    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }

    let imageUrls = [];
    let attachmentUrl = news.attachment;

    // 1. Keep existing images if provided
    if (existingImages && Array.isArray(existingImages)) {
      imageUrls = existingImages;
    }

    // 2. Add new images if uploaded
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.path, 'news/images');
        imageUrls.push(result);
      }
    }

    // 3. Handle attachment update
    if (req.files && req.files.attachment) {
      const result = await uploadToCloudinary(req.files.attachment[0].path, 'news/docs');
      attachmentUrl = result;
    }

    // 4. Update the news item
    news.title = title;
    news.description = description;
    news.fromDate = fromDate;
    news.toDate = toDate;
    news.images = imageUrls;
    news.attachment = attachmentUrl;

    await news.save();

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error(`Update News Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to update news' });
  }
};

/**
 * @desc    Delete news
 * @route   DELETE /api/news/:id
 * @access  Private
 */
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findOne({ _id: req.params.id, schoolCode: req.schoolCode });

    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }

    // Optional: Delete from Cloudinary if we have public_ids stored.
    // For now, we delete from DB as per MVP focus, but UI confirms clean-up is better.
    // Since we don't store public_ids in schema yet (MVP choice), we skip cloud delete for now or derive from URL.

    await news.deleteOne();

    res.status(200).json({
      success: true,
      message: 'News deleted successfully',
    });
  } catch (error) {
    console.error(`Delete News Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to delete news' });
  }
};
