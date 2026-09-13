# Net Bypass — System Architecture & Offline Protocol

## 1. Architectural Philosophy

Over 60% of rural India operates under zero-connectivity, erratic 2G/3G throttles, or power outages. Net Bypass is engineered with an **Offline-First Zero-Data-Loss Architecture**:

```
+-----------------------------------------------------------------------------------+
|                         CLIENT DEVICE (Low-End Android / PWA)                     |
+-----------------------------------------------------------------------------------+
|  [ User App /app ] <-----> [ IndexedDB Storage ] <-----> [ Service Worker sw.js ] |
|         |                        |                                |               |
|   (Optimistic UI)         (Schemes, Mandi, Jobs,           (Asset & API           |
|         |                 Sync Queue, My Requests)           Cache Fallback)      |
|         v                        ^                                |               |
|  [ Sync Engine ] ----------------+                                |               |
+-------------------------------------------------------------------|---------------+
                                   | (When Network Reconnects)      |
                                   v                                v
+-----------------------------------------------------------------------------------+
|                              BACKEND SERVER (Express.js)                          |
+-----------------------------------------------------------------------------------+
|  * Helmet Security & CORS              * Idempotent Batch Sync (/api/sync/push)   |
|  * JWT Role Guards (admin, panchayat)  * Single-Trip Cache Pull (/api/sync/pull)  |
|  * Rate Limiting & Gzip Compression    * REST Endpoints (/services, /mandi, etc)  |
+-----------------------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------------------+
|                         ACID RELATIONAL DATABASE (SQLite WAL)                     |
+-----------------------------------------------------------------------------------+
|  * users                       * schemes                   * sync_events          |
|  * service_providers           * mandi_prices              * notifications        |
|  * service_requests            * marketplace_listings                             |
|  * jobs & job_applications                                                        |
+-----------------------------------------------------------------------------------+
```

---

## 2. The Three Layers

### A. Public / User App (`/app`)
- Lightweight, high-contrast, Indian-language-friendly interface built with vanilla JS and CSS.
- Integrates Text-To-Speech (Web Speech API) for reading mandi prices and welfare scheme benefits aloud.
- Direct cellular emergency dialing links (`tel:112`, `tel:108`, `tel:100`, etc.) that execute on phone modems without packet data.
- In-app "Simulate Offline" toggle allows testing offline workflows on demand.

### B. Protected Admin & Panchayat Portal (`/admin`)
- Separate route and bundle; inaccessible to normal users.
- Role-gated by JWT token verification (`admin` and `panchayat`).
- Panchayat operators dispatch local service requests, review local providers, and inspect anti-fraud flags.
- Super Admins configure roles, review sync audit streams, and manage system parameters.

### C. Backend REST API & Database
- Express.js with SQLite WAL (Write-Ahead Logging) mode.
- 11 structured tables with foreign keys and indexes.
- Pre-seeded with authentic, verified Indian agricultural commodity prices and welfare schemes.

---

## 3. Offline-First Protocol & Lifecycle

### Step 1: Offline Mutation
When a citizen books a service, applies for a job, or lists an item offline:
1. Client generates a unique UUID `client_id`.
2. Item is optimistically saved in IndexedDB with `sync_status = 'pending_sync'`.
3. Mutation payload is appended to `sync_queue` in IndexedDB.
4. UI reflects the new item immediately with badge `Pending Sync ⏳`.

### Step 2: Connection Detection
1. `window.addEventListener('online')` detects network restoration.
2. The Service Worker also triggers `sync` events.
3. A background timer inspects the queue every 30 seconds.

### Step 3: Idempotent Batch Processing
1. Client sends pending queue to `POST /api/sync/push`.
2. Backend checks `client_id` against existing records; duplicates are safely ignored.
3. Server commits transactions to SQLite, creates citizen notifications, and logs `sync_events`.
4. Server returns status map `{ client_id, server_id, status: 'synced' }`.

### Step 4: Reconciliation
1. Client receives confirmation, deletes items from `sync_queue`, and updates IndexedDB status to `synced`.
2. Client displays a toast: "Data synchronized with Panchayat server".
