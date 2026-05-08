// Reusable UI components
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function getInitials(name) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function renderBadge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

// ===== Dark Mode =====
function initTheme() {
  const saved = localStorage.getItem('tutorhub-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('tutorhub-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('tutorhub-theme', 'dark');
  }
  renderNavbar();
}

function renderThemeToggle() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return `
    <li>
      <div class="theme-toggle" onclick="toggleTheme()" title="Toggle dark mode" id="theme-toggle">
        <div class="theme-toggle-knob">${isDark ? '🌙' : '☀️'}</div>
      </div>
    </li>
  `;
}

// Apply theme immediately on load (before DOM ready)
initTheme();

function renderNavbar() {
  const nav = document.getElementById('nav-links');
  const user = Auth.getUser();
  const themeToggle = renderThemeToggle();
  if (!user) {
    nav.innerHTML = `
      <li><a href="#" onclick="navigate('landing')">Home</a></li>
      ${themeToggle}
      <li><a href="#" onclick="navigate('login')" class="btn btn-secondary btn-sm">Sign In</a></li>
      <li><a href="#" onclick="navigate('register')" class="btn btn-primary btn-sm">Get Started</a></li>
    `;
  } else {
    nav.innerHTML = `
      <li><a href="#" onclick="navigate('dashboard')">Dashboard</a></li>
      ${themeToggle}
      <li>
        <div class="nav-user">
          <div class="nav-avatar">${getInitials(user.name)}</div>
          <span>${user.name}</span>
        </div>
      </li>
      <li><a href="#" onclick="Auth.logout()" class="btn btn-secondary btn-sm">Logout</a></li>
    `;
  }
}

function renderTeacherCard(teacher) {
  const subjects = (Array.isArray(teacher.subjects) ? teacher.subjects : JSON.parse(teacher.subjects || '[]'));
  return `
    <div class="card teacher-card">
      <div class="teacher-card-header">
        <div class="teacher-avatar">${getInitials(teacher.name)}</div>
        <div class="teacher-info">
          <h3>${teacher.name}</h3>
          <p class="location"><i class="ph ph-map-pin"></i> ${teacher.location || 'Remote'}</p>
        </div>
      </div>
      <div class="teacher-card-body">
        <p class="teacher-bio">${teacher.bio || 'No bio available'}</p>
        <div class="teacher-subjects">
          ${subjects.slice(0, 4).map(s => `<span class="subject-tag">${s}</span>`).join('')}
        </div>
      </div>
      <div class="teacher-card-footer">
        <span class="teacher-rate">${teacher.hourly_rate} DA<span>/hr</span></span>
        <div class="teacher-rating">
          <span>${renderStars(teacher.rating || 0)}</span>
          <span style="color:var(--text-muted)">(${teacher.total_reviews || 0})</span>
        </div>
      </div>
      <div style="padding:0 24px 20px">
        <button class="btn btn-primary btn-block btn-sm" onclick="openBookingModal(${teacher.id}, '${teacher.name}', ${teacher.hourly_rate}, '${subjects.join(',')}')">Book Session</button>
      </div>
    </div>
  `;
}
