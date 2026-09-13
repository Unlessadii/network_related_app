const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

const dbDir = path.dirname(config.DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.DB_FILE);

// Set pragmas for robust rural multi-read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

module.exports = db;
