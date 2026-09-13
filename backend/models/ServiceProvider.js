const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const ServiceProvider = {
  listAll({ category = null, district = null, village = null, is_verified = null, limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT * FROM service_providers WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND (category LIKE ? OR category IN (SELECT name FROM services WHERE id = ?))';
      params.push(`%${category}%`, category);
    }
    if (district) {
      sql += ' AND district LIKE ?';
      params.push(`%${district}%`);
    }
    if (village) {
      sql += ' AND village LIKE ?';
      params.push(`%${village}%`);
    }
    if (is_verified !== null) {
      sql += ' AND is_verified = ?';
      params.push(is_verified ? 1 : 0);
    }

    sql += ' ORDER BY rating DESC, reviews_count DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare('SELECT * FROM service_providers WHERE id = ?').get(id);
  },

  findByUserId(userId) {
    return db.prepare('SELECT * FROM service_providers WHERE user_id = ?').get(userId);
  },

  create({ user_id = null, name, category, village, district, state = 'Madhya Pradesh', phone, availability = 'Available', rating = 5.0, reviews_count = 1, is_verified = 0 }) {
    const id = `prv-${generateUuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO service_providers (id, user_id, name, category, village, district, state, phone, availability, rating, reviews_count, is_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user_id, name, category, village, district, state, phone, availability, rating, reviews_count, is_verified, now);
    return this.findById(id);
  },

  setVerification(id, isVerified) {
    db.prepare('UPDATE service_providers SET is_verified = ? WHERE id = ?').run(isVerified ? 1 : 0, id);
    return this.findById(id);
  },

  count({ verifiedOnly = false } = {}) {
    if (verifiedOnly) {
      return db.prepare('SELECT COUNT(*) as count FROM service_providers WHERE is_verified = 1').get().count;
    }
    return db.prepare('SELECT COUNT(*) as count FROM service_providers').get().count;
  }
};

module.exports = ServiceProvider;
