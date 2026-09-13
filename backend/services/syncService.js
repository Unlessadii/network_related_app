const db = require('../database/db');
const ServiceRequest = require('../models/ServiceRequest');
const JobApplication = require('../models/JobApplication');
const MarketplaceListing = require('../models/MarketplaceListing');
const SyncEvent = require('../models/SyncEvent');
const Notification = require('../models/Notification');
const User = require('../models/User');

const SyncService = {
  processBatch(items = [], authenticatedUser = null) {
    const results = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const item of items) {
      const { client_id, entity_type, action, payload = {} } = item;
      const effectiveUserId = (authenticatedUser && authenticatedUser.id) || payload.user_id || 'usr-farmer-001';

      try {
        let serverRecord = null;

        if (action === 'SERVICE_REQUEST_CREATE' || entity_type === 'service_request') {
          serverRecord = ServiceRequest.create({
            client_id,
            user_id: effectiveUserId,
            service_id: payload.service_id,
            provider_id: payload.provider_id || null,
            village: payload.village || (authenticatedUser && authenticatedUser.village) || 'Unknown Village',
            district: payload.district || (authenticatedUser && authenticatedUser.district) || 'Narmadapuram',
            description: payload.description,
            urgency: payload.urgency || 'normal',
            scheduled_date: payload.scheduled_date || null,
            status: 'pending',
            sync_status: 'synced'
          });

          // Create notification for user
          Notification.create({
            user_id: effectiveUserId,
            title: 'Service Request Synced',
            message: `Your request #${serverRecord.id} has been submitted to the Panchayat server.`,
            type: 'sync'
          });
        } 
        else if (action === 'JOB_APPLICATION_CREATE' || entity_type === 'job_application') {
          serverRecord = JobApplication.create({
            client_id,
            job_id: payload.job_id,
            user_id: effectiveUserId,
            applicant_name: payload.applicant_name || (authenticatedUser && authenticatedUser.name) || 'Kisan Applicant',
            phone: payload.phone || (authenticatedUser && authenticatedUser.phone) || '9876543210',
            village: payload.village || (authenticatedUser && authenticatedUser.village) || 'Unknown Village',
            experience: payload.experience || '',
            remarks: payload.remarks || '',
            status: 'submitted',
            sync_status: 'synced'
          });

          Notification.create({
            user_id: effectiveUserId,
            title: 'Job Application Synced',
            message: `Your application #${serverRecord.id} has been received.`,
            type: 'sync'
          });
        }
        else if (action === 'MARKETPLACE_LISTING_CREATE' || entity_type === 'marketplace_listing') {
          serverRecord = MarketplaceListing.create({
            client_id,
            user_id: effectiveUserId,
            title: payload.title,
            category: payload.category || 'General',
            price: Number(payload.price) || 0,
            unit: payload.unit || 'per item',
            description: payload.description,
            village: payload.village || (authenticatedUser && authenticatedUser.village) || 'Unknown Village',
            district: payload.district || (authenticatedUser && authenticatedUser.district) || 'Narmadapuram',
            seller_name: payload.seller_name || (authenticatedUser && authenticatedUser.name) || 'Seller',
            seller_phone: payload.seller_phone || (authenticatedUser && authenticatedUser.phone) || '9876543210',
            image_url: payload.image_url || null,
            status: 'active',
            sync_status: 'synced'
          });

          Notification.create({
            user_id: effectiveUserId,
            title: 'Marketplace Listing Published',
            message: `Your listing "${payload.title}" is now visible to all villagers.`,
            type: 'sync'
          });
        }
        else if (action === 'USER_PROFILE_UPDATE' || entity_type === 'user_profile') {
          if (effectiveUserId) {
            serverRecord = User.update(effectiveUserId, payload);
          }
        } else {
          throw new Error(`Unknown sync action: ${action || entity_type}`);
        }

        // Record in sync event audit table
        SyncEvent.record({
          client_id,
          user_id: effectiveUserId,
          entity_type: entity_type || action,
          action: action || 'CREATE',
          status: 'processed',
          payload,
          error_message: null
        });

        results.push({
          client_id,
          server_id: serverRecord ? serverRecord.id : null,
          status: 'synced',
          entity: serverRecord
        });
        processedCount++;
      } catch (err) {
        failedCount++;
        console.error(`[SyncService] Error processing item ${client_id}:`, err.message);

        SyncEvent.record({
          client_id,
          user_id: effectiveUserId,
          entity_type: entity_type || action || 'unknown',
          action: action || 'FAILED',
          status: 'failed',
          payload,
          error_message: err.message
        });

        results.push({
          client_id,
          server_id: null,
          status: 'failed',
          error: err.message
        });
      }
    }

    return {
      total: items.length,
      processed: processedCount,
      failed: failedCount,
      synced_at: new Date().toISOString(),
      items: results
    };
  }
};

module.exports = SyncService;
