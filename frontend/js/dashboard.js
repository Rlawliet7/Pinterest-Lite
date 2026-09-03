let currentUserId = null;

function formatBytes(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function loadUser() {
  try {
    const res = await window.api.request('/auth/me');
    const data = await res.json();
    if (!res.ok) return;
    const user = data.user;
    currentUserId = user._id;
    document.getElementById('user-name').textContent = user.name || user.email;
  } catch (err) {
    console.error('[ERR] Error loading user:', err.message);
  }
}

async function loadFeed() {
  const grid = document.getElementById('image-grid');
  const emptyState = document.getElementById('empty-state');

  try {
    const res = await window.api.request('/upload/feed');
    const data = await res.json();

    if (!res.ok) {
      window.toast(data.error?.message || 'Failed to load images', 'error');
      return;
    }

    grid.innerHTML = '';

    if (!data.images || data.images.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    const frag = document.createDocumentFragment();

    data.images.forEach((image) => {
      const pin = document.createElement('article');
      pin.className = 'pin';
      pin.dataset.id = image._id;

      const uploaderName = image.uploader?.name || image.uploader?.email || 'Unknown';
      const uploaderId = image.uploader?._id;

      pin.innerHTML = `
        <img src="${image.url}" alt="${image.originalName}" loading="lazy" />
        <div class="pin-overlay">
          <div class="pin-top-actions">
            <button class="pin-btn" data-action="download" data-id="${image._id}">
              <span>⬇</span> Download
            </button>
            ${image.isOwner ? `<button class="pin-btn danger" data-action="delete" data-id="${image._id}">Delete</button>` : ''}
          </div>
          <div class="pin-meta">
            <span class="avatar">${initials(uploaderName)}</span>
            <span>${uploaderName}</span>
          </div>
        </div>
        <div class="pin-footer">
          <span class="name" title="${image.originalName}">${image.originalName}</span>
          <span>${formatBytes(image.size)}</span>
        </div>
      `;

      pin.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        openLightbox(image.url, image.originalName);
      });

      frag.appendChild(pin);
    });

    grid.appendChild(frag);

    grid.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (btn.dataset.action === 'download') handleDownload(id);
        if (btn.dataset.action === 'delete') handleDelete(id);
      });
    });

    console.log('[LOG] Feed loaded:', data.images.length);
  } catch (err) {
    console.error('[ERR] Error loading feed:', err.message);
    window.toast('Something went wrong while loading the gallery', 'error');
  }
}

async function handleDownload(id) {
  const { accessToken } = window.api.getTokens();
  if (!accessToken) {
    window.toast('Please sign in to download', 'error');
    return;
  }
  try {
    window.toast('Preparing download...', 'info', 1200);
    const res = await fetch(`/api/upload/${id}/download`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    let filename = 'image';
    const disp = res.headers.get('Content-Disposition') || '';
    const match = /filename="([^"]+)"/.exec(disp);
    if (match) filename = match[1];

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    window.toast('Download started', 'success');
  } catch (err) {
    console.error('[ERR] Download error:', err.message);
    window.toast('Download failed', 'error');
  }
}

async function handleDelete(id) {
  if (!confirm('Delete this image?')) return;
  try {
    const res = await window.api.request(`/upload/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      window.toast(data.error?.message || 'Delete failed', 'error');
      return;
    }
    window.toast('Image deleted', 'success');
    loadFeed();
  } catch (err) {
    console.error('[ERR] Delete error:', err.message);
    window.toast('Delete failed', 'error');
  }
}

function openLightbox(url, alt) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  img.src = url;
  img.alt = alt || '';
  lb.classList.add('show');
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('show');
  document.getElementById('lightbox-img').src = '';
}

function initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
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
    } catch (err) {
      console.error('[ERR] Logout request error:', err.message);
    } finally {
      window.api.clearTokens();
      window.location.href = '/login.html';
    }
  });
}

window.loadFeed = loadFeed;

loadUser();
loadFeed();
initLightbox();
initLogout();