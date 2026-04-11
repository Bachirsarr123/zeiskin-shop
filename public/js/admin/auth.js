/**
 * ZEISKIN Admin — Auth Guard
 * À inclure dans toutes les pages admin
 */

const AdminAuth = {
  token: null,

  init() {
    this.token = sessionStorage.getItem('zeiskin_token');
    if (!this.token) {
      window.location.href = '/admin/index.html';
      return false;
    }
    this.verify();
    return true;
  },

  async verify() {
    try {
      await API.Auth.verify();
    } catch (e) {
      sessionStorage.removeItem('zeiskin_token');
      window.location.href = '/admin/index.html';
    }
  },

  logout() {
    sessionStorage.removeItem('zeiskin_token');
    window.location.href = '/admin/index.html';
  }
};

// Login form handler
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // If already logged in, redirect
  if (sessionStorage.getItem('zeiskin_token')) {
    window.location.href = '/admin/dashboard.html';
    return;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('login-error');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    btn.disabled = true;
    btn.textContent = 'Connexion...';
    errorEl?.classList.remove('show');

    try {
      const data = await API.Auth.login({ username, password });
      sessionStorage.setItem('zeiskin_token', data.token);
      window.location.href = '/admin/dashboard.html';
    } catch (err) {
      errorEl && (errorEl.textContent = err.message);
      errorEl?.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  // Set logout button
  document.getElementById('logout-btn')?.addEventListener('click', () => AdminAuth.logout());

  // Sidebar Toggle for Mobile
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });
    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
        sidebar.classList.remove('open');
      }
    });
  }
});

window.AdminAuth = AdminAuth;
