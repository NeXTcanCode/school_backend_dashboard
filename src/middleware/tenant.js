const School = require('../models/School');

const tenant = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      console.warn('Tenant Middleware: No user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user information found'
      });
    }

    const school = await School.findById(req.user.id);

    if (!school) {
      console.warn(`Tenant Middleware: School not found for ID: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Attach school info to request for downstream use
    req.schoolCode = school.schoolCode;
    req.features = school.features;

    next();
  } catch (error) {
    console.error('Tenant Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error in tenant middleware'
    });
  }
};

module.exports = tenant;
