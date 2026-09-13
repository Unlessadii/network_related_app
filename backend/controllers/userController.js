const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, sanitizeUser } = require('../utils/helpers');

const UserController = {
  async getMe(req, res) {
    const unreadNotifications = Notification.unreadCount(req.user.id);
    return successResponse(res, {
      user: sanitizeUser(req.user),
      unread_notifications: unreadNotifications
    });
  },

  async updateMe(req, res) {
    try {
      const { name, village, district, state, email } = req.body;
      const updated = User.update(req.user.id, { name, village, district, state, email });
      return successResponse(res, { user: sanitizeUser(updated) }, 'Profile updated successfully');
    } catch (err) {
      console.error('[UserController.updateMe]', err);
      return errorResponse(res, 'Failed to update profile', 500);
    }
  },

  async getNotifications(req, res) {
    const notifications = Notification.listByUser(req.user.id);
    return successResponse(res, { notifications });
  },

  async markNotificationRead(req, res) {
    const { id } = req.params;
    Notification.markAsRead(id, req.user.id);
    return successResponse(res, null, 'Notification marked as read');
  }
};

module.exports = UserController;
