function initUpload() {
  const fileInput = document.getElementById('image-input');
  const previewImg = document.getElementById('preview-img');
  const uploadBtn = document.getElementById('upload-btn');
  const providerSelect = document.getElementById('provider-select');
  const alertEl = document.getElementById('upload-alert');

  if (!fileInput) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    previewImg.src = URL.createObjectURL(file);
    previewImg.classList.add('show');
  });

  uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const provider = providerSelect.value;

    if (!file) {
      showUploadAlert('Please select an image first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('provider', provider);

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    try {
      const res = await window.api.request('/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        console.error('[ERR] Upload failed:', data.error?.message);
        showUploadAlert(data.error?.message || 'Upload failed', 'error');
        return;
      }

      console.log('[LOG] Upload successful:', data.image._id);
      showUploadAlert('Image uploaded successfully', 'success');
      if (window.toast) window.toast('Upload complete', 'success');

      fileInput.value = '';
      previewImg.classList.remove('show');
      previewImg.src = '';

      if (window.loadFeed) window.loadFeed();
    } catch (err) {
      console.error('[ERR] Upload request error:', err.message);
      showUploadAlert('Something went wrong during upload', 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload';
    }
  });

  function showUploadAlert(message, type) {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = `alert show alert-${type}`;
  }
}

initUpload();