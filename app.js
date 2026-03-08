/* ========================================
   Habit Tracker — app.js v4
   全機能実装版
   ======================================== */
(function () {
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
  function todayStr() { return formatDate(new Date()); }
  function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function getWeekDays(dateStr) {
    const d = parseDate(dateStr), day = d.getDay(), start = new Date(d);
    start.setDate(start.getDate() - day);
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
      if (!d.version || d.version < DATA_VERSION) save();
      return d.initialized === true || state.tasks.length > 0;
    } catch (e) { return false; }
  }
  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // ---- Task Queries ----
  function getTasksForDate(ds) { return state.tasks.filter(t => !t.createdDate || t.createdDate <= ds); }
  function getCompletionForDate(ds) {
    const tasks = getTasksForDate(ds).filter(t => t.category !== 'カレンダー');
    const rec = state.records[ds] || {};
    const done = tasks.filter(t => rec[t.id] === true).length;
    return { total: tasks.length, done, pct: tasks.length > 0 ? done / tasks.length : 0 };
  }
  function isAllComplete(ds) { const { total, done } = getCompletionForDate(ds); return total > 0 && done === total; }
  function hasSomeComplete(ds) { const r = state.records[ds] || {}; return Object.values(r).some(v => v === true); }

  // ---- Streaks ----
  function calcGlobalStreak() {
    const dt = state.tasks.filter(t => t.frequency === '毎日');
    if (!dt.length) return 0;
    let s = 0, d = new Date(), tk = formatDate(d);
    const tr = state.records[tk] || {}, ta = dt.filter(t => !t.createdDate || t.createdDate <= tk);
    if (!(ta.length > 0 && ta.every(t => tr[t.id] === true))) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 730; i++) {
      const k = formatDate(d), a = dt.filter(t => !t.createdDate || t.createdDate <= k);
      if (!a.length) break;
      const r = state.records[k] || {};
      if (a.every(t => r[t.id] === true)) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  }
  function calcTaskStreak(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return 0;
    let s = 0, d = new Date();
    const created = task.createdDate || '2000-01-01';
    if (!((state.records[formatDate(d)] || {})[id] === true)) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 730; i++) {
      const k = formatDate(d);
      if (k < created) break;
      if (task.frequency === '週') {
        // For weekly tasks, check the whole week
        const weekDays = getWeekDays(k);
        const done = weekDays.some(wd => (state.records[formatDate(wd)] || {})[id] === true);
        if (done) { s++; d.setDate(d.getDate() - 7); } else break;
      } else {
        if ((state.records[k] || {})[id] === true) { s++; d.setDate(d.getDate() - 1); } else break;
      }
    }
    return s;
  }
  function getWeeklyProgress(id) {
    return getWeekDays(state.selectedDate).reduce((c, d) => (state.records[formatDate(d)] || {})[id] === true ? c + 1 : c, 0);
  }

  // ---- Scheduled Tasks ----
  function processScheduledTasks() {
    let changed = false;
    state.scheduledTasks.forEach(st => {
      if (!st.addedToTasks) {
        state.tasks.push({
          id: genId(), name: st.name, emoji: st.emoji || '',
          timing: st.timing || 'いつでも', frequency: '毎日', freqCount: null,
          url: st.url || '', category: 'カレンダー', createdDate: st.date,
          customIcon: null, notifyTime: st.notifyTime || '',
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

  // ---- Notifications (再設計版) ----
  // 設計方針: SWは表示専用、スケジューリングはメインスレッドで管理

  // Service Worker 登録
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        _swRegistration = reg;
      }).catch(() => { /* SW非対応環境でも動作継続 */ });
    }
  }

  // ---- Web Push購読 ----
  async function subscribeToPush() {
    if (!PUSH_CONFIG.pushServerUrl) {
      showToast('⚠️ Push設定が未完了です');
      return false;
    }
    try {
      // 通知許可を確認（呼び出し元で既にrequestPermission済み）
      if (Notification.permission !== 'granted') {
        showToast('❌ 通知が許可されていません。設定から許可してください');
        return false;
      }

      // SW登録を待つ
      const reg = await navigator.serviceWorker.ready;

      // 既存の購読を確認
      let subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        showToast('✅ Push通知は既に有効です');
        return true;
      }

      // サーバーからVAPID公開鍵を取得
      const keyRes = await fetch(PUSH_CONFIG.pushServerUrl + '/vapid-key');
      const keyData = await keyRes.json();
      if (!keyData.publicKey) {
        showToast('❌ サーバーから公開鍵を取得できませんでした');
        return false;
      }
      const vapidKey = urlBase64ToUint8Array(keyData.publicKey);

      // Push購読を作成
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      // サーバーに購読情報を送信
      const res = await fetch(PUSH_CONFIG.pushServerUrl + '/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      });

      if (res.ok) {
        showToast('✅ Push通知を有効にしました！');
        return true;
      } else {
        showToast('❌ サーバーへの登録に失敗しました');
        return false;
      }
    } catch (e) {
      showToast('❌ Push通知の設定に失敗: ' + e.message);
      return false;
    }
  }

  // Push購読を解除
  async function unsubscribeFromPush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        showToast('Push通知は無効です');
        return;
      }

      // サーバーから削除
      if (PUSH_CONFIG.pushServerUrl) {
        await fetch(PUSH_CONFIG.pushServerUrl + '/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        }).catch(() => { });
      }

      await subscription.unsubscribe();
      showToast('Push通知を無効にしました');
    } catch (e) {
      showToast('❌ 解除に失敗: ' + e.message);
    }
  }

  // ---- 通知スケジュールをサーバーに同期 ----
  let _syncTimeout = null;
  function syncNotifySchedules() {
    if (!PUSH_CONFIG.pushServerUrl) return;
    if (_syncTimeout) clearTimeout(_syncTimeout);
    _syncTimeout = setTimeout(async () => {
      try {
        // 通常タスクのnotifyTime
        const taskSchedules = state.tasks
          .filter(t => t.notifyTime)
          .map(t => ({ time: t.notifyTime, name: t.name, emoji: t.emoji || '' }));
        // カレンダータスク(scheduledTasks)のnotifyTime
        const calSchedules = (state.scheduledTasks || [])
          .filter(st => st.notifyTime)
          .map(st => ({ time: st.notifyTime, name: st.name, emoji: st.emoji || '' }));
        const schedules = [...taskSchedules, ...calSchedules];
        await fetch(PUSH_CONFIG.pushServerUrl + '/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedules })
        });
      } catch (e) { /* 同期失敗は無視 */ }
    }, 2000);
  }

  // base64url文字列をUint8Arrayに変換
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }

  // 時刻文字列"HH:MM"を当日0時からの分数に変換
  function timeToMinutes(hm) {
    if (!hm || typeof hm !== 'string') return -1;
    const parts = hm.split(':');
    if (parts.length !== 2) return -1;
    const h = parseInt(parts[0], 10), m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return -1;
    return h * 60 + m;
  }

  // ---- 通知チェック（60秒ごとに呼ばれる） ----
  function checkNotifications() {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const today = todayStr();
    const rec = state.records[today] || {};

    state.tasks.forEach(t => {
      if (!t.notifyTime) return;
      // このタスクが今日の対象かチェック
      if (t.createdDate && t.createdDate > today) return;
      // 既に完了済みなら通知しない
      if (rec[t.id] === true) return;
      // 今日既に通知済みなら通知しない（lastNotifiedDate で判定）
      if (t.lastNotifiedDate === today) return;

      const notifyMin = timeToMinutes(t.notifyTime);
      if (notifyMin < 0) return;

      // 通知条件: 現在時刻 >= 通知時刻
      if (nowMinutes < notifyMin) return;

      // 通知を送信
      t.lastNotifiedDate = today;
      save();

      // メッセージ生成（遅れ具合に応じた文言）
      const diff = nowMinutes - notifyMin;
      const msg = buildNotifyMessage(t.name, diff);
      sendNotification(msg, t.id);
    });
  }

  // 通知メッセージを生成（遅延に応じた文言）
  function buildNotifyMessage(taskName, delayMinutes) {
    // カスタムメッセージがあればそちらも候補に入れる
    const allMsgs = NOTIFY_MESSAGES.concat(
      (state.settings.customMessages || []).map(m => m.replace(/〇〇/g, '{task}'))
    );
    let msg = allMsgs[Math.floor(Math.random() * allMsgs.length)].replace('{task}', taskName);
    // 30分以上遅れている場合は遅延文言を付加
    if (delayMinutes >= 30) {
      msg = '⏰ 予定時刻を過ぎています。' + msg;
    }
    return msg;
  }

  // ---- 通知送信（SW経由 → フォールバック） ----
  function sendNotification(msg, taskId) {
    // SW経由でOS通知を表示
    if (_swRegistration && _swRegistration.active) {
      _swRegistration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: '習慣トラッカー',
        body: msg,
        tag: 'habit-' + taskId,
        taskId: taskId
      });
      // アプリ内バナーも同時表示
      showNotifyBanner(msg);
      return;
    }
    // SW未対応: ブラウザ Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('習慣トラッカー', { body: msg, tag: 'habit-' + taskId, requireInteraction: true });
      } catch (e) {
        showNotifyBanner(msg);
      }
    } else {
      showNotifyBanner(msg);
    }
  }

  // アプリ内バナー通知
  function showNotifyBanner(msg) {
    let banner = document.querySelector('.notify-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'notify-banner';
      document.body.appendChild(banner);
    }
    banner.innerHTML = `<span class="notify-banner-icon">🔔</span><span class="notify-banner-text">${msg}</span>`;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 5000);
    // 通知音
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; gain.gain.value = 0.1;
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch (e) { }
  }

  // ---- 日付変更チェック ----
  function checkDateChange() {
    const currentDate = todayStr();
    if (currentDate !== _lastCheckedDate) {
      _lastCheckedDate = currentDate;
      // 全タスクの lastNotifiedDate をリセット
      state.tasks.forEach(t => { t.lastNotifiedDate = null; });
      save();
      // 選択中の日付が前日なら今日に更新
      if (state.selectedDate < currentDate) {
        state.selectedDate = currentDate;
      }
      // 旧形式の _notified_ フラグもクリーンアップ
      cleanupOldNotificationFlags();
      renderAll();
    }
  }

  // 旧形式の通知フラグをクリーンアップ（互換性維持）
  function cleanupOldNotificationFlags() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('_notified_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) { }
    });
  }

  // ---- メインチェックループ（60秒ごと） ----
  function notificationLoop() {
    checkDateChange();
    checkNotifications();
  }

  // ---- visibilitychange ハンドラ ----
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // フォアグラウンド復帰時：即チェック（見逃し回収）
      notificationLoop();
    }
  }

  // ---- URLパラメータ処理（iOSショートカット連携） ----

  function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const taskId = params.get('taskId');
    const autoCheck = params.get('autoCheck');

    // view パラメータ処理
    if (view) {
      switch (view) {
        case 'today':
          // 今日の一覧（メインビュー、今日の日付を選択）
          state.selectedDate = todayStr();
          state.activeFilter = 'all';
          switchView('main-view');
          renderAll();
          break;
        case 'unfinished':
          // 未完了のみ表示（メインビュー、今日を選択、未完了フィルタ適用）
          state.selectedDate = todayStr();
          state.activeFilter = 'all';
          switchView('main-view');
          renderAll();
          // 未完了タスクをハイライト
          setTimeout(() => highlightUnfinishedTasks(), 300);
          break;
        case 'all':
          // 全タスク表示
          state.activeFilter = 'all';
          switchView('main-view');
          renderAll();
          break;
      }
    }

    // taskId パラメータ処理
    if (taskId) {
      // メインビューに切替
      state.selectedDate = todayStr();
      state.activeFilter = 'all';
      switchView('main-view');
      renderAll();
      // 該当タスクへスクロール＋ハイライト
      setTimeout(() => scrollToAndHighlightTask(taskId), 300);
    }

    // autoCheck パラメータ処理
    if (autoCheck === 'true') {
      // 起動直後に未通知タスクチェック
      notificationLoop();
    }

    // URLパラメータをクリア（履歴を汚さない）
    if (params.toString()) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }

  // 特定タスクへスクロールしてハイライト
  function scrollToAndHighlightTask(taskId) {
    const taskEl = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (!taskEl) return;
    // 画面中央にスクロール
    taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // ハイライトアニメーション
    taskEl.classList.add('task-highlight');
    setTimeout(() => taskEl.classList.remove('task-highlight'), 3000);
  }

  // 未完了タスクをハイライト
  function highlightUnfinishedTasks() {
    const today = todayStr();
    const rec = state.records[today] || {};
    const items = document.querySelectorAll('.task-item');
    items.forEach(el => {
      const id = el.dataset.id;
      if (id && rec[id] !== true) {
        el.classList.add('task-highlight');
        setTimeout(() => el.classList.remove('task-highlight'), 3000);
      }
    });
  }

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
    let tasks = state.tasks;
    if (state.activeFilter !== 'all') tasks = tasks.filter(t => t.category === state.activeFilter);
    if (!tasks.length) { c.innerHTML = '<div class="empty-state" style="display:flex;"><div class="empty-icon">📋</div><p>タスクがありません</p><p class="empty-sub">右下の＋ボタンから追加しましょう</p></div>'; return; }
    const dr = state.records[state.selectedDate] || {};
    // Group by category
    const uncategorized = tasks.filter(t => !t.category);
    const cats = [...new Set(tasks.map(t => t.category).filter(Boolean))];
    const groups = [];
    if (uncategorized.length) groups.push({ name: null, tasks: uncategorized });
    cats.forEach(cat => groups.push({ name: cat, tasks: tasks.filter(t => t.category === cat) }));

    function taskHtml(task) {
      const chk = dr[task.id] === true, ts = calcTaskStreak(task.id), hl = task.url && task.url.trim().length > 0;
      let wh = '';
      if (task.frequency === '週' && task.freqCount) {
        const wp = getWeeklyProgress(task.id), tg = task.freqCount;
        const dots = Array.from({ length: tg }, (_, i) => `<span class="weekly-dot ${i < wp ? 'done' : ''}">●</span>`).join('');
        wh = `<div class="weekly-progress ${wp >= tg ? 'complete' : ''}"><span class="weekly-dots">${dots}</span><span class="weekly-label">${wp}/${tg}</span></div>`;
      }
      const icon = taskIconHtml(task);
      const iconIsImg = task.customIcon ? true : false;
      const memo = getTaskMemo(task.id, state.selectedDate);
      const hasMemo = memo ? 'memo-has' : 'memo-empty';
      return `<div class="task-item" data-id="${task.id}" draggable="true">
        <div class="drag-handle" title="ドラッグで並び替え">≡</div>
        <div class="task-timing">${escapeHtml(task.timing || 'いつでも')}</div>
        <div class="task-center" data-task-id="${task.id}">
          <div class="task-name"><span class="task-label">${icon}${escapeHtml(task.name)}</span></div>
          <div class="task-meta">
            ${task.category ? `<span class="task-category-tag">${escapeHtml(task.category)}</span>` : ''}
            ${hl ? '<span class="task-link-icon">🔗</span>' : ''}
            ${task.notifyTime ? `<span class="task-notify-badge">🔔${task.notifyTime}</span>` : ''}
          </div>${wh}
          ${memo ? `<div class="task-memo-line">📝 ${escapeHtml(memo)}</div>` : ''}
        </div>
        <div class="task-right">
          ${ts > 0 ? `<div class="task-action-cell task-streak-mini"><span class="mini-fire">🔥</span>${ts}</div>` : ''}
          <button class="task-action-cell memo-btn ${hasMemo}" data-memo-id="${task.id}" type="button" title="メモ">📝</button>
          <button class="task-action-cell check-btn ${chk ? 'checked' : ''}" data-check-id="${task.id}" type="button"></button>
        </div>
        <span class="task-edit-hint">長押しで編集</span>
      </div>`;
    }

    let html = '';
    groups.forEach(g => {
      if (g.name) {
        const gTasks = g.tasks;
        const gDone = gTasks.filter(t => dr[t.id] === true).length;
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
  function reorderTask(fromId, toId) {
    const fromIdx = state.tasks.findIndex(t => t.id === fromId);
    const toIdx = state.tasks.findIndex(t => t.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = state.tasks.splice(fromIdx, 1);
    state.tasks.splice(toIdx, 0, moved);
    save(); renderAll();
    showToast('🔄 並び替えました');
  }

  // ---- Render: Year Calendar ----
  function renderCalendar() {
    const y = state.calYear, m = state.calMonth;
    $('#cal-year').textContent = y + '年';
    $('#cal-month').textContent = (m + 1) + '月';
    const c = $('#cal-content'), days = daysInMonth(y, m), tk = todayStr();
    const firstDay = new Date(y, m, 1).getDay();
    let html = '<div class="cal-weekday-row">' + WEEKDAYS.map(w => `<span>${w}</span>`).join('') + '</div>';
    html += '<div class="cal-grid">';
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isT = k === tk;
      const { pct } = getCompletionForDate(k);
      const all = isAllComplete(k), some = hasSomeComplete(k);
      const scheduled = state.scheduledTasks.filter(st => st.date === k);
      const hasSch = scheduled.length > 0;
      html += `<div class="cal-cell${isT ? ' today' : ''}${all ? ' all-complete' : some ? ' has-complete' : ''}" data-date="${k}">
        <span class="cal-day-num">${d}</span>
        ${hasSch ? '<span class="cal-dot scheduled">•</span>' : ''}
        ${some && !all ? '<span class="cal-dot done">•</span>' : ''}
        ${all ? '<span class="cal-dot all-done">✓</span>' : ''}
      </div>`;
    }
    html += '</div>';
    c.innerHTML = html;
    // Click handlers
    c.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
      cell.addEventListener('click', () => openDayDetail(cell.dataset.date));
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
        const done = rec[t.id] === true;
        const memo = getTaskMemo(t.id, dateStr);
        html += `<div class="detail-item ${done ? 'done' : ''}">${t.emoji || ''} ${escapeHtml(t.name)} ${done ? '<span class="detail-check">✅</span>' : '<span class="detail-check dim">○</span>'}${memo ? `<div class="task-memo-line">📝 ${escapeHtml(memo)}</div>` : ''}</div>`;
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

  // ---- Render: Stats ----
  function renderStats() {
    const y = state.statsYear, m = state.statsMonth;
    $('#stats-year').textContent = y + '年';
    $('#stats-month').textContent = (m + 1) + '月';
    const days = daysInMonth(y, m), now = new Date();
    const maxDay = (now.getFullYear() === y && now.getMonth() === m) ? Math.min(now.getDate(), days) : days;
    let tc = 0, tp = 0, ms = 0, cs = 0;
    const tcc = {};
    state.tasks.forEach(t => { tcc[t.id] = 0; });
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const r = state.records[k] || {}, tf = getTasksForDate(k);
      let dc = true;
      tf.forEach(t => { if (d <= maxDay) tp++; if (r[t.id] === true) { if (d <= maxDay) tc++; if (tcc[t.id] !== undefined) tcc[t.id]++; } else dc = false; });
      if (tf.length > 0 && dc) { cs++; ms = Math.max(ms, cs); } else if (tf.length > 0) cs = 0;
    }
    const rate = tp > 0 ? Math.round(tc / tp * 100) : 0;
    $('#stat-total').textContent = tc;
    $('#stat-rate').textContent = rate + '%';
    $('#stat-max-streak').textContent = ms;
    const tsl = $('#task-stats-list');
    if (!state.tasks.length) { tsl.innerHTML = '<div class="stats-empty">タスクがまだありません</div>'; return; }
    tsl.innerHTML = state.tasks.map(t => {
      const cnt = tcc[t.id] || 0, pct = maxDay > 0 ? Math.round(cnt / maxDay * 100) : 0;
      return `<div class="task-stat-row"><div class="task-stat-name">${t.emoji || ''} ${escapeHtml(t.name)}</div><div class="task-stat-bar-bg"><div class="task-stat-bar" style="width:0%"></div></div><div class="task-stat-pct">${pct}%</div></div>`;
    }).join('');
    requestAnimationFrame(() => {
      tsl.querySelectorAll('.task-stat-bar').forEach((bar, i) => {
        const cnt = tcc[state.tasks[i]?.id] || 0, pct = maxDay > 0 ? Math.round(cnt / maxDay * 100) : 0;
        bar.style.width = pct + '%';
      });
    });
    renderDailyChart(y, m);
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
      const r = state.records[k] || {}, tf = getTasksForDate(k), done = tf.filter(t => r[t.id] === true).length;
      const pct = tf.length > 0 ? done / tf.length : 0, x = 32 + (d - 1) * (bw + gap), barH = pct * mH;
      const grad = ctx.createLinearGradient(x, 10 + mH - barH, x, 10 + mH);
      grad.addColorStop(0, 'rgba(74,222,128,0.85)'); grad.addColorStop(1, 'rgba(34,197,94,0.4)');
      ctx.fillStyle = pct > 0 ? grad : 'rgba(74,222,128,0.05)';
      const R = Math.min(bw / 2, 3), bx = x, by = 10 + mH - Math.max(barH, 2), BW = bw, bh = Math.max(barH, 2);
      ctx.beginPath(); ctx.moveTo(bx + R, by); ctx.lineTo(bx + BW - R, by); ctx.quadraticCurveTo(bx + BW, by, bx + BW, by + R);
      ctx.lineTo(bx + BW, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + R); ctx.quadraticCurveTo(bx, by, bx + R, by); ctx.fill();
      if (d % 5 === 1 || d === days) { ctx.fillStyle = '#5a8a6a'; ctx.font = '8px Inter'; ctx.textAlign = 'center'; ctx.fillText(d, x + bw / 2, h - 2); }
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

  // ---- Events ----
  function handleCheck(id) {
    const k = state.selectedDate;
    if (!state.records[k]) state.records[k] = {};
    const was = state.records[k][id] === true;
    state.records[k][id] = !was; save();
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
    $('#edit-task-category').value = t.category || '';
    $$('input[name="edit-timing"]').forEach(r => { r.checked = r.value === (t.timing || 'いつでも'); });
    const fv = t.frequency === '週' ? '週' : '毎日';
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
    const name = $('#task-name').value.trim(); if (!name) return;
    const emoji = $('#emoji-picker-btn').textContent;
    state.tasks.push({
      id: genId(), name,
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
    const newNotifyTime = $('#edit-task-notify-time').value || '';
    if (newNotifyTime !== t.notifyTime) {
      t.lastNotifiedDate = null; // 通知時刻が変更されたらリセット
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

  // ---- Init ----
  function init() {
    const wasInit = load();
    if (!wasInit) {
      state.tasks = [
        { id: '_sample_1', name: '台本読み', emoji: '🤓', timing: '毎日', frequency: '毎日', freqCount: null, url: '', category: '', createdDate: todayStr(), customIcon: null, notifyTime: '' },
        { id: '_sample_2', name: '運動する', emoji: '💪', timing: 'いつでも', frequency: '週', freqCount: 2, url: '', category: '健康管理', createdDate: todayStr(), customIcon: null, notifyTime: '' },
        { id: '_sample_3', name: '寝る前のストレッチ', emoji: '🧘', timing: '寝る前に', frequency: '毎日', freqCount: null, url: '', category: '健康管理', createdDate: todayStr(), customIcon: null, notifyTime: '' },
        { id: '_sample_4', name: 'ダンスの練習', emoji: '💃', timing: 'いつでも', frequency: '毎日', freqCount: null, url: '', category: '', createdDate: todayStr(), customIcon: null, notifyTime: '' },
      ];
      save();
    }
    processScheduledTasks();
    populateGlobalCategoryList();
    const t = state.settings.theme || { h: 142, s: 71, l: 45 };
    applyTheme(t.h, t.s, t.l);
    applyBackground();
    applyTaskScale();
    applyTaskOpacity();
    renderAll();
    syncNotifySchedules();

    // FAB
    const fab = $('#fab-add');
    fab.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openAddModal(); });
    fab.addEventListener('touchend', e => { e.preventDefault(); openAddModal(); });
    const calFab = $('#cal-fab-add');
    calFab.addEventListener('click', e => { e.preventDefault(); openCalTaskModal(''); });
    calFab.addEventListener('touchend', e => { e.preventDefault(); openCalTaskModal(''); });

    // Modal closes
    $('#modal-close').addEventListener('click', () => closeModal('modal-overlay'));
    $('#modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-overlay'); });
    $('#edit-modal-close').addEventListener('click', () => closeModal('edit-modal-overlay'));
    $('#edit-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('edit-modal-overlay'); });
    $('#settings-close').addEventListener('click', () => closeModal('settings-overlay'));
    $('#settings-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('settings-overlay'); });
    $('#cal-task-close').addEventListener('click', () => closeModal('cal-task-overlay'));
    $('#cal-task-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('cal-task-overlay'); });
    $('#day-detail-close').addEventListener('click', () => closeModal('day-detail-overlay'));
    $('#day-detail-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('day-detail-overlay'); });
    $('#memo-close').addEventListener('click', () => closeModal('memo-overlay'));
    $('#memo-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('memo-overlay'); });
    $('#memo-save').addEventListener('click', () => {
      if (memoTaskId) {
        setTaskMemo(memoTaskId, state.selectedDate, $('#memo-input').value);
        closeModal('memo-overlay');
        renderAll();
        showToast('📝 メモを保存しました');
      }
    });

    const memoFab = $('#fab-memo-add');
    if (memoFab) {
      const openNewMemo = () => {
        $('#general-memo-date').value = todayStr();
        $('#general-memo-input').value = '';
        if ($('#general-memo-title')) $('#general-memo-title').value = '';
        if ($('#general-memo-category')) $('#general-memo-category').value = '';
        // Populate category datalist from existing categories
        const dl = $('#memo-category-list');
        if (dl) {
          const cats = new Set();
          // From task categories
          state.tasks.forEach(t => { if (t.category) cats.add(t.category); });
          // From existing memo categories
          Object.values(state.records).forEach(rec => {
            if (rec && rec.memos) {
              Object.values(rec.memos).forEach(v => {
                if (typeof v === 'object' && v.category) cats.add(v.category);
              });
            }
          });
          cats.add('カレンダー');
          dl.innerHTML = [...cats].map(c => `<option value="${escapeHtml(c)}">`).join('');
        }
        openModal('general-memo-overlay');
        setTimeout(() => $('#general-memo-input').focus(), 300);
      };
      memoFab.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openNewMemo(); });
      memoFab.addEventListener('touchend', e => { e.preventDefault(); openNewMemo(); });
    }

    const genMemoClose = $('#general-memo-close');
    if (genMemoClose) {
      genMemoClose.addEventListener('click', () => closeModal('general-memo-overlay'));
    }

    const genMemoOverlay = $('#general-memo-overlay');
    if (genMemoOverlay) {
      genMemoOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('general-memo-overlay'); });
    }

    const genMemoSave = $('#general-memo-save');
    if (genMemoSave) {
      genMemoSave.addEventListener('click', () => {
        const date = $('#general-memo-date').value || todayStr();
        const text = $('#general-memo-input').value.trim();
        const title = $('#general-memo-title') ? $('#general-memo-title').value.trim() : '';
        const category = $('#general-memo-category') ? $('#general-memo-category').value.trim() : '';
        if (text) {
          const tid = 'general_' + genId();
          if (!state.records[date]) state.records[date] = {};
          if (!state.records[date].memos) state.records[date].memos = {};
          state.records[date].memos[tid] = { title, text, category };
          if (category) saveMemoCategory(category);
          save();
          closeModal('general-memo-overlay');
          renderAll();
          if ($('#memo-view').classList.contains('active')) { renderMemoFilters(); renderMemoHistory(); }
          showToast('📝 メモを保存しました');
        }
      });
    }

    // Edit memo modal logic
    const editMemoClose = $('#edit-memo-close');
    if (editMemoClose) editMemoClose.addEventListener('click', () => closeModal('edit-memo-overlay'));
    const editMemoOverlay = $('#edit-memo-overlay');
    if (editMemoOverlay) editMemoOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('edit-memo-overlay'); });
    const editMemoSave = $('#edit-memo-save');
    if (editMemoSave) {
      editMemoSave.addEventListener('click', () => {
        const tid = $('#edit-memo-id').value;
        const date = $('#edit-memo-date').value;
        const type = $('#edit-memo-type').value;
        const title = $('#edit-memo-title').value.trim();
        const text = $('#edit-memo-input').value.trim();
        if (type === 'cal') {
          const calId = tid.replace('cal_', '');
          const st = (state.scheduledTasks || []).find(s => s.id === calId);
          if (st) { st.memo = text; st.name = title || st.name; save(); }
        } else {
          if (text) {
            if (!state.records[date]) state.records[date] = {};
            if (!state.records[date].memos) state.records[date].memos = {};
            const old = state.records[date].memos[tid];
            const oldCat = typeof old === 'object' ? (old.category || '') : '';
            state.records[date].memos[tid] = { title, text, category: oldCat };
            save();
          } else {
            if (state.records[date] && state.records[date].memos) {
              delete state.records[date].memos[tid]; save();
            }
          }
        }
        closeModal('edit-memo-overlay');
        renderMemoHistory();
        renderAll();
        showToast('📝 メモを更新しました');
      });
    }
    const editMemoDel = $('#edit-memo-delete');
    if (editMemoDel) {
      editMemoDel.addEventListener('click', () => {
        const tid = $('#edit-memo-id').value;
        const date = $('#edit-memo-date').value;
        const type = $('#edit-memo-type').value;
        if (type === 'cal') {
          const calId = tid.replace('cal_', '');
          const st = (state.scheduledTasks || []).find(s => s.id === calId);
          if (st) { st.memo = ''; save(); }
        } else {
          if (state.records[date] && state.records[date].memos) {
            delete state.records[date].memos[tid]; save();
          }
        }
        closeModal('edit-memo-overlay');
        renderMemoHistory();
        showToast('�️ メモを削除しました');
      });
    }


    // Edit scheduled task modal
    const editSchClose = $('#edit-scheduled-close');
    if (editSchClose) editSchClose.addEventListener('click', () => closeModal('edit-scheduled-overlay'));
    const editSchOverlay = $('#edit-scheduled-overlay');
    if (editSchOverlay) editSchOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('edit-scheduled-overlay'); });
    const editSchSave = $('#edit-scheduled-save');
    if (editSchSave) {
      editSchSave.addEventListener('click', () => {
        const schId = $('#edit-scheduled-id').value;
        const st = state.scheduledTasks.find(s => s.id === schId);
        if (!st) return;
        st.date = $('#edit-scheduled-date').value || st.date;
        st.name = $('#edit-scheduled-name').value.trim() || st.name;
        st.timing = document.querySelector('input[name="edit-sch-timing"]:checked')?.value || st.timing;
        st.url = $('#edit-scheduled-url').value.trim();
        st.category = 'カレンダー';
        if ($('#edit-scheduled-notify')) st.notifyTime = $('#edit-scheduled-notify').value || '';
        if ($('#edit-scheduled-memo')) st.memo = $('#edit-scheduled-memo').value.trim();
        save(); syncNotifySchedules();
        closeModal('edit-scheduled-overlay');
        renderCalendar(); renderAll();
        showToast('📝 予定を更新しました');
      });
    }
    const editSchDel = $('#edit-scheduled-delete');
    if (editSchDel) {
      editSchDel.addEventListener('click', () => {
        const schId = $('#edit-scheduled-id').value;
        state.scheduledTasks = state.scheduledTasks.filter(s => s.id !== schId);
        save();
        closeModal('edit-scheduled-overlay');
        renderCalendar(); renderAll();
        showToast('🗑️ 予定を削除しました');
      });
    }

    // Category group toggle
    $('#task-list').addEventListener('click', e => {
      const header = e.target.closest('.category-group-header');
      if (header) {
        const group = header.closest('.category-group');
        if (group) group.classList.toggle('collapsed');
        return;
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        ['modal-overlay', 'edit-modal-overlay', 'settings-overlay', 'cal-task-overlay', 'day-detail-overlay', 'memo-overlay', 'general-memo-overlay', 'edit-memo-overlay', 'edit-scheduled-overlay'].forEach(id => {
          if ($('#' + id) && $('#' + id).classList.contains('open')) closeModal(id);
        });
      }
    });

    // Forms
    $('#task-form').addEventListener('submit', addTask);
    $('#edit-task-form').addEventListener('submit', editTask);
    $('#edit-delete-btn').addEventListener('click', deleteTask);
    $('#cal-task-form').addEventListener('submit', addScheduledTask);

    // Settings btn
    $('#settings-btn').addEventListener('click', openSettings);

    // Emoji pickers
    setupEmojiPanel('emoji-picker-btn', 'emoji-panel', 'emoji-cats', 'emoji-grid');
    setupEmojiPanel('edit-emoji-picker-btn', 'edit-emoji-panel', 'edit-emoji-cats', 'edit-emoji-grid');
    setupEmojiPanel('cal-emoji-btn', 'cal-emoji-panel', 'cal-emoji-cats', 'cal-emoji-grid');

    // Icon uploads
    setupIconUpload('custom-icon-upload', 'custom-icon-preview', 'custom-icon-btn', 'custom-icon-clear', v => { currentAddIcon = v; });
    setupIconUpload('edit-custom-icon-upload', 'edit-custom-icon-preview', 'edit-custom-icon-btn', 'edit-custom-icon-clear', v => { currentEditIcon = v; });

    // Frequency toggles
    $$('input[name="frequency"]').forEach(r => r.addEventListener('change', () => { $('#freq-count').style.display = r.value === '週' && r.checked ? '' : 'none'; }));
    $$('input[name="edit-frequency"]').forEach(r => r.addEventListener('change', () => { $('#edit-freq-count').style.display = r.value === '週' && r.checked ? '' : 'none'; }));

    // Task list delegation
    const tl = $('#task-list');
    tl.addEventListener('click', e => {
      if (longPressTriggered) { longPressTriggered = false; e.preventDefault(); e.stopPropagation(); return; }
      const cb = e.target.closest('.check-btn');
      if (cb) { e.preventDefault(); e.stopPropagation(); handleCheck(cb.dataset.checkId); return; }
      const mb = e.target.closest('.memo-btn');
      if (mb) { e.preventDefault(); e.stopPropagation(); openMemoModal(mb.dataset.memoId); return; }
      const ct = e.target.closest('.task-center');
      if (ct) { e.preventDefault(); handleTaskTap(ct.dataset.taskId); return; }
    });
    tl.addEventListener('pointerdown', e => {
      const item = e.target.closest('.task-item'); if (!item || e.target.closest('.check-btn') || e.target.closest('.memo-btn') || e.target.closest('.drag-handle')) return;
      longPressTriggered = false;
      longPressTimer = setTimeout(() => { longPressTriggered = true; if (navigator.vibrate) navigator.vibrate(30); openEditModal(item.dataset.id); }, 500);
    });
    tl.addEventListener('pointerup', () => clearTimeout(longPressTimer));
    tl.addEventListener('pointercancel', () => { clearTimeout(longPressTimer); longPressTriggered = false; });
    tl.addEventListener('pointermove', e => { if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5) clearTimeout(longPressTimer); });
    tl.addEventListener('contextmenu', e => { if (longPressTriggered) e.preventDefault(); });

    // Filter bar
    $('.filter-bar').addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip'); if (!chip) return;
      state.activeFilter = chip.dataset.filter;
      $$('.filter-chip').forEach(c => c.classList.remove('active')); chip.classList.add('active');
      renderTaskList();
    });

    // Nav
    $$('.nav-btn').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));

    // Stats nav
    $('#stats-prev').addEventListener('click', () => { state.statsMonth--; if (state.statsMonth < 0) { state.statsMonth = 11; state.statsYear--; } renderStats(); });
    $('#stats-next').addEventListener('click', () => { state.statsMonth++; if (state.statsMonth > 11) { state.statsMonth = 0; state.statsYear++; } renderStats(); });

    // Calendar nav
    $('#cal-prev').addEventListener('click', () => { state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; } renderCalendar(); });
    $('#cal-next').addEventListener('click', () => { state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; } renderCalendar(); });

    // Settings - Background
    $('#bg-upload-btn').addEventListener('click', () => $('#bg-upload').click());
    $('#bg-upload').addEventListener('change', () => {
      if (!$('#bg-upload').files[0]) return;
      resizeImage($('#bg-upload').files[0], 600, dataUrl => {
        state.settings.backgroundImage = dataUrl;
        extractDominantColor(dataUrl, color => { state.settings.dominantColor = color; save(); applyBackground(); });
        save();
        const bp = $('#bg-preview-box'); bp.innerHTML = ''; bp.style.backgroundImage = `url(${dataUrl})`;
      });
      $('#bg-upload').value = '';
    });
    $('#bg-remove-btn').addEventListener('click', () => {
      state.settings.backgroundImage = null; state.settings.dominantColor = null; save(); applyBackground();
      const bp = $('#bg-preview-box'); bp.innerHTML = '<span class="bg-placeholder">画像未設定</span>'; bp.style.backgroundImage = '';
    });

    // Settings - Notification permission + Push購読
    $('#notify-permission-btn').addEventListener('click', async () => {
      if (!('Notification' in window)) { showToast('❌ このブラウザは通知非対応です'); return; }
      // まずブラウザ通知許可
      const p = await Notification.requestPermission();
      $('#notify-status').textContent = p === 'granted' ? '✅ 通知は許可されています' : '❌ 通知は拒否されました';
      if (p !== 'granted') return;
      // Push購読（PUSH_CONFIGが設定されている場合のみ）
      if (PUSH_CONFIG.pushServerUrl) {
        await subscribeToPush();
      } else {
        showToast('🔔 通知が有効になりました（アプリ内通知のみ）');
      }
    });

    // Settings - Tabs
    $$('.settings-tab').forEach(tab => tab.addEventListener('click', () => {
      $$('.settings-tab').forEach(t => t.classList.remove('active'));
      $$('.settings-panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
      tab.classList.add('active');
      const panel = $('#stab-' + tab.dataset.stab);
      if (panel) { panel.style.display = ''; panel.classList.add('active'); }
    }));

    // Settings - Theme presets
    $('#theme-presets').addEventListener('click', e => {
      const dot = e.target.closest('.theme-dot');
      if (!dot) return;
      const h = +dot.dataset.h, s = +dot.dataset.s, l = +dot.dataset.l;
      state.settings.theme = { h, s, l }; save();
      applyTheme(h, s, l); applyBackground();
      renderThemePresets();
      $('#picker-h').value = h; $('#picker-s').value = s; $('#picker-l').value = l;
      updatePickerPreview();
      showToast('🎨 テーマを変更しました');
    });

    // Settings - Color picker
    ['picker-h', 'picker-s', 'picker-l'].forEach(id => {
      $('#' + id).addEventListener('input', updatePickerPreview);
    });
    $('#picker-apply').addEventListener('click', () => {
      const h = +$('#picker-h').value, s = +$('#picker-s').value, l = +$('#picker-l').value;
      state.settings.theme = { h, s, l }; save();
      applyTheme(h, s, l); applyBackground();
      renderThemePresets();
      showToast('🎨 カラーを適用しました');
    });
    $('#picker-save').addEventListener('click', () => {
      const h = +$('#picker-h').value, s = +$('#picker-s').value, l = +$('#picker-l').value;
      if (!state.settings.customColors) state.settings.customColors = [];
      state.settings.customColors.push({ h, s, l }); save();
      renderSavedColors();
      showToast('💾 カラーを保存しました');
    });

    // Settings - Saved colors
    $('#saved-colors').addEventListener('click', e => {
      const dot = e.target.closest('.saved-dot');
      if (!dot) return;
      const h = +dot.dataset.h, s = +dot.dataset.s, l = +dot.dataset.l;
      state.settings.theme = { h, s, l }; save();
      applyTheme(h, s, l); applyBackground();
      renderThemePresets();
      $('#picker-h').value = h; $('#picker-s').value = s; $('#picker-l').value = l;
      updatePickerPreview();
      showToast('🎨 保存カラーを適用しました');
    });
    $('#saved-colors').addEventListener('contextmenu', e => {
      e.preventDefault();
      const dot = e.target.closest('.saved-dot');
      if (!dot) return;
      const i = +dot.dataset.i;
      state.settings.customColors.splice(i, 1); save();
      renderSavedColors();
      showToast('🗑️ カラーを削除しました');
    });

    // Settings - Custom messages
    $('#custom-msg-add').addEventListener('click', () => {
      const input = $('#custom-msg-input');
      const msg = input.value.trim();
      if (!msg) return;
      if (!state.settings.customMessages) state.settings.customMessages = [];
      state.settings.customMessages.push(msg); save();
      input.value = '';
      renderCustomMessages();
      showToast('💬 メッセージを追加しました');
    });
    $('#custom-msg-list').addEventListener('click', e => {
      const del = e.target.closest('.msg-del');
      if (!del) return;
      const i = +del.dataset.i;
      state.settings.customMessages.splice(i, 1); save();
      renderCustomMessages();
      showToast('�️ メッセージを削除しました');
    });

    // Settings - Task size
    $('#task-size-slider').addEventListener('input', e => {
      state.settings.taskScale = +e.target.value; save();
      applyTaskScale();
    });
    $('#task-size-reset').addEventListener('click', () => {
      state.settings.taskScale = 100; save();
      $('#task-size-slider').value = 100;
      applyTaskScale();
      showToast('📏 サイズをリセットしました');
    });

    // Settings - Task opacity
    $('#task-opacity-slider').addEventListener('input', e => {
      state.settings.taskOpacity = +e.target.value; save();
      applyTaskOpacity();
    });

    // Settings - Random background
    $('#bg-random-toggle').addEventListener('change', e => {
      state.settings.bgRandom = e.target.checked; save();
      showToast(e.target.checked ? '🎲 ランダム背景ON' : '🖼️ 背景固定');
    });
    $('#bg-multi-add-btn').addEventListener('click', () => $('#bg-multi-upload').click());
    $('#bg-multi-upload').addEventListener('change', () => {
      if (!$('#bg-multi-upload').files[0]) return;
      resizeImage($('#bg-multi-upload').files[0], 600, dataUrl => {
        if (!state.settings.backgroundImages) state.settings.backgroundImages = [];
        state.settings.backgroundImages.push(dataUrl); save();
        renderBgMultiList();
        showToast('🖼️ 背景を追加しました');
      });
      $('#bg-multi-upload').value = '';
    });
    function renderBgMultiList() {
      const list = $('#bg-multi-list');
      const imgs = state.settings.backgroundImages || [];
      if (!imgs.length) { list.innerHTML = '<p class="empty-sub">画像はまだありません</p>'; return; }
      list.innerHTML = imgs.map((img, i) =>
        `<div class="bg-multi-item">
          <div class="bg-multi-thumb" style="background-image:url(${img})"></div>
          <button class="bg-multi-del" data-i="${i}" type="button">✕</button>
        </div>`
      ).join('');
    }
    $('#bg-multi-list').addEventListener('click', e => {
      const del = e.target.closest('.bg-multi-del');
      if (!del) return;
      const i = +del.dataset.i;
      state.settings.backgroundImages.splice(i, 1); save();
      renderBgMultiList();
      showToast('🗑️ 背景を削除しました');
    });

    // Settings - Data export/import
    $('#data-export-btn').addEventListener('click', () => {
      const data = localStorage.getItem(STORAGE_KEY); if (!data) return;
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'habit-tracker-backup.json'; a.click();
      showToast('💾 エクスポート完了');
    });
    $('#data-import-btn').addEventListener('click', () => $('#data-import-file').click());
    $('#data-import-file').addEventListener('change', () => {
      const file = $('#data-import-file').files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const d = JSON.parse(e.target.result);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
          location.reload();
        } catch (err) { showToast('❌ ファイルが無効です'); }
      };
      reader.readAsText(file);
      $('#data-import-file').value = '';
    });

    // ---- 通知システム初期化 ----
    // Service Worker 登録
    registerServiceWorker();
    // 旧形式フラグのクリーンアップ
    cleanupOldNotificationFlags();
    // 60秒ごとのメインチェックループ
    setInterval(notificationLoop, 60000);
    // 初回即チェック（見逃し回収）
    notificationLoop();
    // フォアグラウンド復帰時の即チェック
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // URLパラメータ処理（iOSショートカット連携）
    handleUrlParams();

    // Resize
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if ($('#stats-view').classList.contains('active')) renderStats(); }, 200); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
