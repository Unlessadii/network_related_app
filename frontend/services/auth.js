/**
 * Net Bypass Authentication Service
 */
class AuthService {
  constructor() {
    this.tokenKey = 'nb_auth_token';
    this.userKey = 'nb_auth_user';
    this.token = localStorage.getItem(this.tokenKey);
    this.user = JSON.parse(localStorage.getItem(this.userKey) || 'null');
    this.listeners = [];
  }

  onChange(cb) {
    this.listeners.push(cb);
    cb(this.user);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== cb);
    };
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.user));
  }

  isAuthenticated() {
    return Boolean(this.token && this.user);
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  hasRole(roles) {
    if (!this.user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(this.user.role);
  }

  async login(identifier, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: identifier, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    this.token = data.data.token;
    this.user = data.data.user;
    localStorage.setItem(this.tokenKey, this.token);
    localStorage.setItem(this.userKey, JSON.stringify(this.user));
    this.notify();
    return this.user;
  }

  async register(formData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }

    this.token = data.data.token;
    this.user = data.data.user;
    localStorage.setItem(this.tokenKey, this.token);
    localStorage.setItem(this.userKey, JSON.stringify(this.user));
    this.notify();
    return this.user;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.notify();
  }

  // Quick Switcher for Demo testing
  async quickSwitchRole(role) {
    const credentials = {
      admin: { phone: '9876543210', pass: 'Admin@123' },
      panchayat: { phone: '9876543211', pass: 'Panchayat@123' },
      provider: { phone: '9876543212', pass: 'Provider@123' },
      user: { phone: '9876543213', pass: 'User@123' }
    };

    const cred = credentials[role];
    if (cred) {
      return this.login(cred.phone, cred.pass);
    }
  }
}

window.authService = new AuthService();
