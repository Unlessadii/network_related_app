# Net Bypass — REST API Reference

This document outlines the complete REST API interface for **Net Bypass — India's Truly Offline Rural Services Super-App**.

Base URL: `http://localhost:5000/api`

---

## 1. System Health & Diagnostics

### `GET /health`
Returns the status of the server runtime, SQLite database connection, and platform metrics.

**Response (200 OK):**
```json
{
  "status": "online",
  "platform": "Net Bypass - India's Truly Offline Rural Services Super-App",
  "version": "1.0.0",
  "database": "healthy",
  "users_registered": 4,
  "uptime_seconds": 128,
  "timestamp": "2026-09-13T17:35:00.000Z"
}
```

---

## 2. Authentication & Authorization

### `POST /api/auth/register`
Register a new rural user or service provider.

**Request Body:**
```json
{
  "name": "Kamal Kishore",
  "phone": "9876543213",
  "email": "kamal@netbypass.in",
  "password": "User@123",
  "role": "user",
  "village": "Sandiya",
  "district": "Narmadapuram",
  "state": "Madhya Pradesh"
}
```

### `POST /api/auth/login`
Authenticate with phone/email and password.

**Request Body:**
```json
{
  "phone": "9876543213",
  "password": "User@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr-farmer-001",
      "name": "Kamal Kishore Yadav",
      "phone": "9876543213",
      "role": "user",
      "village": "Sandiya",
      "district": "Narmadapuram"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### `GET /api/auth/me`
Requires `Authorization: Bearer <token>`. Returns authenticated user profile.

---

## 3. Services & Service Requests

### `GET /api/services`
List all active service categories (Electrician, Tractor Mechanic, Borewell, Veterinary, etc.) along with verified provider counts.

### `GET /api/providers`
Query parameters: `category`, `district`, `village`, `is_verified`.

### `POST /api/service-requests`
Create a service booking request. Supports online submission or client-side offline queueing.

**Request Body:**
```json
{
  "client_id": "c-550e8400-e29b-41d4-a716-446655440000",
  "service_id": "srv-001",
  "provider_id": "prv-001",
  "village": "Sandiya",
  "district": "Narmadapuram",
  "description": "Solar submersible pump starter box tripped with smoke.",
  "urgency": "urgent",
  "scheduled_date": "2026-09-14"
}
```

---

## 4. Mandi Commodity Rates (Agmarknet / e-NAM)

### `GET /api/mandi-prices`
Query parameters: `crop`, `mandi`, `district`, `state`, `search`.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "prices": [
      {
        "id": "mnd-001",
        "crop": "Wheat (Sharbati)",
        "crop_hi": "गेहूँ (शरबती)",
        "mandi": "Pipariya APMC",
        "district": "Narmadapuram",
        "state": "Madhya Pradesh",
        "min_price": 2450,
        "max_price": 3100,
        "modal_price": 2820,
        "arrival_date": "2026-09-13",
        "source": "e-NAM / MP Mandi Board",
        "last_updated": "2026-09-13T17:00:00.000Z"
      }
    ],
    "last_updated": "2026-09-13T17:00:00.000Z",
    "external_feed_connected": false
  }
}
```

---

## 5. Government Welfare Schemes

### `GET /api/schemes`
Retrieve 100% verified welfare schemes (PM-Kisan, PMAY-G, Ayushman Bharat PM-JAY, PMFBY, MGNREGA, KCC, etc.) with checklists for eligibility, documents, benefits, and direct `.gov.in` portal links.

---

## 6. Rural Jobs & Employment

### `GET /api/jobs`
Query parameters: `category`, `district`, `search`, `status`.

### `POST /api/jobs/:id/apply`
Submit employment application.

**Request Body:**
```json
{
  "client_id": "c-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "applicant_name": "Santosh Yadav",
  "phone": "9876543213",
  "village": "Sandiya",
  "experience": "2 years with solar pumps and starters."
}
```

---

## 7. Local Farmer Marketplace

### `GET /api/marketplace`
Query parameters: `category` (Seeds, Machinery, Livestock, Fertilizers), `district`, `search`.

### `POST /api/marketplace`
Create a new farmer-to-farmer listing.

---

## 8. Offline Bidirectional Synchronization

### `POST /api/sync/push`
Receives an array of offline mutations generated on the device while disconnected. Processes each item idempotently using deterministic UUIDs, updates the database, creates notifications, and logs audit events.

**Request Body:**
```json
{
  "items": [
    {
      "client_id": "c-4a37b561-8a9d-4351-93bf-ec02b7405101",
      "entity_type": "service_request",
      "action": "SERVICE_REQUEST_CREATE",
      "payload": {
        "service_id": "srv-001",
        "village": "Sandiya",
        "district": "Narmadapuram",
        "description": "Borewell line desiltation needed",
        "urgency": "urgent"
      }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 1,
    "processed": 1,
    "failed": 0,
    "synced_at": "2026-09-13T17:35:10.000Z",
    "items": [
      {
        "client_id": "c-4a37b561-8a9d-4351-93bf-ec02b7405101",
        "server_id": "req-8f92b1c4",
        "status": "synced"
      }
    ]
  }
}
```

### `GET /api/sync/pull`
Pulls full bundle of current schemes, mandi prices, jobs, active services, verified providers, and user requests to update client IndexedDB caches in a single network round-trip.

---

## 9. Protected Admin & Panchayat Endpoints

Requires `Authorization: Bearer <token>` with role `admin` or `panchayat`.

- `GET /api/admin/dashboard`: Metrics and overview statistics.
- `GET /api/admin/users`: User list and account statuses.
- `PUT /api/admin/users/:id/role`: Update user role (`admin` only).
- `GET /api/admin/requests`: Service booking dispatcher table.
- `PUT /api/admin/requests/:id`: Update booking status and assign provider.
- `GET /api/admin/providers`: Provider list with ratings and license status.
- `PUT /api/admin/providers/:id/verify`: Approve or revoke provider verification.
- `GET /api/admin/listings`: Marketplace listings for moderation.
- `PUT /api/admin/listings/:id/moderate`: Mark listing as `active`, `flagged` (fraud), or `sold`.
- `POST /api/admin/schemes`: Add new verified welfare scheme.
- `POST /api/admin/jobs`: Post new rural job opening.
- `POST /api/admin/mandi-prices`: Update APMC commodity rates.
- `GET /api/admin/sync-logs`: Inspect offline sync audit trail.
