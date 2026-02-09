const jwt = require('jsonwebtoken');
const School = require('../models/School');

const generateToken = (id, schoolCode) => {
  return jwt.sign({ id, schoolCode }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.signup = async (req, res) => {
  try {
    const { schoolCode, schoolName, password } = req.body;

    const schoolExists = await School.findOne({ schoolCode });
    if (schoolExists) {
      return res.status(400).json({
        success: false,
        message: 'School code already exists',
      });
    }

    const school = await School.create({
      schoolCode,
      schoolName,
      password,
    });

    const token = generateToken(school._id, school.schoolCode);

    res.status(201).json({
      success: true,
      data: {
        id: school._id,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error during signup',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { schoolCode, password } = req.body;

    const school = await School.findOne({ schoolCode });
    if (!school) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await school.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(school._id, school.schoolCode);

    res.status(200).json({
      success: true,
      data: {
        id: school._id,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error during login',
    });
  }
};
