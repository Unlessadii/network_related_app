const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const Service = {
  listAll() {
    return db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM service_providers sp WHERE sp.category = s.name AND sp.is_verified = 1) as provider_count
      FROM services s 
      WHERE s.is_active = 1
      ORDER BY s.name ASC
    `).all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  },

  create({ name, name_hi, category, description, icon }) {
    const id = `srv-${generateUuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO services (id, name, name_hi, category, description, icon, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, name, name_hi, category, description, icon, now);
    return this.findById(id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM services WHERE is_active = 1').get().count;
  }
};

module.exports = Service;
