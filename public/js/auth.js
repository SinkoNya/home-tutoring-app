// Auth state management
const Auth = {
  user: null,
  profile: null,

  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  getUser() {
    if (this.user) return this.user;
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);
    return this.user;
  },

  async fetchUser() {
    try {
      const data = await API.get('/auth/me');
      this.user = data.user;
      this.profile = data.profile;
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch {
      this.logout();
      return null;
    }
  },

  async login(email, password) {
    const data = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.user = data.user;
    return data;
  },

  async register(name, email, password, role, phone) {
    const data = await API.post('/auth/register', { name, email, password, role, phone });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.user = data.user;
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.user = null;
    this.profile = null;
    navigate('landing');
  }
};
