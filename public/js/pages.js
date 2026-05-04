// Landing, Login, Register pages

function renderLanding() {
  return `
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">✨ The #1 Home Tutoring Platform</div>
          <h1>Learn From The<br><span class="gradient-text">Best Tutors</span> At Home</h1>
          <p>Connect with verified, expert tutors for personalized one-on-one sessions. Transform your learning experience with TutorHub.</p>
          <div class="hero-buttons">
            <a href="#" onclick="navigate('register')" class="btn btn-primary">Start Learning →</a>
            <a href="#" onclick="navigate('register')" class="btn btn-secondary">Become a Tutor</a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><h3>500+</h3><p>Expert Tutors</p></div>
            <div class="hero-stat"><h3>10K+</h3><p>Students</p></div>
            <div class="hero-stat"><h3>50K+</h3><p>Sessions</p></div>
            <div class="hero-stat"><h3>4.9</h3><p>Avg Rating</p></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="features">
      <div class="container">
        <div class="section-header">
          <h2>Why Choose <span class="gradient-text">TutorHub</span>?</h2>
          <p>Everything you need for a world-class learning experience</p>
        </div>
        <div class="features-grid">
          <div class="card feature-card"><div class="feature-icon">🎯</div><h3>Personalized Learning</h3><p>Get one-on-one sessions tailored to your pace and learning style.</p></div>
          <div class="card feature-card"><div class="feature-icon">✅</div><h3>Verified Tutors</h3><p>Every tutor is vetted and approved by our admin team for quality.</p></div>
          <div class="card feature-card"><div class="feature-icon">📅</div><h3>Flexible Scheduling</h3><p>Book sessions at times that work best for you and your family.</p></div>
          <div class="card feature-card"><div class="feature-icon">💰</div><h3>Transparent Pricing</h3><p>See hourly rates upfront with no hidden fees or surprises.</p></div>
          <div class="card feature-card"><div class="feature-icon">⭐</div><h3>Ratings & Reviews</h3><p>Read honest reviews from students to find your perfect tutor.</p></div>
          <div class="card feature-card"><div class="feature-icon">🔒</div><h3>Secure Platform</h3><p>Your data and payments are protected with enterprise security.</p></div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand"><h3>🎓 TutorHub</h3><p>Connecting students with expert tutors for personalized home learning experiences.</p></div>
          <div><h4>Platform</h4><ul><li><a href="#">Find Tutors</a></li><li><a href="#">Become a Tutor</a></li><li><a href="#">Pricing</a></li></ul></div>
          <div><h4>Company</h4><ul><li><a href="#">About Us</a></li><li><a href="#">Careers</a></li><li><a href="#">Blog</a></li></ul></div>
          <div><h4>Support</h4><ul><li><a href="#">Help Center</a></li><li><a href="#">Contact</a></li><li><a href="#">Privacy</a></li></ul></div>
        </div>
        <div class="footer-bottom">© 2026 TutorHub. All rights reserved.</div>
      </div>
    </footer>
  `;
}

function renderLogin() {
  return `
    <div class="auth-page">
      <div class="auth-card glass">
        <h1>Welcome Back</h1>
        <p class="subtitle">Sign in to your TutorHub account</p>
        <form id="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label for="login-email">Email Address</label>
            <input type="email" id="login-email" class="form-control" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="Enter your password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="login-btn">Sign In</button>
        </form>
        <div class="auth-divider">Don't have an account?</div>
        <a href="#" onclick="navigate('register')" class="btn btn-secondary btn-block">Create Account</a>
      </div>
    </div>
  `;
}

function renderRegister() {
  return `
    <div class="auth-page">
      <div class="auth-card glass">
        <h1>Join TutorHub</h1>
        <p class="subtitle">Create your account to get started</p>
        <form id="register-form" onsubmit="handleRegister(event)">
          <div class="form-group">
            <label>I am a...</label>
            <div class="role-selector">
              <div class="role-option active" data-role="student" onclick="selectRole(this)">
                <div class="role-icon">🎓</div>
                <div class="role-label">Student</div>
              </div>
              <div class="role-option" data-role="teacher" onclick="selectRole(this)">
                <div class="role-icon">👨‍🏫</div>
                <div class="role-label">Teacher</div>
              </div>
            </div>
            <input type="hidden" id="reg-role" value="student">
          </div>
          <div class="form-group">
            <label for="reg-name">Full Name</label>
            <input type="text" id="reg-name" class="form-control" placeholder="John Doe" required>
          </div>
          <div class="form-group">
            <label for="reg-email">Email Address</label>
            <input type="email" id="reg-email" class="form-control" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label for="reg-phone">Phone Number</label>
            <input type="tel" id="reg-phone" class="form-control" placeholder="+1 234 567 890">
          </div>
          <div class="form-group">
            <label for="reg-password">Password</label>
            <input type="password" id="reg-password" class="form-control" placeholder="Min 6 characters" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="reg-btn">Create Account</button>
        </form>
        <div class="auth-divider">Already have an account?</div>
        <a href="#" onclick="navigate('login')" class="btn btn-secondary btn-block">Sign In</a>
      </div>
    </div>
  `;
}

function selectRole(el) {
  document.querySelectorAll('.role-option').forEach(r => r.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('reg-role').value = el.dataset.role;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  try {
    await Auth.login(
      document.getElementById('login-email').value,
      document.getElementById('login-password').value
    );
    showToast('Welcome back!');
    navigate('dashboard');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  btn.textContent = 'Creating account...';
  btn.disabled = true;
  try {
    await Auth.register(
      document.getElementById('reg-name').value,
      document.getElementById('reg-email').value,
      document.getElementById('reg-password').value,
      document.getElementById('reg-role').value,
      document.getElementById('reg-phone').value
    );
    showToast('Account created successfully!');
    navigate('dashboard');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
}
