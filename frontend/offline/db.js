/**
 * Net Bypass IndexedDB Client Storage Wrapper
 * Provides resilient local storage for offline rural operations.
 */
class OfflineDB {
  constructor() {
    this.dbName = 'NetBypassOfflineDB';
    this.version = 1;
    this.db = null;
    this.readyPromise = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Stores
        const stores = [
          { name: 'schemes', keyPath: 'id' },
          { name: 'mandi_prices', keyPath: 'id' },
          { name: 'jobs', keyPath: 'id' },
          { name: 'services', keyPath: 'id' },
          { name: 'providers', keyPath: 'id' },
          { name: 'marketplace', keyPath: 'id' },
          { name: 'my_requests', keyPath: 'id' },
          { name: 'my_applications', keyPath: 'id' },
          { name: 'sync_queue', keyPath: 'client_id' },
          { name: 'meta', keyPath: 'key' }
        ];

        stores.forEach((s) => {
          if (!db.objectStoreNames.contains(s.name)) {
            db.createObjectStore(s.name, { keyPath: s.keyPath });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[OfflineDB] Failed to open IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAll(storeName) {
    await this.readyPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async get(storeName, key) {
    await this.readyPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, value) {
    await this.readyPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async putBatch(storeName, items = []) {
    await this.readyPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(storeName, key) {
    await this.readyPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName) {
    await this.readyPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // Sync Queue Specific Helpers
  async enqueueMutation(mutation) {
    // mutation: { client_id, entity_type, action, payload, timestamp, retry_count }
    const entry = {
      ...mutation,
      timestamp: mutation.timestamp || new Date().toISOString(),
      retry_count: mutation.retry_count || 0,
      status: 'pending'
    };
    return this.put('sync_queue', entry);
  }

  async getPendingMutations() {
    return this.getAll('sync_queue');
  }

  async removeMutation(clientId) {
    return this.delete('sync_queue', clientId);
  }

  // Cache stats
  async getStorageStats() {
    await this.readyPromise;
    const stats = {};
    const stores = ['schemes', 'mandi_prices', 'jobs', 'services', 'providers', 'marketplace', 'my_requests', 'my_applications', 'sync_queue'];
    for (const name of stores) {
      const items = await this.getAll(name);
      stats[name] = items.length;
    }
    const lastSyncMeta = await this.get('meta', 'last_sync_timestamp');
    stats.last_sync = lastSyncMeta ? lastSyncMeta.value : null;
    return stats;
  }
}

// Global instance for browser usage
window.offlineDB = new OfflineDB();
