/* app-notifications.js - Split from app.js */
'use strict';

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
    if (isCompleted(rec[t.id])) return;
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
    // SW経由の場合、OS通知のみ（バナー二重表示を防止）
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
    if (id && !isCompleted(rec[id])) {
      el.classList.add('task-highlight');
      setTimeout(() => el.classList.remove('task-highlight'), 3000);
    }
  });
}
