/* app-render.js - Split from app.js */
'use strict';

// ---- Render Helpers ----
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function taskIconHtml(task) {
  if (task.customIcon) return `<img src="${task.customIcon}" class="task-custom-icon" alt="">`;
  return task.emoji ? `<span class="task-emoji">${task.emoji}</span> ` : '';
}

// ---- Render: Header ----
function renderHeader() {
  const d = parseDate(state.selectedDate);
  $('#header-year').textContent = d.getFullYear() + '年';
  $('#header-month').textContent = (d.getMonth() + 1) + '月';
  $('#header-day').textContent = d.getDate() + '日';
  $('#header-weekday').textContent = WEEKDAYS[d.getDay()];
  const s = calcGlobalStreak();
  $('#streak-count').textContent = s;
  const b = $('#streak-badge');
  b.style.background = s > 0 ? 'var(--fire-glow)' : 'var(--bg-card)';
  b.style.borderColor = s > 0 ? 'rgba(249,115,22,0.25)' : 'var(--border)';
}

// ---- Render: Week Calendar ----
function renderWeekCalendar() {
  const c = $('#week-calendar'), days = getWeekDays(state.selectedDate), tk = todayStr();
  c.innerHTML = '';
  days.forEach(d => {
    const k = formatDate(d), isT = k === tk, isS = k === state.selectedDate;
    const { total, done, pct } = getCompletionForDate(k);
    const all = total > 0 && done === total, some = done > 0;
    const r = 13, circ = 2 * Math.PI * r, dl = pct * circ, dg = circ - dl;
    const div = document.createElement('div');
    div.className = 'week-day' + (isT ? ' today' : '') + (isS ? ' selected' : '') + (all ? ' all-complete' : some ? ' has-complete' : '');
    div.innerHTML = `<span class="week-day-label">${WEEKDAYS[d.getDay()]}</span>
      <div class="week-day-num-wrap">
        <svg class="day-ring" viewBox="0 0 34 34" width="34" height="34">
          <circle cx="17" cy="17" r="${r}" fill="none" stroke="rgba(74,222,128,0.08)" stroke-width="2.5"/>
          ${pct > 0 ? `<circle cx="17" cy="17" r="${r}" fill="none" stroke="${all ? 'rgba(74,222,128,0.95)' : 'rgba(34,197,94,0.65)'}" stroke-width="2.5" stroke-dasharray="${dl.toFixed(2)} ${dg.toFixed(2)}" stroke-linecap="round" transform="rotate(-90 17 17)"/>` : ''}
        </svg>
        <span class="week-day-num">${d.getDate()}</span>
      </div>`;
    div.addEventListener('click', () => { state.selectedDate = k; renderAll(); });
    c.appendChild(div);
  });
}

// ---- Render: Filters ----
const FIXED_CATS = ['カレンダー'];
let filterEditMode = false;
function renderFilters() {
  const c = $('#category-filters'), cats = [...new Set(state.tasks.map(t => t.category).filter(Boolean))];
  c.innerHTML = '';
  const allCats = [...cats];
  if (!allCats.includes('カレンダー')) allCats.push('カレンダー');
  (state.savedCategories || []).forEach(sc => { if (sc && !allCats.includes(sc)) allCats.push(sc); });
  allCats.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'filter-chip' + (state.activeFilter === cat ? ' active' : '') + (filterEditMode ? ' edit-mode' : '');
    b.dataset.filter = cat;
    b.textContent = cat;
    b.style.webkitUserSelect = 'none'; b.style.userSelect = 'none'; b.style.webkitTouchCallout = 'none';
    if (filterEditMode) {
      b.classList.add('wobble');
      if (!FIXED_CATS.includes(cat)) {
        const del = document.createElement('span');
        del.className = 'filter-del'; del.textContent = '✕';
        del.addEventListener('click', e => {
          e.stopPropagation();
          if (confirm(`「${cat}」を削除しますか？\n所属している項目は「すべて」へ移動します。`)) {
            state.tasks.forEach(t => { if (t.category === cat) t.category = ''; });
            Object.values(state.records).forEach(rec => {
              if (rec && rec.memos) Object.values(rec.memos).forEach(v => { if (typeof v === 'object' && v.category === cat) v.category = ''; });
            });
            state.savedCategories = (state.savedCategories || []).filter(x => x !== cat);
            if (state.activeFilter === cat) state.activeFilter = 'all';
            save(); renderAll();
            showToast('🗑️ カテゴリを削除しました');
          }
        });
        b.appendChild(del);
      }
    } else {
      let lpTimer = null;
      let didLongPress = false;
      b.addEventListener('touchstart', () => { didLongPress = false; lpTimer = setTimeout(() => { didLongPress = true; filterEditMode = true; renderFilters(); showToast('⚙️ 編集モード：✕で削除'); }, 600); }, { passive: true });
      b.addEventListener('touchend', (e) => { clearTimeout(lpTimer); if (didLongPress) e.preventDefault(); });
      b.addEventListener('touchmove', () => clearTimeout(lpTimer));
      b.addEventListener('mousedown', () => { lpTimer = setTimeout(() => { filterEditMode = true; renderFilters(); showToast('⚙️ 編集モード：✕で削除'); }, 600); });
      b.addEventListener('mouseup', () => clearTimeout(lpTimer));
      b.addEventListener('mouseleave', () => clearTimeout(lpTimer));
    }
    c.appendChild(b);
  });
  if (filterEditMode) {
    const done = document.createElement('button');
    done.className = 'filter-chip filter-done-btn'; done.textContent = '✔ 完了';
    done.addEventListener('click', () => { filterEditMode = false; renderFilters(); });
    c.appendChild(done);
  }
  const ab = $('.filter-chip[data-filter="all"]');
  if (ab) ab.classList.toggle('active', state.activeFilter === 'all');
}

// ---- Render: Task List ----
function renderTaskList() {
  const c = $('#task-list');
  let tasks = state.tasks.filter(t => t.category !== 'カレンダー');
  if (state.activeFilter !== 'all') {
    if (state.activeFilter.startsWith('tag:')) {
      const tag = state.activeFilter.replace('tag:', '');
      tasks = tasks.filter(t => (t.tags || []).includes(tag));
    } else if (state.activeFilter.startsWith('priority:')) {
      const pri = state.activeFilter.replace('priority:', '');
      tasks = tasks.filter(t => {
        const p = (t.priority || '').toLowerCase();
        if (pri === 'high') return p === '高' || p === 'high' || p === '❗';
        if (pri === 'medium') return p === '中' || p === 'medium' || p === '❕';
        if (pri === 'low') return p === '低' || p === 'low' || p === '❓';
        return false;
      });
    } else {
      tasks = tasks.filter(t => t.category === state.activeFilter);
    }
  }
  if (!tasks.length) { c.innerHTML = '<div class="empty-state" style="display:flex;"><div class="empty-icon">📋</div><p>タスクがありません</p><p class="empty-sub">右下の＋ボタンから追加しましょう</p></div>'; return; }
  const dr = state.records[state.selectedDate] || {};
  // Group by category
  const uncategorized = tasks.filter(t => !t.category);
  const cats = [...new Set(tasks.map(t => t.category).filter(Boolean))];
  const groups = [];
  if (uncategorized.length) groups.push({ name: null, tasks: uncategorized });
  cats.forEach(cat => groups.push({ name: cat, tasks: tasks.filter(t => t.category === cat) }));

  function taskHtml(task) {
    const chk = isCompleted(dr[task.id]), ts = calcTaskStreak(task.id), hl = task.url && task.url.trim().length > 0;
    let wh = '';
    // Repeat type badge
    let repeatBadge = '';
    if (task.frequency === '週' && task.freqCount) {
      const wp = getWeeklyProgress(task.id), tg = task.freqCount;
      const dots = Array.from({ length: tg }, (_, i) => `<span class="weekly-dot ${i < wp ? 'done' : ''}">●</span>`).join('');
      wh = `<div class="weekly-progress ${wp >= tg ? 'complete' : ''}"><span class="weekly-dots">${dots}</span><span class="weekly-label">${wp}/${tg}</span></div>`;
      repeatBadge = `<span class="repeat-badge repeat-weekly">📅 週${tg}回</span>`;
    } else if (task.frequency === '毎日') {
      // Check timing for weekday/weekend
      if (task.timing === '平日のみ') {
        repeatBadge = '<span class="repeat-badge repeat-weekday">🏢 平日</span>';
      } else if (task.timing === '週末のみ') {
        repeatBadge = '<span class="repeat-badge repeat-weekend">🌴 週末</span>';
      } else {
        repeatBadge = '<span class="repeat-badge repeat-daily">🗓️ 毎日</span>';
      }
    } else if (task.frequency === '1日だけ') {
      repeatBadge = '<span class="repeat-badge repeat-daily">☝️ 1日だけ</span>';
    }
    const icon = taskIconHtml(task);
    const memo = getTaskMemo(task.id, state.selectedDate);
    const hasMemo = memo ? 'memo-has' : 'memo-empty';
    const pri = task.priority || '';
    const priAttr = pri ? ` data-priority="${pri}"` : '';
    // Tags from task.tags field
    const tags = task.tags || [];
    const tagHtml = tags.map(t => `<span class="task-tag-badge">${escapeHtml('#' + t)}</span>`).join('');
    const displayName = task.name;
    const descLine = task.description ? `<div class="task-description-line">${escapeHtml(task.description.length > 40 ? task.description.slice(0, 40) + '…' : task.description)}</div>` : '';
    return `<div class="task-item" data-id="${task.id}" draggable="true">
      <div class="drag-handle" title="ドラッグで並び替え">≡</div>
      <div class="task-timing">${escapeHtml(task.timing || 'いつでも')}</div>
      <div class="task-center" data-task-id="${task.id}">
        <div class="task-name"><span class="task-label">${icon}${escapeHtml(displayName)}</span></div>
        ${descLine}
        <div class="task-meta">
          ${task.category ? `<span class="task-category-tag">${escapeHtml(task.category)}</span>` : ''}
          ${tagHtml}
          ${repeatBadge}
          ${hl ? '<span class="task-link-icon">🔗</span>' : ''}
          ${task.notifyTime ? `<span class="task-notify-badge">🔔${task.notifyTime}</span>` : ''}
        </div>${wh}
        ${memo ? `<div class="task-memo-line">📝 ${escapeHtml(memo)}</div>` : ''}
      </div>
      <div class="task-right">
        ${ts > 0 ? `<div class="task-action-cell task-streak-mini"><span class="mini-fire">🔥</span>${ts}</div>` : ''}
        <button class="task-action-cell memo-btn ${hasMemo}" data-memo-id="${task.id}" type="button" title="メモ">📝</button>
        <button class="task-action-cell check-btn ${chk ? 'checked' : ''}" data-check-id="${task.id}"${priAttr} type="button"></button>
      </div>
      <span class="task-edit-hint">長押しで編集</span>
    </div>`;
  }

  let html = '';
  groups.forEach(g => {
    if (g.name) {
      const gTasks = g.tasks;
      const gDone = gTasks.filter(t => isCompleted(dr[t.id])).length;
      html += `<div class="category-group">
        <div class="category-group-header" data-cat="${escapeHtml(g.name)}">
          <span class="category-group-name">${escapeHtml(g.name)}</span>
          <span class="category-group-count">${gDone}/${gTasks.length}</span>
        </div>
        <div class="category-group-body">${gTasks.map(taskHtml).join('')}</div>
      </div>`;
    } else {
      html += g.tasks.map(taskHtml).join('');
    }
  });
  c.innerHTML = html;

  // ---- Calendar Events Section ----
  const selDate = state.selectedDate;
  const scheduled = (state.scheduledTasks || []).filter(st => st.date === selDate);
  if (scheduled.length > 0) {
    let calHtml = `<div class="calendar-events-section">
      <div class="category-group-header cal-events-header">
        <span class="category-group-name">📅 カレンダー</span>
        <span class="category-group-count">${scheduled.length}件</span>
      </div>
      <div class="cal-events-body">`;
    scheduled.forEach(st => {
      const icon = st.emoji || '📌';
      calHtml += `<div class="cal-event-item">
        <span class="cal-event-icon">${icon}</span>
        <div class="cal-event-info">
          <span class="cal-event-name">${escapeHtml(st.name)}</span>
          ${st.timing ? `<span class="cal-event-timing">${escapeHtml(st.timing)}</span>` : ''}
          ${st.category ? `<span class="task-category-tag">${escapeHtml(st.category)}</span>` : ''}
          ${st.memo ? `<div class="task-memo-line">📝 ${escapeHtml(st.memo)}</div>` : ''}
        </div>
        ${st.url ? `<a href="${escapeHtml(st.url)}" target="_blank" class="cal-event-link">🔗</a>` : ''}
      </div>`;
    });
    calHtml += '</div></div>';
    c.innerHTML += calHtml;
  }

  // Drag & drop
  setupDragAndDrop();
}

// ---- Drag & Drop (Desktop + Touch/iOS) ----
let draggedTaskId = null;
let touchDragEl = null, touchStartY = 0, touchClone = null;
let _dragTouchListenersAdded = false;
function setupDragAndDrop() {
  const items = $$('.task-item[draggable]');
  items.forEach(item => {
    // Desktop drag events
    item.addEventListener('dragstart', e => {
      draggedTaskId = item.dataset.id;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedTaskId);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      $$('.task-item.drag-over').forEach(el => el.classList.remove('drag-over'));
      draggedTaskId = null;
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (item.dataset.id !== draggedTaskId) item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const targetId = item.dataset.id;
      if (!draggedTaskId || draggedTaskId === targetId) return;
      reorderTask(draggedTaskId, targetId);
    });
    // Touch drag (iOS / mobile)
    const handle = item.querySelector('.drag-handle');
    if (!handle) return;
    handle.addEventListener('touchstart', e => {
      touchDragEl = item;
      draggedTaskId = item.dataset.id;
      touchStartY = e.touches[0].clientY;
      item.classList.add('dragging');
    }, { passive: true });
  });
  // Bug#4 fix: Register document-level touch listeners only once
  if (!_dragTouchListenersAdded) {
    _dragTouchListenersAdded = true;
    document.addEventListener('touchmove', e => {
      if (!touchDragEl) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      const els = $$('.task-item');
      els.forEach(el => {
        el.classList.remove('drag-over');
        if (el === touchDragEl) return;
        const r = el.getBoundingClientRect();
        if (y > r.top && y < r.bottom) el.classList.add('drag-over');
      });
    }, { passive: false });
    document.addEventListener('touchend', () => {
      if (!touchDragEl) return;
      const over = document.querySelector('.task-item.drag-over');
      if (over && draggedTaskId) {
        reorderTask(draggedTaskId, over.dataset.id);
      }
      touchDragEl.classList.remove('dragging');
      $$('.task-item.drag-over').forEach(el => el.classList.remove('drag-over'));
      touchDragEl = null; draggedTaskId = null;
    });
  }
}
function reorderTask(fromId, toId) {
  const fromIdx = state.tasks.findIndex(t => t.id === fromId);
  const toIdx = state.tasks.findIndex(t => t.id === toId);
  if (fromIdx < 0 || toIdx < 0) return;
  const [moved] = state.tasks.splice(fromIdx, 1);
  state.tasks.splice(toIdx, 0, moved);
  save(); renderAll();
  showToast('🔄 並び替えました');
}
