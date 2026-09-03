(function () {
  let host;

  function ensureHost() {
    if (host) return host;
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.appendChild(host);
    return host;
  }

  function toast(message, type = 'info', timeout = 2200) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    ensureHost().appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 220);
    }, timeout);
  }

  window.toast = toast;
})();