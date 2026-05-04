const { Router } = require('express');
const {
  getMemberById,
  getMemberNotifications,
  searchMembersHandler,
} = require('../controllers/members.controller');

const router = Router();

router.get('/', searchMembersHandler);
router.get('/:id', getMemberById);
router.get('/:id/notifications', getMemberNotifications);

module.exports = router;
