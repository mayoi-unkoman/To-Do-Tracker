/* app-core.js - Split from app.js */
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const STORAGE_KEY = 'habit_tracker_data';
const DATA_VERSION = 4;

// ---- Emoji Categories ----
const EMOJI_CATS = {
  '顔': ['😊', '😄', '😆', '😎', '🤓', '🥳', '🤩', '😍', '🥰', '😇', '🤗', '😋', '🤔', '😏', '🥺', '😤', '💀', '👻', '🤖', '👽', '😂', '😅', '😉', '😌', '😚', '😘', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤥', '😶', '😷', '🤒', '🤕', '🤢', '🥴', '😴'],
  '活動': ['💪', '🏃', '🧘', '💃', '🕺', '🎯', '🎨', '🎹', '🎵', '⚽', '🏀', '🎮', '🏋️', '🚴', '🏊', '🧗', '🤸', '🏄', '🎳', '🏓', '🤼', '🤺', '🏇', '⛷️', '🏂', '🤽', '🏆', '🎭', '🎬', '🎤', '🎼', '🎷', '🥁', '🎪', '🎣', '🪂'],
  '学習': ['📖', '📚', '✍️', '📝', '💻', '🧠', '🔬', '📊', '🎓', '📐', '🔭', '💡', '📰', '📋', '✏️', '🖊️', '📒', '🗒️', '📑', '🗂️', '💾', '💿', '🧮', '📱', '🖥️', '🖨️', '⌨️', '📉', '📈', '📡'],
  '生活': ['☕', '🍳', '🛒', '🧺', '🪥', '🚿', '🏠', '🚗', '✈️', '🌞', '🍽️', '🧹', '💤', '🛌', '👔', '🧴', '💊', '🎒', '📱', '🔑', '🧳', '🛍️', '🏪', '🏢', '🏥', '🚌', '🚕', '🚲', '🛠️', '🧺'],
  '食事': ['🥗', '🍎', '🥤', '🍱', '🥚', '🍞', '🥛', '🫖', '🧃', '🍰', '🍫', '🥑', '🍙', '🍜', '🍕', '🍔', '🥩', '🥦', '🍇', '🍊', '🍌', '🍓', '🍉', '🍒', '🥝', '🍐', '🍍', '🥭', '🌶️', '🌽', '🥕', '🍡', '🍢', '🍣', '🍦', '🍧'],
  '自然': ['🌿', '🌸', '🌊', '🌈', '⭐', '🌙', '☀️', '🍃', '🦋', '🐾', '🌻', '🌲', '🍁', '🌺', '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯', '🐨', '🐧', '🐸', '🦉', '🦅', '🐢', '🐋', '🐠', '🐙', '🐝', '🦚', '🦜', '🦩', '🦗'],
  '記号': ['❤️', '💚', '💜', '💛', '🧡', '💙', '✨', '🔥', '💎', '🎀', '🏆', '🎉', '🎊', '💯', '✅', '⚡', '🌟', '🏅', '💫', '☄️', '🌍', '🔔', '💣', '🔮', '🪬', '♻️', '❄️', '🍀', '🎗️', '🧿'],
  '手': ['👍', '👎', '👋', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '🤏', '👏', '🙌', '🤲', '🤝', '🙏', '👐', '👊', '✊', '☝️', '👆', '👇', '👈', '👉', '💪', '🦵', '🦶'],
  '物': ['🛡️', '⚔️', '🪨', '🧪', '🧫', '🧬', '🪄', '🕶️', '🎈', '🎁', '🎄', '🎃', '🏮', '🧧', '🧽', '🧱', '🔧', '🔨', '🔩', '🧰', '🪅', '🪆', '🎐', '🪗', '🧸'],
  '乗り物': ['🚀', '✈️', '🚂', '🚍', '🚗', '🚕', '🚲', '🛵', '⛵', '🚢', '🚁', '🚜', '🚒', '🚑', '🚓', '🚨', '🚖', '🚎', '🚌', '🚊'],
};

const NOTIFY_MESSAGES = [
  'まだ「{task}」が終わっていませんよ。',
  '今日の「{task}」、忘れていませんか？',
  '「{task}」があなたを待っています。',
  'そろそろ「{task}」の時間です。',
  '「{task}」、今やると未来の自分が喜びます。',
  '今日の目標「{task}」、残っています。',
  '少しだけでも「{task}」やってみませんか？',
  '「{task}」、今ならまだ間に合います。',
  '……「{task}」、やりました？',
  '今日の「{task}」、放置中です。',
  '「{task}」を終わらせてスッキリしませんか？',
  '「{task}」クリアで今日を締めくくりましょう。',
  'まだ「{task}」が未完了です。',
  '今日の「{task}」、忘却ゾーン入りしそうです。',
  '「{task}」、ここで動けば連続記録キープです。',
  'そろそろ「{task}」を片付ける時間です。',
  '「{task}」を終わらせると気持ちいいですよ。',
  '「{task}」、軽くでいいからやってみましょう。',
  '「{task}」未達成。',
  '「{task}」を終えれば今日が完成します。',
  '「{task}」、未来の自分に託さないでください。',
];

const THEME_PRESETS = [
  { id: 'green', name: '緑', h: 142, s: 71, l: 45 },
  { id: 'red', name: '赤', h: 0, s: 72, l: 60 },
  { id: 'white', name: '白', h: 210, s: 30, l: 78 },
  { id: 'blue', name: '青', h: 217, s: 80, l: 58 },
  { id: 'yellow', name: '黄', h: 48, s: 90, l: 53 },
  { id: 'black', name: '黒', h: 0, s: 0, l: 55 },
  { id: 'milk', name: 'ミルク', h: 30, s: 65, l: 72 },
];

// ---- State ----
let state = {
  tasks: [],
  records: {},
  scheduledTasks: [],
  settings: {
    backgroundImage: null, dominantColor: null,
    theme: { h: 142, s: 71, l: 45 },
    customColors: [],
    customMessages: [],
    taskScale: 100,
    taskOpacity: 100,
    backgroundImages: [],
    bgRandom: false,
  },
  selectedDate: todayStr(),
  activeFilter: 'all',
  statsMonth: new Date().getMonth(),
  statsYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  calMode: 'month',
};
// 最後にチェックした日付を追跡（日付変更検知用）
let _lastCheckedDate = todayStr();
// Service Worker registration reference
let _swRegistration = null;
// ---- Web Push設定 ----
// ※ PushサーバーURLのみ設定（公開鍵はサーバーから自動取得）
const PUSH_CONFIG = {
  pushServerUrl: 'https://push-server.tz5jqbgcp7.workers.dev',
};
let longPressTimer = null, longPressTriggered = false;

// ---- Date Utilities ----
function todayStr() {
  return formatDate(new Date());
}
function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function getWeekDays(dateStr) {
  const d = parseDate(dateStr), day = d.getDay(), start = new Date(d);
  // 月曜起算: 月=0, 火=1, ..., 日=6
  const mondayOffset = (day === 0) ? 6 : day - 1;
  start.setDate(start.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => { const dd = new Date(start); dd.setDate(dd.getDate() + i); return dd; });
}
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

// ---- Persistence ----
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: DATA_VERSION, initialized: true,
      tasks: state.tasks, records: state.records,
      scheduledTasks: state.scheduledTasks, settings: state.settings,
      savedCategories: state.savedCategories || [],
      categoryOrder: state.categoryOrder || [],
      savedMemoCategories: state.savedMemoCategories || [],
      memoCategoryOrder: state.memoCategoryOrder || [],
    }));
  } catch (e) { }
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return false;
    state.tasks = Array.isArray(d.tasks) ? d.tasks : [];
    state.records = d.records && typeof d.records === 'object' ? d.records : {};
    state.scheduledTasks = Array.isArray(d.scheduledTasks) ? d.scheduledTasks : [];
    state.settings = d.settings && typeof d.settings === 'object' ? d.settings : { backgroundImage: null, dominantColor: null };
    state.savedCategories = Array.isArray(d.savedCategories) ? d.savedCategories : [];
    state.categoryOrder = Array.isArray(d.categoryOrder) ? d.categoryOrder : [];
    state.savedMemoCategories = Array.isArray(d.savedMemoCategories) ? d.savedMemoCategories : [];
    state.memoCategoryOrder = Array.isArray(d.memoCategoryOrder) ? d.memoCategoryOrder : [];
    // タグ自動移行: name内の#tagをtagsフィールドに分離
    state.tasks.forEach(t => {
      if (!t.tags) {
        const extracted = t.name.match(/#[^\s#]+/g) || [];
        t.tags = extracted.map(x => x.replace(/^#/, ''));
        t.name = t.name.replace(/#[^\s#]+/g, '').trim();
      }
      if (t.description === undefined) t.description = '';
    });
    if (!d.version || d.version < DATA_VERSION) save();
    return d.initialized === true || state.tasks.length > 0;
  } catch (e) { return false; }
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
// ---- Record Helpers ----
// 完了判定（旧形式 true と新形式 {done:true, completedAt:"HH:MM"} の両対応）
function isCompleted(val) { return val === true || (val && val.done === true); }
function getCompletedAt(val) { return (val && val.completedAt) ? val.completedAt : null; }

// ---- Task Queries ----
function getTasksForDate(ds) {
  return state.tasks.filter(t => {
    // 1日だけタスク: createdDateの日のみ表示
    if (t.frequency === '1日だけ') return t.createdDate === ds;
    // カレンダーカテゴリ: createdDateの日のみ表示（日付全体反映バグ修正）
    if (t.category === 'カレンダー') return t.createdDate === ds;
    // 通常タスク: 作成日以降すべて
    return !t.createdDate || t.createdDate <= ds;
  });
}
function getCompletionForDate(ds) {
  const dateObj = parseDate(ds);
  const tasks = getTasksForDate(ds).filter(t => t.category !== 'カレンダー' && isTaskActiveOnDate(t, dateObj));
  const rec = state.records[ds] || {};
  const done = tasks.filter(t => isCompleted(rec[t.id])).length;
  return { total: tasks.length, done, pct: tasks.length > 0 ? done / tasks.length : 0 };
}
function isAllComplete(ds) { const { total, done } = getCompletionForDate(ds); return total > 0 && done === total; }
function hasSomeComplete(ds) { const r = state.records[ds] || {}; return Object.values(r).some(v => isCompleted(v)); }

// ---- Streaks ----
// 対象日かどうか判定（平日のみ/週末のみを考慮）
function isTaskActiveOnDate(task, dateObj) {
  const dow = dateObj.getDay();
  if (task.timing === '平日のみ' && (dow === 0 || dow === 6)) return false;
  if (task.timing === '週末のみ' && dow !== 0 && dow !== 6) return false;
  return true;
}

function calcGlobalStreak() {
  const dt = state.tasks.filter(t => t.frequency === '毎日');
  if (!dt.length) return 0;
  let s = 0, d = new Date(), tk = formatDate(d);
  const tr = state.records[tk] || {}, ta = dt.filter(t => !t.createdDate || t.createdDate <= tk);
  // 今日対象のタスクが全て完了しているか（対象日のみ）
  const todayActive = ta.filter(t => isTaskActiveOnDate(t, d));
  if (!(todayActive.length > 0 && todayActive.every(t => isCompleted(tr[t.id])))) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 730; i++) {
    const k = formatDate(d);
    const a = dt.filter(t => !t.createdDate || t.createdDate <= k);
    if (!a.length) break;
    // その日に対象のタスクのみチェック
    const active = a.filter(t => isTaskActiveOnDate(t, d));
    if (active.length === 0) {
      // 全タスクが非対象日（例: 平日タスクのみの土日）→ スキップ
      d.setDate(d.getDate() - 1);
      continue;
    }
    const r = state.records[k] || {};
    if (active.every(t => isCompleted(r[t.id]))) { s++; d.setDate(d.getDate() - 1); } else break;
  }
  return s;
}
function calcTaskStreak(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return 0;
  let s = 0, d = new Date();
  const created = task.createdDate || '2000-01-01';
  const todayKey = formatDate(d);

  if (task.frequency === '週') {
    // ---- 週Nタスク: 週単位でカウント ----
    // 今週の達成状況を確認
    const thisWeek = getWeekDays(todayKey);
    const thisWeekDone = thisWeek.some(wd => isCompleted((state.records[formatDate(wd)] || {})[id]));
    if (!thisWeekDone) {
      // 今週未達成 → 先週から開始
      d.setDate(d.getDate() - 7);
    }
    for (let i = 0; i < 104; i++) { // 最大2年分
      const k = formatDate(d);
      if (k < created) break;
      const weekDays = getWeekDays(k);
      const done = weekDays.some(wd => isCompleted((state.records[formatDate(wd)] || {})[id]));
      if (done) { s++; d.setDate(d.getDate() - 7); } else break;
    }
  } else {
    // ---- 毎日タスク（平日のみ/週末のみ含む） ----
    // 今日が対象日かチェック
    const todayActive = isTaskActiveOnDate(task, d);
    if (todayActive) {
      // 今日が対象日: 未完了なら昨日から開始
      if (!(isCompleted((state.records[todayKey] || {})[id]))) {
        d.setDate(d.getDate() - 1);
      }
    } else {
      // 今日が非対象日（平日タスクの土日等）: 直前の対象日から開始
      d.setDate(d.getDate() - 1);
    }

    for (let i = 0; i < 730; i++) {
      const k = formatDate(d);
      if (k < created) break;
      // 非対象日はスキップ（ストリーク途切れにしない）
      if (!isTaskActiveOnDate(task, d)) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      // 対象日: 達成なら+1、未達成なら途切れ
      if (isCompleted((state.records[k] || {})[id])) {
        s++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
  }
  return s;
}
function getWeeklyProgress(id) {
  return getWeekDays(state.selectedDate).reduce((c, d) => isCompleted((state.records[formatDate(d)] || {})[id]) ? c + 1 : c, 0);
}

// ---- Scheduled Tasks ----
function processScheduledTasks() {
  let changed = false;
  state.scheduledTasks.forEach(st => {
    if (!st.addedToTasks) {
      // 重複チェック: 同じscheduledIdのタスクが既に存在する場合スキップ
      const exists = state.tasks.some(t => t.scheduledId === st.id);
      if (exists) { st.addedToTasks = true; changed = true; return; }
      state.tasks.push({
        id: genId(), name: st.name, emoji: st.emoji || '',
        timing: st.timing || 'いつでも', frequency: '1日だけ', freqCount: null,
        url: st.url || '', category: 'カレンダー', createdDate: st.date,
        customIcon: null, notifyTime: st.notifyTime || '',
        scheduledId: st.id, tags: [], description: st.memo || '',
      });
      st.addedToTasks = true; changed = true;
    }
  });
  if (changed) save();
}

// ---- Global Category List ----
function populateGlobalCategoryList() {
  const dl = $('#global-category-list');
  if (!dl) return;
  const cats = new Set();
  cats.add('カレンダー');
  state.tasks.forEach(t => { if (t.category) cats.add(t.category); });
  state.scheduledTasks.forEach(st => { if (st.category) cats.add(st.category); });
  Object.values(state.records).forEach(rec => {
    if (rec && rec.memos) {
      Object.values(rec.memos).forEach(v => {
        if (typeof v === 'object' && v.category) cats.add(v.category);
      });
    }
  });
  if (state.savedCategories) state.savedCategories.forEach(c => cats.add(c));
  dl.innerHTML = [...cats].map(c => `<option value="${escapeHtml(c)}">`).join('');
  // Also update memo-category-list
  const mdl = $('#memo-category-list');
  if (mdl) mdl.innerHTML = dl.innerHTML;
}

function saveCategory(cat) {
  if (!cat || !cat.trim()) return;
  cat = cat.trim();
  if (!state.savedCategories) state.savedCategories = [];
  if (!state.savedCategories.includes(cat)) {
    state.savedCategories.push(cat);
    save();
  }
}

// ---- Image Processing ----
function resizeImage(file, maxSize, cb) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const c = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = h * (maxSize / w); w = maxSize; }
        else { w = w * (maxSize / h); h = maxSize; }
      }
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/png', 0.8));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function extractDominantColor(dataUrl, cb) {
  const img = new Image();
  img.onload = function () {
    const c = document.createElement('canvas');
    c.width = 50; c.height = 50;
    c.getContext('2d').drawImage(img, 0, 0, 50, 50);
    const px = c.getContext('2d').getImageData(0, 0, 50, 50).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < px.length; i += 16) { r += px[i]; g += px[i + 1]; b += px[i + 2]; count++; }
    cb({ r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) });
  };
  img.src = dataUrl;
}

// ---- Theme System ----
function applyTheme(h, s, l) {
  const root = document.documentElement;
  root.style.setProperty('--accent', `hsl(${h},${s}%,${l}%)`);
  root.style.setProperty('--accent-dim', `hsl(${h},${Math.round(s * 0.6)}%,${Math.round(l * 0.65)}%)`);
  root.style.setProperty('--accent-glow', `hsla(${h},${s}%,${l}%,0.08)`);
  root.style.setProperty('--border-accent', `hsla(${h},${s}%,${l}%,0.25)`);
  const bh = s > 5 ? h : 0;
  const bs = Math.min(40, s);
  root.style.setProperty('--bg-deep', `hsl(${bh},${bs}%,5%)`);
  root.style.setProperty('--bg-primary', `hsl(${bh},${Math.min(35, s)}%,8%)`);
  root.style.setProperty('--bg-card', `hsl(${bh},${Math.min(30, s)}%,11%)`);
  root.style.setProperty('--bg-card-hover', `hsl(${bh},${Math.min(28, s)}%,14%)`);
  root.style.setProperty('--bg-surface', `hsl(${bh},${Math.min(25, s)}%,15%)`);
  root.style.setProperty('--bg-input', `hsl(${bh},${Math.min(35, s)}%,7%)`);
}

function applyTaskScale() {
  const scale = (state.settings.taskScale || 100) / 100;
  document.documentElement.style.setProperty('--task-scale', scale);
}
function applyTaskOpacity() {
  const o = state.settings.taskOpacity != null ? state.settings.taskOpacity : 100;
  document.documentElement.style.setProperty('--task-opacity', o / 100);
}

// ---- Background ----
function applyBackground() {
  // Random background support
  const imgs = state.settings.backgroundImages || [];
  let bg = state.settings.backgroundImage;
  if (state.settings.bgRandom && imgs.length > 0) {
    bg = imgs[Math.floor(Math.random() * imgs.length)];
  }
  const t = state.settings.theme || { h: 142, s: 71, l: 45 };
  applyTheme(t.h, t.s, t.l);
  if (bg) {
    document.body.style.backgroundImage = `url(${bg})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    const bh = t.s > 5 ? t.h : 0;
    const root = document.documentElement;
    root.style.setProperty('--bg-deep', `hsla(${bh},${Math.min(40, t.s)}%,5%,0.85)`);
    root.style.setProperty('--bg-primary', `hsla(${bh},${Math.min(35, t.s)}%,8%,0.88)`);
    root.style.setProperty('--bg-card', `hsla(${bh},${Math.min(30, t.s)}%,11%,0.9)`);
  } else {
    document.body.style.backgroundImage = '';
  }
}

// ---- Settings Renderers ----
function renderThemePresets() {
  const container = $('#theme-presets');
  if (!container) return;
  const t = state.settings.theme || { h: 142, s: 71, l: 45 };
  container.innerHTML = THEME_PRESETS.map(p =>
    `<button class="theme-dot${p.h === t.h && p.s === t.s ? ' active' : ''}" data-h="${p.h}" data-s="${p.s}" data-l="${p.l}" style="background:hsl(${p.h},${p.s}%,${p.l}%)"><span>${p.name}</span></button>`
  ).join('');
}

function renderSavedColors() {
  const container = $('#saved-colors');
  if (!container) return;
  const colors = state.settings.customColors || [];
  container.innerHTML = colors.length ? colors.map((c, i) =>
    `<button class="saved-dot" data-i="${i}" data-h="${c.h}" data-s="${c.s}" data-l="${c.l}" style="background:hsl(${c.h},${c.s}%,${c.l}%)"></button>`
  ).join('') : '<p class="settings-desc">保存したカラーはありません</p>';
}

function renderCustomMessages() {
  const container = $('#custom-msg-list');
  if (!container) return;
  const msgs = state.settings.customMessages || [];
  container.innerHTML = msgs.length ? msgs.map((m, i) =>
    `<div class="msg-item"><span>${m}</span><button class="msg-del" data-i="${i}">✕</button></div>`
  ).join('') : '<p class="settings-desc">追加されたメッセージはありません</p>';
}

function updatePickerPreview() {
  const p = $('#picker-preview');
  if (!p) return;
  const h = $('#picker-h').value, s = $('#picker-s').value, l = $('#picker-l').value;
  p.style.background = `hsl(${h},${s}%,${l}%)`;
}
