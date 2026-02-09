const Event = require('../models/Event');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

/**
 * @desc    Get all events for the school
 * @route   GET /api/events
 * @access  Private
 */
exports.getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const events = await Event.find({ schoolCode: req.schoolCode })
      .sort({ fromDate: 1 }) // Show upcoming events first
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments({ schoolCode: req.schoolCode });

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`Get Events Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

/**
 * @desc    Create new event
 * @route   POST /api/events
 * @access  Private
 */
exports.createEvent = async (req, res) => {
  try {
    const { title, description, fromDate, toDate } = req.body;
    let imageUrls = [];
    let attachmentUrl = null;

    // 1. Handle Images
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.path, 'events/images');
        imageUrls.push(result);
      }
    }

    // 2. Handle PDF Attachment
    if (req.files && req.files.attachment) {
      const result = await uploadToCloudinary(req.files.attachment[0].path, 'events/docs');
      attachmentUrl = result;
    }

    // 3. Save to MongoDB
    const event = await Event.create({
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
      data: event,
    });
  } catch (error) {
    console.error(`Create Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

/**
 * @desc    Update event
 * @route   PATCH /api/events/:id
 * @access  Private
 */
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, fromDate, toDate, location, existingImages } = req.body;

    const event = await Event.findOne({ _id: req.params.id, schoolCode: req.schoolCode });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let imageUrls = [];
    let attachmentUrl = event.attachment;

    // 1. Keep existing images if provided
    if (existingImages && Array.isArray(existingImages)) {
      imageUrls = existingImages;
    }

    // 2. Add new images if uploaded
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.path, 'events/images');
        imageUrls.push(result);
      }
    }

    // 3. Handle attachment update
    if (req.files && req.files.attachment) {
      const result = await uploadToCloudinary(req.files.attachment[0].path, 'events/docs');
      attachmentUrl = result;
    }

    // 4. Update the event
    event.title = title;
    event.description = description;
    event.fromDate = fromDate;
    event.toDate = toDate;
    event.location = location || event.location;
    event.images = imageUrls;
    event.attachment = attachmentUrl;

    await event.save();

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error(`Update Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, schoolCode: req.schoolCode });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error(`Delete Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};
