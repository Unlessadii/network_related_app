const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const JobApplication = {
  listAll({ jobId = null, userId = null, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT ja.*, j.title as job_title, j.company_or_employer, j.salary, j.location as job_location
      FROM job_applications ja
      LEFT JOIN jobs j ON ja.job_id = j.id
      WHERE 1=1
    `;
    const params = [];

    if (jobId) {
      sql += ' AND ja.job_id = ?';
      params.push(jobId);
    }
    if (userId) {
      sql += ' AND ja.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY ja.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare(`
      SELECT ja.*, j.title as job_title, j.company_or_employer, j.salary
      FROM job_applications ja
      LEFT JOIN jobs j ON ja.job_id = j.id
      WHERE ja.id = ?
    `).get(id);
  },

  findByClientId(clientId) {
    if (!clientId) return null;
    return db.prepare('SELECT * FROM job_applications WHERE client_id = ?').get(clientId);
  },

  create({ client_id = null, job_id, user_id, applicant_name, phone, village, experience = '', remarks = '', status = 'submitted', sync_status = 'synced' }) {
    if (client_id) {
      const existing = this.findByClientId(client_id);
      if (existing) return existing;
    }

    const id = `app-${generateUuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO job_applications (id, client_id, job_id, user_id, applicant_name, phone, village, experience, remarks, status, sync_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, client_id, job_id, user_id, applicant_name, phone, village, experience, remarks, status, sync_status, now);

    return this.findById(id);
  },

  updateStatus(id, status) {
    db.prepare('UPDATE job_applications SET status = ? WHERE id = ?').run(status, id);
    return this.findById(id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM job_applications').get().count;
  }
};

module.exports = JobApplication;
