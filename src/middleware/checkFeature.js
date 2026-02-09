const checkFeature = (featureName) => (req, res, next) => {
  if (!req.features || !req.features[featureName]) {
    return res.status(403).json({
      success: false,
      message: `Feature '${featureName}' is disabled for this school`,
    });
  }
  next();
};

module.exports = checkFeature;
