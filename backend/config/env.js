require('dotenv').config();
const path = require('path');

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret_netbypass_rural_security_key_2026_jwt_token',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_FILE: process.env.DB_FILE || path.resolve(__dirname, '../database/netbypass.sqlite'),
  MANDI_API_URL: process.env.MANDI_API_URL || '',
  MANDI_API_KEY: process.env.MANDI_API_KEY || '',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500
};
