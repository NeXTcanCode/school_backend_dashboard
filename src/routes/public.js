const express = require('express');
const { getPublicNews, getPublicEvents, getPublicGallery } = require('../controllers/publicController');

const router = express.Router();

router.get('/news/:schoolCode', getPublicNews);
router.get('/events/:schoolCode', getPublicEvents);
router.get('/gallery/:schoolCode', getPublicGallery);

module.exports = router;
