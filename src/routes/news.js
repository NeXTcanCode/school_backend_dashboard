const express = require('express');
const { getNews, createNews, updateNews, deleteNews } = require('../controllers/newsController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const checkFeature = require('../middleware/checkFeature');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { newsSchema } = require('../../shared/schemas/newsSchema');

const router = express.Router();

// Apply common middleware
router.use(auth);
router.use(tenant);
router.use(checkFeature('news'));

// Define routes
router.get('/', getNews);

router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'attachment', maxCount: 1 }
  ]),
  validate(newsSchema),
  createNews
);

router.patch(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'attachment', maxCount: 1 }
  ]),
  validate(newsSchema),
  updateNews
);

router.delete('/:id', deleteNews);

module.exports = router;
