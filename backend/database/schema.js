const db = require('./db');

function initSchema() {
  const ddl = `
    -- Users table with Role-Based Access Control
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'provider', 'panchayat', 'admin')),
      village TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Madhya Pradesh',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Service Categories
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Service Providers
    CREATE TABLE IF NOT EXISTS service_providers (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      village TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Madhya Pradesh',
      phone TEXT NOT NULL,
      availability TEXT NOT NULL DEFAULT 'Available Today',
      rating REAL NOT NULL DEFAULT 4.8,
      reviews_count INTEGER NOT NULL DEFAULT 12,
      is_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Service Requests / Bookings
    CREATE TABLE IF NOT EXISTS service_requests (
      id TEXT PRIMARY KEY,
      client_id TEXT UNIQUE,
      user_id TEXT NOT NULL,
      service_id TEXT,
      provider_id TEXT,
      village TEXT NOT NULL,
      district TEXT NOT NULL,
      description TEXT NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'normal' CHECK(urgency IN ('normal', 'urgent', 'emergency')),
      scheduled_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
      sync_status TEXT NOT NULL DEFAULT 'synced' CHECK(sync_status IN ('synced', 'pending_sync')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
      FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE SET NULL
    );

    -- Rural Employment / Jobs
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      company_or_employer TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      village TEXT,
      district TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Madhya Pradesh',
      salary TEXT NOT NULL,
      job_type TEXT NOT NULL DEFAULT 'Full-Time' CHECK(job_type IN ('Full-Time', 'Part-Time', 'Seasonal', 'Daily Wage')),
      description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed')),
      created_at TEXT NOT NULL
    );

    -- Job Applications
    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      client_id TEXT UNIQUE,
      job_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      village TEXT NOT NULL,
      experience TEXT,
      remarks TEXT,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'reviewed', 'shortlisted', 'rejected')),
      sync_status TEXT NOT NULL DEFAULT 'synced' CHECK(sync_status IN ('synced', 'pending_sync')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 100% Verified Government Welfare Schemes
    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      ministry TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      eligibility TEXT NOT NULL,
      documents TEXT NOT NULL,
      benefits TEXT NOT NULL,
      official_url TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Mandi Commodity Prices (Agmarknet / e-NAM APMC)
    CREATE TABLE IF NOT EXISTS mandi_prices (
      id TEXT PRIMARY KEY,
      crop TEXT NOT NULL,
      crop_hi TEXT NOT NULL,
      mandi TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      modal_price REAL NOT NULL,
      arrival_date TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'e-NAM / Agmarknet Portal',
      last_updated TEXT NOT NULL
    );

    -- Local Rural Marketplace Listings
    CREATE TABLE IF NOT EXISTS marketplace_listings (
      id TEXT PRIMARY KEY,
      client_id TEXT UNIQUE,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'per item',
      description TEXT NOT NULL,
      village TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Madhya Pradesh',
      seller_name TEXT NOT NULL,
      seller_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'flagged', 'sold')),
      sync_status TEXT NOT NULL DEFAULT 'synced' CHECK(sync_status IN ('synced', 'pending_sync')),
      image_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'emergency', 'sync')),
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Offline Sync Audit Log / Queue Replay
    CREATE TABLE IF NOT EXISTS sync_events (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      user_id TEXT,
      entity_type TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'processed' CHECK(status IN ('pending', 'processed', 'conflict', 'failed')),
      payload TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );

    -- Indexes for high-speed queries on mobile networks
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_requests_user ON service_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
    CREATE INDEX IF NOT EXISTS idx_jobs_district ON jobs(district);
    CREATE INDEX IF NOT EXISTS idx_mandi_crop ON mandi_prices(crop);
    CREATE INDEX IF NOT EXISTS idx_mandi_district ON mandi_prices(district);
    CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);
    CREATE INDEX IF NOT EXISTS idx_marketplace_cat ON marketplace_listings(category);
    CREATE INDEX IF NOT EXISTS idx_sync_client ON sync_events(client_id);
  `;

  db.exec(ddl);
  console.log('[Database] Schema initialized successfully.');
}

module.exports = { initSchema };
