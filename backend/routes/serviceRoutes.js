const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/serviceController');
const { optionalAuth, authenticate, requireRole } = require('../middleware/authMiddleware');

// Services catalog
router.get('/services', ServiceController.getServices);
router.get('/services/:id', ServiceController.getServiceById);

// Service Providers directory
router.get('/providers', ServiceController.getProviders);
router.get('/providers/:id', ServiceController.getProviderById);
router.post('/providers', optionalAuth, ServiceController.registerProvider);

// Service Requests / Bookings
router.post('/service-requests', optionalAuth, ServiceController.createServiceRequest);
router.get('/service-requests', optionalAuth, ServiceController.getServiceRequests);
router.get('/service-requests/:id', optionalAuth, ServiceController.getServiceRequestById);
router.put('/service-requests/:id/status', authenticate, requireRole(['admin', 'panchayat', 'provider']), ServiceController.updateRequestStatus);

module.exports = router;
