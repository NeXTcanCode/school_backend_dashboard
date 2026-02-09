const express = require('express');
const { getStats, getSchoolProfile, updateFeatures } = require('../controllers/schoolController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();

router.use(auth);
router.use(tenant);

router.get('/stats', getStats);
router.get('/me', getSchoolProfile);
router.put('/features', updateFeatures);

module.exports = router;
