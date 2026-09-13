const SyncService = require('../services/syncService');
const Scheme = require('../models/Scheme');
const MandiPrice = require('../models/MandiPrice');
const Job = require('../models/Job');
const Service = require('../models/Service');
const ServiceProvider = require('../models/ServiceProvider');
const MarketplaceListing = require('../models/MarketplaceListing');
const ServiceRequest = require('../models/ServiceRequest');
const JobApplication = require('../models/JobApplication');
const { successResponse, errorResponse } = require('../utils/helpers');

const SyncController = {
  async push(req, res) {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return errorResponse(res, 'Invalid sync payload: "items" must be an array of mutation objects.', 400);
      }

      const result = SyncService.processBatch(items, req.user);
      return successResponse(res, result, 'Batch synchronization processed successfully', 200, {
        batch_size: items.length
      });
    } catch (err) {
      console.error('[SyncController.push]', err);
      return errorResponse(res, 'Offline sync batch processing failed', 500);
    }
  },

  async pull(req, res) {
    try {
      const userId = req.user ? req.user.id : null;

      const schemes = Scheme.listAll({ limit: 100 });
      const mandiPrices = MandiPrice.listAll({ limit: 100 });
      const jobs = Job.listAll({ status: 'active', limit: 50 });
      const services = Service.listAll();
      const providers = ServiceProvider.listAll({ is_verified: 1, limit: 100 });
      const marketplace = MarketplaceListing.listAll({ status: 'active', limit: 50 });

      let myRequests = [];
      let myApplications = [];
      if (userId) {
        myRequests = ServiceRequest.listAll({ userId, limit: 50 });
        myApplications = JobApplication.listAll({ userId, limit: 50 });
      }

      return successResponse(res, {
        sync_timestamp: new Date().toISOString(),
        schemes,
        mandi_prices: mandiPrices,
        jobs,
        services,
        providers,
        marketplace,
        user_data: {
          requests: myRequests,
          applications: myApplications
        }
      }, 'Offline bundle pulled successfully');
    } catch (err) {
      console.error('[SyncController.pull]', err);
      return errorResponse(res, 'Failed to pull sync data bundle', 500);
    }
  }
};

module.exports = SyncController;
