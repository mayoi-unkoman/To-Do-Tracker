/* app-events.js - Events, modals, memo */
'use strict';

// ---- Events ----
function handleCheck(id) {
  const k = state.selectedDate;
  if (!state.records[k]) state.records[k] = {};
  const was = isCompleted(state.records[k][id]);
  if (was) {
    state.records[k][id] = false;
  } else {
    const now = new Date();
    state.records[k][id] = { done: true, completedAt: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` };
  }
  save();
  if (!was) {
    const btn = document.querySelector(`.check-btn[data-check-id="${id}"]`);
    if (btn) { btn.classList.add('checked'); createParticles(btn); }
  }
  setTimeout(() => {
    renderAll();
    // Check all-complete celebration
    if (!was) {
      const { total, done } = getCompletionForDate(k);
      if (total > 0 && done === total && celebrationShownForDate !== k) {
        celebrationShownForDate = k;
        showConfetti();
        showToast('🎉 今日のタスク全達成！おめでとう！');
      }
    }
  }, was ? 0 : 150);
  if (!was) showToast('✅ 完了！');
}
function createParticles(btn) {
  const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div'); p.className = 'check-particle';
    const a = (Math.PI * 2 * i) / 6, dist = 20 + Math.random() * 15;
    p.style.left = cx + 'px'; p.style.top = cy + 'px';
    p.style.setProperty('--dx', Math.cos(a) * dist + 'px'); p.style.setProperty('--dy', Math.sin(a) * dist + 'px');
    document.body.appendChild(p); setTimeout(() => p.remove(), 500);
  }
}
function handleTaskTap(id) {
  if (longPressTriggered) return;
  const t = state.tasks.find(x => x.id === id); if (!t) return;
  if (t.url && t.url.trim()) window.open(t.url, '_blank', 'noopener');
}

// ---- Memo ----
let memoTaskId = null;
function getTaskMemo(taskId, date) {
  const dr = state.records[date || state.selectedDate];
  return dr && dr.memos && dr.memos[taskId] ? dr.memos[taskId] : '';
}
function setTaskMemo(taskId, date, memo) {
  if (!state.records[date]) state.records[date] = {};
  if (!state.records[date].memos) state.records[date].memos = {};
  if (memo.trim()) state.records[date].memos[taskId] = memo.trim();
  else delete state.records[date].memos[taskId];
  save();
}
function openMemoModal(id) {
  const t = state.tasks.find(x => x.id === id); if (!t) return;
  memoTaskId = id;
  $('#memo-task-name').textContent = `${t.emoji || ''} ${t.name}`;
  $('#memo-input').value = getTaskMemo(id, state.selectedDate);
  openModal('memo-overlay');
  setTimeout(() => $('#memo-input').focus(), 200);
}

// ---- Modals ----
function openModal(id) { $('#' + id).classList.add('open'); }
function closeModal(id) { $('#' + id).classList.remove('open'); }
function hidePanels(...ids) { ids.forEach(id => { const e = $('#' + id); if (e) e.style.display = 'none'; }); }

function openAddModal() {
  openModal('modal-overlay');
  $('#task-form').reset();
  $('#emoji-picker-btn').textContent = '😊';
  hidePanels('emoji-panel');
  $('#freq-count').style.display = 'none';
  $('#custom-icon-preview').textContent = 'なし'; $('#custom-icon-preview').style.backgroundImage = '';
  currentAddIcon = null;
  setTimeout(() => $('#task-name').focus(), 300);
}
function openEditModal(id) {
  const t = state.tasks.find(x => x.id === id); if (!t) return;
  openModal('edit-modal-overlay');
  $('#edit-task-id').value = t.id;
  $('#edit-task-name').value = t.name;
  $('#edit-emoji-picker-btn').textContent = t.emoji || '😊';
  $('#edit-task-url').value = t.url || '';
  // Auto-show URL input if task has URL
  const editUrlWrap = $('#edit-modal-overlay .url-input-wrap');
  const editUrlBtn = $('#edit-url-toggle-btn');
  if (t.url && t.url.trim()) {
    if (editUrlWrap) editUrlWrap.classList.add('open');
    if (editUrlBtn) editUrlBtn.classList.add('active');
  } else {
    if (editUrlWrap) editUrlWrap.classList.remove('open');
    if (editUrlBtn) editUrlBtn.classList.remove('active');
  }
  $('#edit-task-category').value = t.category || '';
  if ($('#edit-task-tags')) $('#edit-task-tags').value = (t.tags || []).join(', ');
  if ($('#edit-task-description')) $('#edit-task-description').value = t.description || '';
  $$('input[name="edit-timing"]').forEach(r => { r.checked = r.value === (t.timing || 'いつでも'); });
  const fv = t.frequency === '週' ? '週' : (t.frequency === '1日だけ' ? '1日だけ' : '毎日');
  $$('input[name="edit-frequency"]').forEach(r => { r.checked = r.value === fv; });
  $('#edit-freq-count').style.display = t.frequency === '週' ? '' : 'none';
  $('#edit-freq-count').value = t.freqCount || 3;
  hidePanels('edit-emoji-panel');
  $('#edit-task-notify-time').value = t.notifyTime || '';
  currentEditIcon = t.customIcon || null;
  const eip = $('#edit-custom-icon-preview');
  if (t.customIcon) { eip.textContent = ''; eip.style.backgroundImage = `url(${t.customIcon})`; }
  else { eip.textContent = 'なし'; eip.style.backgroundImage = ''; }
}

let currentAddIcon = null, currentEditIcon = null;

function addTask(e) {
  e.preventDefault();
  const rawName = $('#task-name').value.trim(); if (!rawName) return;
  const emoji = $('#emoji-picker-btn').textContent;
  // タグを名前から分離
  const extractedTags = rawName.match(/#[^\s#]+/g) || [];
  const cleanName = rawName.replace(/#[^\s#]+/g, '').trim();
  const tagsInput = $('#task-tags')?.value.trim() || '';
  const inputTags = tagsInput ? tagsInput.split(/[,、\s]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean) : [];
  const allTags = [...new Set([...extractedTags.map(t => t.replace(/^#/, '')), ...inputTags])];
  state.tasks.push({
    id: genId(), name: cleanName || rawName,
    emoji: emoji !== '😊' ? emoji : '',
    timing: document.querySelector('input[name="timing"]:checked')?.value || 'いつでも',
    frequency: document.querySelector('input[name="frequency"]:checked')?.value || '毎日',
    freqCount: document.querySelector('input[name="frequency"]:checked')?.value === '週' ? parseInt($('#freq-count').value) || 3 : null,
    url: $('#task-url').value.trim(),
    category: $('#task-category').value.trim(),
    createdDate: todayStr(),
    customIcon: currentAddIcon,
    notifyTime: $('#task-notify-time').value || '',
    lastNotifiedDate: null,
    priority: '',
    tags: allTags,
    description: $('#task-description')?.value.trim() || '',
  });
  resetCelebration(); save(); syncNotifySchedules(); closeModal('modal-overlay'); renderAll(); showToast('✨ タスクを追加しました');
}
function editTask(e) {
  e.preventDefault();
  const id = $('#edit-task-id').value, t = state.tasks.find(x => x.id === id); if (!t) return;
  t.name = $('#edit-task-name').value.trim();
  const emoji = $('#edit-emoji-picker-btn').textContent;
  t.emoji = emoji !== '😊' ? emoji : '';
  t.timing = document.querySelector('input[name="edit-timing"]:checked')?.value || 'いつでも';
  t.frequency = document.querySelector('input[name="edit-frequency"]:checked')?.value || '毎日';
  t.freqCount = t.frequency === '週' ? parseInt($('#edit-freq-count').value) || 3 : null;
  t.url = $('#edit-task-url').value.trim();
  t.category = $('#edit-task-category').value.trim();
  t.customIcon = currentEditIcon;
  // タグ・説明を保存
  const tagsInput = $('#edit-task-tags')?.value.trim() || '';
  t.tags = tagsInput ? tagsInput.split(/[,、\s]+/).map(x => x.replace(/^#/, '').trim()).filter(Boolean) : [];
  t.description = $('#edit-task-description')?.value.trim() || '';
  const newNotifyTime = $('#edit-task-notify-time').value || '';
  if (newNotifyTime !== t.notifyTime) {
    t.lastNotifiedDate = null;
  }
  t.notifyTime = newNotifyTime;
  save(); syncNotifySchedules(); closeModal('edit-modal-overlay'); renderAll(); showToast('📝 保存しました');
}
let deleteConfirmPending = false;
function deleteTask(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const btn = $('#edit-delete-btn');
  if (!deleteConfirmPending) {
    deleteConfirmPending = true;
    btn.textContent = '本当に削除する？';
    btn.style.background = 'rgba(239,68,68,0.3)';
    setTimeout(() => { deleteConfirmPending = false; btn.textContent = '削除'; btn.style.background = ''; }, 3000);
    return;
  }
  deleteConfirmPending = false;
  const id = $('#edit-task-id').value;
  // カレンダータスクの場合、scheduledTasksからも削除
  const task = state.tasks.find(t => t.id === id);
  if (task && task.category === 'カレンダー') {
    state.scheduledTasks = state.scheduledTasks.filter(st => {
      // 名前と日付が一致するscheduledTaskを削除
      return !(st.name === task.name && st.date === task.createdDate);
    });
  }
  state.tasks = state.tasks.filter(t => t.id !== id);
  Object.keys(state.records).forEach(k => { if (state.records[k] && state.records[k][id] !== undefined) delete state.records[k][id]; });
  save(); syncNotifySchedules(); closeModal('edit-modal-overlay'); renderAll(); showToast('🗑️ 削除しました');
  btn.textContent = '削除'; btn.style.background = '';
}
function addScheduledTask(e) {
  e.preventDefault();
  const date = $('#cal-task-date').value, name = $('#cal-task-name').value.trim();
  if (!date || !name) return;
  const emoji = $('#cal-emoji-btn').textContent;
  const userCat = $('#cal-task-category').value.trim();
  if (userCat) saveCategory(userCat);
  state.scheduledTasks.push({
    id: genId(), date, name,
    emoji: emoji !== '😊' ? emoji : '',
    timing: document.querySelector('input[name="cal-timing"]:checked')?.value || 'いつでも',
    url: $('#cal-task-url').value.trim(),
    category: 'カレンダー',
    notifyTime: $('#cal-task-notify-time') ? $('#cal-task-notify-time').value || '' : '',
    memo: ($('#cal-task-memo') ? $('#cal-task-memo').value.trim() : ''),
    addedToTasks: false,
  });
  save(); syncNotifySchedules(); closeModal('cal-task-overlay');
  processScheduledTasks();
  renderCalendar(); renderAll();
  showToast('📅 予定を登録しました');
}

// ---- Toast ----
let toastTimer;
function showToast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.remove('show');
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---- View Switch ----
function switchView(vid) {
  $$('.view').forEach(v => v.classList.remove('active'));
  const tgt = $('#' + vid); if (tgt) tgt.classList.add('active');
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === vid));
  if (vid === 'stats-view') setTimeout(() => renderStats(), 50);
  if (vid === 'calendar-view') renderCalendar();
  if (vid === 'memo-view') { renderMemoFilters(); renderMemoHistory(); }
}

let activeMemoFilter = 'all';
let memoEditMode = false;
const FIXED_MEMO_FILTERS = [
  { key: 'all', label: 'すべて' },
  { key: 'task', label: 'タスク' },
  { key: 'general', label: '新規メモ' },
  { key: 'calendar', label: 'カレンダー' },
];
const FIXED_MEMO_KEYS = ['all', 'task', 'general', 'calendar'];

function saveMemoCategory(cat) {
  if (!cat || !cat.trim()) return;
  cat = cat.trim();
  if (!state.savedMemoCategories) state.savedMemoCategories = [];
  if (!state.savedMemoCategories.includes(cat)) {
    state.savedMemoCategories.push(cat);
    save();
  }
}

function renderMemoFilters() {
  const bar = $('#memo-filter-bar');
  if (!bar) return;
  bar.innerHTML = '';
  FIXED_MEMO_FILTERS.forEach(f => {
    const b = document.createElement('button');
    b.className = 'filter-chip' + (activeMemoFilter === f.key ? ' active' : '');
    b.dataset.memoFilter = f.key;
    b.textContent = f.label;
    b.style.webkitUserSelect = 'none'; b.style.userSelect = 'none'; b.style.webkitTouchCallout = 'none';
    b.addEventListener('click', () => { activeMemoFilter = f.key; renderMemoFilters(); renderMemoHistory(); });
    bar.appendChild(b);
  });
  const customCats = [...(state.savedMemoCategories || [])];
  Object.values(state.records).forEach(rec => {
    if (rec && rec.memos) {
      Object.entries(rec.memos).forEach(([tid, val]) => {
        if (tid.startsWith('general_') && typeof val === 'object' && val.category && !FIXED_MEMO_KEYS.includes(val.category) && !customCats.includes(val.category)) {
          customCats.push(val.category);
        }
      });
    }
  });
  customCats.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'filter-chip' + (activeMemoFilter === 'custom_' + cat ? ' active' : '') + (memoEditMode ? ' edit-mode wobble' : '');
    b.dataset.memoFilter = 'custom_' + cat;
    b.textContent = cat;
    b.style.webkitUserSelect = 'none'; b.style.userSelect = 'none'; b.style.webkitTouchCallout = 'none';
    if (memoEditMode) {
      const del = document.createElement('span');
      del.className = 'filter-del'; del.textContent = '✕';
      del.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`「${cat}」を削除しますか？\n所属しているメモは「すべて」へ移動します。`)) {
          Object.values(state.records).forEach(rec => {
            if (rec && rec.memos) Object.values(rec.memos).forEach(v => { if (typeof v === 'object' && v.category === cat) v.category = ''; });
          });
          state.savedMemoCategories = (state.savedMemoCategories || []).filter(x => x !== cat);
          if (activeMemoFilter === 'custom_' + cat) activeMemoFilter = 'all';
          save(); renderMemoFilters(); renderMemoHistory();
          showToast('🗑️ メモカテゴリを削除しました');
        }
      });
      b.appendChild(del);
    } else {
      b.addEventListener('click', () => { activeMemoFilter = 'custom_' + cat; renderMemoFilters(); renderMemoHistory(); });
      let lpTimer = null;
      let didLP = false;
      const startLP = () => { didLP = false; lpTimer = setTimeout(() => { didLP = true; memoEditMode = true; renderMemoFilters(); showToast('⚙️ メモフィルター編集中'); }, 600); };
      const cancelLP = (e) => { clearTimeout(lpTimer); if (didLP && e) e.preventDefault(); };
      b.addEventListener('touchstart', startLP, { passive: true });
      b.addEventListener('touchend', cancelLP);
      b.addEventListener('touchmove', () => clearTimeout(lpTimer));
      b.addEventListener('mousedown', startLP);
      b.addEventListener('mouseup', cancelLP);
      b.addEventListener('mouseleave', cancelLP);
    }
    bar.appendChild(b);
  });
  if (memoEditMode) {
    const done = document.createElement('button');
    done.className = 'filter-chip filter-done-btn'; done.textContent = '✔ 完了';
    done.addEventListener('click', () => { memoEditMode = false; renderMemoFilters(); });
    bar.appendChild(done);
  }
}

function renderMemoHistory() {
  const list = $('#memo-history-list');
  if (!list) return;
  const taskMemos = [];
  const generalMemos = [];
  const calMemos = [];
  // Collect memos from records.memos
  Object.keys(state.records).forEach(date => {
    const rec = state.records[date];
    if (!rec || !rec.memos || typeof rec.memos !== 'object') return;
    Object.keys(rec.memos).forEach(tid => {
      const val = rec.memos[tid];
      if (!val) return;
      // val can be string (legacy) or {title, text, category}
      const text = typeof val === 'object' ? (val.text || '') : val;
      const title = typeof val === 'object' ? (val.title || '') : '';
      const cat = typeof val === 'object' ? (val.category || '') : '';
      if (!text) return;
      if (tid.startsWith('general_')) {
        generalMemos.push({ date, taskId: tid, title, category: cat, memo: text });
      } else {
        const task = state.tasks.find(t => t.id === tid);
        if (task) {
          taskMemos.push({ date, taskId: tid, taskName: task.name, emoji: task.emoji || '', title, memo: text });
        }
      }
    });
  });
  // Collect calendar memos
  (state.scheduledTasks || []).forEach(st => {
    if (st.memo && st.memo.trim()) {
      calMemos.push({ date: st.date, taskId: 'cal_' + st.id, calId: st.id, name: st.name, emoji: st.emoji || '📅', title: st.name, memo: st.memo });
    }
  });
  taskMemos.sort((a, b) => b.date.localeCompare(a.date));
  generalMemos.sort((a, b) => b.date.localeCompare(a.date));
  calMemos.sort((a, b) => b.date.localeCompare(a.date));

  // Apply filter
  const isCustomFilter = activeMemoFilter.startsWith('custom_');
  const customCatName = isCustomFilter ? activeMemoFilter.replace('custom_', '') : '';
  let showTask = activeMemoFilter === 'all' || activeMemoFilter === 'task';
  let showGeneral = activeMemoFilter === 'all' || activeMemoFilter === 'general';
  let showCal = activeMemoFilter === 'all' || activeMemoFilter === 'calendar';
  // For custom category filter, only show matching general memos
  let filteredGeneral = generalMemos;
  if (isCustomFilter) {
    showTask = false; showCal = false; showGeneral = true;
    filteredGeneral = generalMemos.filter(m => m.category === customCatName);
  }

  const totalCount = (showTask ? taskMemos.length : 0) + (showGeneral ? filteredGeneral.length : 0) + (showCal ? calMemos.length : 0);
  if (totalCount === 0) {
    list.innerHTML = '<p class="empty-sub" style="padding:20px;text-align:center;">メモはまだありません</p>';
    return;
  }

  function renderMemoItem(m, type) {
    const d = parseDate(m.date);
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
    const displayTitle = m.title || (type === 'task' ? `${m.emoji || ''} ${m.taskName || ''}`.trim() : (type === 'cal' ? `📅 ${m.name || ''}` : '🗒️ メモ'));
    const delBtn = (type === 'cal')
      ? `<button class="memo-del" data-cal-id="${m.calId}" type="button">✕</button>`
      : `<button class="memo-del" data-date="${m.date}" data-task-id="${m.taskId}" type="button">✕</button>`;
    return `<div class="memo-card" data-memo-type="${type}" data-memo-id="${m.taskId}" data-memo-date="${m.date}">
      <div class="memo-card-header">
        <span class="memo-date">${dateLabel}</span>
        <span class="memo-card-title">${escapeHtml(displayTitle)}</span>
        <span class="memo-card-arrow">▼</span>
        ${delBtn}
      </div>
      <div class="memo-card-body" style="display:none;">
        <p class="memo-card-text">${escapeHtml(m.memo)}</p>
      </div>
    </div>`;
  }

  function renderSection(title, icon, items, type) {
    if (!items.length) return '';
    let h = `<div class="memo-section">
      <div class="memo-section-title">${icon} ${title}<span class="memo-section-count">${items.length}</span></div>`;
    items.forEach(m => { h += renderMemoItem(m, type); });
    h += '</div>';
    return h;
  }

  let html = '';
  if (showTask) html += renderSection('タスクごとのメモ', '✅', taskMemos, 'task');
  if (showGeneral) html += renderSection(isCustomFilter ? customCatName : '新規メモ', '🗒️', filteredGeneral, 'general');
  if (showCal) html += renderSection('カレンダーのメモ', '📅', calMemos, 'cal');
  list.innerHTML = html;

  // Collapse toggle
  list.querySelectorAll('.memo-card-header').forEach(hdr => {
    hdr.addEventListener('click', e => {
      if (e.target.closest('.memo-del')) return;
      const card = hdr.closest('.memo-card');
      const body = card.querySelector('.memo-card-body');
      const arrow = card.querySelector('.memo-card-arrow');
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      arrow.textContent = isOpen ? '▼' : '▲';
    });
  });

  // Long press to edit
  list.querySelectorAll('.memo-card').forEach(card => {
    let lpTimer = null;
    const startLP = () => { lpTimer = setTimeout(() => openEditMemo(card), 500); };
    const cancelLP = () => { clearTimeout(lpTimer); };
    card.addEventListener('mousedown', startLP);
    card.addEventListener('mouseup', cancelLP);
    card.addEventListener('mouseleave', cancelLP);
    card.addEventListener('touchstart', startLP, { passive: true });
    card.addEventListener('touchend', cancelLP);
    card.addEventListener('touchcancel', cancelLP);
  });

  // Delete memo
  list.querySelectorAll('.memo-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const calId = btn.dataset.calId;
      if (calId) {
        // Delete calendar memo
        const st = (state.scheduledTasks || []).find(s => s.id === calId);
        if (st) { st.memo = ''; save(); }
      } else {
        const date = btn.dataset.date, tid = btn.dataset.taskId;
        const rec = state.records[date];
        if (rec && rec.memos) { delete rec.memos[tid]; save(); }
      }
      renderMemoHistory();
      showToast('🗑️ メモを削除しました');
    });
  });
}

function openEditMemo(card) {
  const type = card.dataset.memoType;
  const tid = card.dataset.memoId;
  const date = card.dataset.memoDate;
  let currentTitle = '', currentText = '';
  if (type === 'cal') {
    const calId = tid.replace('cal_', '');
    const st = (state.scheduledTasks || []).find(s => s.id === calId);
    if (!st) return;
    currentTitle = st.name || '';
    currentText = st.memo || '';
  } else {
    const rec = state.records[date];
    if (!rec || !rec.memos || !rec.memos[tid]) return;
    const val = rec.memos[tid];
    currentTitle = typeof val === 'object' ? (val.title || '') : '';
    currentText = typeof val === 'object' ? (val.text || '') : val;
  }
  $('#edit-memo-id').value = tid;
  $('#edit-memo-date').value = date;
  $('#edit-memo-type').value = type;
  $('#edit-memo-title').value = currentTitle;
  $('#edit-memo-input').value = currentText;
  openModal('edit-memo-overlay');
  setTimeout(() => $('#edit-memo-input').focus(), 200);
}


// ---- Emoji/Icon/Settings functions moved to app-settings.js ----