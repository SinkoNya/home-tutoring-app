// API helper module
const API = {
  base: '/api',

  getToken() {
    return localStorage.getItem('token');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options
    };
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(`${this.base}${endpoint}`, config);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      throw err;
    }
  },

  get(endpoint) { return this.request(endpoint); },
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};
