// Dashboard renderers for Student, Teacher, Admin

let currentTab = 'overview';

function renderDashboard(role) {
  if (role === 'student') return renderStudentDashboard();
  if (role === 'teacher') return renderTeacherDashboard();
  if (role === 'admin') return renderAdminDashboard();
  return '<p>Unknown role</p>';
}

// ─── STUDENT DASHBOARD ───
function renderStudentDashboard() {
  return `
    <div class="dashboard">
      <aside class="sidebar">
        <ul class="sidebar-nav">
          <li><a href="#" class="active" onclick="switchTab('find-tutors', this)">🔍 Find Tutors</a></li>
          <li><a href="#" onclick="switchTab('my-bookings', this)">📅 My Bookings</a></li>
          <li><a href="#" onclick="switchTab('my-profile', this)">👤 My Profile</a></li>
        </ul>
      </aside>
      <main class="main-content">
        <div id="dashboard-content"><div class="spinner"></div></div>
      </main>
    </div>
    <div class="modal-overlay" id="booking-modal">
      <div class="modal glass" id="booking-modal-content"></div>
    </div>
  `;
}

// ─── TEACHER DASHBOARD ───
function renderTeacherDashboard() {
  return `
    <div class="dashboard">
      <aside class="sidebar">
        <ul class="sidebar-nav">
          <li><a href="#" class="active" onclick="switchTab('teacher-overview', this)">📊 Overview</a></li>
          <li><a href="#" onclick="switchTab('teacher-bookings', this)">📅 Bookings</a></li>
          <li><a href="#" onclick="switchTab('teacher-profile', this)">👤 My Profile</a></li>
        </ul>
      </aside>
      <main class="main-content">
        <div id="dashboard-content"><div class="spinner"></div></div>
      </main>
    </div>
  `;
}

// ─── ADMIN DASHBOARD ───
function renderAdminDashboard() {
  return `
    <div class="dashboard">
      <aside class="sidebar">
        <ul class="sidebar-nav">
          <li><a href="#" class="active" onclick="switchTab('admin-overview', this)">📊 Overview</a></li>
          <li><a href="#" onclick="switchTab('admin-users', this)">👥 Users</a></li>
          <li><a href="#" onclick="switchTab('admin-teachers', this)">👨‍🏫 Teacher Approvals</a></li>
          <li><a href="#" onclick="switchTab('admin-bookings', this)">📅 All Bookings</a></li>
        </ul>
      </aside>
      <main class="main-content">
        <div id="dashboard-content"><div class="spinner"></div></div>
      </main>
    </div>
  `;
}

function switchTab(tab, el) {
  if (el) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
  }
  currentTab = tab;
  loadTabContent(tab);
}

async function loadTabContent(tab) {
  const container = document.getElementById('dashboard-content');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    switch (tab) {
      case 'find-tutors': await loadFindTutors(container); break;
      case 'my-bookings': await loadMyBookings(container); break;
      case 'my-profile': await loadStudentProfile(container); break;
      case 'teacher-overview': await loadTeacherOverview(container); break;
      case 'teacher-bookings': await loadTeacherBookings(container); break;
      case 'teacher-profile': await loadTeacherProfile(container); break;
      case 'admin-overview': await loadAdminOverview(container); break;
      case 'admin-users': await loadAdminUsers(container); break;
      case 'admin-teachers': await loadAdminTeachers(container); break;
      case 'admin-bookings': await loadAdminBookings(container); break;
      default: container.innerHTML = '<p>Page not found</p>';
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading data</h3><p>${err.message}</p></div>`;
  }
}

// ─── STUDENT TABS ───
async function loadFindTutors(el) {
  const data = await API.get('/teachers');
  if (!data.teachers.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><h3>No tutors available yet</h3><p>Check back soon!</p></div>';
    return;
  }
  el.innerHTML = `
    <div class="page-header"><h1>Find Your Perfect Tutor</h1><p>Browse our verified expert tutors</p></div>
    <div class="search-bar"><input type="text" class="form-control" placeholder="Search by name, subject..." oninput="searchTutors(this.value)"></div>
    <div class="teacher-grid" id="teachers-list">${data.teachers.map(renderTeacherCard).join('')}</div>
  `;
}

async function searchTutors(query) {
  const data = await API.get(`/teachers?search=${encodeURIComponent(query)}`);
  document.getElementById('teachers-list').innerHTML = data.teachers.length
    ? data.teachers.map(renderTeacherCard).join('')
    : '<div class="empty-state"><h3>No tutors found</h3></div>';
}

async function loadMyBookings(el) {
  const data = await API.get('/bookings');
  el.innerHTML = `
    <div class="page-header"><h1>My Bookings</h1><p>Track your tutoring sessions</p></div>
    ${data.bookings.length ? `
      <div class="table-wrapper"><table>
        <thead><tr><th>Teacher</th><th>Subject</th><th>Date</th><th>Time</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${data.bookings.map(b => `
          <tr>
            <td>${b.teacher_name}</td><td>${b.subject}</td><td>${b.date}</td>
            <td>${b.start_time} - ${b.end_time}</td><td>${b.total_price} DA</td>
            <td>${renderBadge(b.status)}</td>
            <td>${b.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="updateBooking(${b.id},'cancelled')">Cancel</button>` : '—'}</td>
          </tr>
        `).join('')}</tbody>
      </table></div>
    ` : '<div class="empty-state"><div class="empty-icon">📅</div><h3>No bookings yet</h3><p>Find a tutor and book your first session!</p></div>'}
  `;
}

async function loadStudentProfile(el) {
  const data = await API.get('/auth/me');
  el.innerHTML = `
    <div class="page-header"><h1>My Profile</h1></div>
    <div class="card" style="max-width:500px">
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:24px">
        <div class="teacher-avatar" style="width:64px;height:64px;font-size:1.5rem">${getInitials(data.user.name)}</div>
        <div><h3>${data.user.name}</h3><p style="color:var(--text-muted)">${data.user.email}</p></div>
      </div>
      <p><strong>Role:</strong> ${data.user.role}</p>
      <p><strong>Phone:</strong> ${data.user.phone || 'Not set'}</p>
      <p><strong>Joined:</strong> ${new Date(data.user.created_at).toLocaleDateString()}</p>
    </div>
  `;
}

// ─── BOOKING MODAL ───
function openBookingModal(teacherId, teacherName, rate, subjectsStr) {
  if (!Auth.isLoggedIn()) { navigate('login'); return; }
  const subjects = subjectsStr.split(',');
  const modal = document.getElementById('booking-modal');
  document.getElementById('booking-modal-content').innerHTML = `
    <h2>Book Session with ${teacherName}</h2>
    <form onsubmit="submitBooking(event, ${teacherId})">
      <div class="form-group"><label>Subject</label>
        <select class="form-control" id="book-subject" required>
          ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Date</label><input type="date" class="form-control" id="book-date" required min="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Start Time</label><input type="time" class="form-control" id="book-start" required></div>
      <div class="form-group"><label>End Time</label><input type="time" class="form-control" id="book-end" required></div>
      <div class="form-group"><label>Notes (optional)</label><textarea class="form-control" id="book-notes" rows="3"></textarea></div>
      <p style="color:var(--secondary);margin-bottom:16px">Rate: ${rate} DA/hr</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeBookingModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Confirm Booking</button>
      </div>
    </form>
  `;
  modal.classList.add('active');
}

function closeBookingModal() { document.getElementById('booking-modal').classList.remove('active'); }

async function submitBooking(e, teacherId) {
  e.preventDefault();
  try {
    await API.post('/bookings', {
      teacher_id: teacherId,
      subject: document.getElementById('book-subject').value,
      date: document.getElementById('book-date').value,
      start_time: document.getElementById('book-start').value,
      end_time: document.getElementById('book-end').value,
      notes: document.getElementById('book-notes').value
    });
    showToast('Booking created!');
    closeBookingModal();
    switchTab('my-bookings');
  } catch (err) { showToast(err.message, 'error'); }
}

async function updateBooking(id, status) {
  try {
    await API.put(`/bookings/${id}`, { status });
    showToast(`Booking ${status}`);
    loadTabContent(currentTab);
  } catch (err) { showToast(err.message, 'error'); }
}

// ─── TEACHER TABS ───
async function loadTeacherOverview(el) {
  const [meData, bookingsData] = await Promise.all([API.get('/auth/me'), API.get('/bookings')]);
  const profile = meData.profile || {};
  const pending = bookingsData.bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookingsData.bookings.filter(b => b.status === 'confirmed').length;
  const completed = bookingsData.bookings.filter(b => b.status === 'completed').length;

  el.innerHTML = `
    <div class="page-header"><h1>Welcome, ${meData.user.name}</h1><p>Your teaching dashboard</p></div>
    ${profile.status === 'pending' ? '<div class="card" style="border-color:var(--warning);margin-bottom:24px"><p>⏳ Your profile is pending admin approval. You will be able to receive bookings once approved.</p></div>' : ''}
    <div class="stats-grid">
      <div class="card stat-card"><div class="stat-icon purple">⭐</div><div class="stat-info"><h3>${profile.rating || 0}</h3><p>Rating</p></div></div>
      <div class="card stat-card"><div class="stat-icon teal">👥</div><div class="stat-info"><h3>${profile.total_students || 0}</h3><p>Students</p></div></div>
      <div class="card stat-card"><div class="stat-icon pink">📋</div><div class="stat-info"><h3>${pending}</h3><p>Pending</p></div></div>
      <div class="card stat-card"><div class="stat-icon green">✅</div><div class="stat-info"><h3>${completed}</h3><p>Completed</p></div></div>
    </div>
    <div class="card"><h3 style="margin-bottom:16px">Recent Bookings</h3>
      ${bookingsData.bookings.length ? `<div class="table-wrapper"><table>
        <thead><tr><th>Student</th><th>Subject</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${bookingsData.bookings.slice(0, 5).map(b => `<tr><td>${b.student_name}</td><td>${b.subject}</td><td>${b.date}</td><td>${renderBadge(b.status)}</td></tr>`).join('')}</tbody>
      </table></div>` : '<p style="color:var(--text-muted)">No bookings yet</p>'}
    </div>
  `;
}

async function loadTeacherBookings(el) {
  const data = await API.get('/bookings');
  el.innerHTML = `
    <div class="page-header"><h1>My Bookings</h1><p>Manage your tutoring sessions</p></div>
    ${data.bookings.length ? `<div class="table-wrapper"><table>
      <thead><tr><th>Student</th><th>Subject</th><th>Date</th><th>Time</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${data.bookings.map(b => `<tr>
        <td>${b.student_name}</td><td>${b.subject}</td><td>${b.date}</td>
        <td>${b.start_time}-${b.end_time}</td><td>${b.total_price} DA</td><td>${renderBadge(b.status)}</td>
        <td>${b.status === 'pending' ? `
          <button class="btn btn-success btn-sm" onclick="updateBooking(${b.id},'confirmed')">Accept</button>
          <button class="btn btn-danger btn-sm" onclick="updateBooking(${b.id},'cancelled')">Decline</button>
        ` : b.status === 'confirmed' ? `<button class="btn btn-primary btn-sm" onclick="updateBooking(${b.id},'completed')">Complete</button>` : '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty-state"><div class="empty-icon">📅</div><h3>No bookings yet</h3></div>'}
  `;
}

async function loadTeacherProfile(el) {
  const data = await API.get('/auth/me');
  const p = data.profile || {};
  const subjects = Array.isArray(p.subjects) ? p.subjects : [];

  el.innerHTML = `
    <div class="page-header"><h1>Edit Profile</h1><p>Keep your profile updated to attract students</p></div>
    <div class="card" style="max-width:600px">
      <form onsubmit="saveTeacherProfile(event)">
        <div class="form-group"><label>Bio</label><textarea class="form-control" id="tp-bio" rows="4">${p.bio || ''}</textarea></div>
        <div class="form-group"><label>Hourly Rate ($)</label><input type="number" class="form-control" id="tp-rate" value="${p.hourly_rate || 0}" min="1"></div>
        <div class="form-group"><label>Experience (years)</label><input type="number" class="form-control" id="tp-exp" value="${p.experience_years || 0}" min="0"></div>
        <div class="form-group"><label>Subjects (comma separated)</label><input type="text" class="form-control" id="tp-subjects" value="${subjects.join(', ')}"></div>
        <div class="form-group"><label>Location</label><input type="text" class="form-control" id="tp-location" value="${p.location || ''}"></div>
        <div class="form-group"><label>Education</label><input type="text" class="form-control" id="tp-education" value="${p.education || ''}"></div>
        <button type="submit" class="btn btn-primary">Save Profile</button>
      </form>
    </div>
  `;
}

async function saveTeacherProfile(e) {
  e.preventDefault();
  try {
    await API.put('/teachers/profile', {
      bio: document.getElementById('tp-bio').value,
      hourly_rate: parseFloat(document.getElementById('tp-rate').value),
      experience_years: parseInt(document.getElementById('tp-exp').value),
      subjects: document.getElementById('tp-subjects').value.split(',').map(s => s.trim()).filter(Boolean),
      location: document.getElementById('tp-location').value,
      education: document.getElementById('tp-education').value
    });
    showToast('Profile saved!');
  } catch (err) { showToast(err.message, 'error'); }
}

// ─── ADMIN TABS ───
async function loadAdminOverview(el) {
  const data = await API.get('/admin/stats');
  const s = data.stats;
  el.innerHTML = `
    <div class="page-header"><h1>Admin Dashboard</h1><p>Platform overview and management</p></div>
    <div class="stats-grid">
      <div class="card stat-card"><div class="stat-icon purple">👥</div><div class="stat-info"><h3>${s.totalUsers}</h3><p>Total Users</p></div></div>
      <div class="card stat-card"><div class="stat-icon teal">🎓</div><div class="stat-info"><h3>${s.totalStudents}</h3><p>Students</p></div></div>
      <div class="card stat-card"><div class="stat-icon pink">👨‍🏫</div><div class="stat-info"><h3>${s.totalTeachers}</h3><p>Teachers</p></div></div>
      <div class="card stat-card"><div class="stat-icon green">📅</div><div class="stat-info"><h3>${s.totalBookings}</h3><p>Bookings</p></div></div>
    </div>
    <div class="stats-grid">
      <div class="card stat-card"><div class="stat-icon purple">⏳</div><div class="stat-info"><h3>${s.pendingTeachers}</h3><p>Pending Teachers</p></div></div>
      <div class="card stat-card"><div class="stat-icon teal">✅</div><div class="stat-info"><h3>${s.completedBookings}</h3><p>Completed</p></div></div>
      <div class="card stat-card"><div class="stat-icon green">💰</div><div class="stat-info"><h3>${s.totalRevenue.toFixed(0)} DA</h3><p>Revenue</p></div></div>
    </div>
    <div class="card"><h3 style="margin-bottom:16px">Recent Users</h3>
      <div class="table-wrapper"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
        <tbody>${data.recentUsers.map(u => `<tr><td>${u.name}</td><td>${u.email}</td><td>${renderBadge(u.role)}</td><td>${renderBadge(u.status)}</td><td>${new Date(u.created_at).toLocaleDateString()}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>
  `;
}

async function loadAdminUsers(el) {
  const data = await API.get('/admin/users');
  el.innerHTML = `
    <div class="page-header"><h1>Manage Users</h1><p>View and manage all platform users</p></div>
    <div class="table-wrapper"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${data.users.map(u => `<tr>
        <td>${u.name}</td><td>${u.email}</td><td>${renderBadge(u.role)}</td><td>${renderBadge(u.status)}</td>
        <td>
          ${u.status === 'active' ? `<button class="btn btn-danger btn-sm" onclick="adminUpdateUser(${u.id},'suspended')">Suspend</button>` : `<button class="btn btn-success btn-sm" onclick="adminUpdateUser(${u.id},'active')">Activate</button>`}
        </td>
      </tr>`).join('')}</tbody>
    </table></div>
  `;
}

async function loadAdminTeachers(el) {
  const data = await API.get('/admin/teachers/pending');
  el.innerHTML = `
    <div class="page-header"><h1>Teacher Approvals</h1><p>Review and approve teacher applications</p></div>
    ${data.teachers.length ? `<div class="teacher-grid">${data.teachers.map(t => `
      <div class="card">
        <h3>${t.name}</h3><p style="color:var(--text-muted);margin-bottom:8px">${t.email}</p>
        <p style="margin-bottom:8px">${t.bio || 'No bio provided'}</p>
        <p><strong>Education:</strong> ${t.education || 'N/A'}</p>
        <p><strong>Rate:</strong> ${t.hourly_rate} DA/hr</p>
        <p><strong>Experience:</strong> ${t.experience_years} years</p>
        <div style="margin-top:16px;display:flex;gap:8px">
          <button class="btn btn-success btn-sm" onclick="adminTeacherStatus(${t.id},'approved')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="adminTeacherStatus(${t.id},'rejected')">Reject</button>
        </div>
      </div>
    `).join('')}</div>` : '<div class="empty-state"><div class="empty-icon">✅</div><h3>No pending applications</h3></div>'}
  `;
}

async function loadAdminBookings(el) {
  const data = await API.get('/bookings');
  el.innerHTML = `
    <div class="page-header"><h1>All Bookings</h1></div>
    <div class="table-wrapper"><table>
      <thead><tr><th>Student</th><th>Teacher</th><th>Subject</th><th>Date</th><th>Price</th><th>Status</th></tr></thead>
      <tbody>${data.bookings.map(b => `<tr>
        <td>${b.student_name || 'N/A'}</td><td>${b.teacher_name || 'N/A'}</td><td>${b.subject}</td>
        <td>${b.date}</td><td>${b.total_price} DA</td><td>${renderBadge(b.status)}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  `;
}

async function adminUpdateUser(id, status) {
  try {
    await API.put(`/admin/users/${id}`, { status });
    showToast(`User ${status}`);
    loadTabContent('admin-users');
  } catch (err) { showToast(err.message, 'error'); }
}

async function adminTeacherStatus(id, status) {
  try {
    await API.put(`/admin/teachers/${id}/status`, { status });
    showToast(`Teacher ${status}`);
    loadTabContent('admin-teachers');
  } catch (err) { showToast(err.message, 'error'); }
}
