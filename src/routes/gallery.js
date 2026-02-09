const express = require('express');
const { getGallery, createGallery, updateGallery, deleteGallery } = require('../controllers/galleryController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const checkFeature = require('../middleware/checkFeature');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { gallerySchema } = require('../../shared/schemas/gallerySchema');

const router = express.Router();

router.use(auth);
router.use(tenant);
router.use(checkFeature('gallery'));

router.get('/', getGallery);

router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'attachment', maxCount: 1 }
  ]),
  validate(gallerySchema),
  createGallery
);

router.patch(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'attachment', maxCount: 1 }
  ]),
  validate(gallerySchema),
  updateGallery
);

router.delete('/:id', deleteGallery);

module.exports = router;
