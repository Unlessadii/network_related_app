const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/me', authenticate, UserController.getMe);
router.put('/me', authenticate, UserController.updateMe);
router.get('/notifications', authenticate, UserController.getNotifications);
router.put('/notifications/:id/read', authenticate, UserController.markNotificationRead);

module.exports = router;
