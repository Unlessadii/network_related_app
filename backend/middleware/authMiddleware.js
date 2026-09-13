const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { errorResponse } = require('../utils/helpers');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = User.findById(decoded.id);

    if (!user || !user.is_active) {
      return errorResponse(res, 'User account not found or suspended', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session token expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token', 401);
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = User.findById(decoded.id);
    if (user && user.is_active) {
      req.user = user;
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `Access denied. Requires one of roles: [${roles.join(', ')}]`, 403);
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole
};
