/**
 * Net Bypass Offline Sync Engine
 * Handles bidirectional synchronization, conflict resolution, offline queuing,
 * and simulated offline testing for rural scenarios.
 */
class SyncEngine {
  constructor() {
    this.isSimulatedOffline = localStorage.getItem('nb_simulated_offline') === 'true';
    this.isSyncing = false;
    this.listeners = [];
    this.init();
  }

  init() {
    // Listen to real browser network status
    window.addEventListener('online', () => {
      this.notifyListeners();
      if (this.isOnline()) {
        this.triggerSync();
      }
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });

    // Listen to service worker trigger messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'TRIGGER_BACKGROUND_SYNC') {
          this.triggerSync();
        }
      });
    }

    // Auto-sync check every 30 seconds if online
    setInterval(() => {
      if (this.isOnline() && !this.isSyncing) {
        this.triggerSync();
      }
    }, 30000);
  }

  isOnline() {
    if (this.isSimulatedOffline) return false;
    return navigator.onLine;
  }

  toggleOfflineSimulation(enabled) {
    this.isSimulatedOffline = enabled;
    localStorage.setItem('nb_simulated_offline', enabled ? 'true' : 'false');
    this.notifyListeners();
    if (this.isOnline()) {
      this.triggerSync();
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    // Initial call
    callback(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  async notifyListeners() {
    const status = await this.getStatus();
    this.listeners.forEach((cb) => cb(status));
  }

  async getStatus() {
    const queue = window.offlineDB ? await window.offlineDB.getPendingMutations() : [];
    const meta = window.offlineDB ? await window.offlineDB.get('meta', 'last_sync_timestamp') : null;

    return {
      online: this.isOnline(),
      simulated: this.isSimulatedOffline,
      pendingCount: queue.length,
      isSyncing: this.isSyncing,
      lastSync: meta ? meta.value : null
    };
  }

  // Queue a mutation while offline
  async enqueue(action, entityType, payload) {
    const clientId = 'c-' + crypto.randomUUID();
    const mutation = {
      client_id: clientId,
      action,
      entity_type: entityType,
      payload,
      timestamp: new Date().toISOString()
    };

    if (window.offlineDB) {
      await window.offlineDB.enqueueMutation(mutation);
    }

    this.notifyListeners();

    // If currently online, immediately trigger sync
    if (this.isOnline()) {
      this.triggerSync();
    }

    return clientId;
  }

  // Drain the queue to the backend server
  async triggerSync() {
    if (!this.isOnline() || this.isSyncing) return;
    this.isSyncing = true;
    this.notifyListeners();

    try {
      if (!window.offlineDB) return;

      const queue = await window.offlineDB.getPendingMutations();
      if (queue.length > 0) {
        console.log(`[SyncEngine] Pushing ${queue.length} offline mutations to Panchayat server...`);

        const token = localStorage.getItem('nb_auth_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/sync/push', {
          method: 'POST',
          headers,
          body: JSON.stringify({ items: queue })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data.items) {
            // Remove successful mutations from local queue
            for (const item of data.data.items) {
              if (item.status === 'synced') {
                await window.offlineDB.removeMutation(item.client_id);
              }
            }
          }
        }
      }

      // Also pull latest bundle to update client caches
      await this.pullLatestBundle();

      // Record last sync timestamp
      const now = new Date().toISOString();
      await window.offlineDB.put('meta', { key: 'last_sync_timestamp', value: now });

      if (window.ui && typeof window.ui.showToast === 'function') {
        window.ui.showToast('Data synchronized with Panchayat server', 'success');
      }
    } catch (err) {
      console.warn('[SyncEngine] Sync failed, will retry on next connection event:', err.message);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  async pullLatestBundle() {
    try {
      const token = localStorage.getItem('nb_auth_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/sync/pull', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const { schemes, mandi_prices, jobs, services, providers, marketplace, user_data } = json.data;
          if (schemes) await window.offlineDB.putBatch('schemes', schemes);
          if (mandi_prices) await window.offlineDB.putBatch('mandi_prices', mandi_prices);
          if (jobs) await window.offlineDB.putBatch('jobs', jobs);
          if (services) await window.offlineDB.putBatch('services', services);
          if (providers) await window.offlineDB.putBatch('providers', providers);
          if (marketplace) await window.offlineDB.putBatch('marketplace', marketplace);
          if (user_data && user_data.requests) await window.offlineDB.putBatch('my_requests', user_data.requests);
          if (user_data && user_data.applications) await window.offlineDB.putBatch('my_applications', user_data.applications);
        }
      }
    } catch (err) {
      console.warn('[SyncEngine] Could not pull latest bundle:', err.message);
    }
  }
}

window.syncEngine = new SyncEngine();
