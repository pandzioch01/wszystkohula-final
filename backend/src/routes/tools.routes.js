const { Router } = require('express');
const {
  getToolById,
  searchToolsHandler,
} = require('../controllers/tools.controller');

const router = Router();

router.get('/', searchToolsHandler);
router.get('/:id', getToolById);

module.exports = router;
