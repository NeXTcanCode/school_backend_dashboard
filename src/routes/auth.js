const express = require('express');
const { signup, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../../shared/schemas/authSchema');

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);

module.exports = router;
