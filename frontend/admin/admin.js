/**
 * Net Bypass Protected Admin & Panchayat Portal Controller
 */
class AdminPortal {
  constructor() {
    this.currentTab = 'overview';
    this.dashboardData = null;
    this.init();
  }

  async init() {
    window.authService.onChange(() => this.render());
    this.render();
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${window.authService.getToken()}`
    };
  }

  async render() {
    const root = document.getElementById('admin-root');
    if (!root) return;

    const user = window.authService.getUser();

    // 1. Not Authenticated -> Show Admin Login
    if (!user) {
      root.innerHTML = this.renderLoginScreen();
      return;
    }

    // 2. Authenticated but unauthorized role -> Show Access Denied
    if (!['admin', 'panchayat'].includes(user.role)) {
      root.innerHTML = this.renderAccessDeniedScreen(user);
      return;
    }

    // 3. Authorized -> Fetch dashboard data and render admin layout
    root.innerHTML = this.renderAdminLayout(user);
    this.loadTabContent(this.currentTab);
  }

  renderLoginScreen() {
    return `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-dark); padding: 20px;">
        <div style="background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: var(--radius); padding: 36px; max-width: 440px; width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div class="logo-box" style="margin: 0 auto 12px; width: 50px; height: 50px; font-size: 24px;">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h2 style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Panchayat & Admin Portal</h2>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Role-Gated Access for Verified Officials</p>
          </div>

          <form onsubmit="window.admin.handleLogin(event)">
            <div class="form-group">
              <label class="form-label">Official Email or Phone</label>
              <input type="text" id="admin-login-id" class="form-input" value="admin@netbypass.in" required>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="admin-login-pass" class="form-input" value="Admin@123" required>
            </div>

            <button type="submit" class="btn btn-primary full-width" style="margin-top: 10px;">
              <i class="fa-solid fa-lock"></i> Secure Login
            </button>
          </form>

          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-glass); font-size: 12px; color: var(--text-dim);">
            <div style="font-weight: 700; margin-bottom: 6px;">Sample Official Credentials:</div>
            <div>• Super Admin: <code>admin@netbypass.in</code> / <code>Admin@123</code></div>
            <div>• Panchayat Officer: <code>panchayat@netbypass.in</code> / <code>Panchayat@123</code></div>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="/app" style="color: var(--green-glow); font-size: 13px; text-decoration: none;">&larr; Return to Public App</a>
          </div>
        </div>
      </div>
    `;
  }

  renderAccessDeniedScreen(user) {
    return `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-dark); padding: 20px;">
        <div style="background: var(--bg-card); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius); padding: 36px; max-width: 480px; width: 100%; text-align: center;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: #f87171; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px;">
            <i class="fa-solid fa-ban"></i>
          </div>
          <h2 style="font-size: 22px; font-weight: 800;">403 — Unauthorized Access</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin: 10px 0 20px;">
            Logged in as <strong>${user.name}</strong> with role <code>${user.role}</code>. 
            Normal citizen or provider accounts cannot view Panchayat administration or database controls.
          </p>

          <div style="display: flex; gap: 10px; justify-content: center;">
            <a href="/app" class="btn btn-secondary"><i class="fa-solid fa-mobile-screen"></i> Go to Citizen App</a>
            <button class="btn btn-primary" onclick="window.authService.quickSwitchRole('admin')"><i class="fa-solid fa-user-shield"></i> Switch to Admin</button>
          </div>
        </div>
      </div>
    `;
  }

  renderAdminLayout(user) {
    return `
      <div class="admin-layout">
        <!-- Sidebar Navigation -->
        <aside class="admin-sidebar">
          <div class="admin-sidebar-header">
            <div class="logo-box">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div class="brand-info">
              <span class="brand-title">Net Bypass Admin</span>
              <span class="role-badge role-${user.role}">${user.role} Portal</span>
            </div>
          </div>

          <nav class="admin-nav">
            <a class="admin-nav-item ${this.currentTab === 'overview' ? 'active' : ''}" onclick="window.admin.switchTab('overview')">
              <i class="fa-solid fa-gauge-high"></i> <span>Dashboard</span>
            </a>
            <a class="admin-nav-item ${this.currentTab === 'requests' ? 'active' : ''}" onclick="window.admin.switchTab('requests')">
              <i class="fa-solid fa-calendar-check"></i> <span>Service Requests</span>
            </a>
            <a class="admin-nav-item ${this.currentTab === 'providers' ? 'active' : ''}" onclick="window.admin.switchTab('providers')">
              <i class="fa-solid fa-user-check"></i> <span>Verify Providers</span>
            </a>
            <a class="admin-nav-item ${this.currentTab === 'users' ? 'active' : ''}" onclick="window.admin.switchTab('users')">
              <i class="fa-solid fa-users"></i> <span>User Management</span>
            </a>
            <a class="admin-nav-item ${this.currentTab === 'marketplace' ? 'active' : ''}" onclick="window.admin.switchTab('marketplace')">
              <i class="fa-solid fa-store"></i> <span>Marketplace Moderation</span>
            </a>
            <a class="admin-nav-item ${this.currentTab === 'schemes' ? 'active' : ''}" onclick="window.admin.switchTab('schemes')">
              <i class="fa-solid fa-landmark"></i> <span>Welfare Schemes</span>
            </a>
            <a class="admin-nav-item ${this.currentTab === 'jobs' ? 'active' : ''}" onclick="window.admin.switchTab('jobs')">
              <i class="fa-solid fa-briefcase"></i> <span>Rural Jobs</span>
            </a>
            <a class="admin-nav-item ${this.currentTab === 'mandi' ? 'active' : ''}" onclick="window.admin.switchTab('mandi')">
              <i class="fa-solid fa-chart-line"></i> <span>Mandi Rates</span>
            </a>
            <a class="admin-nav-item ${this.currentTab === 'sync-logs' ? 'active' : ''}" onclick="window.admin.switchTab('sync-logs')">
              <i class="fa-solid fa-arrows-rotate"></i> <span>Offline Sync Monitor</span>
            </a>
          </nav>

          <div class="admin-sidebar-footer">
            <div style="font-size: 12px; margin-bottom: 8px;">
              <div style="font-weight: 700;">${user.name}</div>
              <div style="color: var(--text-muted); font-size: 11px;">${user.village}</div>
            </div>
            <button class="btn btn-secondary btn-sm full-width" onclick="window.authService.logout()">
              <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="admin-main">
          <header class="admin-topbar">
            <div class="admin-topbar-left">
              <h2 id="admin-page-title">Panchayat Administration Dashboard</h2>
            </div>
            <div class="admin-topbar-right">
              <a href="/app" target="_blank" class="btn btn-secondary btn-sm">
                <i class="fa-solid fa-mobile-screen"></i> Open App View
              </a>
              <span class="badge-tag badge-green"><i class="fa-solid fa-circle"></i> Node API Online</span>
            </div>
          </header>

          <div class="admin-content" id="admin-tab-viewport">
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
              <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px;"></i> Loading administrative data...
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async handleLogin(event) {
    event.preventDefault();
    const id = document.getElementById('admin-login-id').value;
    const pass = document.getElementById('admin-login-pass').value;

    try {
      await window.authService.login(id, pass);
      window.ui.showToast('Official Login Successful', 'success');
    } catch (err) {
      window.ui.showToast(err.message, 'error');
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.admin-nav-item').forEach((el) => {
      el.classList.remove('active');
    });
    this.render();
  }

  async loadTabContent(tab) {
    const viewport = document.getElementById('admin-tab-viewport');
    const titleEl = document.getElementById('admin-page-title');
    if (!viewport) return;

    try {
      if (tab === 'overview') {
        if (titleEl) titleEl.textContent = 'Panchayat & District Overview';
        const res = await fetch('/api/admin/dashboard', { headers: this.getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          this.dashboardData = json.data;
          viewport.innerHTML = this.renderOverviewTab(json.data);
        }
      } 
      else if (tab === 'requests') {
        if (titleEl) titleEl.textContent = 'Service Requests Dispatcher';
        const res = await fetch('/api/admin/requests', { headers: this.getAuthHeaders() });
        const json = await res.json();
        viewport.innerHTML = this.renderRequestsTab(json.data ? json.data.requests : []);
      }
      else if (tab === 'providers') {
        if (titleEl) titleEl.textContent = 'Technician & Provider Verification';
        const res = await fetch('/api/admin/providers', { headers: this.getAuthHeaders() });
        const json = await res.json();
        viewport.innerHTML = this.renderProvidersTab(json.data ? json.data.providers : []);
      }
      else if (tab === 'users') {
        if (titleEl) titleEl.textContent = 'Registered User Management';
        const res = await fetch('/api/admin/users', { headers: this.getAuthHeaders() });
        const json = await res.json();
        viewport.innerHTML = this.renderUsersTab(json.data ? json.data.users : []);
      }
      else if (tab === 'marketplace') {
        if (titleEl) titleEl.textContent = 'Marketplace Moderation & Anti-Fraud';
        const res = await fetch('/api/admin/listings', { headers: this.getAuthHeaders() });
        const json = await res.json();
        viewport.innerHTML = this.renderMarketplaceTab(json.data ? json.data.listings : []);
      }
      else if (tab === 'schemes') {
        if (titleEl) titleEl.textContent = 'Government Schemes Content Manager';
        const res = await fetch('/api/schemes', { headers: this.getAuthHeaders() });
        const json = await res.json();
        viewport.innerHTML = this.renderSchemesTab(json.data ? json.data.schemes : []);
      }
      else if (tab === 'jobs') {
        if (titleEl) titleEl.textContent = 'Rural Employment Postings';
        const res = await fetch('/api/jobs', { headers: this.getAuthHeaders() });
        const json = await res.json();
        viewport.innerHTML = this.renderJobsTab(json.data ? json.data.jobs : []);
      }
      else if (tab === 'mandi') {
        if (titleEl) titleEl.textContent = 'APMC Mandi Commodity Manager';
        const res = await fetch('/api/mandi-prices', { headers: this.getAuthHeaders() });
        const json = await res.json();
        viewport.innerHTML = this.renderMandiTab(json.data ? json.data.prices : []);
      }
      else if (tab === 'sync-logs') {
        if (titleEl) titleEl.textContent = 'Offline Sync Queue & Replay Monitor';
        const res = await fetch('/api/admin/sync-logs', { headers: this.getAuthHeaders() });
        const json = await res.json();
        viewport.innerHTML = this.renderSyncLogsTab(json.data ? json.data.logs : []);
      }
    } catch (err) {
      viewport.innerHTML = `<div class="card-item" style="color: #f87171;">Failed to load data: ${err.message}</div>`;
    }
  }

  // --- Overview Tab ---
  renderOverviewTab(data) {
    const s = data.stats;
    return `
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Total Citizens</span>
            <div class="stat-card-icon icon-blue"><i class="fa-solid fa-users"></i></div>
          </div>
          <div class="stat-card-num">${s.total_users}</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Active Requests</span>
            <div class="stat-card-icon icon-orange"><i class="fa-solid fa-clock-rotate-left"></i></div>
          </div>
          <div class="stat-card-num">${s.total_requests}</div>
          <small style="color: var(--text-dim);">${s.pending_requests} Pending Dispatch</small>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Verified Providers</span>
            <div class="stat-card-icon icon-green"><i class="fa-solid fa-user-check"></i></div>
          </div>
          <div class="stat-card-num">${s.verified_providers} <small style="font-size: 14px; font-weight: normal; color: var(--text-dim);">/ ${s.total_providers}</small></div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Offline Sync Events</span>
            <div class="stat-card-icon icon-purple"><i class="fa-solid fa-arrows-rotate"></i></div>
          </div>
          <div class="stat-card-num">${s.offline_sync_events}</div>
        </div>
      </div>

      <!-- Recent Service Requests Table -->
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">Recent Citizen Service Requests</h3>
          <button class="btn btn-secondary btn-sm" onclick="window.admin.switchTab('requests')">View All</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Citizen</th>
                <th>Service</th>
                <th>Village</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${(data.recent_requests || []).map((r) => `
                <tr>
                  <td><code>${r.id}</code></td>
                  <td><strong>${r.user_name || 'Citizen'}</strong><br><small style="color: var(--text-dim);">${r.user_phone || ''}</small></td>
                  <td>${r.service_name || 'General Service'}</td>
                  <td>${r.village}</td>
                  <td><span class="chip ${r.urgency === 'urgent' ? 'chip-pending' : ''}">${r.urgency}</span></td>
                  <td><span class="chip chip-${r.status}">${r.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.admin.openUpdateRequestModal('${r.id}', '${r.status}')">
                      Update
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Requests Tab ---
  renderRequestsTab(requests) {
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">All Village Service Bookings (${requests.length})</h3>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Citizen</th>
                <th>Service & Description</th>
                <th>Assigned Provider</th>
                <th>Village</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${requests.map((r) => `
                <tr>
                  <td><code>${r.id}</code></td>
                  <td><strong>${r.user_name || 'Citizen'}</strong></td>
                  <td>
                    <strong>${r.service_name || 'Service'}</strong>
                    <div style="font-size: 12px; color: var(--text-muted);">${r.description}</div>
                  </td>
                  <td>${r.provider_name || '<em style="color: #fb923c;">Unassigned</em>'}</td>
                  <td>${r.village}</td>
                  <td><span class="chip chip-${r.status}">${r.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.admin.openUpdateRequestModal('${r.id}', '${r.status}')">
                      Dispatch / Status
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Providers Tab ---
  renderProvidersTab(providers) {
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">Technicians & Service Providers (${providers.length})</h3>
          <button class="btn btn-primary btn-sm" onclick="window.admin.openAddProviderModal()">+ Register Provider</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Phone</th>
                <th>Rating</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${providers.map((p) => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td>${p.category}</td>
                  <td>${p.village}, ${p.district}</td>
                  <td>${p.phone}</td>
                  <td>★ ${p.rating} (${p.reviews_count})</td>
                  <td>
                    ${p.is_verified 
                      ? '<span class="chip chip-completed"><i class="fa-solid fa-check"></i> Verified</span>' 
                      : '<span class="chip chip-pending">Pending Verification</span>'
                    }
                  </td>
                  <td>
                    <button class="btn ${p.is_verified ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="window.admin.toggleProviderVerification('${p.id}', ${!p.is_verified})">
                      ${p.is_verified ? 'Revoke' : 'Approve & Verify'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Users Tab ---
  renderUsersTab(users) {
    const isSuperAdmin = window.authService.getUser().role === 'admin';
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">Registered Citizens & Officials (${users.length})</h3>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Village</th>
                <th>District</th>
                <th>Status</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              ${users.map((u) => `
                <tr>
                  <td><strong>${u.name}</strong></td>
                  <td>${u.phone}</td>
                  <td><span class="role-badge role-${u.role}">${u.role}</span></td>
                  <td>${u.village}</td>
                  <td>${u.district}</td>
                  <td><span class="chip chip-active">Active</span></td>
                  <td>
                    ${isSuperAdmin ? `
                      <select class="form-select" style="padding: 4px 8px; font-size: 12px; width: auto;" onchange="window.admin.updateUserRole('${u.id}', this.value)">
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="provider" ${u.role === 'provider' ? 'selected' : ''}>Provider</option>
                        <option value="panchayat" ${u.role === 'panchayat' ? 'selected' : ''}>Panchayat</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                      </select>
                    ` : '<span style="color: var(--text-dim); font-size: 11px;">Admin Only</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Marketplace Tab ---
  renderMarketplaceTab(listings) {
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">Marketplace Listings Moderation (${listings.length})</h3>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Item Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Seller</th>
                <th>Village</th>
                <th>Status</th>
                <th>Moderation</th>
              </tr>
            </thead>
            <tbody>
              ${listings.map((l) => `
                <tr>
                  <td><strong>${l.title}</strong></td>
                  <td>${l.category}</td>
                  <td style="color: #4ade80; font-weight: 700;">₹${l.price}</td>
                  <td>${l.seller_name} (${l.seller_phone})</td>
                  <td>${l.village}</td>
                  <td><span class="chip chip-${l.status}">${l.status}</span></td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" onclick="window.admin.moderateListing('${l.id}', 'active')">Approve</button>
                      <button class="btn btn-outline btn-sm" style="color: #f87171;" onclick="window.admin.moderateListing('${l.id}', 'flagged')">Flag Fraud</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Schemes Tab ---
  renderSchemesTab(schemes) {
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">Verified Government Welfare Schemes (${schemes.length})</h3>
          <button class="btn btn-primary btn-sm" onclick="window.admin.openAddSchemeModal()">+ Add Verified Scheme</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Ministry</th>
                <th>Category</th>
                <th>Benefits</th>
                <th>Official URL</th>
              </tr>
            </thead>
            <tbody>
              ${schemes.map((s) => `
                <tr>
                  <td><strong>${s.name}</strong><br><small style="color: var(--text-dim);">${s.name_hi}</small></td>
                  <td>${s.ministry}</td>
                  <td><span class="badge-tag badge-blue">${s.category}</span></td>
                  <td><small>${s.benefits}</small></td>
                  <td><a href="${s.official_url}" target="_blank" style="color: var(--green-glow);">Link</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Jobs Tab ---
  renderJobsTab(jobs) {
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">Rural Job Postings (${jobs.length})</h3>
          <button class="btn btn-primary btn-sm" onclick="window.admin.openAddJobModal()">+ Post New Job</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Employer / Dept</th>
                <th>Location</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${jobs.map((j) => `
                <tr>
                  <td><strong>${j.title}</strong></td>
                  <td>${j.company_or_employer}</td>
                  <td>${j.location}</td>
                  <td style="color: #4ade80; font-weight: 700;">${j.salary}</td>
                  <td><span class="chip chip-active">${j.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.admin.toggleJobStatus('${j.id}', '${j.status === 'active' ? 'closed' : 'active'}')">
                      ${j.status === 'active' ? 'Close' : 'Activate'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Mandi Tab ---
  renderMandiTab(prices) {
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">Agricultural Commodity Rates (${prices.length})</h3>
          <button class="btn btn-primary btn-sm" onclick="window.admin.openAddMandiModal()">+ Update Mandi Rate</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Crop / Commodity</th>
                <th>Mandi Yard</th>
                <th>District</th>
                <th>Modal Price</th>
                <th>Min / Max</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              ${prices.map((m) => `
                <tr>
                  <td><strong>${m.crop}</strong></td>
                  <td>${m.mandi}</td>
                  <td>${m.district} (${m.state})</td>
                  <td style="color: #4ade80; font-weight: 800; font-size: 15px;">₹${m.modal_price} /Qtl</td>
                  <td>₹${m.min_price} - ₹${m.max_price}</td>
                  <td><small>${new Date(m.last_updated).toLocaleDateString()}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Sync Logs Tab ---
  renderSyncLogsTab(logs) {
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size: 16px; font-weight: 800;">Offline Sync Audit Stream (${logs.length})</h3>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Client UUID</th>
                <th>Entity Action</th>
                <th>Status</th>
                <th>Processed At</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map((l) => `
                <tr>
                  <td><code>${l.id}</code></td>
                  <td><code>${l.client_id}</code></td>
                  <td><strong>${l.action}</strong> (${l.entity_type})</td>
                  <td><span class="chip chip-${l.status === 'processed' ? 'completed' : 'pending'}">${l.status}</span></td>
                  <td><small>${new Date(l.processed_at).toLocaleString()}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Modals & Handlers ---
  openUpdateRequestModal(requestId, currentStatus) {
    const html = `
      <form onsubmit="window.admin.submitUpdateRequest(event, '${requestId}')">
        <div class="form-group">
          <label class="form-label">Update Request Status</label>
          <select id="req-status-select" class="form-select">
            <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="assigned" ${currentStatus === 'assigned' ? 'selected' : ''}>Assigned to Provider</option>
            <option value="in_progress" ${currentStatus === 'in_progress' ? 'selected' : ''}>In Progress (On-Site)</option>
            <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary full-width" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary full-width">Save Status</button>
        </div>
      </form>
    `;
    window.ui.openModal(`Update Request #${requestId}`, html);
  }

  async submitUpdateRequest(event, requestId) {
    event.preventDefault();
    const status = document.getElementById('req-status-select').value;
    const res = await fetch(`/api/admin/requests/${requestId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      window.ui.closeModal();
      window.ui.showToast('Request status updated', 'success');
      this.loadTabContent('requests');
    }
  }

  async toggleProviderVerification(providerId, isVerified) {
    const res = await fetch(`/api/admin/providers/${providerId}/verify`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ is_verified: isVerified })
    });
    if (res.ok) {
      window.ui.showToast(`Provider verification ${isVerified ? 'approved' : 'revoked'}`, 'success');
      this.loadTabContent('providers');
    }
  }

  async updateUserRole(userId, role) {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      window.ui.showToast('User role updated', 'success');
      this.loadTabContent('users');
    }
  }

  async moderateListing(listingId, status) {
    const res = await fetch(`/api/admin/listings/${listingId}/moderate`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      window.ui.showToast(`Listing marked as ${status}`, 'success');
      this.loadTabContent('marketplace');
    }
  }

  async toggleJobStatus(jobId, status) {
    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      window.ui.showToast(`Job status changed to ${status}`, 'success');
      this.loadTabContent('jobs');
    }
  }

  openAddSchemeModal() {
    const html = `
      <form onsubmit="window.admin.submitAddScheme(event)">
        <div class="form-group">
          <label class="form-label">Scheme Name (English)</label>
          <input type="text" id="sch-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Scheme Name (Hindi)</label>
          <input type="text" id="sch-name-hi" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">Ministry / Department</label>
          <input type="text" id="sch-ministry" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Eligibility</label>
          <textarea id="sch-eligibility" class="form-textarea" required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Direct Benefits</label>
          <input type="text" id="sch-benefits" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Official Portal URL (.gov.in)</label>
          <input type="url" id="sch-url" class="form-input" required>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary full-width" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary full-width">Add Verified Scheme</button>
        </div>
      </form>
    `;
    window.ui.openModal('Add Verified Welfare Scheme', html);
  }

  async submitAddScheme(event) {
    event.preventDefault();
    const payload = {
      name: document.getElementById('sch-name').value,
      name_hi: document.getElementById('sch-name-hi').value,
      ministry: document.getElementById('sch-ministry').value,
      category: 'Welfare',
      description: document.getElementById('sch-benefits').value,
      eligibility: document.getElementById('sch-eligibility').value,
      benefits: document.getElementById('sch-benefits').value,
      official_url: document.getElementById('sch-url').value
    };

    const res = await fetch('/api/admin/schemes', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      window.ui.closeModal();
      window.ui.showToast('Scheme added successfully', 'success');
      this.loadTabContent('schemes');
    }
  }

  openAddJobModal() {
    const html = `
      <form onsubmit="window.admin.submitAddJob(event)">
        <div class="form-group">
          <label class="form-label">Job Title</label>
          <input type="text" id="job-title" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Employer / Cooperative</label>
          <input type="text" id="job-emp" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <input type="text" id="job-cat" class="form-input" value="Agriculture" required>
        </div>
        <div class="form-group">
          <label class="form-label">Location (Block / District)</label>
          <input type="text" id="job-loc" class="form-input" value="Pipariya, Narmadapuram" required>
        </div>
        <div class="form-group">
          <label class="form-label">Salary</label>
          <input type="text" id="job-sal" class="form-input" value="₹15,000 / month" required>
        </div>
        <div class="form-group">
          <label class="form-label">Contact Phone</label>
          <input type="tel" id="job-phone" class="form-input" value="9876543210" required>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary full-width" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary full-width">Publish Job</button>
        </div>
      </form>
    `;
    window.ui.openModal('Post Rural Job Opportunity', html);
  }

  async submitAddJob(event) {
    event.preventDefault();
    const payload = {
      title: document.getElementById('job-title').value,
      company_or_employer: document.getElementById('job-emp').value,
      category: document.getElementById('job-cat').value,
      location: document.getElementById('job-loc').value,
      salary: document.getElementById('job-sal').value,
      contact_phone: document.getElementById('job-phone').value,
      district: 'Narmadapuram'
    };

    const res = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      window.ui.closeModal();
      window.ui.showToast('Job published successfully', 'success');
      this.loadTabContent('jobs');
    }
  }

  openAddMandiModal() {
    const html = `
      <form onsubmit="window.admin.submitAddMandi(event)">
        <div class="form-group">
          <label class="form-label">Crop Name (English)</label>
          <input type="text" id="mnd-crop" class="form-input" placeholder="e.g. Mustard (Sarson)" required>
        </div>
        <div class="form-group">
          <label class="form-label">Crop Name (Hindi)</label>
          <input type="text" id="mnd-crop-hi" class="form-input" placeholder="उदा. सरसों">
        </div>
        <div class="form-group">
          <label class="form-label">APMC Mandi</label>
          <input type="text" id="mnd-mandi" class="form-input" value="Pipariya APMC" required>
        </div>
        <div class="form-group">
          <label class="form-label">District</label>
          <input type="text" id="mnd-dist" class="form-input" value="Narmadapuram" required>
        </div>
        <div class="form-group">
          <label class="form-label">Modal Price (₹ per Quintal)</label>
          <input type="number" id="mnd-modal" class="form-input" placeholder="e.g. 5450" required>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary full-width" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary full-width">Update Mandi Rate</button>
        </div>
      </form>
    `;
    window.ui.openModal('Update Agricultural Mandi Price', html);
  }

  async submitAddMandi(event) {
    event.preventDefault();
    const payload = {
      crop: document.getElementById('mnd-crop').value,
      crop_hi: document.getElementById('mnd-crop-hi').value,
      mandi: document.getElementById('mnd-mandi').value,
      district: document.getElementById('mnd-dist').value,
      modal_price: document.getElementById('mnd-modal').value,
      min_price: Number(document.getElementById('mnd-modal').value) * 0.9,
      max_price: Number(document.getElementById('mnd-modal').value) * 1.1
    };

    const res = await fetch('/api/admin/mandi-prices', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      window.ui.closeModal();
      window.ui.showToast('Mandi price updated successfully', 'success');
      this.loadTabContent('mandi');
    }
  }
}

window.admin = new AdminPortal();
