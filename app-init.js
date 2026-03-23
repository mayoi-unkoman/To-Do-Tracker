/* app-init.js - Split from app.js */
'use strict';

// ---- Bottom Nav Template ----
function initBottomNavs() {
  const tpl = document.getElementById('bottom-nav-tpl');
  if (!tpl) return;
  document.querySelectorAll('.bottom-nav-slot').forEach(slot => {
    const view = slot.closest('.view');
    const nav = tpl.content.cloneNode(true);
    if (view) {
      const viewId = view.id;
      nav.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.view === viewId) btn.classList.add('active');
      });
    }
    slot.replaceWith(nav);
  });
}

// ---- Init ----
function init() {
  // Expand bottom-nav templates before anything else
  initBottomNavs();

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
  fab.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openAddSheet(); });
  const calFab = $('#cal-fab-add');
  if (calFab) {
    calFab.addEventListener('click', e => { e.preventDefault(); openCalTaskModal(''); });
  }

  // Modal closes (loop pattern)
  [
    ['modal-close', 'modal-overlay'],
    ['edit-modal-close', 'edit-modal-overlay'],
    ['settings-close', 'settings-overlay'],
    ['cal-task-close', 'cal-task-overlay'],
    ['day-detail-close', 'day-detail-overlay'],
    ['memo-close', 'memo-overlay'],
  ].forEach(([closeId, overlayId]) => {
    const closeBtn = $('#' + closeId);
    const overlay = $('#' + overlayId);
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(overlayId));
    if (overlay) overlay.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(overlayId); });
  });
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
    // Bug#3 fix: Use click only to prevent double-fire on touch devices
    memoFab.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openNewMemo(); });
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
      showToast('🗑️ メモを削除しました');
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

  // Drawer (replaces settings btn)
  $('#drawer-btn').addEventListener('click', openDrawer);
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#drawer-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDrawer(); });
  $('#drawer-settings-btn').addEventListener('click', () => { closeDrawer(); openSettings(); });

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

  // Calendar nav + mode toggle
  $('#cal-prev').addEventListener('click', () => {
    if (state.calMode === 'month' || state.calMode === 'list') {
      state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    } else {
      state.calYear--;
    }
    renderCalendar();
  });
  $('#cal-next').addEventListener('click', () => {
    if (state.calMode === 'month' || state.calMode === 'list') {
      state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    } else {
      state.calYear++;
    }
    renderCalendar();
  });
  // Calendar mode dropdown
  $('#cal-mode-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#cal-mode-dropdown').classList.toggle('open');
  });
  document.querySelectorAll('.cal-mode-option').forEach(opt => {
    opt.addEventListener('click', () => {
      state.calMode = opt.dataset.mode;
      $('#cal-mode-dropdown').classList.remove('open');
      renderCalendar();
    });
  });
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dd = $('#cal-mode-dropdown');
    if (dd && !dd.contains(e.target)) dd.classList.remove('open');
  });

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
    showToast('🗑️ メッセージを削除しました');
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
