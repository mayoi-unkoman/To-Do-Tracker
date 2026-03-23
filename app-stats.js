/* app-stats.js - Split from app.js */
'use strict';

// ---- Render: Stats ----
function renderStats() {
  const y = state.statsYear, m = state.statsMonth;
  $('#stats-year').textContent = y + '年';
  $('#stats-month').textContent = (m + 1) + '月';
  const days = daysInMonth(y, m), now = new Date();
  const maxDay = (now.getFullYear() === y && now.getMonth() === m) ? Math.min(now.getDate(), days) : days;
  let tc = 0, tp = 0, ms = 0, cs = 0;
  const tcc = {};  // タスクごとの達成日数
  const tad = {};  // タスクごとの対象日数
  state.tasks.forEach(t => { tcc[t.id] = 0; tad[t.id] = 0; });
  for (let d = 1; d <= days; d++) {
    const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(y, m, d);
    const r = state.records[k] || {}, tf = getTasksForDate(k).filter(t => t.category !== 'カレンダー');
    // その日に対象のタスクのみフィルタ
    const activeTasks = tf.filter(t => isTaskActiveOnDate(t, dateObj));
    let dc = true;
    activeTasks.forEach(t => {
      if (d <= maxDay) { tp++; if (tad[t.id] !== undefined) tad[t.id]++; }
      if (isCompleted(r[t.id])) {
        if (d <= maxDay) tc++;
        if (tcc[t.id] !== undefined) tcc[t.id]++;
      } else { dc = false; }
    });
    // ストリーク: 対象タスクが0ならスキップ
    if (activeTasks.length > 0) {
      if (dc) { cs++; ms = Math.max(ms, cs); } else cs = 0;
    }
  }
  const rate = tp > 0 ? Math.round(tc / tp * 100) : 0;
  $('#stat-total').textContent = tc;
  $('#stat-rate').textContent = rate + '%';
  $('#stat-max-streak').textContent = ms;
  const tsl = $('#task-stats-list');
  if (!state.tasks.length) { tsl.innerHTML = '<div class="stats-empty">タスクがまだありません</div>'; return; }
  tsl.innerHTML = state.tasks.filter(t => t.category !== 'カレンダー').map(t => {
    const cnt = tcc[t.id] || 0;
    const activeDays = tad[t.id] || 0;
    const pct = activeDays > 0 ? Math.round(cnt / activeDays * 100) : 0;
    return `<div class="task-stat-row"><div class="task-stat-name">${t.emoji || ''} ${escapeHtml(t.name)}</div><div class="task-stat-bar-bg"><div class="task-stat-bar" style="width:0%"></div></div><div class="task-stat-pct">${pct}%</div></div>`;
  }).join('');
  const filteredTasks = state.tasks.filter(t => t.category !== 'カレンダー');
  requestAnimationFrame(() => {
    tsl.querySelectorAll('.task-stat-bar').forEach((bar, i) => {
      const t = filteredTasks[i];
      if (!t) return;
      const cnt = tcc[t.id] || 0;
      const activeDays = tad[t.id] || 0;
      const pct = activeDays > 0 ? Math.round(cnt / activeDays * 100) : 0;
      bar.style.width = pct + '%';
    });
  });
  renderDailyChart(y, m);
  renderTaskStreakList();
  renderDayOfWeekStats(y, m);
  renderTimeOfDayStats(y, m);
}
function renderDailyChart(year, month) {
  const canvas = $('#daily-chart'); if (!canvas) return;
  const ctx = canvas.getContext('2d'), dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect(), w = rect.width - 32, h = 160;
  canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.scale(dpr, dpr);
  const days = daysInMonth(year, month), bw = Math.max(3, (w - 40) / days - 2), gap = 2, mH = h - 30;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(74,222,128,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const ly = 10 + (mH / 4) * i; ctx.beginPath(); ctx.moveTo(30, ly); ctx.lineTo(w, ly); ctx.stroke(); }
  ctx.fillStyle = '#5a8a6a'; ctx.font = '9px Inter'; ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++)ctx.fillText((100 - i * 25) + '%', 25, 14 + (mH / 4) * i);
  for (let d = 1; d <= days; d++) {
    const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month, d);
    const r = state.records[k] || {}, tf = getTasksForDate(k).filter(t => t.category !== 'カレンダー');
    // 対象タスクのみで達成率を計算
    const activeTasks = tf.filter(t => isTaskActiveOnDate(t, dateObj));
    const done = activeTasks.filter(t => isCompleted(r[t.id])).length;
    const pct = activeTasks.length > 0 ? done / activeTasks.length : 0, x = 32 + (d - 1) * (bw + gap), barH = pct * mH;
    const grad = ctx.createLinearGradient(x, 10 + mH - barH, x, 10 + mH);
    grad.addColorStop(0, 'rgba(74,222,128,0.85)'); grad.addColorStop(1, 'rgba(34,197,94,0.4)');
    ctx.fillStyle = pct > 0 ? grad : 'rgba(74,222,128,0.05)';
    const R = Math.min(bw / 2, 3), bx = x, by = 10 + mH - Math.max(barH, 2), BW = bw, bh = Math.max(barH, 2);
    ctx.beginPath(); ctx.moveTo(bx + R, by); ctx.lineTo(bx + BW - R, by); ctx.quadraticCurveTo(bx + BW, by, bx + BW, by + R);
    ctx.lineTo(bx + BW, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + R); ctx.quadraticCurveTo(bx, by, bx + R, by); ctx.fill();
    if (d % 5 === 1 || d === days) { ctx.fillStyle = '#5a8a6a'; ctx.font = '8px Inter'; ctx.textAlign = 'center'; ctx.fillText(d, x + bw / 2, h - 2); }
  }
}

// ---- タスク別最大ストリーク計算（全期間） ----
function calcTaskMaxStreak(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return 0;
  const created = task.createdDate || '2000-01-01';
  const today = new Date();
  let maxS = 0, curS = 0;

  if (task.frequency === '週') {
    // 週Nタスク: 作成週から今週まで走査
    let d = new Date(parseDate(created));
    for (let i = 0; i < 104; i++) {
      const k = formatDate(d);
      if (k > formatDate(today)) break;
      const weekDays = getWeekDays(k);
      const done = weekDays.some(wd => isCompleted((state.records[formatDate(wd)] || {})[id]));
      if (done) { curS++; maxS = Math.max(maxS, curS); } else { curS = 0; }
      d.setDate(d.getDate() + 7);
    }
  } else {
    // 毎日タスク: 作成日から今日まで走査
    let d = new Date(parseDate(created));
    while (formatDate(d) <= formatDate(today)) {
      if (!isTaskActiveOnDate(task, d)) { d.setDate(d.getDate() + 1); continue; }
      const k = formatDate(d);
      if (isCompleted((state.records[k] || {})[id])) {
        curS++; maxS = Math.max(maxS, curS);
      } else { curS = 0; }
      d.setDate(d.getDate() + 1);
    }
  }
  return maxS;
}

// ---- タスク別最大ストリークリスト描画 ----
function renderTaskStreakList() {
  const el = $('#task-streak-list'); if (!el) return;
  const tasks = state.tasks.filter(t => t.category !== 'カレンダー');
  if (!tasks.length) { el.innerHTML = '<div class="stats-empty">タスクがまだありません</div>'; return; }
  const data = tasks.map(t => ({ task: t, maxStreak: calcTaskMaxStreak(t.id), curStreak: calcTaskStreak(t.id) }))
    .sort((a, b) => b.maxStreak - a.maxStreak);
  const topStreak = data[0]?.maxStreak || 1;
  el.innerHTML = data.map(d => {
    const pct = topStreak > 0 ? Math.round(d.maxStreak / topStreak * 100) : 0;
    return `<div class="streak-row">
      <div class="streak-row-name">${d.task.emoji || ''} ${escapeHtml(d.task.name)}</div>
      <div class="streak-row-bar-bg"><div class="streak-row-bar" style="width:0%"></div></div>
      <div class="streak-row-val"><span class="streak-max-val">🔥${d.maxStreak}日</span><span class="streak-cur-val">(現在 ${d.curStreak}日)</span></div>
    </div>`;
  }).join('');
  // 分析テキスト
  const best = data[0];
  const worst = data.filter(d => d.maxStreak > 0).slice(-1)[0];
  let insightHtml = '';
  if (best && best.maxStreak > 0) {
    insightHtml += `<div class="insight-item insight-good">💪 <strong>${escapeHtml(best.task.name)}</strong> が最も継続力が高い（最大${best.maxStreak}日連続）</div>`;
  }
  if (worst && worst !== best && worst.maxStreak > 0) {
    insightHtml += `<div class="insight-item insight-warn">⚡ <strong>${escapeHtml(worst.task.name)}</strong> は継続が途切れやすい傾向（最大${worst.maxStreak}日）</div>`;
  }
  if (insightHtml) el.innerHTML += `<div class="insight-box">${insightHtml}</div>`;
  requestAnimationFrame(() => {
    el.querySelectorAll('.streak-row-bar').forEach((bar, i) => {
      const d = data[i]; if (!d) return;
      bar.style.width = (topStreak > 0 ? Math.round(d.maxStreak / topStreak * 100) : 0) + '%';
    });
  });
}

// ---- 曜日別達成傾向描画 ----
function renderDayOfWeekStats(year, month) {
  const el = $('#day-of-week-stats'); if (!el) return;
  const days = daysInMonth(year, month);
  const now = new Date();
  const maxDay = (now.getFullYear() === year && now.getMonth() === month) ? Math.min(now.getDate(), days) : days;
  const dowData = Array.from({ length: 7 }, () => ({ total: 0, done: 0 }));
  const dowNames = ['日', '月', '火', '水', '木', '金', '土'];

  for (let d = 1; d <= maxDay; d++) {
    const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month, d);
    const dow = dateObj.getDay();
    const r = state.records[k] || {};
    const tf = getTasksForDate(k).filter(t => t.category !== 'カレンダー');
    const active = tf.filter(t => isTaskActiveOnDate(t, dateObj));
    active.forEach(t => {
      dowData[dow].total++;
      if (isCompleted(r[t.id])) dowData[dow].done++;
    });
  }

  const rates = dowData.map((d, i) => ({
    name: dowNames[i], rate: d.total > 0 ? Math.round(d.done / d.total * 100) : 0, total: d.total, done: d.done
  }));
  const maxRate = Math.max(...rates.map(r => r.rate), 1);

  // 月曜始まりに並び替え
  const orderedRates = [...rates.slice(1), rates[0]];

  el.innerHTML = orderedRates.map(r => {
    const barPct = maxRate > 0 ? Math.round(r.rate / maxRate * 100) : 0;
    const isLow = r.rate > 0 && r.rate <= Math.min(...orderedRates.filter(x => x.total > 0).map(x => x.rate));
    const isHigh = r.rate > 0 && r.rate >= Math.max(...orderedRates.filter(x => x.total > 0).map(x => x.rate));
    return `<div class="dow-row ${isLow ? 'dow-low' : ''} ${isHigh ? 'dow-high' : ''}">
      <span class="dow-name">${r.name}</span>
      <div class="dow-bar-bg"><div class="dow-bar" style="width:${barPct}%"></div></div>
      <span class="dow-rate">${r.rate}%</span>
    </div>`;
  }).join('');

  // 分析テキスト
  const activeRates = orderedRates.filter(r => r.total > 0);
  if (activeRates.length > 0) {
    const best = activeRates.reduce((a, b) => a.rate >= b.rate ? a : b);
    const worst = activeRates.reduce((a, b) => a.rate <= b.rate ? a : b);
    let insightHtml = '';
    if (best.rate > 0) insightHtml += `<div class="insight-item insight-good">📈 <strong>${best.name}曜日</strong>の達成率が最も高い（${best.rate}%）</div>`;
    if (worst !== best && worst.rate < best.rate) insightHtml += `<div class="insight-item insight-warn">📉 <strong>${worst.name}曜日</strong>の達成率が比較的低い（${worst.rate}%）</div>`;
    if (insightHtml) el.innerHTML += `<div class="insight-box">${insightHtml}</div>`;
  }
}

// ---- 時間帯別達成傾向描画 ----
function renderTimeOfDayStats(year, month) {
  const el = $('#time-of-day-stats'); if (!el) return;
  const days = daysInMonth(year, month);
  const now = new Date();
  const maxDay = (now.getFullYear() === year && now.getMonth() === month) ? Math.min(now.getDate(), days) : days;
  // 時間帯バケット: 0-5, 6-8, 9-11, 12-14, 15-17, 18-20, 21-23
  const buckets = [
    { label: '深夜', range: '0-5時', from: 0, to: 5, count: 0, icon: '🌙' },
    { label: '早朝', range: '6-8時', from: 6, to: 8, count: 0, icon: '🌅' },
    { label: '午前', range: '9-11時', from: 9, to: 11, count: 0, icon: '☀️' },
    { label: '昼', range: '12-14時', from: 12, to: 14, count: 0, icon: '🌤️' },
    { label: '午後', range: '15-17時', from: 15, to: 17, count: 0, icon: '🌇' },
    { label: '夕方', range: '18-20時', from: 18, to: 20, count: 0, icon: '🌆' },
    { label: '夜', range: '21-23時', from: 21, to: 23, count: 0, icon: '🌃' },
  ];
  let totalWithTime = 0;

  for (let d = 1; d <= maxDay; d++) {
    const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const r = state.records[k];
    if (!r) continue;
    Object.entries(r).forEach(([key, val]) => {
      if (key === 'memos' || !val) return;
      const at = getCompletedAt(val);
      if (!at) return;
      const hour = parseInt(at.split(':')[0], 10);
      if (isNaN(hour)) return;
      totalWithTime++;
      const bucket = buckets.find(b => hour >= b.from && hour <= b.to);
      if (bucket) bucket.count++;
    });
  }

  if (totalWithTime === 0) {
    el.innerHTML = '<div class="stats-empty">時刻データはまだありません<br><span class="stats-empty-sub">タスクを完了すると時間帯が記録されます</span></div>';
    return;
  }

  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  el.innerHTML = `<div class="time-slots">` + buckets.map(b => {
    const pct = maxCount > 0 ? Math.round(b.count / maxCount * 100) : 0;
    const isTop = b.count === maxCount && b.count > 0;
    return `<div class="time-slot ${isTop ? 'time-slot-top' : ''}" title="${b.range}: ${b.count}回">
      <div class="time-slot-bar-wrap"><div class="time-slot-bar" style="height:${pct}%"></div></div>
      <div class="time-slot-icon">${b.icon}</div>
      <div class="time-slot-label">${b.label}</div>
      <div class="time-slot-count">${b.count}</div>
    </div>`;
  }).join('') + `</div>`;

  // 分析テキスト
  const topBucket = buckets.reduce((a, b) => a.count >= b.count ? a : b);
  if (topBucket.count > 0) {
    el.innerHTML += `<div class="insight-box"><div class="insight-item insight-good">⏰ <strong>${topBucket.range}</strong>に達成されることが多い（${topBucket.count}回）</div></div>`;
  }
}

// ---- Render: Progress Bar ----
function renderProgressBar() {
  const { total, done } = getCompletionForDate(state.selectedDate);
  $('#progress-count').textContent = `${done}/${total}`;
  const pct = total > 0 ? (done / total) * 100 : 0;
  $('#progress-fill').style.width = pct + '%';
  const dp = $('#daily-progress');
  if (total === 0) dp.style.display = 'none';
  else dp.style.display = '';
  if (total > 0 && done === total) dp.classList.add('complete');
  else dp.classList.remove('complete');
}

// ---- Confetti ----
function showConfetti() {
  const canvas = $('#confetti-canvas');
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pieces = [];
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0', '#ff9f43', '#00d2d3'];
  // Collect task emojis for today
  const todayTasks = getTasksForDate(state.selectedDate);
  const taskEmojis = todayTasks.map(t => t.emoji).filter(Boolean);
  for (let i = 0; i < 60; i++) {
    const useEmoji = taskEmojis.length > 0 && Math.random() < 0.5;
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 15 - 5,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.3,
      life: 1,
      emoji: useEmoji ? taskEmojis[Math.floor(Math.random() * taskEmojis.length)] : null,
      size: useEmoji ? (16 + Math.random() * 16) : 0,
    });
  }
  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pieces.forEach(p => {
      if (p.life <= 0) return;
      alive = true;
      p.x += p.vx; p.y += p.vy; p.vy += 0.35;
      p.rot += p.rv; p.life -= 0.012;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      if (p.emoji) {
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
      } else {
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });
    frame++;
    if (alive && frame < 120) requestAnimationFrame(animate);
    else { canvas.style.display = 'none'; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
  requestAnimationFrame(animate);
}

let celebrationShownForDate = null;
function resetCelebration() { celebrationShownForDate = null; }

// ---- Render All ----
function renderAll() { renderHeader(); renderWeekCalendar(); renderFilters(); renderTaskList(); renderProgressBar(); populateGlobalCategoryList(); }
