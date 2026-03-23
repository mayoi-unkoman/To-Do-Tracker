/* app-drawer.js - Split from app.js */
'use strict';

// ===== Drawer Menu Logic =====
function openDrawer() {
  renderDrawerContent();
  document.getElementById('drawer-overlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
}
function renderDrawerContent() {
  // All count
  const allCount = document.getElementById('drawer-all-count');
  if (allCount) allCount.textContent = state.tasks.length;

  // Tags: from task.tags field
  const tagsEl = document.getElementById('drawer-tags');
  if (tagsEl) {
    const allTags = new Set();
    state.tasks.forEach(t => {
      (t.tags || []).forEach(tag => allTags.add(tag));
    });
    if (allTags.size === 0) {
      tagsEl.innerHTML = '<div class="drawer-empty">タグはまだありません</div>';
    } else {
      tagsEl.innerHTML = [...allTags].map(tag => {
        const count = state.tasks.filter(t => (t.tags || []).includes(tag)).length;
        const isActive = state.activeFilter === 'tag:' + tag;
        return `<div class="drawer-item${isActive ? ' active' : ''}" data-drawer-filter="tag:${escapeHtml(tag)}">
          <span class="drawer-item-icon">🏷️</span>
          <span class="drawer-item-label">${escapeHtml('#' + tag)}</span>
          <span class="drawer-item-count">${count}</span>
        </div>`;
      }).join('');
    }
  }

  // Priority counts
  const priCount = (match) => state.tasks.filter(t => {
    const p = (t.priority || '').toLowerCase();
    return match(p);
  }).length;
  const hc = document.getElementById('drawer-pri-high-count');
  const mc = document.getElementById('drawer-pri-med-count');
  const lc = document.getElementById('drawer-pri-low-count');
  if (hc) hc.textContent = priCount(p => p === '高' || p === 'high' || p === '❗');
  if (mc) mc.textContent = priCount(p => p === '中' || p === 'medium' || p === '❕');
  if (lc) lc.textContent = priCount(p => p === '低' || p === 'low' || p === '❓');

  // Categories
  const catsEl = document.getElementById('drawer-categories');
  if (catsEl) {
    const cats = [...new Set(state.tasks.map(t => t.category).filter(Boolean))];
    const savedCats = (state.savedCategories || []).filter(c => !cats.includes(c));
    const allCats = [...cats, ...savedCats];
    let catHtml = '<div class="drawer-section-title">📁 カテゴリー <span class="drawer-hint">長押しで削除</span></div>';
    if (allCats.length === 0) {
      catHtml += '<div class="drawer-empty">カテゴリーはありません</div>';
    } else {
      catHtml += allCats.map(cat => {
        const count = state.tasks.filter(t => t.category === cat).length;
        const isActive = state.activeFilter === cat;
        const catColor = getCategoryColor(cat);
        return `<div class="drawer-item${isActive ? ' active' : ''}" data-drawer-filter="${escapeHtml(cat)}" data-cat-name="${escapeHtml(cat)}">
          <span class="drawer-item-icon" ${catColor ? `style="color:${catColor}"` : ''}>📂</span>
          <span class="drawer-item-label">${escapeHtml(cat)}</span>
          ${count > 0 ? `<span class="drawer-item-count">${count}</span>` : ''}
        </div>`;
      }).join('');
    }
    catsEl.innerHTML = catHtml;

    // Category long-press delete
    catsEl.querySelectorAll('[data-cat-name]').forEach(item => {
      let lpTimer = null;
      const startLP = () => {
        lpTimer = setTimeout(() => {
          const catName = item.dataset.catName;
          if (confirm(`カテゴリー「${catName}」を削除しますか？\n（タスク自体は削除されません）`)) {
            state.tasks.forEach(t => { if (t.category === catName) t.category = ''; });
            state.savedCategories = (state.savedCategories || []).filter(c => c !== catName);
            state.categoryOrder = (state.categoryOrder || []).filter(c => c !== catName);
            if (state.activeFilter === catName) state.activeFilter = 'all';
            save(); renderAll(); renderDrawerContent();
            showToast(`🗑️ カテゴリー「${catName}」を削除しました`);
          }
        }, 600);
      };
      const cancelLP = () => { clearTimeout(lpTimer); };
      item.addEventListener('touchstart', startLP, { passive: true });
      item.addEventListener('touchend', cancelLP);
      item.addEventListener('touchcancel', cancelLP);
      item.addEventListener('mousedown', startLP);
      item.addEventListener('mouseup', cancelLP);
      item.addEventListener('mouseleave', cancelLP);
    });
  }

  // Active state for "all"
  const allItem = document.querySelector('[data-drawer-filter="all"]');
  if (allItem) allItem.classList.toggle('active', state.activeFilter === 'all');

  // Click handlers for drawer items
  document.querySelectorAll('[data-drawer-filter]').forEach(item => {
    item.addEventListener('click', () => {
      const filter = item.dataset.drawerFilter;
      if (filter.startsWith('tag:')) {
        state.activeFilter = filter;
      } else {
        state.activeFilter = filter;
      }
      closeDrawer();
      renderAll();
    });
  });
}

function getCategoryColor(cat) {
  // Check savedCategories for color info
  if (state.savedCategories) {
    const found = state.savedCategories.find(c => typeof c === 'object' && c.name === cat);
    if (found && found.color) return found.color;
  }
  return '';
}

window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;

// Wire up submit button
document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('qs-submit-btn');
  if (submitBtn) submitBtn.addEventListener('click', qsSubmit);
});

// ---- App Start ----
// Always use DOMContentLoaded to ensure all script files are loaded before init()
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already ready, but we need to defer to ensure all scripts have executed
  setTimeout(init, 0);
}
