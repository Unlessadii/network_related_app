/**
 * Net Bypass UI Components & Utilities
 * Accessible, high-contrast, Indian-language-friendly UI utilities.
 */
class UIComponents {
  constructor() {
    this.currentLanguage = localStorage.getItem('nb_lang') || 'en';
    this.translations = {
      en: {
        appName: 'Net Bypass',
        tagline: 'Truly Offline Rural Services Super-App',
        onlineStatus: 'Online • Connected',
        offlineStatus: 'Offline Mode • Local Cache',
        syncingStatus: 'Syncing Changes...',
        simulateOffline: 'Simulate Offline',
        emergencySOS: 'Emergency SOS (112)',
        home: 'Home',
        services: 'Services',
        mandi: 'Mandi Rates',
        schemes: 'Govt Schemes',
        jobs: 'Rural Jobs',
        marketplace: 'Marketplace',
        requests: 'My Requests',
        offlineCenter: 'Offline Center',
        lastUpdated: 'Last Updated',
        offlineDataNote: 'Offline data — Last updated: ',
        pendingSyncBadge: 'Pending Sync ⏳',
        syncedBadge: 'Synced to Panchayat ✅',
        readAloud: 'Read Aloud (Voice)',
        stopVoice: 'Stop Voice',
        applyNow: 'Apply Job',
        bookService: 'Book Service',
        callDirect: 'Call Directly',
        postListing: 'Post Item for Sale',
        login: 'Login',
        register: 'Register',
        logout: 'Logout'
      },
      hi: {
        appName: 'नेट बाईपास',
        tagline: 'भारत का संपूर्ण ऑफलाइन ग्रामीण सुपर-एप',
        onlineStatus: 'ऑनलाइन • कनेक्टेड',
        offlineStatus: 'ऑफलाइन मोड • स्थानीय मेमोरी',
        syncingStatus: 'डेटा सिंक हो रहा है...',
        simulateOffline: 'ऑफलाइन टेस्ट करें',
        emergencySOS: 'आपातकालीन एसओएस (112)',
        home: 'होम',
        services: 'सेवाएं',
        mandi: 'मंडी भाव',
        schemes: 'सरकारी योजनाएं',
        jobs: 'ग्रामीण रोजगार',
        marketplace: 'हाट / बाजार',
        requests: 'मेरे अनुरोध',
        offlineCenter: 'ऑफलाइन केंद्र',
        lastUpdated: 'अंतिम अपडेट',
        offlineDataNote: 'ऑफलाइन डेटा — अंतिम अपडेट: ',
        pendingSyncBadge: 'सिंक प्रतीक्षित ⏳',
        syncedBadge: 'पंचायत सर्वर पर दर्ज ✅',
        readAloud: 'आवाज़ में सुनें',
        stopVoice: 'आवाज़ रोकें',
        applyNow: 'आवेदन करें',
        bookService: 'सेवा बुक करें',
        callDirect: 'सीधा कॉल करें',
        postListing: 'बिक्री के लिए सामान जोड़ें',
        login: 'लॉग इन',
        register: 'पंजीकरण',
        logout: 'लॉग आउट'
      }
    };
  }

  t(key) {
    const lang = this.translations[this.currentLanguage] || this.translations.en;
    return lang[key] || this.translations.en[key] || key;
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('nb_lang', lang);
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = this.t(key);
    });
    if (window.renderAppView) window.renderAppView();
  }

  showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconMap = {
      info: 'fa-circle-info text-blue',
      success: 'fa-circle-check text-green',
      warning: 'fa-triangle-exclamation text-orange',
      error: 'fa-circle-xmark text-red',
      sync: 'fa-arrows-rotate text-green'
    };

    toast.innerHTML = `
      <i class="fa-solid ${iconMap[type] || 'fa-info-circle'}"></i>
      <div class="toast-text">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  openModal(title, contentHtml) {
    let backdrop = document.getElementById('global-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'global-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close-btn" onclick="window.ui.closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
      </div>
    `;

    backdrop.classList.add('active');
  }

  closeModal() {
    const backdrop = document.getElementById('global-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
  }

  // Text-To-Speech Speech Synthesis for accessibility
  speak(text, lang = 'hi-IN') {
    if (!('speechSynthesis' in window)) {
      this.showToast('Speech synthesis not supported on this browser', 'warning');
      return;
    }

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clear rural comprehension
    window.speechSynthesis.speak(utterance);
    this.showToast('Reading aloud...', 'info', 2500);
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

window.ui = new UIComponents();
