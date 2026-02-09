const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `dashboard/${folder}`,
    });

    // Delete local temp file after upload
    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error) {
    // Clean up local file even on failure
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

module.exports = { uploadToCloudinary };
