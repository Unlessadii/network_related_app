const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const Job = {
  listAll({ category = null, district = null, search = null, status = 'active', limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT * FROM jobs WHERE 1=1';
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
      sql += ' AND (title LIKE ? OR title_hi LIKE ? OR description LIKE ? OR company_or_employer LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  },

  create({ title, title_hi, company_or_employer, category, location, village = null, district, state = 'Madhya Pradesh', salary, job_type = 'Full-Time', description, requirements, contact_phone }) {
    const id = `job-${generateUuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO jobs (id, title, title_hi, company_or_employer, category, location, village, district, state, salary, job_type, description, requirements, contact_phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(id, title, title_hi, company_or_employer, category, location, village, district, state, salary, job_type, description, requirements, contact_phone, now);
    return this.findById(id);
  },

  updateStatus(id, status) {
    db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, id);
    return this.findById(id);
  },

  count({ status = 'active' } = {}) {
    if (status) {
      return db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = ?').get(status).count;
    }
    return db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
  }
};

module.exports = Job;
