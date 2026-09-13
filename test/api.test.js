const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');

let server;
let baseUrl;
let adminToken = '';
let userToken = '';

before(async () => {
  await new Promise((resolve) => {
    // Listen on dynamic port 0
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  if (server) server.close();
});

test('1. Health Check Endpoint GET /health', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'online');
  assert.equal(data.database, 'healthy');
  assert.ok(data.users_registered > 0);
});

test('2. User Login & Token Generation POST /api/auth/login', async () => {
  // Login as admin
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', password: 'Admin@123' })
  });
  assert.equal(adminRes.status, 200);
  const adminData = await adminRes.json();
  assert.ok(adminData.success);
  assert.equal(adminData.data.user.role, 'admin');
  adminToken = adminData.data.token;

  // Login as normal citizen user
  const userRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543213', password: 'User@123' })
  });
  assert.equal(userRes.status, 200);
  const userData = await userRes.json();
  assert.ok(userData.success);
  assert.equal(userData.data.user.role, 'user');
  userToken = userData.data.token;
});

test('3. Role-Based Admin Route Protection', async () => {
  // Unauthenticated request should be 401
  const unauthRes = await fetch(`${baseUrl}/api/admin/dashboard`);
  assert.equal(unauthRes.status, 401);

  // Normal citizen user should be 403 Forbidden
  const userForbiddenRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  assert.equal(userForbiddenRes.status, 403);

  // Admin user should be 200 OK
  const adminAllowedRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.equal(adminAllowedRes.status, 200);
  const adminData = await adminAllowedRes.json();
  assert.ok(adminData.data.stats.total_users >= 4);
});

test('4. Mandi Prices API GET /api/mandi-prices', async () => {
  const res = await fetch(`${baseUrl}/api/mandi-prices`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.success);
  assert.ok(data.data.prices.length >= 5);

  // Filter test
  const filterRes = await fetch(`${baseUrl}/api/mandi-prices?crop=Wheat`);
  const filterData = await filterRes.json();
  assert.ok(filterData.data.prices.some((p) => p.crop.includes('Wheat')));
});

test('5. Verified Government Schemes API GET /api/schemes', async () => {
  const res = await fetch(`${baseUrl}/api/schemes`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.success);
  assert.ok(data.data.schemes.length >= 6);

  // Check official URL structure
  const pmKisan = data.data.schemes.find((s) => s.name.includes('PM-Kisan'));
  assert.ok(pmKisan);
  assert.equal(pmKisan.official_url, 'https://pmkisan.gov.in');
});

test('6. Services & Providers API GET /api/services & /api/providers', async () => {
  const srvRes = await fetch(`${baseUrl}/api/services`);
  assert.equal(srvRes.status, 200);
  const srvData = await srvRes.json();
  assert.ok(srvData.data.services.length >= 6);

  const prvRes = await fetch(`${baseUrl}/api/providers`);
  assert.equal(prvRes.status, 200);
  const prvData = await prvRes.json();
  assert.ok(prvData.data.providers.length >= 3);
});

test('7. Service Request Creation POST /api/service-requests', async () => {
  const res = await fetch(`${baseUrl}/api/service-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      service_id: 'srv-001',
      village: 'Sandiya',
      district: 'Narmadapuram',
      description: 'Solar panel wire cut by wild boar; requires immediate reconnect',
      urgency: 'urgent'
    })
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.success);
  assert.equal(data.data.request.urgency, 'urgent');
});

test('8. Offline Batch Sync Reconciliation POST /api/sync/push', async () => {
  const batchUuid1 = 'test-client-req-' + Date.now();
  const batchUuid2 = 'test-client-job-' + Date.now();

  const syncPayload = {
    items: [
      {
        client_id: batchUuid1,
        entity_type: 'service_request',
        action: 'SERVICE_REQUEST_CREATE',
        payload: {
          service_id: 'srv-002',
          village: 'Bankhedi',
          district: 'Narmadapuram',
          description: 'Harvester clutch slipping during field cut',
          urgency: 'urgent'
        }
      },
      {
        client_id: batchUuid2,
        entity_type: 'job_application',
        action: 'JOB_APPLICATION_CREATE',
        payload: {
          job_id: 'job-001',
          applicant_name: 'Devendra Patel',
          phone: '9826001122',
          village: 'Bankhedi',
          experience: '3 years solar pump installation'
        }
      }
    ]
  };

  const res = await fetch(`${baseUrl}/api/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(syncPayload)
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.success);
  assert.equal(data.data.processed, 2);
  assert.equal(data.data.failed, 0);

  // Verify idempotency: re-sending the same batch must NOT duplicate
  const res2 = await fetch(`${baseUrl}/api/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(syncPayload)
  });
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.data.processed, 2);
});

test('9. Full Sync Pull Bundle GET /api/sync/pull', async () => {
  const res = await fetch(`${baseUrl}/api/sync/pull`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.success);
  assert.ok(data.data.schemes.length > 0);
  assert.ok(data.data.mandi_prices.length > 0);
  assert.ok(data.data.jobs.length > 0);
  assert.ok(data.data.user_data.requests.length > 0);
});
