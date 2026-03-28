/* app-calendar.js - Split from app.js */
'use strict';

// ---- Render: Calendar (Month + Year + List) ----
function renderCalendar() {
  const y = state.calYear, m = state.calMonth;
  const mNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const calTitle = $('#cal-title');
  const monthView = $('#cal-month-view');
  const yearView = $('#cal-year-view');
  const listView = $('#cal-list-view');

  monthView.style.display = 'none';
  yearView.style.display = 'none';
  listView.style.display = 'none';

  if (state.calMode === 'month') {
    calTitle.textContent = y + '年 ' + mNames[m];
    monthView.style.display = '';
    renderMonthCalendar(y, m);
  } else if (state.calMode === 'list') {
    calTitle.textContent = y + '年 ' + mNames[m];
    listView.style.display = '';
    renderListCalendar(y, m);
  } else {
    calTitle.textContent = y + '年';
    yearView.style.display = '';
    renderYearCalendar(y);
  }
  // Update dropdown checkmarks
  ['list', 'year', 'month'].forEach(mode => {
    const ck = $(`#cal-mode-check-${mode}`);
    if (ck) ck.classList.toggle('active', state.calMode === mode);
  });
}

// Task color mapping
const CAT_COLORS = ['green', 'blue', 'orange', 'pink', 'red', 'purple'];
function getTaskColor(task, idx) {
  if (task.category) {
    // ユーザー定義色があればそれを使用
    const userColor = getCategoryColor(task.category);
    if (userColor) return userColor;
    // なければカテゴリ名のハッシュで安定した色を割り当て
    let hash = 0;
    for (let i = 0; i < task.category.length; i++) {
      hash = ((hash << 5) - hash) + task.category.charCodeAt(i);
      hash |= 0;
    }
    return CAT_COLORS[Math.abs(hash) % CAT_COLORS.length];
  }
  return CAT_COLORS[idx % CAT_COLORS.length];
}

function renderMonthCalendar(y, m) {
  const grid = $('#cal-month-grid');
  const fd = new Date(y, m, 1).getDay();
  const dim = daysInMonth(y, m);
  const tk = todayStr();
  let h = '';
  for (let i = 0; i < fd; i++) h += '<div class="new-month-cell empty"></div>';
  for (let d = 1; d <= dim; d++) {
    const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isT = k === tk;
    const tasks = getTasksForDate(k).filter(t => t.category === 'カレンダー');
    // Show up to 3 task bars (tasks only — scheduledTasks are already converted to tasks)
    let taskBars = '';
    if (tasks.length > 0) {
      taskBars = tasks.slice(0, 3).map((t, i) => {
        const color = getTaskColor(t, i);
        const name = t.name.length > 5 ? t.name.slice(0, 5) : t.name;
        return `<div class="new-cal-task-bar ${color}">${name}</div>`;
      }).join('');
    }
    h += `<div class="new-month-cell${isT ? ' today' : ''}" data-date="${k}">
      <div class="new-month-cell-day">${d}</div>
      <div class="new-month-cell-tasks">${taskBars}</div>
    </div>`;
  }
  grid.innerHTML = h;
  grid.querySelectorAll('.new-month-cell:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => openDayDetail(cell.dataset.date));
  });
}

function renderYearCalendar(y) {
  const grid = $('#cal-year-grid');
  const mNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const tk = todayStr();
  let h = '';
  for (let m = 0; m < 12; m++) {
    const fd = new Date(y, m, 1).getDay();
    const dim = daysInMonth(y, m);
    h += `<div class="new-mini-month"><div class="new-mini-month-title">${mNames[m]}</div><div class="new-mini-month-grid">`;
    for (let i = 0; i < fd; i++) h += '<span></span>';
    for (let d = 1; d <= dim; d++) {
      const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isT = k === tk;
      const hasTask = hasSomeComplete(k) || state.scheduledTasks.some(st => st.date === k);
      h += `<span class="${isT ? 'today' : ''}${hasTask ? ' has-task' : ''}" data-date="${k}">${d}</span>`;
    }
    h += '</div></div>';
  }
  grid.innerHTML = h;
  grid.querySelectorAll('.new-mini-month-grid span[data-date]').forEach(sp => {
    sp.addEventListener('click', () => openDayDetail(sp.dataset.date));
  });
  // Month title tap -> list view for that month
  grid.querySelectorAll('.new-mini-month-title').forEach((title, idx) => {
    title.style.cursor = 'pointer';
    title.addEventListener('click', () => {
      state.calMonth = idx;
      state.calMode = 'list';
      renderCalendar();
    });
  });
}

// ---- Render: Calendar List View ----
function renderListCalendar(y, m) {
  const content = $('#cal-list-content');
  if (!content) return;
  const dim = daysInMonth(y, m);
  const tk = todayStr();
  let html = '';
  for (let d = 1; d <= dim; d++) {
    const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const date = new Date(y, m, d);
    const dayLabel = WEEKDAYS[date.getDay()];
    const isToday = k === tk;
    const tasks = getTasksForDate(k).filter(t => t.category === 'カレンダー');
    // scheduledTasks are already in tasks via processScheduledTasks
    const rec = state.records[k] || {};

    if (tasks.length === 0) continue; // Skip empty days

    html += `<div class="cal-list-day${isToday ? ' today' : ''}">`;
    html += `<div class="cal-list-day-header">`;
    html += `<span class="cal-list-day-num">${d}</span>`;
    html += `<span class="cal-list-day-name">${dayLabel}</span>`;
    if (isToday) html += `<span class="cal-list-today-badge">今日</span>`;
    html += `</div>`;
    html += `<div class="cal-list-day-items">`;

    // Scheduled events are already converted to tasks via processScheduledTasks

    // Tasks
    tasks.forEach(t => {
      const done = isCompleted(rec[t.id]);
      const pri = t.priority || '';
      html += `<div class="cal-list-item${done ? ' done' : ''}" data-task-id="${t.id}" data-date="${k}">`;
      html += `<span class="cal-list-item-check${done ? ' checked' : ''}" ${pri ? `data-priority="${pri}"` : ''} data-check-task="${t.id}" data-check-date="${k}">${done ? '✓' : '○'}</span>`;
      html += `<span class="cal-list-item-name">${t.emoji || ''} ${escapeHtml(t.name)}</span>`;
      html += `</div>`;
    });

    html += `</div></div>`;
  }
  if (!html) html = '<p class="empty-sub" style="padding:20px;text-align:center;">この月のデータはありません</p>';
  content.innerHTML = html;

  // Click day headers to open detail
  content.querySelectorAll('.cal-list-day-header').forEach(hdr => {
    hdr.style.cursor = 'pointer';
    const dayEl = hdr.closest('.cal-list-day');
    if (!dayEl) return;
    hdr.addEventListener('click', () => {
      const dateStr = dayEl.querySelector('.cal-list-item')?.dataset?.date;
      // Get date from day number
      const dayNum = hdr.querySelector('.cal-list-day-num')?.textContent;
      if (dayNum) {
        const dk = `${y}-${String(m + 1).padStart(2, '0')}-${String(parseInt(dayNum)).padStart(2, '0')}`;
        openDayDetail(dk);
      }
    });
  });

  // B5: Click on list task items for check and detail
  content.querySelectorAll('[data-check-task]').forEach(chk => {
    chk.style.cursor = 'pointer';
    chk.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = chk.dataset.checkTask;
      const dateKey = chk.dataset.checkDate;
      if (!state.records[dateKey]) state.records[dateKey] = {};
      const was = isCompleted(state.records[dateKey][taskId]);
      if (was) {
        state.records[dateKey][taskId] = false;
      } else {
        const now = new Date();
        state.records[dateKey][taskId] = { done: true, completedAt: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` };
      }
      save(); renderCalendar(); renderAll();
    });
  });
  content.querySelectorAll('.cal-list-item[data-task-id]').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const dayNum = item.closest('.cal-list-day')?.querySelector('.cal-list-day-num')?.textContent;
      if (dayNum) {
        const dk = `${y}-${String(m + 1).padStart(2, '0')}-${String(parseInt(dayNum)).padStart(2, '0')}`;
        openDayDetail(dk);
      }
    });
  });
}

function openDayDetail(dateStr) {
  const d = parseDate(dateStr);
  $('#day-detail-title').textContent = `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
  const scheduled = state.scheduledTasks.filter(st => st.date === dateStr);
  const tasks = getTasksForDate(dateStr);
  const rec = state.records[dateStr] || {};
  let html = '';
  if (scheduled.length) {
    // Group by category
    const cats = [...new Set(scheduled.map(st => st.category || '').filter(Boolean))];
    const uncatSch = scheduled.filter(st => !st.category);
    html += '<h3 class="detail-section-title">📅 予定</h3>';
    if (uncatSch.length) {
      uncatSch.forEach(st => { html += renderScheduledItem(st); });
    }
    cats.forEach(cat => {
      const items = scheduled.filter(st => st.category === cat);
      html += `<div class="detail-cat-group"><div class="detail-cat-header" data-cat="${escapeHtml(cat)}"><span>${escapeHtml(cat)}</span></div>`;
      items.forEach(st => { html += renderScheduledItem(st); });
      html += '</div>';
    });
  }
  if (tasks.length) {
    html += '<h3 class="detail-section-title">✅ タスク</h3>';
    tasks.forEach(t => {
      const done = isCompleted(rec[t.id]);
      const memo = getTaskMemo(t.id, dateStr);
      const isCalTask = t.category === 'カレンダー';
      html += `<div class="detail-item ${done ? 'done' : ''}" data-detail-task="${t.id}" ${isCalTask ? `data-cal-task-id="${t.id}"` : ''} style="cursor:pointer">${t.emoji || ''} ${escapeHtml(t.name)} <span class="detail-check${done ? '' : ' dim'}" data-detail-check="${t.id}">${done ? '✅' : '○'}</span>${isCalTask ? `<button class="scheduled-del-btn" data-del-task-id="${t.id}" type="button" title="削除">✕</button>` : ''}${memo ? `<div class="task-memo-line">📝 ${escapeHtml(memo)}</div>` : ''}</div>`;
    });
  }
  if (!scheduled.length && !tasks.length) html = '<p class="empty-sub" style="padding:20px;text-align:center;">この日のデータはありません</p>';
  $('#day-detail-content').innerHTML = html;
  // Category group toggle in detail
  $('#day-detail-content').querySelectorAll('.detail-cat-header').forEach(h => {
    h.addEventListener('click', () => h.closest('.detail-cat-group').classList.toggle('collapsed'));
  });
  // Delete scheduled task buttons
  $('#day-detail-content').querySelectorAll('.scheduled-del-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const delId = btn.dataset.delId;
      state.scheduledTasks = state.scheduledTasks.filter(s => s.id !== delId);
      save();
      closeModal('day-detail-overlay');
      renderCalendar(); renderAll();
      showToast('🗑️ 予定を削除しました');
    });
  });
  // Long-press to edit scheduled items
  $('#day-detail-content').querySelectorAll('.detail-item[data-scheduled-id]').forEach(item => {
    let lpTimer = null;
    const startLP = () => {
      lpTimer = setTimeout(() => {
        closeModal('day-detail-overlay');
        openEditScheduled(item.dataset.scheduledId);
      }, 500);
    };
    const cancelLP = () => { clearTimeout(lpTimer); };
    item.addEventListener('mousedown', startLP);
    item.addEventListener('mouseup', cancelLP);
    item.addEventListener('mouseleave', cancelLP);
    item.addEventListener('touchstart', startLP, { passive: true });
    item.addEventListener('touchend', cancelLP);
    item.addEventListener('touchcancel', cancelLP);
  });
  // B5: Click to toggle task completion in detail view
  $('#day-detail-content').querySelectorAll('[data-detail-check]').forEach(chk => {
    chk.style.cursor = 'pointer';
    chk.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = chk.dataset.detailCheck;
      if (!state.records[dateStr]) state.records[dateStr] = {};
      const was = isCompleted(state.records[dateStr][taskId]);
      if (was) {
        state.records[dateStr][taskId] = false;
      } else {
        const now = new Date();
        state.records[dateStr][taskId] = { done: true, completedAt: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` };
      }
      save(); renderCalendar(); renderAll();
      // Re-open detail to refresh
      closeModal('day-detail-overlay');
      openDayDetail(dateStr);
    });
  });
  // カレンダータスク削除ボタン
  $('#day-detail-content').querySelectorAll('[data-del-task-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const taskId = btn.dataset.delTaskId;
      // tasksから削除
      const task = state.tasks.find(t => t.id === taskId);
      state.tasks = state.tasks.filter(t => t.id !== taskId);
      // scheduledTasksからも削除（scheduledId連携）
      if (task && task.scheduledId) {
        state.scheduledTasks = state.scheduledTasks.filter(s => s.id !== task.scheduledId);
      }
      save();
      closeModal('day-detail-overlay');
      renderCalendar(); renderAll();
      showToast('🗑️ タスクを削除しました');
    });
  });
  // カレンダータスク長押し→編集
  $('#day-detail-content').querySelectorAll('[data-cal-task-id]').forEach(item => {
    let lpTimer = null;
    const startLP = () => {
      lpTimer = setTimeout(() => {
        closeModal('day-detail-overlay');
        const taskId = item.dataset.calTaskId;
        openEditModal(taskId);
      }, 500);
    };
    const cancelLP = () => { clearTimeout(lpTimer); };
    item.addEventListener('mousedown', startLP);
    item.addEventListener('mouseup', cancelLP);
    item.addEventListener('mouseleave', cancelLP);
    item.addEventListener('touchstart', startLP, { passive: true });
    item.addEventListener('touchend', cancelLP);
    item.addEventListener('touchcancel', cancelLP);
  });
  $('#day-detail-add-btn').onclick = () => {
    closeModal('day-detail-overlay');
    openCalTaskModal(dateStr);
  };
  openModal('day-detail-overlay');
}

function openEditScheduled(schId) {
  const st = state.scheduledTasks.find(s => s.id === schId);
  if (!st) return;
  populateGlobalCategoryList();
  $('#edit-scheduled-id').value = st.id;
  $('#edit-scheduled-date').value = st.date;
  $('#edit-scheduled-name').value = st.name;
  // Set timing radio
  document.querySelectorAll('input[name="edit-sch-timing"]').forEach(r => { r.checked = r.value === (st.timing || 'いつでも'); });
  $('#edit-scheduled-url').value = st.url || '';
  $('#edit-scheduled-category').value = st.category || '';
  if ($('#edit-scheduled-notify')) $('#edit-scheduled-notify').value = st.notifyTime || '';
  if ($('#edit-scheduled-memo')) $('#edit-scheduled-memo').value = st.memo || '';
  openModal('edit-scheduled-overlay');
}
function renderScheduledItem(st) {
  let h = `<div class="detail-item" data-scheduled-id="${st.id}">${st.emoji || '📌'} ${escapeHtml(st.name)} ${st.addedToTasks ? '<span class="detail-badge">追加済み</span>' : ''}`;
  if (st.url && st.url.trim()) h += ` <a href="${escapeHtml(st.url)}" target="_blank" class="detail-link">🔗</a>`;
  h += `<button class="scheduled-del-btn" data-del-id="${st.id}" type="button" title="削除">✕</button>`;
  if (st.memo && st.memo.trim()) h += `<div class="task-memo-line">📝 ${escapeHtml(st.memo)}</div>`;
  h += '</div>';
  return h;
}

function openCalTaskModal(dateStr) {
  $('#cal-task-date').value = dateStr || '';
  $('#cal-task-form').reset();
  if (dateStr) $('#cal-task-date').value = dateStr;
  $('#cal-emoji-btn').textContent = '😊';
  hidePanels('cal-emoji-panel');
  populateGlobalCategoryList();
  openModal('cal-task-overlay');
}
