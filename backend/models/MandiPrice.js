const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const MandiPrice = {
  listAll({ crop = null, district = null, state = null, mandi = null, search = null, limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT * FROM mandi_prices WHERE 1=1';
    const params = [];

    if (crop) {
      sql += ' AND (crop LIKE ? OR crop_hi LIKE ?)';
      params.push(`%${crop}%`, `%${crop}%`);
    }
    if (district) {
      sql += ' AND district LIKE ?';
      params.push(`%${district}%`);
    }
    if (state) {
      sql += ' AND state LIKE ?';
      params.push(`%${state}%`);
    }
    if (mandi) {
      sql += ' AND mandi LIKE ?';
      params.push(`%${mandi}%`);
    }
    if (search) {
      sql += ' AND (crop LIKE ? OR crop_hi LIKE ? OR mandi LIKE ? OR district LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY crop ASC, modal_price DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare('SELECT * FROM mandi_prices WHERE id = ?').get(id);
  },

  upsert({ crop, crop_hi, mandi, district, state, min_price, max_price, modal_price, arrival_date = null, source = 'e-NAM / Agmarknet Portal' }) {
    const existing = db.prepare('SELECT id FROM mandi_prices WHERE crop = ? AND mandi = ?').get(crop, mandi);
    const now = new Date().toISOString();
    const date = arrival_date || now.slice(0, 10);

    if (existing) {
      db.prepare(`
        UPDATE mandi_prices 
        SET crop_hi = ?, district = ?, state = ?, min_price = ?, max_price = ?, modal_price = ?, arrival_date = ?, source = ?, last_updated = ?
        WHERE id = ?
      `).run(crop_hi, district, state, min_price, max_price, modal_price, date, source, now, existing.id);
      return this.findById(existing.id);
    } else {
      const id = `mnd-${generateUuid().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO mandi_prices (id, crop, crop_hi, mandi, district, state, min_price, max_price, modal_price, arrival_date, source, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, crop, crop_hi, mandi, district, state, min_price, max_price, modal_price, date, source, now);
      return this.findById(id);
    }
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM mandi_prices').get().count;
  },

  lastUpdated() {
    const row = db.prepare('SELECT MAX(last_updated) as latest FROM mandi_prices').get();
    return row ? row.latest : null;
  }
};

module.exports = MandiPrice;
