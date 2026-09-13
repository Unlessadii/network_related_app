const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const User = {
  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByPhone(phone) {
    return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  },

  findByEmail(email) {
    if (!email) return null;
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findByPhoneOrEmail(identifier) {
    return db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(identifier, identifier);
  },

  create({ name, phone, email = null, password_hash, role = 'user', village, district, state = 'Madhya Pradesh' }) {
    const id = `usr-${generateUuid()}`;
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, name, phone, email, password_hash, role, village, district, state, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    stmt.run(id, name, phone, email, password_hash, role, village, district, state, now, now);
    return this.findById(id);
  },

  update(id, fields) {
    const allowed = ['name', 'village', 'district', 'state', 'email'];
    const updates = [];
    const values = [];

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  updateRole(id, role) {
    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, new Date().toISOString(), id);
    return this.findById(id);
  },

  listAll({ limit = 100, offset = 0, role = null } = {}) {
    if (role) {
      return db.prepare('SELECT id, name, phone, email, role, village, district, state, is_active, created_at FROM users WHERE role = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(role, limit, offset);
    }
    return db.prepare('SELECT id, name, phone, email, role, village, district, state, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  }
};

module.exports = User;
