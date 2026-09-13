const express = require('express');
const router = express.Router();
const SyncController = require('../controllers/syncController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/sync/push', optionalAuth, SyncController.push);
router.get('/sync/pull', optionalAuth, SyncController.pull);

module.exports = router;
