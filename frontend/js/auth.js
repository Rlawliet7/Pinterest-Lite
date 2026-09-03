function showAlert(el, message, type = 'error') {
  el.textContent = message;
  el.className = `alert show alert-${type}`;
}

async function handleAuthRedirectIfLoggedIn() {
  const { accessToken } = window.api.getTokens();
  if (accessToken) {
    window.location.href = '/dashboard.html';
  }
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('alert');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await window.api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error('[ERR] Login failed:', data.error?.message);
        showAlert(alertEl, data.error?.message || 'Login failed');
        return;
      }

      window.api.setTokens(data);
      console.log('[LOG] Login successful, redirecting to dashboard');
      window.location.href = '/dashboard.html';
    } catch (err) {
      console.error('[ERR] Login request error:', err.message);
      showAlert(alertEl, 'Something went wrong. Please try again.');
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('alert');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await window.api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error('[ERR] Registration failed:', data.error?.message);
        showAlert(alertEl, data.error?.message || 'Registration failed');
        return;
      }

      window.api.setTokens(data);
      console.log('[LOG] Registration successful, redirecting to dashboard');
      window.location.href = '/dashboard.html';
    } catch (err) {
      console.error('[ERR] Registration request error:', err.message);
      showAlert(alertEl, 'Something went wrong. Please try again.');
    }
  });
}

handleAuthRedirectIfLoggedIn();
initLoginForm();
initRegisterForm();