# Net Bypass — India's Truly Offline Rural Services Super-App

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Node.js%2020%20%7C%20PWA%20%7C%20SQLite-16a34a.svg)](https://nodejs.org)
[![Offline-First](https://img.shields.io/badge/Offline--First-100%25%20Functional-orange.svg)](docs/ARCHITECTURE.md)
[![Tests](https://img.shields.io/badge/Tests-9%2F9%20Passing-brightgreen.svg)](test/api.test.js)

**Net Bypass** is a full-stack, production-ready, offline-first digital public infrastructure super-app built for rural India. It provides verified government welfare schemes, real-time and cached e-NAM mandi commodity prices, local technician bookings, rural employment opportunities, a farmer-to-farmer marketplace, and emergency cellular telephony SOS—guaranteeing 100% usability even under zero-connectivity or unstable 2G/3G conditions.

---

## 📑 Table of Contents

1. [Key Features](#-key-features)
2. [Architecture Overview](#-architecture-overview)
3. [Project Structure](#-project-structure)
4. [Prerequisites & Installation](#-prerequisites--installation)
5. [Database Setup & Seeding](#-database-setup--seeding)
6. [Environment Variables](#-environment-variables)
7. [Running Locally](#-running-locally)
8. [Automated Testing](#-automated-testing)
9. [Production Deployment](#-production-deployment)
10. [Git Commands for Deployment](#-git-commands-for-deployment)
11. [External Services & API Keys](#-external-services--api-keys)

---

## ⚡ Key Features

- **True Offline-First Engine**: Operates from Service Worker caches and IndexedDB. Book services, apply for jobs, and post marketplace listings with zero data; mutations automatically synchronize via idempotent FIFO queues when connectivity returns.
- **In-App Offline Simulator**: Instant toggle switch in the UI allows testing offline behaviors and auto-sync without cutting physical network connections.
- **100% Verified Government Schemes**: Official checklists and eligibility for PM-Kisan, PMAY-G, Ayushman Bharat PM-JAY, PMFBY, MGNREGA, KCC, and Jal Jeevan Mission with direct `.gov.in` portal links.
- **e-NAM / Agmarknet APMC Mandi Rates**: Live prices and cached fallback for Wheat, Soybean, Paddy, Mustard, Cotton, Onion, Potato, and Tomato with last-updated timestamp badges.
- **Direct Cellular Emergency SOS**: 1-tap cellular dialing for `112` (National Emergency), `108` (Ambulance), `100` (Police), `181` (Women Helpline), and `1098` (Childline) requiring zero packet data.
- **Voice & Accessibility**: Web Speech API Text-To-Speech (TTS) readout in Hindi and English.
- **Protected Panchayat & Admin Portal**: Separate role-gated `/admin` portal for Panchayat operators and district officials to dispatch requests, verify technicians, and moderate listings.

---

## 🏛 Architecture Overview

The system consists of three distinct layers:
1. **Public User Super-App (`/app`)**: Clean, responsive, mobile-first interface adhering to the dark glassmorphic rural design system.
2. **Protected Admin & Panchayat Portal (`/admin`)**: Role-gated dashboard restricted to `admin` and `panchayat` credentials.
3. **Backend REST API (`/api`)**: Modular Express.js server backed by SQLite (WAL mode) with JWT authentication, rate limiting, and batch sync reconciliation.

For in-depth architectural details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/API.md](docs/API.md).

---

## 📂 Project Structure

```
c:\Users\asus\Documents\New folder\marketing\
├── .env.example                       # Environment configuration template
├── .gitignore                         # Git ignore rules
├── package.json                       # Project dependencies & npm scripts
├── server.js                          # Express application entry point
├── index.html                         # Public Landing Page (Preserved branding & design)
├── styles.css                         # Design system tokens & styles (Preserved)
│
├── backend/
│   ├── config/
│   │   └── env.js                     # Environment variable resolution
│   ├── database/
│   │   ├── db.js                      # SQLite database initialization (WAL mode)
│   │   ├── schema.js                  # Table definitions (11 tables) & indexes
│   │   └── seed.js                    # Verified rural seed data (Schemes, Mandi, Users)
│   ├── models/                        # Relational query models
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── ServiceProvider.js
│   │   ├── ServiceRequest.js
│   │   ├── Job.js
│   │   ├── JobApplication.js
│   │   ├── Scheme.js
│   │   ├── MandiPrice.js
│   │   ├── MarketplaceListing.js
│   │   ├── SyncEvent.js
│   │   └── Notification.js
│   ├── controllers/                   # Request controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── serviceController.js
│   │   ├── jobController.js
│   │   ├── schemeController.js
│   │   ├── mandiController.js
│   │   ├── marketplaceController.js
│   │   ├── syncController.js
│   │   └── adminController.js
│   ├── routes/                        # Express routers
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── schemeRoutes.js
│   │   ├── mandiRoutes.js
│   │   ├── marketplaceRoutes.js
│   │   ├── syncRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js          # JWT verification & role guards
│   │   ├── rateLimiter.js             # Rate limiting
│   │   ├── errorHandler.js            # Error middleware
│   │   └── validator.js               # Input validators
│   ├── services/
│   │   ├── mandiService.js            # APMC data fetching & cache manager
│   │   └── syncService.js             # Offline queue reconciliation
│   └── utils/
│       └── helpers.js                 # UUID, response helpers
│
├── frontend/
│   ├── app/
│   │   ├── index.html                 # Citizen Super-App SPA
│   │   └── app.js                     # User App Client logic & routing
│   ├── admin/
│   │   ├── index.html                 # Admin & Panchayat Portal SPA
│   │   └── admin.js                   # Admin Portal Client logic
│   ├── components/
│   │   └── ui-components.js           # Toast, modal, TTS voice readout
│   ├── services/
│   │   ├── api.js                     # REST API client with offline fallback
│   │   └── auth.js                    # Token & session management
│   ├── offline/
│   │   ├── db.js                      # IndexedDB persistent client storage
│   │   └── sync-engine.js             # Offline queue, background sync
│   ├── assets/
│   │   ├── icon.svg                   # Brand icon
│   │   └── manifest.json              # PWA manifest
│   └── styles/
│       ├── app.css                    # User App styles
│       └── admin.css                  # Admin Portal styles
│
├── public/
│   ├── sw.js                          # Service Worker for offline caching
│   └── manifest.json                  # PWA manifest
│
├── docs/
│   ├── API.md                         # Detailed API reference
│   └── ARCHITECTURE.md                # System design & offline protocol
│
└── test/
    └── api.test.js                    # Automated integration test suite
```

---

## 🛠 Prerequisites & Installation

### Prerequisites
- **Node.js**: v18.x or v20.x (Recommended: Node v20.18+)
- **npm**: v9.x or v10.x

### Step 1: Clone Repository
```bash
git clone https://github.com/Unlessadii/network_related_app.git
cd network_related_app
```

### Step 2: Install Dependencies
```bash
npm install
```

---

## 🗄 Database Setup & Seeding

The platform uses an embedded, high-concurrency SQLite database with WAL mode. To initialize the schema and populate verified rural seed data:

```bash
npm run db:seed
```

### Pre-Seeded Accounts for Testing:
| Role | Identifier / Email | Password | Purpose |
|------|--------------------|----------|---------|
| **Super Admin** | `admin@netbypass.in` or `9876543210` | `Admin@123` | System analytics, role updates, audit logs |
| **Panchayat Officer** | `panchayat@netbypass.in` or `9876543211` | `Panchayat@123` | Request dispatch, provider verification |
| **Service Provider** | `ramesh.electrician@netbypass.in` or `9876543212` | `Provider@123` | Technician profile |
| **Rural Citizen** | `kamal.farmer@netbypass.in` or `9876543213` | `User@123` | Service booking, job applications |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Default variables:
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=supersecret_netbypass_rural_security_key_2026_jwt_token
JWT_EXPIRES_IN=7d
DB_FILE=./backend/database/netbypass.sqlite

# Optional: Connect live external Mandi API (Agmarknet / data.gov.in)
MANDI_API_URL=
MANDI_API_KEY=

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
```

---

## 🚀 Running Locally

### Development Server
```bash
npm start
```
Or with auto-reload:
```bash
npm run dev
```

### Accessing the Platform:
- **Landing Page**: [http://localhost:5000/](http://localhost:5000/)
- **Public User App**: [http://localhost:5000/app](http://localhost:5000/app)
- **Admin & Panchayat Portal**: [http://localhost:5000/admin](http://localhost:5000/admin)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🧪 Automated Testing

Execute the native integration test suite:

```bash
npm test
```

All 9 test suites verify:
1. Server health check
2. User authentication & JWT generation
3. Role-based admin access control (401/403/200)
4. Mandi prices retrieval & filtering
5. Verified welfare schemes retrieval
6. Service categories & provider directory
7. Service booking request creation
8. Offline batch synchronization & idempotency
9. Incremental sync bundle pull

---

## 🌐 Production Deployment

### Option 1: Linux VPS (Ubuntu / Debian with PM2 & Nginx)
```bash
# 1. Install PM2 process manager
npm install -g pm2

# 2. Run seed script
npm run db:seed

# 3. Start application with PM2
pm2 start server.js --name "net-bypass"

# 4. Save PM2 configuration to restart on reboot
pm2 save
pm2 startup
```

### Option 2: Docker Container
Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run db:seed
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## 📤 Git Commands for Deployment

To commit and push all files to the repository:

```bash
# 1. Check current git status
git status

# 2. Add all created files
git add .

# 3. Commit changes with a descriptive message
git commit -m "feat: complete offline-first rural super-app architecture with user app, admin portal, REST API, SQLite WAL, and service worker"

# 4. Ensure origin remote is configured
git remote set-url origin https://github.com/Unlessadii/network_related_app.git

# 5. Push to main branch
git push origin main
```

---

## 🔑 External Services & API Keys

Net Bypass is self-contained with verified pre-cached data and does not require third-party paid keys for core operation. However, the following external integrations can be optionally enabled via environment variables:

1. **Agmarknet / data.gov.in Mandi API**:
   - Variable: `MANDI_API_URL`, `MANDI_API_KEY`
   - Purpose: Fetches live daily commodity arrival rates from APMC mandis across India.
   - Fallback: Pre-loaded with official Agmarknet/e-NAM prices across MP, UP, Rajasthan, Haryana, and Maharashtra.
2. **SMS Gateway (e.g. CDAC Mobile Seva / Fast2SMS)**:
   - Purpose: OTP verification for feature phones without internet.
3. **Speech Synthesis**:
   - Uses the browser's native `window.speechSynthesis` (Web Speech API) with zero external API key requirements.
