async function loadUser() {
  try {
    const res = await window.api.request('/auth/me');
    const data = await res.json();

    if (!res.ok) {
      console.error('[ERR] Failed to load user info');
      return;
    }

    document.getElementById('user-name').textContent = data.user.name || data.user.email;
    console.log('[LOG] User info loaded:', data.user.email);
  } catch (err) {
    console.error('[ERR] Error loading user:', err.message);
  }
}

async function loadImages() {
  const grid = document.getElementById('image-grid');
  const emptyState = document.getElementById('empty-state');

  try {
    const res = await window.api.request('/upload');
    const data = await res.json();

    if (!res.ok) {
      console.error('[ERR] Failed to load images');
      return;
    }

    grid.innerHTML = '';

    if (data.images.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    data.images.forEach((image) => {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.innerHTML = `
        <img src="${image.url}" alt="${image.originalName}" />
        <div class="image-card-body">
          <span title="${image.originalName}">${image.originalName}</span>
          <button class="btn-danger" data-id="${image._id}">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });

    console.log('[LOG] Loaded images:', data.images.length);
  } catch (err) {
    console.error('[ERR] Error loading images:', err.message);
  }
}

async function handleDelete(id) {
  if (!confirm('Delete this image?')) return;

  try {
    const res = await window.api.request(`/upload/${id}`, { method: 'DELETE' });

    if (!res.ok && res.status !== 204) {
      const data = await res.json();
      console.error('[ERR] Delete failed:', data.error?.message);
      alert(data.error?.message || 'Delete failed');
      return;
    }

    console.log('[LOG] Image deleted:', id);
    loadImages();
  } catch (err) {
    console.error('[ERR] Error deleting image:', err.message);
  }
}

function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const { refreshToken } = window.api.getTokens();
    try {
      await window.api.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      console.log('[LOG] Logged out successfully');
    } catch (err) {
      console.error('[ERR] Logout request error:', err.message);
    } finally {
      window.api.clearTokens();
      window.location.href = '/login.html';
    }
  });
}

window.loadImages = loadImages;

loadUser();
loadImages();
initLogout();