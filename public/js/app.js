// ============================================================
// CaptionAI — Complete SPA Application Logic
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // ---- State ----
  let currentSection = 'dashboard';
  let selectedFile = null;
  let selectedCaptionType = 'short';
  let generatedCaption = '';
  let savedCaptions = JSON.parse(localStorage.getItem('captionai_history') || '[]');
  let totalGenerated = parseInt(localStorage.getItem('captionai_total') || '0', 10);

  // ---- DOM References ----
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const sections = document.querySelectorAll('.content-section');

  const uploadDropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const previewFilename = document.getElementById('previewFilename');
  const previewSize = document.getElementById('previewSize');
  const removeBtn = document.getElementById('removeBtn');
  const replaceBtn = document.getElementById('replaceBtn');

  const captionTypeInputs = document.querySelectorAll('input[name="captionType"]');
  const captionTypeOptions = document.querySelectorAll('.caption-type-option');
  const generateBtn = document.getElementById('generateBtn');

  const resultArea = document.getElementById('resultArea');
  const resultTypeBadge = document.getElementById('resultTypeBadge');
  const resultCaption = document.getElementById('resultCaption');
  const resultWordCount = document.getElementById('resultWordCount');
  const resultCharCount = document.getElementById('resultCharCount');
  const resultBody = document.getElementById('resultBody');
  const resultEdit = document.getElementById('resultEdit');
  const editTextarea = document.getElementById('editTextarea');

  const copyBtn = document.getElementById('copyBtn');
  const editBtn = document.getElementById('editBtn');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const saveLibraryBtn = document.getElementById('saveLibraryBtn');

  const libraryGrid = document.getElementById('libraryGrid');
  const libraryEmpty = document.getElementById('libraryEmpty');
  const librarySearch = document.getElementById('librarySearch');
  const clearAllBtn = document.getElementById('clearAllBtn');

  const quickCreateBtn = document.getElementById('quickCreateBtn');

  const toastContainer = document.getElementById('toastContainer');

  // ============================================================
  // NAVIGATION
  // ============================================================
  function navigateTo(section) {
    currentSection = section;
    sections.forEach(s => s.classList.add('d-none'));
    const target = document.getElementById(section + '-section');
    if (target) target.classList.remove('d-none');

    sidebarLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === section);
    });

    // Close mobile sidebar
    closeMobileSidebar();

    // Refresh section data
    if (section === 'dashboard') updateDashboard();
    if (section === 'library') renderLibrary();
    if (section === 'settings') fetchHealthStatus();
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });

  if (quickCreateBtn) {
    quickCreateBtn.addEventListener('click', () => navigateTo('create'));
  }

  // ============================================================
  // MOBILE SIDEBAR
  // ============================================================
  function openMobileSidebar() {
    sidebar.classList.add('show');
    sidebarOverlay.classList.add('show');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('show');
    sidebarOverlay.classList.remove('show');
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (sidebar.classList.contains('show')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  function updateDashboard() {
    const statTotal = document.getElementById('statTotalGenerated');
    const statSaved = document.getElementById('statSavedCaptions');
    const statRecent = document.getElementById('statRecentActivity');

    if (statTotal) statTotal.textContent = totalGenerated;
    if (statSaved) statSaved.textContent = savedCaptions.length;

    if (statRecent) {
      if (savedCaptions.length > 0) {
        const lastItem = savedCaptions[savedCaptions.length - 1];
        const dateStr = lastItem.date ? formatRelativeDate(lastItem.date) : '—';
        statRecent.textContent = dateStr;
      } else {
        statRecent.textContent = '—';
      }
    }
  }

  function formatRelativeDate(dateStr) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    return days + 'd ago';
  }

  // ============================================================
  // IMAGE UPLOAD
  // ============================================================
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  // Drag and drop
  if (uploadDropzone) {
    uploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.add('dragover');
    });

    uploadDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.remove('dragover');
    });

    uploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    });

    uploadDropzone.addEventListener('click', (e) => {
      if (e.target === browseBtn || browseBtn.contains(e.target)) return;
      fileInput.click();
    });
  }

  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
    });
  }

  function handleFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Please upload a JPEG, PNG, or WebP image.', 'danger');
      return;
    }
    if (file.size > MAX_SIZE) {
      showToast('File size must be under 5 MB.', 'danger');
      return;
    }
    selectedFile = file;
    showPreview(file);
    generateBtn.disabled = false;
  }

  function showPreview(file) {
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewFilename.textContent = file.name;
    previewSize.textContent = formatFileSize(file.size);
    uploadDropzone.classList.add('d-none');
    imagePreview.classList.remove('d-none');
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function removeImage() {
    if (previewImg.src.startsWith('blob:')) {
      URL.revokeObjectURL(previewImg.src);
    }
    selectedFile = null;
    previewImg.src = '';
    fileInput.value = '';
    imagePreview.classList.add('d-none');
    uploadDropzone.classList.remove('d-none');
    generateBtn.disabled = true;
    resultArea.classList.add('d-none');
  }

  if (removeBtn) removeBtn.addEventListener('click', removeImage);
  if (replaceBtn) replaceBtn.addEventListener('click', () => fileInput.click());

  // ============================================================
  // CAPTION TYPE SELECTION
  // ============================================================
  captionTypeInputs.forEach(input => {
    input.addEventListener('change', () => {
      selectedCaptionType = input.value;
      captionTypeOptions.forEach(opt => {
        opt.classList.toggle('selected', opt.querySelector('input').value === input.value);
      });
    });
  });

  // ============================================================
  // GENERATE CAPTION
  // ============================================================
  async function generateCaptionRequest() {
    if (!selectedFile) {
      showToast('Please upload an image first.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('captionType', selectedCaptionType);

    // Loading state
    generateBtn.disabled = true;
    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Analyzing...';

    try {
      const response = await fetch('/api/caption', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to generate caption');
      }

      generatedCaption = data.generatedCaption || data.caption || '';
      displayResult({
        captionType: data.captionType || selectedCaptionType,
        caption: generatedCaption,
      });

      // Update stats
      totalGenerated++;
      localStorage.setItem('captionai_total', totalGenerated.toString());

      showToast('Caption generated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Something went wrong. Please try again.', 'danger');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnHTML;
    }
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', generateCaptionRequest);
  }

  // ============================================================
  // RESULT DISPLAY
  // ============================================================
  const captionTypeLabels = {
    short: 'Short Caption',
    detailed: 'Detailed Description',
    social: 'Social Media Caption',
    accessibility: 'Accessibility Alt Text',
    keywords: 'Keywords & Tags',
  };

  function displayResult(data) {
    resultArea.classList.remove('d-none');
    resultBody.classList.remove('d-none');
    resultEdit.classList.add('d-none');

    resultTypeBadge.textContent = captionTypeLabels[data.captionType] || data.captionType;
    resultCaption.textContent = data.caption;
    generatedCaption = data.caption;

    updateCounts(data.caption);

    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateCounts(text) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    resultWordCount.textContent = words + ' word' + (words !== 1 ? 's' : '');
    resultCharCount.textContent = chars + ' character' + (chars !== 1 ? 's' : '');
  }

  // ============================================================
  // RESULT ACTIONS
  // ============================================================

  // Copy
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(generatedCaption);
        showToast('Caption copied to clipboard!', 'success');
      } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = generatedCaption;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Caption copied to clipboard!', 'success');
      }
    });
  }

  // Edit
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      editTextarea.value = generatedCaption;
      resultBody.classList.add('d-none');
      resultEdit.classList.remove('d-none');
    });
  }

  if (saveEditBtn) {
    saveEditBtn.addEventListener('click', () => {
      generatedCaption = editTextarea.value;
      resultCaption.textContent = generatedCaption;
      updateCounts(generatedCaption);
      resultEdit.classList.add('d-none');
      resultBody.classList.remove('d-none');
      showToast('Caption updated.', 'success');
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      resultEdit.classList.add('d-none');
      resultBody.classList.remove('d-none');
    });
  }

  // Regenerate
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', generateCaptionRequest);
  }

  // Download
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!generatedCaption) return;
      const blob = new Blob([generatedCaption], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, '') : 'caption';
      a.download = baseName + '_caption.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Caption downloaded.', 'success');
    });
  }

  // Save to Library
  if (saveLibraryBtn) {
    saveLibraryBtn.addEventListener('click', () => {
      if (!generatedCaption) return;

      const entry = {
        captionType: selectedCaptionType,
        caption: generatedCaption,
        imageName: selectedFile ? selectedFile.name : 'Unknown',
        date: new Date().toISOString(),
      };

      savedCaptions.push(entry);
      localStorage.setItem('captionai_history', JSON.stringify(savedCaptions));
      showToast('Caption saved to library!', 'success');
    });
  }

  // ============================================================
  // LIBRARY
  // ============================================================
  function renderLibrary(filterQuery) {
    let items = savedCaptions;

    if (filterQuery && filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      items = items.filter(item =>
        item.caption.toLowerCase().includes(q) ||
        item.imageName.toLowerCase().includes(q) ||
        (captionTypeLabels[item.captionType] || '').toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      libraryGrid.innerHTML = '';
      libraryEmpty.classList.remove('d-none');
      return;
    }

    libraryEmpty.classList.add('d-none');

    libraryGrid.innerHTML = '';
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'library-card';

      const header = document.createElement('div');
      header.className = 'library-card-header';

      const badge = document.createElement('span');
      badge.className = 'badge bg-accent';
      badge.textContent = captionTypeLabels[item.captionType] || item.captionType;

      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn-delete';
      deleteButton.title = 'Delete';
      deleteButton.innerHTML = '<i class="bi bi-x-lg"></i>';
      // Find original index in savedCaptions
      const originalIdx = savedCaptions.indexOf(item);
      deleteButton.addEventListener('click', () => deleteFromLibrary(originalIdx));

      header.appendChild(badge);
      header.appendChild(deleteButton);

      const captionP = document.createElement('p');
      captionP.className = 'library-card-caption';
      captionP.textContent = item.caption;

      const meta = document.createElement('div');
      meta.className = 'library-card-meta';

      const fileSpan = document.createElement('span');
      fileSpan.textContent = item.imageName || 'Unknown';

      const dateSpan = document.createElement('span');
      dateSpan.textContent = item.date ? new Date(item.date).toLocaleDateString() : '';

      meta.appendChild(fileSpan);
      meta.appendChild(dateSpan);

      card.appendChild(header);
      card.appendChild(captionP);
      card.appendChild(meta);

      libraryGrid.appendChild(card);
    });
  }

  function deleteFromLibrary(index) {
    if (index < 0 || index >= savedCaptions.length) return;
    savedCaptions.splice(index, 1);
    localStorage.setItem('captionai_history', JSON.stringify(savedCaptions));
    renderLibrary(librarySearch ? librarySearch.value : '');
    showToast('Caption deleted.', 'success');
  }

  if (librarySearch) {
    librarySearch.addEventListener('input', () => {
      renderLibrary(librarySearch.value);
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (savedCaptions.length === 0) return;
      if (!confirm('Are you sure you want to clear all saved captions?')) return;
      savedCaptions = [];
      localStorage.removeItem('captionai_history');
      renderLibrary();
      showToast('Library cleared.', 'success');
    });
  }

  // ============================================================
  // NOTIFICATIONS (Toast)
  // ============================================================
  function showToast(message, type) {
    type = type || 'info';
    const bgClass = {
      success: 'bg-success',
      danger: 'bg-danger',
      warning: 'bg-warning',
      info: 'bg-secondary',
    }[type] || 'bg-secondary';

    const iconClass = {
      success: 'bi-check-circle-fill',
      danger: 'bi-exclamation-triangle-fill',
      warning: 'bi-exclamation-circle-fill',
      info: 'bi-info-circle-fill',
    }[type] || 'bi-info-circle-fill';

    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white border-0 ' + bgClass;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    const flexDiv = document.createElement('div');
    flexDiv.className = 'd-flex';

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'toast-body';

    const icon = document.createElement('i');
    icon.className = 'bi ' + iconClass + ' me-2';
    bodyDiv.appendChild(icon);
    bodyDiv.appendChild(document.createTextNode(message));

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close btn-close-white me-2 m-auto';
    closeBtn.setAttribute('data-bs-dismiss', 'toast');
    closeBtn.setAttribute('aria-label', 'Close');

    flexDiv.appendChild(bodyDiv);
    flexDiv.appendChild(closeBtn);
    toastEl.appendChild(flexDiv);

    toastContainer.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }

  // ============================================================
  // SETTINGS — Health Check
  // ============================================================
  async function fetchHealthStatus() {
    const apiStatus = document.getElementById('apiStatus');
    if (!apiStatus) return;

    apiStatus.innerHTML = '<div class="status-indicator"><span class="status-dot status-checking"></span><span>Checking connection...</span></div>';

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (data.status === 'ok') {
        const configured = data.apiConfigured ? 'API key configured' : 'API key not configured';
        const model = data.model || 'Unknown';
        apiStatus.innerHTML = '';

        const indicator = document.createElement('div');
        indicator.className = 'status-indicator mb-2';

        const dot = document.createElement('span');
        dot.className = 'status-dot status-ok';
        const label = document.createElement('span');
        label.textContent = 'Server is running';

        indicator.appendChild(dot);
        indicator.appendChild(label);
        apiStatus.appendChild(indicator);

        const details = document.createElement('ul');
        details.className = 'list-unstyled settings-list mb-0';

        const li1 = document.createElement('li');
        li1.innerHTML = '<strong>Status:</strong> ';
        li1.appendChild(document.createTextNode(configured));

        const li2 = document.createElement('li');
        li2.innerHTML = '<strong>Model:</strong> ';
        li2.appendChild(document.createTextNode(model));

        details.appendChild(li1);
        details.appendChild(li2);
        apiStatus.appendChild(details);
      } else {
        throw new Error('Unexpected status');
      }
    } catch {
      apiStatus.innerHTML = '<div class="status-indicator"><span class="status-dot status-error"></span><span>Unable to reach server</span></div>';
    }
  }

  // ============================================================
  // INIT
  // ============================================================
  updateDashboard();
  renderLibrary();
  fetchHealthStatus();
  navigateTo('dashboard');
});
