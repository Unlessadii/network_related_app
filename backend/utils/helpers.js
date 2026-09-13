const crypto = require('crypto');

function generateUuid() {
  return crypto.randomUUID();
}

function successResponse(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
}

function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const payload = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString()
    }
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  generateUuid,
  successResponse,
  errorResponse,
  sanitizeUser
};
