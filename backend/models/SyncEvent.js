const db = require('../database/db');
const { generateUuid } = require('../utils/helpers');

const SyncEvent = {
  record({ client_id, user_id = null, entity_type, action, status = 'processed', payload = {}, error_message = null }) {
    const id = `snc-${generateUuid()}`;
    const now = new Date().toISOString();
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

    db.prepare(`
      INSERT INTO sync_events (id, client_id, user_id, entity_type, action, status, payload, error_message, created_at, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, client_id, user_id, entity_type, action, status, payloadStr, error_message, now, now);

    return db.prepare('SELECT * FROM sync_events WHERE id = ?').get(id);
  },

  listRecent({ limit = 50 } = {}) {
    return db.prepare('SELECT * FROM sync_events ORDER BY processed_at DESC LIMIT ?').all(limit);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM sync_events').get().count;
  }
};

module.exports = SyncEvent;
