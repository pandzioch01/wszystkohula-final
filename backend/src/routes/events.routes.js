const { Router } = require('express');
const { listEvents, getEventById } = require('../controllers/events.controller');

const router = Router();

router.get('/', listEvents);
router.get('/:id', getEventById);

module.exports = router;
