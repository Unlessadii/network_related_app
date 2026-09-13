const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All admin routes require authentication and either 'admin' or 'panchayat' role
router.use(authenticate, requireRole(['admin', 'panchayat']));

// Dashboard metrics
router.get('/dashboard', AdminController.getDashboard);

// Users management (super-admin only can change roles)
router.get('/users', AdminController.getUsers);
router.put('/users/:id/role', AdminController.updateUserRole);

// Service requests dispatcher
router.get('/requests', AdminController.getRequests);
router.put('/requests/:id', AdminController.updateRequest);

// Providers verification
router.get('/providers', AdminController.getProviders);
router.put('/providers/:id/verify', AdminController.verifyProvider);

// Marketplace moderation
router.get('/listings', AdminController.getListings);
router.put('/listings/:id/moderate', AdminController.moderateListing);

// Schemes management
router.post('/schemes', AdminController.createScheme);
router.put('/schemes/:id', AdminController.updateScheme);

// Jobs management
router.post('/jobs', AdminController.createJob);
router.put('/jobs/:id', AdminController.updateJob);

// Mandi rates management
router.post('/mandi-prices', AdminController.updateMandiPrice);

// Sync audit logs
router.get('/sync-logs', AdminController.getSyncLogs);

module.exports = router;
