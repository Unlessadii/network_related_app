/**
 * Net Bypass API Client with Transparent Offline Fallback & Optimistic Mutation
 */
const ApiClient = {
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    const token = window.authService ? window.authService.getToken() : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // GET: Network-First with IndexedDB Fallback
  async get(url, storeFallbackName = null) {
    const isOnline = window.syncEngine ? window.syncEngine.isOnline() : navigator.onLine;

    if (isOnline) {
      try {
        const res = await fetch(url, { headers: this.getHeaders() });
        if (res.ok) {
          const json = await res.json();
          // Update offline store if applicable
          if (storeFallbackName && window.offlineDB && json.data) {
            const dataToCache = json.data[storeFallbackName] || json.data.prices || json.data.schemes || json.data.jobs || json.data.services || json.data.listings || (Array.isArray(json.data) ? json.data : null);
            if (Array.isArray(dataToCache)) {
              window.offlineDB.putBatch(storeFallbackName, dataToCache);
            }
          }
          return { data: json.data, isOffline: false };
        }
      } catch (err) {
        console.warn(`[ApiClient] Network fetch failed for ${url}, falling back to offline DB:`, err.message);
      }
    }

    // Offline Fallback
    if (storeFallbackName && window.offlineDB) {
      const items = await window.offlineDB.getAll(storeFallbackName);
      const meta = await window.offlineDB.get('meta', 'last_sync_timestamp');
      return {
        data: {
          [storeFallbackName]: items,
          prices: items,
          schemes: items,
          jobs: items,
          services: items,
          listings: items,
          last_updated: meta ? meta.value : new Date().toISOString()
        },
        isOffline: true
      };
    }

    return { data: null, isOffline: true };
  },

  // Service Booking: Online POST or Offline Queue
  async createServiceRequest(payload) {
    const isOnline = window.syncEngine ? window.syncEngine.isOnline() : navigator.onLine;

    if (isOnline) {
      try {
        const res = await fetch('/api/service-requests', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          if (window.offlineDB) {
            await window.offlineDB.put('my_requests', json.data.request);
          }
          return { success: true, data: json.data.request, isOffline: false };
        }
      } catch (err) {
        console.warn('[ApiClient] Direct booking failed, queuing offline:', err.message);
      }
    }

    // Offline optimistic queueing
    const clientId = await window.syncEngine.enqueue('SERVICE_REQUEST_CREATE', 'service_request', payload);
    const optimisticRecord = {
      id: clientId,
      client_id: clientId,
      ...payload,
      status: 'pending',
      sync_status: 'pending_sync',
      created_at: new Date().toISOString()
    };

    if (window.offlineDB) {
      await window.offlineDB.put('my_requests', optimisticRecord);
    }

    return { success: true, data: optimisticRecord, isOffline: true };
  },

  // Job Application: Online POST or Offline Queue
  async applyJob(jobId, payload) {
    const isOnline = window.syncEngine ? window.syncEngine.isOnline() : navigator.onLine;

    if (isOnline) {
      try {
        const res = await fetch(`/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          if (window.offlineDB) {
            await window.offlineDB.put('my_applications', json.data.application);
          }
          return { success: true, data: json.data.application, isOffline: false };
        }
      } catch (err) {
        console.warn('[ApiClient] Direct job apply failed, queuing offline:', err.message);
      }
    }

    // Offline queueing
    const clientId = await window.syncEngine.enqueue('JOB_APPLICATION_CREATE', 'job_application', {
      job_id: jobId,
      ...payload
    });

    const optimisticRecord = {
      id: clientId,
      client_id: clientId,
      job_id: jobId,
      ...payload,
      status: 'submitted',
      sync_status: 'pending_sync',
      created_at: new Date().toISOString()
    };

    if (window.offlineDB) {
      await window.offlineDB.put('my_applications', optimisticRecord);
    }

    return { success: true, data: optimisticRecord, isOffline: true };
  },

  // Marketplace: Online POST or Offline Queue
  async createMarketplaceListing(payload) {
    const isOnline = window.syncEngine ? window.syncEngine.isOnline() : navigator.onLine;

    if (isOnline) {
      try {
        const res = await fetch('/api/marketplace', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          if (window.offlineDB) {
            await window.offlineDB.put('marketplace', json.data.listing);
          }
          return { success: true, data: json.data.listing, isOffline: false };
        }
      } catch (err) {
        console.warn('[ApiClient] Direct listing failed, queuing offline:', err.message);
      }
    }

    // Offline queueing
    const clientId = await window.syncEngine.enqueue('MARKETPLACE_LISTING_CREATE', 'marketplace_listing', payload);
    const optimisticRecord = {
      id: clientId,
      client_id: clientId,
      ...payload,
      status: 'active',
      sync_status: 'pending_sync',
      created_at: new Date().toISOString()
    };

    if (window.offlineDB) {
      await window.offlineDB.put('marketplace', optimisticRecord);
    }

    return { success: true, data: optimisticRecord, isOffline: true };
  }
};

window.apiClient = ApiClient;
