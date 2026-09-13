const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceProvider = require('../models/ServiceProvider');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Scheme = require('../models/Scheme');
const MandiPrice = require('../models/MandiPrice');
const MarketplaceListing = require('../models/MarketplaceListing');
const SyncEvent = require('../models/SyncEvent');
const { successResponse, errorResponse } = require('../utils/helpers');

const AdminController = {
  async getDashboard(req, res) {
    try {
      const stats = {
        total_users: User.count(),
        total_requests: ServiceRequest.count(),
        pending_requests: ServiceRequest.count({ status: 'pending' }),
        in_progress_requests: ServiceRequest.count({ status: 'in_progress' }),
        completed_requests: ServiceRequest.count({ status: 'completed' }),
        total_providers: ServiceProvider.count(),
        verified_providers: ServiceProvider.count({ verifiedOnly: true }),
        active_jobs: Job.count({ status: 'active' }),
        job_applications: JobApplication.count(),
        schemes_count: Scheme.count(),
        mandi_crops_tracked: MandiPrice.count(),
        mandi_last_updated: MandiPrice.lastUpdated(),
        marketplace_active: MarketplaceListing.count({ status: 'active' }),
        marketplace_flagged: MarketplaceListing.count({ status: 'flagged' }),
        offline_sync_events: SyncEvent.count()
      };

      const recentRequests = ServiceRequest.listAll({ limit: 8 });
      const recentSyncEvents = SyncEvent.listRecent({ limit: 10 });

      return successResponse(res, {
        stats,
        recent_requests: recentRequests,
        recent_sync_events: recentSyncEvents,
        role: req.user.role
      }, 'Admin dashboard metrics retrieved');
    } catch (err) {
      console.error('[AdminController.getDashboard]', err);
      return errorResponse(res, 'Failed to generate admin dashboard', 500);
    }
  },

  async getUsers(req, res) {
    const { role, limit = 50, offset = 0 } = req.query;
    const users = User.listAll({ role, limit: Number(limit), offset: Number(offset) });
    return successResponse(res, { users, count: users.length });
  },

  async updateUserRole(req, res) {
    // Only super admin can change roles
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Only Super Admin can change user roles', 403);
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'provider', 'panchayat', 'admin'].includes(role)) {
      return errorResponse(res, 'Invalid role specification', 400);
    }

    const updated = User.updateRole(id, role);
    return successResponse(res, { user: updated }, 'User role updated successfully');
  },

  async getRequests(req, res) {
    const { status, limit = 50, offset = 0 } = req.query;
    const requests = ServiceRequest.listAll({ status, limit: Number(limit), offset: Number(offset) });
    return successResponse(res, { requests, count: requests.length });
  },

  async updateRequest(req, res) {
    const { id } = req.params;
    const { status, provider_id } = req.body;
    const updated = ServiceRequest.updateStatus(id, status, provider_id);
    if (!updated) return errorResponse(res, 'Request not found', 404);
    return successResponse(res, { request: updated }, 'Service request updated');
  },

  async getProviders(req, res) {
    const { is_verified, limit = 50, offset = 0 } = req.query;
    const providers = ServiceProvider.listAll({
      is_verified: is_verified !== undefined ? is_verified === 'true' || is_verified === '1' : null,
      limit: Number(limit),
      offset: Number(offset)
    });
    return successResponse(res, { providers, count: providers.length });
  },

  async verifyProvider(req, res) {
    const { id } = req.params;
    const { is_verified } = req.body;
    const updated = ServiceProvider.setVerification(id, Boolean(is_verified));
    if (!updated) return errorResponse(res, 'Provider not found', 404);
    return successResponse(res, { provider: updated }, 'Provider verification status updated');
  },

  async getListings(req, res) {
    const { status, limit = 50, offset = 0 } = req.query;
    const listings = MarketplaceListing.listAll({ status, limit: Number(limit), offset: Number(offset) });
    return successResponse(res, { listings, count: listings.length });
  },

  async moderateListing(req, res) {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'flagged', 'sold'

    if (!['active', 'flagged', 'sold'].includes(status)) {
      return errorResponse(res, 'Invalid status value', 400);
    }

    const updated = MarketplaceListing.updateStatus(id, status);
    if (!updated) return errorResponse(res, 'Listing not found', 404);
    return successResponse(res, { listing: updated }, 'Listing moderation status updated');
  },

  async createScheme(req, res) {
    try {
      const { name, name_hi, ministry, category, description, eligibility, documents, benefits, official_url } = req.body;
      if (!name || !ministry || !description || !eligibility || !official_url) {
        return errorResponse(res, 'Name, ministry, description, eligibility, and official_url are required', 400);
      }

      const scheme = Scheme.create({
        name,
        name_hi: name_hi || name,
        ministry,
        category: category || 'General',
        description,
        eligibility,
        documents: documents || '',
        benefits: benefits || '',
        official_url
      });

      return successResponse(res, { scheme }, 'Scheme created successfully', 201);
    } catch (err) {
      console.error('[AdminController.createScheme]', err);
      return errorResponse(res, 'Failed to create scheme', 500);
    }
  },

  async updateScheme(req, res) {
    const { id } = req.params;
    const updated = Scheme.update(id, req.body);
    if (!updated) return errorResponse(res, 'Scheme not found', 404);
    return successResponse(res, { scheme: updated }, 'Scheme updated successfully');
  },

  async createJob(req, res) {
    try {
      const { title, title_hi, company_or_employer, category, location, village, district, state, salary, job_type, description, requirements, contact_phone } = req.body;
      if (!title || !company_or_employer || !category || !location || !salary || !contact_phone) {
        return errorResponse(res, 'Missing required job fields', 400);
      }

      const job = Job.create({
        title,
        title_hi: title_hi || title,
        company_or_employer,
        category,
        location,
        village,
        district: district || 'Narmadapuram',
        state: state || 'Madhya Pradesh',
        salary,
        job_type: job_type || 'Full-Time',
        description: description || '',
        requirements: requirements || '',
        contact_phone
      });

      return successResponse(res, { job }, 'Job created successfully', 201);
    } catch (err) {
      console.error('[AdminController.createJob]', err);
      return errorResponse(res, 'Failed to create job', 500);
    }
  },

  async updateJob(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    const updated = Job.updateStatus(id, status);
    if (!updated) return errorResponse(res, 'Job not found', 404);
    return successResponse(res, { job: updated }, 'Job status updated');
  },

  async updateMandiPrice(req, res) {
    try {
      const { crop, crop_hi, mandi, district, state, min_price, max_price, modal_price, arrival_date, source } = req.body;
      if (!crop || !mandi || !district || !modal_price) {
        return errorResponse(res, 'Crop, mandi, district, and modal_price are required', 400);
      }

      const item = MandiPrice.upsert({
        crop,
        crop_hi: crop_hi || crop,
        mandi,
        district,
        state: state || 'Madhya Pradesh',
        min_price: Number(min_price) || Number(modal_price) * 0.9,
        max_price: Number(max_price) || Number(modal_price) * 1.1,
        modal_price: Number(modal_price),
        arrival_date,
        source: source || 'Panchayat Mandi Portal'
      });

      return successResponse(res, { mandi_price: item }, 'Mandi price updated successfully');
    } catch (err) {
      console.error('[AdminController.updateMandiPrice]', err);
      return errorResponse(res, 'Failed to update mandi price', 500);
    }
  },

  async getSyncLogs(req, res) {
    const logs = SyncEvent.listRecent({ limit: 100 });
    return successResponse(res, { logs, count: logs.length });
  }
};

module.exports = AdminController;
