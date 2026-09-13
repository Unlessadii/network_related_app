const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const ServiceRequest = {
  listAll({ userId = null, providerId = null, status = null, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT sr.*, 
        u.name as user_name, u.phone as user_phone,
        s.name as service_name, s.name_hi as service_name_hi, s.icon as service_icon,
        sp.name as provider_name, sp.phone as provider_phone
      FROM service_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN services s ON sr.service_id = s.id
      LEFT JOIN service_providers sp ON sr.provider_id = sp.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ' AND sr.user_id = ?';
      params.push(userId);
    }
    if (providerId) {
      sql += ' AND sr.provider_id = ?';
      params.push(providerId);
    }
    if (status) {
      sql += ' AND sr.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare(`
      SELECT sr.*, 
        u.name as user_name, u.phone as user_phone,
        s.name as service_name, s.name_hi as service_name_hi, s.icon as service_icon,
        sp.name as provider_name, sp.phone as provider_phone
      FROM service_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN services s ON sr.service_id = s.id
      LEFT JOIN service_providers sp ON sr.provider_id = sp.id
      WHERE sr.id = ?
    `).get(id);
  },

  findByClientId(clientId) {
    if (!clientId) return null;
    return db.prepare('SELECT * FROM service_requests WHERE client_id = ?').get(clientId);
  },

  create({ client_id = null, user_id, service_id, provider_id = null, village, district, description, urgency = 'normal', scheduled_date = null, status = 'pending', sync_status = 'synced' }) {
    // If idempotent client_id already exists, return existing
    if (client_id) {
      const existing = this.findByClientId(client_id);
      if (existing) return existing;
    }

    const id = `req-${generateUuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO service_requests (id, client_id, user_id, service_id, provider_id, village, district, description, urgency, scheduled_date, status, sync_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, client_id, user_id, service_id, provider_id, village, district, description, urgency, scheduled_date, status, sync_status, now, now);

    return this.findById(id);
  },

  updateStatus(id, status, providerId = null) {
    const now = new Date().toISOString();
    if (providerId) {
      db.prepare('UPDATE service_requests SET status = ?, provider_id = ?, updated_at = ? WHERE id = ?').run(status, providerId, now, id);
    } else {
      db.prepare('UPDATE service_requests SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    }
    return this.findById(id);
  },

  count({ status = null } = {}) {
    if (status) {
      return db.prepare('SELECT COUNT(*) as count FROM service_requests WHERE status = ?').get(status).count;
    }
    return db.prepare('SELECT COUNT(*) as count FROM service_requests').get().count;
  }
};

module.exports = ServiceRequest;
