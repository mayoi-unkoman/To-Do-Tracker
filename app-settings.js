/* app-settings.js - Settings, emoji setup */
'use strict';

// ---- Emoji Picker Setup ----
function setupEmojiPanel(btnId, panelId, catsId, gridId) {
  const btn = $('#' + btnId), panel = $('#' + panelId), catsEl = $('#' + catsId), grid = $('#' + gridId);
  let currentCat = Object.keys(EMOJI_CATS)[0];
  function renderGrid() {
    grid.innerHTML = (EMOJI_CATS[currentCat] || []).map(e => `<span>${e}</span>`).join('');
  }
  function renderCats() {
    catsEl.innerHTML = Object.keys(EMOJI_CATS).map(c =>
      `<button type="button" class="emoji-cat-btn${c === currentCat ? ' active' : ''}" data-cat="${c}">${EMOJI_CATS[c][0]}</button>`
    ).join('');
  }
  btn.addEventListener('click', e => {
    e.preventDefault();
    const show = panel.style.display === 'none';
    panel.style.display = show ? 'block' : 'none';
    if (show) { renderCats(); renderGrid(); }
  });
  catsEl.addEventListener('click', e => {
    const b = e.target.closest('.emoji-cat-btn'); if (!b) return;
    currentCat = b.dataset.cat; renderCats(); renderGrid();
  });
  grid.addEventListener('click', e => {
    if (e.target.tagName === 'SPAN') { btn.textContent = e.target.textContent; panel.style.display = 'none'; }
  });
}

// ---- File Upload Helpers ----
function setupIconUpload(uploadId, previewId, btnId, clearId, setFn) {
  const upload = $('#' + uploadId), preview = $('#' + previewId), btn = $('#' + btnId), clear = $('#' + clearId);
  btn.addEventListener('click', e => { e.preventDefault(); upload.click(); });
  upload.addEventListener('change', () => {
    if (!upload.files[0]) return;
    resizeImage(upload.files[0], 64, dataUrl => {
      setFn(dataUrl);
      preview.textContent = ''; preview.style.backgroundImage = `url(${dataUrl})`;
    });
    upload.value = '';
  });
  clear.addEventListener('click', e => {
    e.preventDefault(); setFn(null);
    preview.textContent = 'なし'; preview.style.backgroundImage = '';
  });
}


function openSettings() {
  openModal('settings-overlay');
  // Reset to first tab
  $$('.settings-tab').forEach(t => t.classList.remove('active'));
  $$('.settings-panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
  const firstTab = $('.settings-tab');
  if (firstTab) firstTab.classList.add('active');
  const firstPanel = $('#stab-bg');
  if (firstPanel) { firstPanel.style.display = ''; firstPanel.classList.add('active'); }
  // BG preview
  const bp = $('#bg-preview-box');
  if (state.settings.backgroundImage) {
    bp.innerHTML = ''; bp.style.backgroundImage = `url(${state.settings.backgroundImage})`;
  } else {
    bp.innerHTML = '<span class="bg-placeholder">画像未設定</span>'; bp.style.backgroundImage = '';
  }
  // Notify status
  const ns = $('#notify-status');
  if ('Notification' in window) {
    ns.textContent = Notification.permission === 'granted' ? '✅ 通知は許可されています' :
      Notification.permission === 'denied' ? '❌ 通知はブロックされています' : '⏳ 未設定';
  } else {
    ns.textContent = '❌ このブラウザは通知をサポートしていません';
  }
  renderCustomMessages();
  // Theme
  renderThemePresets();
  renderSavedColors();
  const t = state.settings.theme || { h: 142, s: 71, l: 45 };
  $('#picker-h').value = t.h; $('#picker-s').value = t.s; $('#picker-l').value = t.l;
  updatePickerPreview();
  // Task size
  $('#task-size-slider').value = state.settings.taskScale || 100;
  // Task opacity
  $('#task-opacity-slider').value = state.settings.taskOpacity != null ? state.settings.taskOpacity : 100;
  // Random background
  $('#bg-random-toggle').checked = !!state.settings.bgRandom;
  const bgImgs = state.settings.backgroundImages || [];
  const bgList = $('#bg-multi-list');
  if (!bgImgs.length) { bgList.innerHTML = '<p class="empty-sub">画像はまだありません</p>'; }
  else {
    bgList.innerHTML = bgImgs.map((img, i) =>
      `<div class="bg-multi-item"><div class="bg-multi-thumb" style="background-image:url(${img})"></div><button class="bg-multi-del" data-i="${i}" type="button">✕</button></div>`
    ).join('');
  }
}