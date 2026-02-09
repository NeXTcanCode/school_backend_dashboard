const express = require('express');
const { getEvents, createEvent, deleteEvent } = require('../controllers/eventController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const checkFeature = require('../middleware/checkFeature');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { eventSchema } = require('../../shared/schemas/eventSchema');

const router = express.Router();

router.use(auth);
router.use(tenant);
router.use(checkFeature('events'));

router.get('/', getEvents);

router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'attachment', maxCount: 1 }
  ]),
  validate(eventSchema),
  createEvent
);

router.delete('/:id', deleteEvent);

module.exports = router;
