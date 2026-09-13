const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const Notification = {
  listByUser(userId, { limit = 30 } = {}) {
    return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
  },

  create({ user_id, title, message, type = 'info' }) {
    const id = `ntf-${generateUuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, user_id, title, message, type, now);
    return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  },

  markAsRead(id, userId) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  },

  unreadCount(userId) {
    return db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId).count;
  }
};

module.exports = Notification;
