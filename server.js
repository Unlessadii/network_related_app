const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const config = require('./backend/config/env');
const { initSchema } = require('./backend/database/schema');
const { seedDatabase } = require('./backend/database/seed');
const db = require('./backend/database/db');
const errorHandler = require('./backend/middleware/errorHandler');
const { apiLimiter } = require('./backend/middleware/rateLimiter');

// Ensure database schema and seed exist
try {
  initSchema();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedDatabase();
  }
} catch (err) {
  console.error('[Server] Database initialization warning:', err.message);
}

const app = express();

// Security Headers (Configured for PWA, Fonts, Icons)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors());
app.use(compression()); // Optimize bandwidth for rural 2G/3G connections
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// API Health Check
app.get('/health', (req, res) => {
  let dbStatus = 'healthy';
  let totalUsers = 0;
  try {
    totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  } catch {
    dbStatus = 'degraded';
  }

  res.status(200).json({
    status: 'online',
    platform: "Net Bypass - India's Truly Offline Rural Services Super-App",
    version: '1.0.0',
    database: dbStatus,
    users_registered: totalUsers,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Mount Backend API Routes
app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/users', require('./backend/routes/userRoutes'));
app.use('/api', require('./backend/routes/serviceRoutes'));
app.use('/api', require('./backend/routes/jobRoutes'));
app.use('/api', require('./backend/routes/schemeRoutes'));
app.use('/api', require('./backend/routes/mandiRoutes'));
app.use('/api', require('./backend/routes/marketplaceRoutes'));
app.use('/api', require('./backend/routes/syncRoutes'));
app.use('/api/admin', require('./backend/routes/adminRoutes'));

// Static Routing for PWA assets & Service Worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// Serve frontend modules
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Specific Application Routes
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'app', 'index.html'));
});

app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'app', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'admin', 'index.html'));
});

// Serve Root Landing Page (Preserved index.html & styles.css)
app.use(express.static(__dirname));

// Central Error Handler
app.use(errorHandler);

// Start Server
if (require.main === module) {
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🌾 NET BYPASS — INDIA'S TRULY OFFLINE RURAL SERVICES SUPER-APP`);
    console.log(`⚡ Server running on: http://localhost:${PORT}`);
    console.log(`📱 User Mobile App:   http://localhost:${PORT}/app`);
    console.log(`🛡️ Admin Portal:      http://localhost:${PORT}/admin`);
    console.log(`🩺 Health Check:      http://localhost:${PORT}/health`);
    console.log(`================================================================`);
  });
}

module.exports = app;
