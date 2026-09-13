const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const MarketplaceListing = {
  listAll({ category = null, district = null, search = null, status = 'active', limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT * FROM marketplace_listings WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND category LIKE ?';
      params.push(`%${category}%`);
    }
    if (district) {
      sql += ' AND district LIKE ?';
      params.push(`%${district}%`);
    }
    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR seller_name LIKE ? OR village LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(id);
  },

  findByClientId(clientId) {
    if (!clientId) return null;
    return db.prepare('SELECT * FROM marketplace_listings WHERE client_id = ?').get(clientId);
  },

  create({ client_id = null, user_id, title, category, price, unit = 'per item', description, village, district, state = 'Madhya Pradesh', seller_name, seller_phone, status = 'active', sync_status = 'synced', image_url = null }) {
    if (client_id) {
      const existing = this.findByClientId(client_id);
      if (existing) return existing;
    }

    const id = `mkt-${generateUuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO marketplace_listings (id, client_id, user_id, title, category, price, unit, description, village, district, state, seller_name, seller_phone, status, sync_status, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, client_id, user_id, title, category, price, unit, description, village, district, state, seller_name, seller_phone, status, sync_status, image_url, now);

    return this.findById(id);
  },

  updateStatus(id, status) {
    db.prepare('UPDATE marketplace_listings SET status = ? WHERE id = ?').run(status, id);
    return this.findById(id);
  },

  count({ status = 'active' } = {}) {
    if (status) {
      return db.prepare('SELECT COUNT(*) as count FROM marketplace_listings WHERE status = ?').get(status).count;
    }
    return db.prepare('SELECT COUNT(*) as count FROM marketplace_listings').get().count;
  }
};

module.exports = MarketplaceListing;
