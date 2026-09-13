const Service = require('../models/Service');
const ServiceProvider = require('../models/ServiceProvider');
const ServiceRequest = require('../models/ServiceRequest');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/helpers');

const ServiceController = {
  async getServices(req, res) {
    const services = Service.listAll();
    return successResponse(res, { services });
  },

  async getServiceById(req, res) {
    const { id } = req.params;
    const service = Service.findById(id);
    if (!service) return errorResponse(res, 'Service not found', 404);

    const providers = ServiceProvider.listAll({ category: service.name });
    return successResponse(res, { service, providers });
  },

  async getProviders(req, res) {
    const { category, district, village, is_verified } = req.query;
    const providers = ServiceProvider.listAll({
      category,
      district,
      village,
      is_verified: is_verified !== undefined ? is_verified === 'true' || is_verified === '1' : null
    });
    return successResponse(res, { providers, count: providers.length });
  },

  async getProviderById(req, res) {
    const { id } = req.params;
    const provider = ServiceProvider.findById(id);
    if (!provider) return errorResponse(res, 'Service provider not found', 404);
    return successResponse(res, { provider });
  },

  async registerProvider(req, res) {
    try {
      const { name, category, village, district, state, phone, availability } = req.body;
      if (!name || !category || !village || !district || !phone) {
        return errorResponse(res, 'Name, category, village, district, and phone are required', 400);
      }

      const provider = ServiceProvider.create({
        user_id: req.user ? req.user.id : null,
        name,
        category,
        village,
        district,
        state: state || 'Madhya Pradesh',
        phone,
        availability: availability || 'Available Today',
        is_verified: 0 // Requires admin/panchayat approval
      });

      return successResponse(res, { provider }, 'Provider registered. Awaiting Panchayat verification.', 201);
    } catch (err) {
      console.error('[ServiceController.registerProvider]', err);
      return errorResponse(res, 'Failed to register service provider', 500);
    }
  },

  async createServiceRequest(req, res) {
    try {
      const { client_id, service_id, provider_id, village, district, description, urgency = 'normal', scheduled_date } = req.body;
      const userId = req.user ? req.user.id : (req.body.user_id || 'usr-farmer-001');

      if (!description || !village || !district) {
        return errorResponse(res, 'Description, village, and district are required.', 400);
      }

      const request = ServiceRequest.create({
        client_id,
        user_id: userId,
        service_id,
        provider_id,
        village,
        district,
        description,
        urgency,
        scheduled_date,
        status: 'pending',
        sync_status: 'synced'
      });

      // Notify user
      Notification.create({
        user_id: userId,
        title: 'Service Request Created',
        message: `Your booking #${request.id} for "${description.slice(0, 30)}..." has been recorded.`,
        type: 'info'
      });

      return successResponse(res, { request }, 'Service request created successfully', 201);
    } catch (err) {
      console.error('[ServiceController.createServiceRequest]', err);
      return errorResponse(res, 'Failed to create service request', 500);
    }
  },

  async getServiceRequests(req, res) {
    const userId = req.user ? req.user.id : null;
    const { status } = req.query;

    let requests;
    if (req.user && ['admin', 'panchayat'].includes(req.user.role)) {
      requests = ServiceRequest.listAll({ status });
    } else {
      requests = ServiceRequest.listAll({ userId, status });
    }

    return successResponse(res, { requests });
  },

  async getServiceRequestById(req, res) {
    const { id } = req.params;
    const request = ServiceRequest.findById(id);
    if (!request) return errorResponse(res, 'Service request not found', 404);

    if (req.user && !['admin', 'panchayat'].includes(req.user.role) && request.user_id !== req.user.id) {
      return errorResponse(res, 'Unauthorized to view this request', 403);
    }

    return successResponse(res, { request });
  },

  async updateRequestStatus(req, res) {
    const { id } = req.params;
    const { status, provider_id } = req.body;

    if (!['pending', 'assigned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return errorResponse(res, 'Invalid status value', 400);
    }

    const updated = ServiceRequest.updateStatus(id, status, provider_id);
    if (!updated) return errorResponse(res, 'Service request not found', 404);

    // Notify requesting user
    Notification.create({
      user_id: updated.user_id,
      title: 'Service Request Status Updated',
      message: `Your request #${id} status changed to "${status}".`,
      type: 'info'
    });

    return successResponse(res, { request: updated }, 'Status updated successfully');
  }
};

module.exports = ServiceController;
