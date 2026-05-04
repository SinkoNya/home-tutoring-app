// Main SPA Router
let currentPage = 'landing';

function navigate(page) {
  currentPage = page;
  const app = document.getElementById('app');
  renderNavbar();

  switch (page) {
    case 'landing':
      app.innerHTML = renderLanding();
      break;
    case 'login':
      if (Auth.isLoggedIn()) { navigate('dashboard'); return; }
      app.innerHTML = renderLogin();
      break;
    case 'register':
      if (Auth.isLoggedIn()) { navigate('dashboard'); return; }
      app.innerHTML = renderRegister();
      break;
    case 'dashboard':
      if (!Auth.isLoggedIn()) { navigate('login'); return; }
      const user = Auth.getUser();
      app.innerHTML = renderDashboard(user.role);
      // Auto-load first tab
      setTimeout(() => {
        if (user.role === 'student') loadTabContent('find-tutors');
        else if (user.role === 'teacher') loadTabContent('teacher-overview');
        else if (user.role === 'admin') loadTabContent('admin-overview');
      }, 100);
      break;
    default:
      app.innerHTML = renderLanding();
  }

  window.scrollTo(0, 0);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    navigate('dashboard');
  } else {
    navigate('landing');
  }
});
