const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { successResponse, errorResponse, sanitizeUser } = require('../utils/helpers');

const AuthController = {
  async register(req, res) {
    try {
      const { name, phone, email, password, role = 'user', village, district, state } = req.body;

      if (!name || !phone || !password || !village || !district) {
        return errorResponse(res, 'Name, phone, password, village, and district are required.', 400);
      }

      // Check existing
      const existingPhone = User.findByPhone(phone);
      if (existingPhone) {
        return errorResponse(res, 'A user with this phone number already exists.', 409);
      }

      if (email) {
        const existingEmail = User.findByEmail(email);
        if (existingEmail) {
          return errorResponse(res, 'A user with this email already exists.', 409);
        }
      }

      // Disallow registering directly as admin from public endpoint unless key provided
      const finalRole = ['user', 'provider'].includes(role) ? role : 'user';

      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(password, salt);

      const user = User.create({
        name,
        phone,
        email: email || null,
        password_hash,
        role: finalRole,
        village,
        district,
        state: state || 'Madhya Pradesh'
      });

      const token = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      );

      return successResponse(res, {
        user: sanitizeUser(user),
        token
      }, 'Registration successful', 201);
    } catch (err) {
      console.error('[AuthController.register]', err);
      return errorResponse(res, 'Registration failed', 500);
    }
  },

  async login(req, res) {
    try {
      const { phone, email, password } = req.body;
      const identifier = phone || email;

      if (!identifier || !password) {
        return errorResponse(res, 'Phone/Email and password are required.', 400);
      }

      const user = User.findByPhoneOrEmail(identifier);
      if (!user) {
        return errorResponse(res, 'Invalid credentials. No user found with this phone or email.', 401);
      }

      if (!user.is_active) {
        return errorResponse(res, 'Account is suspended. Please contact Panchayat administrator.', 403);
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return errorResponse(res, 'Invalid credentials. Incorrect password.', 401);
      }

      const token = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      );

      return successResponse(res, {
        user: sanitizeUser(user),
        token
      }, 'Login successful');
    } catch (err) {
      console.error('[AuthController.login]', err);
      return errorResponse(res, 'Login failed', 500);
    }
  },

  async logout(req, res) {
    // JWT is stateless; client drops token
    return successResponse(res, null, 'Logged out successfully');
  },

  async me(req, res) {
    return successResponse(res, {
      user: sanitizeUser(req.user)
    }, 'Current user profile');
  }
};

module.exports = AuthController;
