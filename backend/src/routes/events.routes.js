const { Router } = require('express');
const {
  listEvents,
  getEventById,
  createEventHandler,
  updateEventHandler,
  deleteEventHandler,
} = require('../controllers/events.controller');

const router = Router();

router.get('/', listEvents);
router.post('/', createEventHandler);
router.get('/:id', getEventById);
router.patch('/:id', updateEventHandler);
router.delete('/:id', deleteEventHandler);

module.exports = router;
