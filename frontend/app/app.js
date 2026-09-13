/**
 * Net Bypass Public User App Controller
 */
class NetBypassApp {
  constructor() {
    this.currentTab = 'home';
    this.selectedServiceCategory = null;
    this.selectedSchemeCategory = null;
    this.selectedJobCategory = null;
    this.selectedMarketCategory = null;
    this.mandiFilter = '';
    this.init();
  }

  async init() {
    // Setup sync engine listener
    window.syncEngine.subscribe((status) => this.handleNetworkStatusChange(status));

    // Setup auth listener
    window.authService.onChange((user) => this.handleAuthChange(user));

    // Pull initial bundle if online
    if (window.syncEngine.isOnline()) {
      window.syncEngine.pullLatestBundle();
    }

    // Render initial view
    this.render();
  }

  handleNetworkStatusChange(status) {
    const pill = document.getElementById('network-status-pill');
    const text = document.getElementById('network-status-text');
    const offlineBar = document.getElementById('offline-bar');
    const pendingCounter = document.getElementById('pending-sync-counter');
    const navBadge = document.getElementById('nav-pending-badge');

    if (!pill || !text) return;

    if (status.isSyncing) {
      pill.className = 'status-pill status-syncing';
      text.textContent = 'Syncing...';
    } else if (status.online) {
      pill.className = 'status-pill status-online';
      text.textContent = 'Online';
      if (offlineBar) offlineBar.style.display = 'none';
    } else {
      pill.className = 'status-pill status-offline';
      text.textContent = status.simulated ? 'Simulated Offline' : 'Offline Mode';
      if (offlineBar) offlineBar.style.display = 'flex';
    }

    if (pendingCounter) {
      pendingCounter.textContent = `${status.pendingCount} Pending Sync`;
      pendingCounter.style.display = status.pendingCount > 0 ? 'inline-block' : 'none';
    }

    if (navBadge) {
      if (status.pendingCount > 0) {
        navBadge.style.display = 'block';
        navBadge.textContent = status.pendingCount;
      } else {
        navBadge.style.display = 'none';
      }
    }
  }

  handleAuthChange(user) {
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn && user) {
      profileBtn.innerHTML = `<i class="fa-solid fa-circle-user text-green"></i> <span style="font-size: 11px; margin-left: 4px;">${user.name.split(' ')[0]}</span>`;
    } else if (profileBtn) {
      profileBtn.innerHTML = `<i class="fa-solid fa-user"></i>`;
    }
  }

  toggleLanguage() {
    const current = window.ui.currentLanguage;
    const next = current === 'en' ? 'hi' : 'en';
    window.ui.setLanguage(next);
    document.getElementById('lang-label').textContent = next === 'en' ? 'हिन्दी' : 'English';
    this.render();
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.nav-tab').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-tab') === tab);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.render();
  }

  async render() {
    const container = document.getElementById('app-view');
    if (!container) return;

    switch (this.currentTab) {
      case 'home':
        container.innerHTML = await this.renderHomeView();
        break;
      case 'services':
        container.innerHTML = await this.renderServicesView();
        break;
      case 'mandi':
        container.innerHTML = await this.renderMandiView();
        break;
      case 'schemes':
        container.innerHTML = await this.renderSchemesView();
        break;
      case 'jobs':
        container.innerHTML = await this.renderJobsView();
        break;
      case 'marketplace':
        container.innerHTML = await this.renderMarketplaceView();
        break;
      case 'requests':
        container.innerHTML = await this.renderRequestsView();
        break;
      case 'emergency':
        container.innerHTML = this.renderEmergencyView();
        break;
      default:
        container.innerHTML = await this.renderHomeView();
    }
  }

  // --- 1. HOME VIEW ---
  async renderHomeView() {
    const mandiRes = await window.apiClient.get('/api/mandi-prices?limit=3', 'mandi_prices');
    const schemesRes = await window.apiClient.get('/api/schemes?limit=2', 'schemes');
    const isOnline = window.syncEngine.isOnline();
    const isHindi = window.ui.currentLanguage === 'hi';

    const mandiList = (mandiRes.data && (mandiRes.data.prices || mandiRes.data.mandi_prices)) || [];
    const schemesList = (schemesRes.data && (schemesRes.data.schemes || mandiRes.data)) || [];

    return `
      <!-- Emergency SOS Speeddial -->
      <div class="sos-banner">
        <div class="sos-banner-left">
          <div class="sos-icon">
            <i class="fa-solid fa-phone-volume"></i>
          </div>
          <div>
            <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 2px;">
              ${isHindi ? 'राष्ट्रीय आपातकालीन डायल 112' : 'Emergency Telephony SOS (112)'}
            </h4>
            <small style="opacity: 0.9; font-size: 11px;">
              ${isHindi ? 'बिना इंटरनेट सीधा सेलुलर कॉल • एम्बुलेंस / पुलिस' : 'Direct cellular call • No internet required'}
            </small>
          </div>
        </div>
        <a href="tel:112" class="sos-btn">
          <i class="fa-solid fa-phone"></i> 112
        </a>
      </div>

      <!-- Quick Services Category Grid -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px;">
        <h3 style="font-size: 16px; font-weight: 800;">
          ${isHindi ? 'ग्रामीण सेवाएं' : 'Rural Services'}
        </h3>
        <a href="javascript:void(0)" onclick="window.app.switchTab('services')" style="font-size: 12px; color: var(--green-glow); text-decoration: none; font-weight: 700;">
          ${isHindi ? 'सभी देखें &rarr;' : 'View All &rarr;'}
        </a>
      </div>

      <div class="cat-grid">
        <div class="cat-card" onclick="window.app.filterServices('Electrician')">
          <div class="cat-icon-wrap icon-green"><i class="fa-solid fa-bolt"></i></div>
          <span class="cat-title">${isHindi ? 'बिजली / सोलर' : 'Electrician & Solar'}</span>
        </div>
        <div class="cat-card" onclick="window.app.filterServices('Tractor')">
          <div class="cat-icon-wrap icon-orange"><i class="fa-solid fa-tractor"></i></div>
          <span class="cat-title">${isHindi ? 'ट्रैक्टर मिस्त्री' : 'Tractor Mechanic'}</span>
        </div>
        <div class="cat-card" onclick="window.app.filterServices('Borewell')">
          <div class="cat-icon-wrap icon-blue"><i class="fa-solid fa-water"></i></div>
          <span class="cat-title">${isHindi ? 'बोरवेल सुधार' : 'Borewell Repair'}</span>
        </div>
        <div class="cat-card" onclick="window.app.filterServices('Veterinary')">
          <div class="cat-icon-wrap icon-purple"><i class="fa-solid fa-cow"></i></div>
          <span class="cat-title">${isHindi ? 'पशु चिकित्सक' : 'Veterinary Doctor'}</span>
        </div>
      </div>

      <!-- Live Mandi Rates Preview -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0 10px;">
        <div>
          <h3 style="font-size: 16px; font-weight: 800;">
            ${isHindi ? 'आज के मंडी भाव' : 'Live Mandi Prices'}
          </h3>
          <span style="font-size: 11px; color: var(--text-muted);">
            ${isOnline ? 'e-NAM / Agmarknet APMC' : 'Offline Cache — Pipariya / Indore / Karnal'}
          </span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="window.app.switchTab('mandi')">
          ${isHindi ? 'सभी भाव' : 'Full Mandi'}
        </button>
      </div>

      <div class="mandi-grid">
        ${mandiList.slice(0, 3).map((item) => `
          <div class="mandi-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="mandi-crop-name">${isHindi ? (item.crop_hi || item.crop) : item.crop}</span>
              <span class="badge-tag badge-green">e-NAM</span>
            </div>
            <div class="mandi-location">${item.mandi}, ${item.district}</div>
            <div class="mandi-price-row">
              <span style="font-size: 12px; color: var(--text-muted);">${isHindi ? 'मॉडल भाव:' : 'Modal Price:'}</span>
              <span class="modal-price-val">₹${item.modal_price} <small style="font-size: 12px; font-weight: normal; color: var(--text-muted);">/Qtl</small></span>
            </div>
            <div class="mandi-range">Min: ₹${item.min_price} • Max: ₹${item.max_price}</div>
          </div>
        `).join('')}
      </div>

      <!-- Verified Schemes Preview -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 24px 0 12px;">
        <h3 style="font-size: 16px; font-weight: 800;">
          ${isHindi ? 'सत्यापित सरकारी योजनाएं' : 'Verified Welfare Schemes'}
        </h3>
        <a href="javascript:void(0)" onclick="window.app.switchTab('schemes')" style="font-size: 12px; color: var(--green-glow); text-decoration: none; font-weight: 700;">
          ${isHindi ? 'सभी योजनाएं &rarr;' : 'Explore All &rarr;'}
        </a>
      </div>

      ${schemesList.slice(0, 2).map((s) => `
        <div class="card-item">
          <div class="card-item-header">
            <div>
              <span class="badge-tag badge-blue" style="margin-bottom: 4px; display: inline-block;">${s.ministry || 'Govt of India'}</span>
              <div class="card-item-title">${isHindi ? (s.name_hi || s.name) : s.name}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.ui.speak('${(s.benefits || '').replace(/'/g, "\\'")}')" title="Read Aloud">
              <i class="fa-solid fa-volume-high"></i>
            </button>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">${s.description}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-dim);">
            <span><strong>Benefits:</strong> ${s.benefits}</span>
            <a href="${s.official_url}" target="_blank" class="btn btn-outline btn-sm">Official Portal</a>
          </div>
        </div>
      `).join('')}

      <!-- Offline Diagnostic & Simulation Card -->
      <div class="card-item" style="margin-top: 24px; border: 1px dashed var(--border-glass-hover); background: rgba(34, 197, 94, 0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-size: 14px; font-weight: 800;">
              ${isHindi ? 'ऑफलाइन कार्यक्षमता परीक्षक' : 'Offline-First Engine Controller'}
            </h4>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              ${isHindi ? 'बिना इंटरनेट के सेवा बुकिंग और नौकरी आवेदन टेस्ट करें' : 'Test service bookings, job applications, and marketplace offline'}
            </p>
          </div>
          <button class="btn ${window.syncEngine.isSimulatedOffline ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="window.app.toggleSimulatedOffline()">
            <i class="fa-solid ${window.syncEngine.isSimulatedOffline ? 'fa-signal' : 'fa-plane-slash'}"></i>
            ${window.syncEngine.isSimulatedOffline ? 'Turn Online' : 'Simulate Offline'}
          </button>
        </div>
      </div>
    `;
  }

  // --- 2. SERVICES VIEW ---
  async renderServicesView() {
    const isHindi = window.ui.currentLanguage === 'hi';
    const srvRes = await window.apiClient.get('/api/services', 'services');
    const prvRes = await window.apiClient.get('/api/providers', 'providers');

    const services = (srvRes.data && srvRes.data.services) || [];
    const providers = (prvRes.data && prvRes.data.providers) || [];

    const filteredProviders = this.selectedServiceCategory
      ? providers.filter((p) => p.category.toLowerCase().includes(this.selectedServiceCategory.toLowerCase()))
      : providers;

    return `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 20px; font-weight: 800;">${isHindi ? 'विश्वसनीय ग्रामीण सेवाएं' : 'Rural Services & Mechanics'}</h2>
        <p style="font-size: 12px; color: var(--text-muted);">${isHindi ? 'स्थानीय सत्यापित मिस्त्री एवं तकनीशियन • ऑफलाइन बुकिंग' : 'Book verified local technicians with offline queueing'}</p>
      </div>

      <!-- Categories Filter -->
      <div class="filter-bar">
        <span class="filter-pill ${!this.selectedServiceCategory ? 'active' : ''}" onclick="window.app.filterServices(null)">
          ${isHindi ? 'सभी' : 'All Categories'}
        </span>
        ${services.map((s) => `
          <span class="filter-pill ${this.selectedServiceCategory === s.name ? 'active' : ''}" onclick="window.app.filterServices('${s.name}')">
            ${isHindi ? s.name_hi : s.name}
          </span>
        `).join('')}
      </div>

      <!-- Provider Directory -->
      <div style="margin-top: 16px;">
        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px;">
          ${isHindi ? 'सत्यापित सेवा प्रदाता' : 'Available Local Technicians'} (${filteredProviders.length})
        </h3>

        ${filteredProviders.map((p) => `
          <div class="card-item">
            <div class="card-item-header">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="card-item-title">${p.name}</span>
                  ${p.is_verified ? '<span class="badge-tag badge-green"><i class="fa-solid fa-circle-check"></i> Panchayat Verified</span>' : ''}
                </div>
                <div style="font-size: 12px; color: var(--green-glow); margin-top: 2px;">${p.category}</div>
              </div>
              <div style="text-align: right;">
                <span style="color: #facc15; font-weight: 800; font-size: 14px;">★ ${p.rating}</span>
                <small style="font-size: 10px; color: var(--text-muted); display: block;">${p.reviews_count} reviews</small>
              </div>
            </div>

            <div style="font-size: 12px; color: var(--text-muted); margin: 8px 0;">
              <i class="fa-solid fa-location-dot"></i> ${p.village}, ${p.district} • <span class="text-green">${p.availability}</span>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button class="btn btn-primary btn-sm full-width" onclick="window.app.openBookingModal('${p.id}', '${p.name}', '${p.category}')">
                <i class="fa-solid fa-calendar-check"></i> ${isHindi ? 'सेवा बुक करें' : 'Book Service'}
              </button>
              <a href="tel:${p.phone}" class="btn btn-secondary btn-sm">
                <i class="fa-solid fa-phone"></i>
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 3. MANDI PRICES VIEW ---
  async renderMandiView() {
    const isHindi = window.ui.currentLanguage === 'hi';
    const res = await window.apiClient.get('/api/mandi-prices', 'mandi_prices');
    const prices = (res.data && res.data.prices) || [];
    const lastUpdated = res.data ? res.data.last_updated : null;

    return `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 20px; font-weight: 800;">${isHindi ? 'e-NAM कृषि मंडी भाव' : 'e-NAM Agricultural Mandi Rates'}</h2>
        <div style="font-size: 12px; color: ${res.isOffline ? '#fb923c' : '#4ade80'}; margin-top: 2px;">
          <i class="fa-solid ${res.isOffline ? 'fa-plane-slash' : 'fa-check-double'}"></i>
          ${res.isOffline ? 'Offline data — Last updated: ' : 'Live APMC Feed — Last updated: '}
          <strong>${lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Today'}</strong>
        </div>
      </div>

      <!-- Search & Voice Button -->
      <div style="display: flex; gap: 10px; margin-bottom: 16px;">
        <input type="text" id="mandi-search-input" class="form-input" placeholder="${isHindi ? 'फसल या मंडी खोजें (उदा. गेहूं, इंदौर)...' : 'Search crop or market (e.g. Wheat, Indore)...'}" oninput="window.app.searchMandi(this.value)">
        <button class="btn btn-secondary" onclick="window.app.readAllMandiAloud(this)" title="Read Mandi Aloud">
          <i class="fa-solid fa-volume-high"></i>
        </button>
      </div>

      <div class="mandi-grid" id="mandi-cards-container">
        ${prices.map((m) => `
          <div class="mandi-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="mandi-crop-name">${isHindi ? (m.crop_hi || m.crop) : m.crop}</span>
              <button class="btn btn-secondary btn-sm" onclick="window.ui.speak('${isHindi ? (m.crop_hi || m.crop) : m.crop} भाव ${m.mandi} में ${m.modal_price} रुपये प्रति क्विंटल है')" style="padding: 4px 8px;">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>
            <div class="mandi-location"><i class="fa-solid fa-location-dot"></i> ${m.mandi}, ${m.district} (${m.state})</div>
            
            <div class="mandi-price-row">
              <span style="font-size: 12px; color: var(--text-muted);">${isHindi ? 'मॉडल भाव:' : 'Modal Rate:'}</span>
              <span class="modal-price-val">₹${m.modal_price} <small style="font-size: 12px; font-weight: normal; color: var(--text-muted);">/Qtl</small></span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-dim);">
              <span>Min: ₹${m.min_price}</span>
              <span>Max: ₹${m.max_price}</span>
              <span>${m.arrival_date}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 4. GOVERNMENT SCHEMES VIEW ---
  async renderSchemesView() {
    const isHindi = window.ui.currentLanguage === 'hi';
    const res = await window.apiClient.get('/api/schemes', 'schemes');
    const schemes = (res.data && res.data.schemes) || [];

    return `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 20px; font-weight: 800;">${isHindi ? '100% सत्यापित सरकारी योजनाएं' : '100% Verified Welfare Schemes'}</h2>
        <p style="font-size: 12px; color: var(--text-muted);">${isHindi ? 'सीधे सरकारी मंत्रालयों से सत्यापित जानकारी • ऑफलाइन उपलब्ध' : 'Verified government welfare schemes with offline checklist & eligibility'}</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${schemes.map((s) => `
          <div class="card-item">
            <div class="card-item-header">
              <div>
                <span class="badge-tag badge-blue" style="margin-bottom: 4px; display: inline-block;">${s.category} • ${s.ministry}</span>
                <h3 class="card-item-title">${isHindi ? (s.name_hi || s.name) : s.name}</h3>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="window.ui.speak('${(s.benefits || s.description).replace(/'/g, "\\'")}')" title="Listen Aloud">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>

            <p style="font-size: 13px; color: var(--text-muted); margin: 8px 0 14px;">${s.description}</p>

            <div style="background: rgba(0, 0, 0, 0.25); border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 12px;">
              <div style="margin-bottom: 8px;">
                <strong style="color: #4ade80;">${isHindi ? '✓ पात्रता (Eligibility):' : '✓ Eligibility:'}</strong>
                <span style="color: var(--text-white); margin-left: 4px;">${s.eligibility}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #60a5fa;">${isHindi ? '📄 आवश्यक दस्तावेज़:' : '📄 Required Documents:'}</strong>
                <span style="color: var(--text-white); margin-left: 4px;">${s.documents}</span>
              </div>
              <div>
                <strong style="color: #fb923c;">${isHindi ? '🎁 मुख्य लाभ:' : '🎁 Direct Benefits:'}</strong>
                <span style="color: var(--text-white); margin-left: 4px;">${s.benefits}</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: var(--text-dim);">${isHindi ? 'अपडेट:' : 'Updated:'} ${s.last_updated}</span>
              <a href="${s.official_url}" target="_blank" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> ${isHindi ? 'आधिकारिक पोर्टल' : 'Official Portal'}
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 5. JOBS VIEW ---
  async renderJobsView() {
    const isHindi = window.ui.currentLanguage === 'hi';
    const res = await window.apiClient.get('/api/jobs', 'jobs');
    const jobs = (res.data && res.data.jobs) || [];

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800;">${isHindi ? 'ग्रामीण रोजगार अवसर' : 'Rural Employment & Jobs'}</h2>
          <p style="font-size: 12px; color: var(--text-muted);">${isHindi ? 'कृषि, सोलर, डेयरी एवं पंचायत नौकरियां • ऑफलाइन आवेदन संभव' : 'Rural jobs with instant offline application queueing'}</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${jobs.map((j) => `
          <div class="card-item">
            <div class="card-item-header">
              <div>
                <span class="badge-tag badge-green" style="margin-bottom: 4px; display: inline-block;">${j.job_type} • ${j.category}</span>
                <h3 class="card-item-title">${isHindi ? (j.title_hi || j.title) : j.title}</h3>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${j.company_or_employer}</div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 15px; font-weight: 800; color: #4ade80;">${j.salary}</span>
              </div>
            </div>

            <p style="font-size: 13px; color: var(--text-muted); margin: 8px 0;">${j.description}</p>

            <div style="font-size: 12px; color: var(--text-dim); margin-bottom: 12px;">
              <i class="fa-solid fa-location-dot"></i> ${j.location}, ${j.district} • <strong>Req:</strong> ${j.requirements}
            </div>

            <div style="display: flex; gap: 10px;">
              <button class="btn btn-primary btn-sm full-width" onclick="window.app.openJobApplyModal('${j.id}', '${j.title}')">
                <i class="fa-solid fa-paper-plane"></i> ${isHindi ? 'आवेदन करें' : 'Apply Now'}
              </button>
              <a href="tel:${j.contact_phone}" class="btn btn-secondary btn-sm">
                <i class="fa-solid fa-phone"></i>
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 6. MARKETPLACE VIEW ---
  async renderMarketplaceView() {
    const isHindi = window.ui.currentLanguage === 'hi';
    const res = await window.apiClient.get('/api/marketplace', 'marketplace');
    const listings = (res.data && res.data.listings) || [];

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800;">${isHindi ? 'ग्रामीण हाट / बाजार' : 'Rural Farmer Marketplace'}</h2>
          <p style="font-size: 12px; color: var(--text-muted);">${isHindi ? 'बीज, उपकरण, मवेशी एवं खाद की सीधी खरीद-बिक्री' : 'Farmer-to-farmer equipment, livestock, seeds & produce'}</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.app.openPostListingModal()">
          <i class="fa-solid fa-plus"></i> ${isHindi ? 'सामान जोड़ें' : 'Sell Item'}
        </button>
      </div>

      <div class="mandi-grid">
        ${listings.map((l) => `
          <div class="card-item" style="padding: 14px;">
            ${l.image_url ? `<img src="${l.image_url}" alt="${l.title}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : ''}
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span class="badge-tag badge-orange">${l.category}</span>
              ${l.sync_status === 'pending_sync' ? '<span class="badge-tag badge-orange">Pending Sync ⏳</span>' : ''}
            </div>
            <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 4px;">${l.title}</h4>
            <div style="font-size: 18px; font-weight: 800; color: #4ade80; margin-bottom: 6px;">
              ₹${l.price} <small style="font-size: 11px; color: var(--text-muted);">${l.unit}</small>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">${l.description}</p>
            <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 12px;">
              <i class="fa-solid fa-user"></i> ${l.seller_name} • <i class="fa-solid fa-location-dot"></i> ${l.village}
            </div>
            <a href="tel:${l.seller_phone}" class="btn btn-secondary btn-sm full-width">
              <i class="fa-solid fa-phone"></i> ${isHindi ? 'विक्रेता को कॉल करें' : 'Contact Seller'}
            </a>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 7. MY REQUESTS & BOOKINGS VIEW ---
  async renderRequestsView() {
    const isHindi = window.ui.currentLanguage === 'hi';
    const srvRes = await window.apiClient.get('/api/service-requests', 'my_requests');
    const jobRes = await window.apiClient.get('/api/jobs/my-applications', 'my_applications');

    const requests = (srvRes.data && srvRes.data.requests) || [];
    const applications = (jobRes.data && jobRes.data.applications) || [];

    return `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 20px; font-weight: 800;">${isHindi ? 'मेरे अनुरोध एवं आवेदन' : 'My Requests & Bookings'}</h2>
        <p style="font-size: 12px; color: var(--text-muted);">${isHindi ? 'ऑफलाइन कतार एवं सिंक स्थिति की वास्तविक जानकारी' : 'Track your bookings and job submissions in real-time'}</p>
      </div>

      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 10px;">
        ${isHindi ? 'सेवा अनुरोध' : 'Service Requests'} (${requests.length})
      </h3>

      ${requests.length === 0 ? `
        <div class="card-item" style="text-align: center; color: var(--text-muted); padding: 30px;">
          <i class="fa-solid fa-inbox" style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
          <div>${isHindi ? 'कोई सेवा अनुरोध नहीं मिला' : 'No service requests recorded yet'}</div>
        </div>
      ` : requests.map((r) => `
        <div class="card-item">
          <div class="card-item-header">
            <div>
              <div class="card-item-title">${r.service_name || 'Service Booking'}</div>
              <small style="color: var(--text-dim); font-size: 11px;">ID: #${r.id}</small>
            </div>
            <div>
              ${r.sync_status === 'pending_sync' 
                ? '<span class="chip chip-pending">Pending Sync ⏳</span>'
                : `<span class="chip chip-${r.status}">${r.status}</span>`
              }
            </div>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin: 8px 0;">${r.description}</p>
          <div style="font-size: 11px; color: var(--text-dim);">
            <i class="fa-solid fa-location-dot"></i> ${r.village}, ${r.district} • 
            <span>Urgency: <strong>${r.urgency}</strong></span>
          </div>
        </div>
      `).join('')}

      <h3 style="font-size: 15px; font-weight: 700; margin: 24px 0 10px;">
        ${isHindi ? 'नौकरी आवेदन' : 'Job Applications'} (${applications.length})
      </h3>

      ${applications.length === 0 ? `
        <div class="card-item" style="text-align: center; color: var(--text-muted); padding: 30px;">
          <i class="fa-solid fa-briefcase" style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
          <div>${isHindi ? 'कोई नौकरी आवेदन नहीं मिला' : 'No job applications submitted yet'}</div>
        </div>
      ` : applications.map((a) => `
        <div class="card-item">
          <div class="card-item-header">
            <div>
              <div class="card-item-title">${a.job_title || 'Rural Job Application'}</div>
              <small style="color: var(--text-dim); font-size: 11px;">Applicant: ${a.applicant_name} (${a.phone})</small>
            </div>
            <div>
              ${a.sync_status === 'pending_sync'
                ? '<span class="chip chip-pending">Pending Sync ⏳</span>'
                : `<span class="chip chip-${a.status}">${a.status}</span>`
              }
            </div>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin: 6px 0;">${a.experience || 'No past experience specified'}</p>
          <div style="font-size: 11px; color: var(--text-dim);">Village: ${a.village}</div>
        </div>
      `).join('')}
    `;
  }

  // --- 8. EMERGENCY SOS VIEW ---
  renderEmergencyView() {
    const isHindi = window.ui.currentLanguage === 'hi';
    return `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #f87171;">
          <i class="fa-solid fa-phone-volume"></i> ${isHindi ? 'आपातकालीन टेलीफोनी सेवाएं' : 'National Emergency Helplines'}
        </h2>
        <p style="font-size: 12px; color: var(--text-muted);">
          ${isHindi ? 'इंटरनेट की आवश्यकता नहीं है। सीधे सेलुलर डायलर से कॉल करें।' : 'Works with zero data / internet. Direct cellular dialing.'}
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <a href="tel:112" class="card-item" style="display: flex; justify-content: space-between; align-items: center; text-decoration: none; border-left: 4px solid #dc2626;">
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: #fff;">112 — National Emergency Response</h4>
            <small style="color: var(--text-muted);">All-in-one Police, Fire & Medical rescue</small>
          </div>
          <span class="btn btn-primary btn-sm" style="background: #dc2626;"><i class="fa-solid fa-phone"></i> Call 112</span>
        </a>

        <a href="tel:108" class="card-item" style="display: flex; justify-content: space-between; align-items: center; text-decoration: none; border-left: 4px solid #ea580c;">
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: #fff;">108 — Free Rural Ambulance Service</h4>
            <small style="color: var(--text-muted);">Maternity & emergency hospital transit</small>
          </div>
          <span class="btn btn-primary btn-sm" style="background: #ea580c;"><i class="fa-solid fa-phone"></i> Call 108</span>
        </a>

        <a href="tel:181" class="card-item" style="display: flex; justify-content: space-between; align-items: center; text-decoration: none; border-left: 4px solid #c084fc;">
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: #fff;">181 — Women Helpline</h4>
            <small style="color: var(--text-muted);">24x7 confidential domestic & legal support</small>
          </div>
          <span class="btn btn-primary btn-sm" style="background: #9333ea;"><i class="fa-solid fa-phone"></i> Call 181</span>
        </a>

        <a href="tel:1098" class="card-item" style="display: flex; justify-content: space-between; align-items: center; text-decoration: none; border-left: 4px solid #3b82f6;">
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: #fff;">1098 — Childline Support</h4>
            <small style="color: var(--text-muted);">Emergency assistance for children in distress</small>
          </div>
          <span class="btn btn-primary btn-sm" style="background: #2563eb;"><i class="fa-solid fa-phone"></i> Call 1098</span>
        </a>

        <a href="tel:14567" class="card-item" style="display: flex; justify-content: space-between; align-items: center; text-decoration: none; border-left: 4px solid #14b8a6;">
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: #fff;">14567 — Senior Citizen Helpline</h4>
            <small style="color: var(--text-muted);">Elder line welfare assistance & pension aid</small>
          </div>
          <span class="btn btn-primary btn-sm" style="background: #0d9488;"><i class="fa-solid fa-phone"></i> Call 14567</span>
        </a>
      </div>
    `;
  }

  // --- Interactive Actions & Modals ---
  filterServices(category) {
    this.selectedServiceCategory = category;
    this.switchTab('services');
  }

  searchMandi(query) {
    const cards = document.querySelectorAll('#mandi-cards-container .mandi-card');
    const q = query.toLowerCase();
    cards.forEach((c) => {
      const text = c.textContent.toLowerCase();
      c.style.display = text.includes(q) ? 'block' : 'none';
    });
  }

  readAllMandiAloud(btn) {
    const cards = document.querySelectorAll('#mandi-cards-container .mandi-card');
    let readout = 'आज के मुख्य मंडी भाव हैं: ';
    cards.forEach((c, idx) => {
      if (idx < 5 && c.style.display !== 'none') {
        const crop = c.querySelector('.mandi-crop-name').textContent;
        const price = c.querySelector('.modal-price-val').textContent.replace('/Qtl', '');
        readout += `${crop} ${price} रुपये प्रति क्विंटल; `;
      }
    });
    window.ui.speak(readout);
  }

  toggleSimulatedOffline() {
    const current = window.syncEngine.isSimulatedOffline;
    window.syncEngine.toggleOfflineSimulation(!current);
    window.ui.showToast(!current ? 'Simulated Offline Mode Enabled' : 'Connected Online', !current ? 'warning' : 'success');
    this.render();
  }

  openBookingModal(providerId, providerName, serviceCategory) {
    const user = window.authService.getUser();
    const isHindi = window.ui.currentLanguage === 'hi';

    const html = `
      <form id="booking-form" onsubmit="window.app.submitBooking(event, '${providerId}')">
        <div style="margin-bottom: 14px; background: rgba(34, 197, 94, 0.1); padding: 10px; border-radius: 8px;">
          <strong>${isHindi ? 'सेवा प्रदाता:' : 'Provider:'}</strong> ${providerName} (${serviceCategory})
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'समस्या का विवरण (Description)' : 'Problem Description'}</label>
          <textarea id="book-desc" class="form-textarea" placeholder="e.g. 5 HP motor starter tripped with spark; needs rewiring..." required></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'गांव / कस्बा (Village)' : 'Village / Ward'}</label>
          <input type="text" id="book-village" class="form-input" value="${user ? user.village : 'Sandiya'}" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'जिला (District)' : 'District'}</label>
          <input type="text" id="book-district" class="form-input" value="${user ? user.district : 'Narmadapuram'}" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'प्राथमिकता (Urgency)' : 'Urgency Level'}</label>
          <select id="book-urgency" class="form-select">
            <option value="normal">Normal (Within 24 Hours)</option>
            <option value="urgent" selected>Urgent (Today)</option>
            <option value="emergency">Emergency (Immediate)</option>
          </select>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary full-width" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary full-width">
            <i class="fa-solid fa-check"></i> ${isHindi ? 'अनुरोध भेजें (ऑफलाइन सक्षम)' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    `;

    window.ui.openModal(isHindi ? 'सेवा अनुरोध दर्ज करें' : 'Book Service Appointment', html);
  }

  async submitBooking(event, providerId) {
    event.preventDefault();
    const desc = document.getElementById('book-desc').value;
    const village = document.getElementById('book-village').value;
    const district = document.getElementById('book-district').value;
    const urgency = document.getElementById('book-urgency').value;

    const payload = {
      provider_id: providerId,
      description: desc,
      village,
      district,
      urgency,
      scheduled_date: new Date().toISOString().slice(0, 10)
    };

    const res = await window.apiClient.createServiceRequest(payload);
    window.ui.closeModal();

    if (res.isOffline) {
      window.ui.showToast('Saved offline! Request will sync automatically when network returns.', 'warning', 5000);
    } else {
      window.ui.showToast('Service request created and sent to Panchayat server!', 'success');
    }

    this.switchTab('requests');
  }

  openJobApplyModal(jobId, jobTitle) {
    const user = window.authService.getUser();
    const isHindi = window.ui.currentLanguage === 'hi';

    const html = `
      <form id="job-apply-form" onsubmit="window.app.submitJobApplication(event, '${jobId}')">
        <div style="margin-bottom: 14px; background: rgba(59, 130, 246, 0.1); padding: 10px; border-radius: 8px;">
          <strong>${jobTitle}</strong>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'आपका नाम (Full Name)' : 'Applicant Name'}</label>
          <input type="text" id="app-name" class="form-input" value="${user ? user.name : 'Santosh Yadav'}" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'मोबाइल नंबर (Phone)' : 'Mobile Phone'}</label>
          <input type="tel" id="app-phone" class="form-input" value="${user ? user.phone : '9876543213'}" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'गांव (Village)' : 'Village'}</label>
          <input type="text" id="app-village" class="form-input" value="${user ? user.village : 'Sandiya'}" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'अनुभव / विवरण (Experience)' : 'Relevant Experience'}</label>
          <textarea id="app-exp" class="form-textarea" placeholder="e.g. 2 years experience with solar submersible pumps and Hero bike..."></textarea>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary full-width" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary full-width">
            <i class="fa-solid fa-paper-plane"></i> ${isHindi ? 'आवेदन जमा करें' : 'Submit Application'}
          </button>
        </div>
      </form>
    `;

    window.ui.openModal(isHindi ? 'नौकरी के लिए आवेदन' : 'Apply for Job Posting', html);
  }

  async submitJobApplication(event, jobId) {
    event.preventDefault();
    const applicant_name = document.getElementById('app-name').value;
    const phone = document.getElementById('app-phone').value;
    const village = document.getElementById('app-village').value;
    const experience = document.getElementById('app-exp').value;

    const payload = { applicant_name, phone, village, experience };
    const res = await window.apiClient.applyJob(jobId, payload);
    window.ui.closeModal();

    if (res.isOffline) {
      window.ui.showToast('Application stored offline! Will sync automatically upon reconnection.', 'warning', 5000);
    } else {
      window.ui.showToast('Application sent successfully to employer!', 'success');
    }

    this.switchTab('requests');
  }

  openPostListingModal() {
    const user = window.authService.getUser();
    const isHindi = window.ui.currentLanguage === 'hi';

    const html = `
      <form id="listing-form" onsubmit="window.app.submitListing(event)">
        <div class="form-group">
          <label class="form-label">${isHindi ? 'वस्तु का शीर्षक (Title)' : 'Item Title'}</label>
          <input type="text" id="lst-title" class="form-input" placeholder="e.g. Sharbati Wheat Seeds (50kg bags)" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'श्रेणी (Category)' : 'Category'}</label>
          <select id="lst-category" class="form-select">
            <option value="Seeds">Seeds & Crops</option>
            <option value="Machinery">Farm Machinery & Tools</option>
            <option value="Livestock">Livestock & Cattle</option>
            <option value="Fertilizers">Fertilizers & Compost</option>
            <option value="General">Other Rural Produce</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'मूल्य (Price in ₹)' : 'Price (₹)'}</label>
          <input type="number" id="lst-price" class="form-input" placeholder="e.g. 2500" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'इकाई (Unit)' : 'Unit'}</label>
          <input type="text" id="lst-unit" class="form-input" value="per bag" required>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'विवरण (Description)' : 'Description'}</label>
          <textarea id="lst-desc" class="form-textarea" placeholder="Describe quality, condition, or warranty..." required></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">${isHindi ? 'संपर्क नंबर (Phone)' : 'Contact Phone'}</label>
          <input type="tel" id="lst-phone" class="form-input" value="${user ? user.phone : '9876543213'}" required>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary full-width" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary full-width">
            <i class="fa-solid fa-plus"></i> ${isHindi ? 'सामान पोस्ट करें' : 'Post Listing'}
          </button>
        </div>
      </form>
    `;

    window.ui.openModal(isHindi ? 'हाट में बिक्री के लिए विज्ञापन जोड़ें' : 'Post Marketplace Listing', html);
  }

  async submitListing(event) {
    event.preventDefault();
    const title = document.getElementById('lst-title').value;
    const category = document.getElementById('lst-category').value;
    const price = document.getElementById('lst-price').value;
    const unit = document.getElementById('lst-unit').value;
    const description = document.getElementById('lst-desc').value;
    const seller_phone = document.getElementById('lst-phone').value;

    const payload = {
      title,
      category,
      price,
      unit,
      description,
      seller_phone,
      village: (window.authService.getUser() && window.authService.getUser().village) || 'Sandiya'
    };

    const res = await window.apiClient.createMarketplaceListing(payload);
    window.ui.closeModal();

    if (res.isOffline) {
      window.ui.showToast('Listing stored offline! Will sync with market when network returns.', 'warning', 5000);
    } else {
      window.ui.showToast('Listing published to Rural Marketplace!', 'success');
    }

    this.switchTab('marketplace');
  }

  async openOfflineCenter() {
    const status = await window.syncEngine.getStatus();
    const stats = window.offlineDB ? await window.offlineDB.getStorageStats() : {};
    const isHindi = window.ui.currentLanguage === 'hi';

    const html = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.25); padding: 12px; border-radius: 8px;">
          <div>
            <strong>Network Status:</strong>
            <span style="color: ${status.online ? '#4ade80' : '#fb923c'}; margin-left: 6px; font-weight: 800;">
              ${status.online ? 'Online' : (status.simulated ? 'Simulated Offline' : 'Offline')}
            </span>
          </div>
          <button class="btn btn-sm ${status.simulated ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.toggleSimulatedOffline()">
            ${status.simulated ? 'Disable Simulation' : 'Simulate Offline'}
          </button>
        </div>

        <div style="background: rgba(0, 0, 0, 0.25); padding: 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Pending Sync Queue:</span>
            <strong style="color: #fb923c;">${status.pendingCount} actions</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim);">
            <span>Last Synchronized:</span>
            <span>${status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>

        <h4 style="font-size: 13px; font-weight: 700; margin-top: 6px;">Local Offline Cache (IndexedDB):</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
          <div style="background: rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 6px;">Schemes: <strong>${stats.schemes || 0}</strong></div>
          <div style="background: rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 6px;">Mandi Rates: <strong>${stats.mandi_prices || 0}</strong></div>
          <div style="background: rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 6px;">Rural Jobs: <strong>${stats.jobs || 0}</strong></div>
          <div style="background: rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 6px;">Services: <strong>${stats.services || 0}</strong></div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 14px;">
          <button class="btn btn-primary full-width" onclick="window.syncEngine.triggerSync(); window.ui.closeModal();">
            <i class="fa-solid fa-arrows-rotate"></i> Sync All Changes Now
          </button>
        </div>
      </div>
    `;

    window.ui.openModal(isHindi ? 'ऑफलाइन डेटा एवं सिंक केंद्र' : 'Offline Engine & Sync Diagnostic', html);
  }

  openProfileModal() {
    const user = window.authService.getUser();
    const isHindi = window.ui.currentLanguage === 'hi';

    if (user) {
      const html = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #16a34a, #15803d); display: inline-flex; align-items: center; justify-content: center; font-size: 26px; color: #fff; margin-bottom: 8px;">
            <i class="fa-solid fa-user"></i>
          </div>
          <h3 style="font-size: 18px; font-weight: 800;">${user.name}</h3>
          <span class="role-badge role-${user.role}" style="display: inline-block; margin-top: 4px;">Role: ${user.role}</span>
        </div>

        <div style="background: rgba(0, 0, 0, 0.25); padding: 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;">
          <div style="margin-bottom: 6px;"><strong>Phone:</strong> ${user.phone}</div>
          <div style="margin-bottom: 6px;"><strong>Village:</strong> ${user.village}</div>
          <div><strong>District:</strong> ${user.district}, ${user.state}</div>
        </div>

        <!-- Quick Demo Role Switcher -->
        <h4 style="font-size: 12px; color: var(--text-dim); margin-bottom: 8px; text-transform: uppercase;">Quick Demo Switcher:</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
          <button class="btn btn-secondary btn-sm" onclick="window.authService.quickSwitchRole('admin'); window.ui.closeModal();">Switch Admin</button>
          <button class="btn btn-secondary btn-sm" onclick="window.authService.quickSwitchRole('panchayat'); window.ui.closeModal();">Switch Panchayat</button>
          <button class="btn btn-secondary btn-sm" onclick="window.authService.quickSwitchRole('provider'); window.ui.closeModal();">Switch Provider</button>
          <button class="btn btn-secondary btn-sm" onclick="window.authService.quickSwitchRole('user'); window.ui.closeModal();">Switch Farmer</button>
        </div>

        <div style="display: flex; gap: 10px;">
          ${['admin', 'panchayat'].includes(user.role) ? '<a href="/admin" target="_blank" class="btn btn-primary full-width"><i class="fa-solid fa-shield"></i> Open Admin Portal</a>' : ''}
          <button class="btn btn-outline full-width" onclick="window.authService.logout(); window.ui.closeModal();">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      `;
      window.ui.openModal('My Profile', html);
    } else {
      // Login or Register Form
      const html = `
        <form id="auth-form" onsubmit="window.app.handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Phone Number / Email</label>
            <input type="text" id="login-phone" class="form-input" value="9876543213" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="login-pass" class="form-input" value="User@123" required>
          </div>
          <button type="submit" class="btn btn-primary full-width" style="margin-top: 12px;">
            <i class="fa-solid fa-lock"></i> Login
          </button>

          <div style="margin-top: 16px; font-size: 12px; color: var(--text-dim); text-align: center;">
            Demo Credentials Pre-filled: <strong>9876543213 / User@123</strong>
          </div>
        </form>
      `;
      window.ui.openModal('Sign In to Net Bypass', html);
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    const phone = document.getElementById('login-phone').value;
    const pass = document.getElementById('login-pass').value;

    try {
      await window.authService.login(phone, pass);
      window.ui.closeModal();
      window.ui.showToast('Login successful!', 'success');
      this.render();
    } catch (err) {
      window.ui.showToast(err.message, 'error');
    }
  }
}

window.app = new NetBypassApp();
window.renderAppView = () => window.app.render();
