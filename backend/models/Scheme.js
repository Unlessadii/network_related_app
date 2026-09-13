const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const Scheme = {
  listAll({ category = null, search = null, limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT * FROM schemes WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category LIKE ?';
      params.push(`%${category}%`);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR name_hi LIKE ? OR description LIKE ? OR ministry LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare('SELECT * FROM schemes WHERE id = ?').get(id);
  },

  create({ name, name_hi, ministry, category, description, eligibility, documents, benefits, official_url }) {
    const id = `sch-${generateUuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    db.prepare(`
      INSERT INTO schemes (id, name, name_hi, ministry, category, description, eligibility, documents, benefits, official_url, last_updated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, name_hi, ministry, category, description, eligibility, documents, benefits, official_url, today, now);
    return this.findById(id);
  },

  update(id, fields) {
    const allowed = ['name', 'name_hi', 'ministry', 'category', 'description', 'eligibility', 'documents', 'benefits', 'official_url'];
    const updates = [];
    const values = [];

    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) {
        updates.push(`${k} = ?`);
        values.push(v);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('last_updated = ?');
    values.push(new Date().toISOString().slice(0, 10));
    values.push(id);

    db.prepare(`UPDATE schemes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM schemes').get().count;
  }
};

module.exports = Scheme;
