/* app-quickadd.js - Split from app.js */
'use strict';

// ===== Quick-Add Bottom Sheet Logic =====
let qsState = { date: '', dateStr: '', priority: '', priorityColor: '', repeat: '', emoji: '', category: '', tags: [] };
let qsDpYear = new Date().getFullYear(), qsDpMonth = new Date().getMonth();
let qsEmojiCat = Object.keys(EMOJI_CATS)[0]; // default first category

function openAddSheet() {
  qsState = { date: '', dateStr: '', priority: '', priorityColor: '', repeat: '', emoji: '', category: '', tags: [] };
  qsDpYear = new Date().getFullYear(); qsDpMonth = new Date().getMonth();
  const overlay = document.getElementById('add-overlay');
  overlay.classList.add('open');
  // Clear extra fields
  const tagsInput = document.getElementById('add-tags-input');
  const memoInput = document.getElementById('add-memo-input');
  const urlInput = document.getElementById('add-url-input');
  if (tagsInput) tagsInput.value = '';
  if (memoInput) memoInput.value = '';
  if (urlInput) urlInput.value = '';
  qsUpdateInfo();
  qsRenderDatePicker();
  qsRenderEmojiTabs();
  qsRenderEmojiGrid();
  qsRenderCatPopup();
  setTimeout(() => document.getElementById('add-title').focus(), 300);
  // iOS keyboard handling: adjust sheet position
  if (window.visualViewport) {
    const adjustSheet = () => {
      const sheet = document.querySelector('.add-sheet');
      if (!sheet || !overlay.classList.contains('open')) return;
      const vv = window.visualViewport;
      const diff = window.innerHeight - vv.height;
      sheet.style.transform = diff > 50 ? `translateY(-${diff}px)` : '';
    };
    window.visualViewport.addEventListener('resize', adjustSheet);
    // Cleanup on close
    const origClose = closeAddSheet;
    closeAddSheet = function() {
      window.visualViewport.removeEventListener('resize', adjustSheet);
      const sheet = document.querySelector('.add-sheet');
      if (sheet) sheet.style.transform = '';
      closeAddSheet = origClose;
      origClose();
    };
  }
}
function closeAddSheet() {
  document.getElementById('add-overlay').classList.remove('open');
  qsCloseAllPanels();
  qsCloseCat();
}
function qsCloseAllPanels() {
  document.querySelectorAll('.add-panel').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.add-tool-btn').forEach(b => b.classList.remove('active'));
}
function qsTogglePanel(name) {
  const panel = document.getElementById('panel-' + name);
  const btn = document.getElementById('tool-' + name);
  const isOpen = panel.classList.contains('open');
  qsCloseAllPanels();
  qsCloseCat();
  if (!isOpen) {
    panel.classList.add('open');
    if (btn) btn.classList.add('active');
    if (name === 'date') qsRenderDatePicker();
    if (name === 'emoji') { qsRenderEmojiTabs(); qsRenderEmojiGrid(); }
  }
}

// Date Picker
function qsRenderDatePicker() {
  const el = document.getElementById('dp-days');
  if (!el) return;
  const fd = new Date(qsDpYear, qsDpMonth, 1).getDay();
  const dim = new Date(qsDpYear, qsDpMonth + 1, 0).getDate();
  const today = new Date();
  const mNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  document.getElementById('dp-month-title').textContent = mNames[qsDpMonth];
  let h = '';
  for (let i = 0; i < fd; i++) h += '<span class="empty"></span>';
  for (let d = 1; d <= dim; d++) {
    const isToday = (qsDpYear === today.getFullYear() && qsDpMonth === today.getMonth() && d === today.getDate());
    const dateKey = `${qsDpYear}-${String(qsDpMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const sel = qsState.dateStr === dateKey;
    h += `<span class="${isToday ? 'today' : ''}${sel ? ' selected' : ''}" onclick="qsSelectDate(${d})">${d}</span>`;
  }
  el.innerHTML = h;
}
function qsDpPrev() { qsDpMonth--; if (qsDpMonth < 0) { qsDpMonth = 11; qsDpYear--; } qsRenderDatePicker(); }
function qsDpNext() { qsDpMonth++; if (qsDpMonth > 11) { qsDpMonth = 0; qsDpYear++; } qsRenderDatePicker(); }
function qsSelectDate(d) {
  qsState.dateStr = `${qsDpYear}-${String(qsDpMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  qsState.date = `${qsDpMonth + 1}月${d}日`;
  qsUpdateInfo();
  qsRenderDatePicker();
}

// Priority — now also stored as data for check-btn coloring
function qsSetPriority(label, color) {
  qsState.priority = label;
  qsState.priorityColor = color;
  qsUpdateInfo();
  qsCloseAllPanels();
}

// Quick date selection
function qsQuickDate(type) {
  const today = new Date();
  let d = new Date(today);
  switch (type) {
    case 'today': break;
    case 'tomorrow': d.setDate(d.getDate() + 1); break;
    case 'nextmon':
      d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
      break;
    case 'evening': break; // same day
  }
  qsDpYear = d.getFullYear(); qsDpMonth = d.getMonth();
  qsState.dateStr = formatDate(d);
  qsState.date = `${d.getMonth() + 1}月${d.getDate()}日`;
  if (type === 'evening') qsState.date += '（夕方）';
  qsUpdateInfo();
  qsRenderDatePicker();
}

// Repeat
function qsSetRepeat(label) {
  qsState.repeat = label;
  qsUpdateInfo();
  qsCloseAllPanels();
}

// Tag — focus the dedicated tag input field
function qsAddTag() {
  qsCloseCat(); qsCloseAllPanels();
  const tagInput = document.getElementById('add-tags-input');
  if (tagInput) {
    tagInput.focus();
  }
}

// Emoji Picker (uses EMOJI_CATS from outer scope)
function qsRenderEmojiTabs() {
  const tabsEl = document.getElementById('qs-emoji-tabs');
  if (!tabsEl) return;
  tabsEl.innerHTML = Object.keys(EMOJI_CATS).map(cat =>
    `<button class="qs-emoji-tab${cat === qsEmojiCat ? ' active' : ''}" onclick="qsSwitchEmojiCat('${cat}')">${cat}</button>`
  ).join('');
}
function qsRenderEmojiGrid() {
  const gridEl = document.getElementById('qs-emoji-grid');
  if (!gridEl) return;
  const emojis = EMOJI_CATS[qsEmojiCat] || [];
  // Bug#5 fix: Use data attributes + event delegation instead of inline onclick
  gridEl.innerHTML = emojis.map(e =>
    `<span class="qs-emoji-pick" data-emoji="${e}">${e}</span>`
  ).join('');
  gridEl.querySelectorAll('.qs-emoji-pick').forEach(el => {
    el.addEventListener('click', () => qsPickEmoji(el.dataset.emoji));
  });
}
function qsSwitchEmojiCat(cat) {
  qsEmojiCat = cat;
  qsRenderEmojiTabs();
  qsRenderEmojiGrid();
}
function qsPickEmoji(emoji) {
  qsState.emoji = emoji;
  qsUpdateInfo();
  qsCloseAllPanels();
}

// Category
function qsToggleCat() {
  qsCloseAllPanels();
  const popup = document.getElementById('cat-popup');
  popup.classList.toggle('open');
}
function qsCloseCat() {
  document.getElementById('cat-popup').classList.remove('open');
}
function qsRenderCatPopup() {
  const popup = document.getElementById('cat-popup');
  if (!popup) return;
  // Build category list from state
  const cats = new Set();
  state.tasks.forEach(t => { if (t.category && t.category !== 'カレンダー') cats.add(t.category); });
  if (state.savedCategories) state.savedCategories.forEach(c => { if (c !== 'カレンダー') cats.add(c); });
  const catIcons = { '健康管理': '🏋️', '学習': '📖', '習慣': '🌿', '仕事': '💼' };
  let h = '';
  [...cats].forEach(cat => {
    const icon = catIcons[cat] || '📁';
    // Bug#6 fix: Use data attributes instead of inline onclick to avoid single-quote escaping issues
    h += `<div class="cat-item" data-cat-icon="${escapeHtml(icon)}" data-cat-name="${escapeHtml(cat)}">\
<span class="cat-item-icon">${icon}</span>${escapeHtml(cat)}</div>`;
  });
  h += `<div class="cat-item cat-add-item" data-action="new-cat"><span class="cat-item-icon">＋</span>カテゴリを追加する</div>`;
  popup.innerHTML = h;
  // Bug#6 fix: Event delegation for category selection
  popup.querySelectorAll('.cat-item[data-cat-name]').forEach(el => {
    el.addEventListener('click', () => qsSelectCat(el.dataset.catIcon, el.dataset.catName));
  });
  const newCatBtn = popup.querySelector('[data-action="new-cat"]');
  if (newCatBtn) newCatBtn.addEventListener('click', () => openNewCat());
}
function qsSelectCat(icon, name) {
  qsState.category = name;
  qsUpdateInfo();
  qsCloseCat();
}

// New Category
function openNewCat() {
  qsCloseCat();
  document.getElementById('newcat-overlay').classList.add('open');
  document.getElementById('newcat-name').value = '';
  document.querySelectorAll('.newcat-color').forEach(c => c.classList.remove('selected'));
  document.querySelector('.newcat-color.none').classList.add('selected');
  setTimeout(() => document.getElementById('newcat-name').focus(), 200);
}
function closeNewCat() {
  document.getElementById('newcat-overlay').classList.remove('open');
}
function saveNewCat() {
  const name = document.getElementById('newcat-name').value.trim();
  if (name) {
    // 選択された色を取得
    const selectedColor = document.querySelector('.newcat-color.selected');
    const color = selectedColor ? selectedColor.dataset.color || '' : '';
    saveCategory(name, color || undefined);
    qsState.category = name;
    qsUpdateInfo();
    qsRenderCatPopup();
  }
  closeNewCat();
}
// Bug#8 fix: Accept the color argument properly
function selectNewCatColor(el, color) {
  document.querySelectorAll('.newcat-color').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

// Update info chips
function qsUpdateInfo() {
  const el = document.getElementById('add-selected-info');
  if (!el) return;
  let chips = '';
  if (qsState.emoji) chips += `<span class="add-info-chip emoji">${qsState.emoji}</span>`;
  if (qsState.date) chips += `<span class="add-info-chip date">📅 ${qsState.date}</span>`;
  if (qsState.priority) chips += `<span class="add-info-chip priority" style="background:${qsState.priorityColor}20;color:${qsState.priorityColor}">🚩 ${qsState.priority}</span>`;
  if (qsState.repeat) chips += `<span class="add-info-chip repeat">🔄 ${qsState.repeat}</span>`;
  if (qsState.category) chips += `<span class="add-info-chip category">📋 ${qsState.category}</span>`;
  el.innerHTML = chips;
}

// Submit - creates a real task using existing addTask logic
function qsSubmit() {
  const name = document.getElementById('add-title').value.trim();
  if (!name) { document.getElementById('add-title').focus(); return; }
  // Parse frequency AND timing from repeat setting
  let freq = '毎日', freqCount = null, timing = 'いつでも';
  if (qsState.repeat === '週3回') { freq = '週'; freqCount = 3; }
  else if (qsState.repeat === '平日のみ') { freq = '毎日'; timing = '平日のみ'; }
  else if (qsState.repeat === '週末のみ') { freq = '毎日'; timing = '週末のみ'; }
  else if (qsState.repeat === '毎日') { freq = '毎日'; }

  // タグを独立フィールドから取得
  const tagsInput = document.getElementById('add-tags-input');
  const tagsVal = tagsInput ? tagsInput.value.trim() : '';
  const inputTags = tagsVal ? tagsVal.split(/[,、\s#]+/).filter(Boolean) : [];
  const allTags = [...new Set([...inputTags, ...(qsState.tags || [])])];

  // URLとメモを独立フィールドから取得
  const urlInput = document.getElementById('add-url-input');
  const memoInput = document.getElementById('add-memo-input');
  const url = urlInput ? urlInput.value.trim() : '';
  const description = memoInput ? memoInput.value.trim() : '';

  state.tasks.push({
    id: genId(), name: name,
    emoji: qsState.emoji || '',
    timing: timing,
    frequency: freq,
    freqCount: freqCount,
    url: url,
    category: qsState.category || '',
    createdDate: qsState.dateStr || todayStr(),
    customIcon: null,
    notifyTime: '',
    lastNotifiedDate: null,
    priority: qsState.priority || '',
    tags: allTags,
    description: description,
  });
  if (qsState.category) saveCategory(qsState.category);
  // カレンダーカテゴリの場合、scheduledTasksにも同期追加
  if ((qsState.category || '') === 'カレンダー') {
    const newTask = state.tasks[state.tasks.length - 1];
    const schId = genId();
    state.scheduledTasks.push({
      id: schId, date: newTask.createdDate, name: newTask.name,
      emoji: newTask.emoji, timing: newTask.timing,
      url: newTask.url, category: 'カレンダー',
      notifyTime: '', memo: newTask.description || '',
      addedToTasks: true,
    });
    newTask.scheduledId = schId;
  }
  resetCelebration(); save(); syncNotifySchedules();
  closeAddSheet();
  if (typeof renderCalendar === 'function') renderCalendar();
  renderAll();
  showToast('✨ タスクを追加しました');
}

// Expose to window for onclick handlers
window.openAddSheet = openAddSheet;
window.closeAddSheet = closeAddSheet;
window.qsTogglePanel = qsTogglePanel;
window.qsDpPrev = qsDpPrev;
window.qsDpNext = qsDpNext;
window.qsSelectDate = qsSelectDate;
window.qsSetPriority = qsSetPriority;
window.qsSetRepeat = qsSetRepeat;
window.qsAddTag = qsAddTag;
window.qsToggleCat = qsToggleCat;
window.qsSelectCat = qsSelectCat;
window.qsPickEmoji = qsPickEmoji;
window.qsSwitchEmojiCat = qsSwitchEmojiCat;
window.openNewCat = openNewCat;
window.closeNewCat = closeNewCat;
window.saveNewCat = saveNewCat;
window.selectNewCatColor = selectNewCatColor;
window.qsQuickDate = qsQuickDate;
