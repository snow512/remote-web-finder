/* === Material File Icons (CDN with timeout fallback) === */
let materialGetIcon = null;
try {
  const mod = await Promise.race([
    import('https://cdn.jsdelivr.net/npm/material-file-icons@2.4.0/+esm'),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
  ]);
  materialGetIcon = mod.getIcon || mod.default?.getIcon;
} catch (e) {
  console.warn('material-file-icons CDN unavailable, using fallback emoji icons');
}

/* === State === */
let currentPath = null;
let isEditing = false;
let isDirty = false;
let originalContent = '';
let treeData = [];
let livePreviewTimer = null;
let focusedTreeItem = null;
let openFileController = null;
let isLargeFile = false;
let draftTimer = null;
let tocObserver = null;
const LONG_PRESS_MS = 500;
const scrollPositions = new Map();

const RECENT_KEY = 'rwf-recent';
const FAVORITES_KEY = 'rwf-favorites';
const THEME_KEY = 'rwf-theme';
const SIDEBAR_WIDTH_KEY = 'rwf-sidebar-width';
const WRAP_KEY = 'rwf-word-wrap';
const ZOOM_KEY = 'rwf-zoom';
const IMAGE_ZOOM_KEY = 'rwf-image-zoom';
const FONT_SIZE_KEY = 'rwf-font-size';
const DRAFT_PREFIX = 'rwf-draft:';
const SHOW_IGNORED_KEY = 'rwf-show-ignored';
const OPEN_DIRS_KEY = 'rwf-open-dirs';
const SECTIONS_KEY = 'rwf-sections-collapsed';
const CUSTOM_FILTERS_KEY = 'rwf-custom-filters';
const MAX_RECENT = 5;
const BASE_TITLE = 'Remote Web Finder';

/* === Path Utilities === */
// getFileName, getDirPath, getDirName — defined in utils.js

/* === DOM Helpers === */
function getTreeRow(filePath) {
  return treeEl.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
}
function updateFileUrl(filePath, push = false) {
  const url = new URL(window.location);
  if (filePath) url.searchParams.set('file', filePath);
  else url.searchParams.delete('file');
  history[push ? 'pushState' : 'replaceState'](filePath ? { file: filePath } : null, '', url);
}
function setTreeItemActive(rowEl) {
  treeEl.querySelectorAll('.tree-item.active').forEach(el => { removeMarquee(el); el.classList.remove('active'); });
  if (rowEl) { rowEl.classList.add('active'); applyMarquee(rowEl); }
}
function resetPanelMode() {
  contentBody.classList.remove('split-mode');
  editorPanel.style.display = 'none';
  livePreviewEl.style.display = 'none';
  previewEl.style.display = 'block';
  mdToolbar.style.display = 'none';
}
function setEditButtons(editing) {
  btnEdit.style.display = editing ? 'none' : 'inline-block';
  btnSave.style.display = editing ? 'inline-block' : 'none';
  btnCancel.style.display = editing ? 'inline-block' : 'none';
  btnSearch.style.display = 'none';
}
async function throwIfNotOk(res) {
  if (res.ok) return;
  const body = await res.text();
  let msg;
  try { msg = JSON.parse(body).error; } catch { msg = body || res.statusText; }
  throw new Error(msg);
}

async function refreshTreeAndSelect(filePath) {
  await loadTree();
  if (filePath) {
    expandPathTo(filePath);
    setTreeItemActive(getTreeRow(filePath));
  }
}
async function expandAndOpenFile(filePath, enterEdit = false) {
  expandPathTo(filePath);
  const row = getTreeRow(filePath);
  if (row) {
    await openFile(filePath, row);
    if (enterEdit) enterEditMode();
  }
}

/* === API URL Builders === */
const API = {
  file: (p) => `/api/file?path=${encodeURIComponent(p)}`,
  raw: (p) => `/api/raw?path=${encodeURIComponent(p)}`,
  folder: (p) => `/api/folder?path=${encodeURIComponent(p)}`,
  rename: (oldP, newP) => `/api/rename?path=${encodeURIComponent(oldP)}&newPath=${encodeURIComponent(newP)}`,
};

/* === DOM === */
const $ = (sel) => document.querySelector(sel);
const treeEl = $('#tree');
const previewEl = $('#preview');
const editorEl = $('#editor');
const editorWrap = $('#editorWrap');
const editorPanel = $('#editorPanel');
const lineNumbersEl = $('#lineNumbers');
const livePreviewEl = $('#livePreview');
const toolbarEl = $('#toolbar');
const breadcrumbEl = $('#breadcrumb');
const btnSearch = $('#btnSearch');
const btnEdit = $('#btnEdit');
const btnSave = $('#btnSave');
const btnCancel = $('#btnCancel');
const hamburger = $('#hamburger');
const sidebar = $('#sidebar');
const overlay = $('#sidebarOverlay');
const searchInput = $('#searchInput');
const filterPresetBtn = $('#filterPresetBtn');
const filterPresetMenu = $('#filterPresetMenu');
const filterCountEl = $('#filterCount');
const recentFilesEl = $('#recentSection');
const recentListEl = $('#recentList');
const recentClearBtn = $('#recentClear');
const favoritesSection = $('#favoritesSection');
const favoritesList = $('#favoritesList');
const favoritesClearBtn = $('#favoritesClear');
const btnExpandAll = $('#btnExpandAll');
const btnCollapseAll = $('#btnCollapseAll');
const tocEl = $('#toc');
const tocListEl = $('#tocList');
const contentBody = $('#contentBody');
const toastContainer = $('#toastContainer');
const themeToggle = $('#themeToggle');
const searchBar = $('#searchBar');
const searchText = $('#searchText');
const searchCount = $('#searchCount');
const searchPrev = $('#searchPrev');
const searchNext = $('#searchNext');
const searchClose = $('#searchClose');
const resizeHandle = $('#resizeHandle');
const contextMenu = $('#contextMenu');
const ctxDelete = $('#ctxDelete');
const ctxRename = $('#ctxRename');
const ctxMove = $('#ctxMove');
const ctxCopy = $('#ctxCopy');
const ctxFavorite = $('#ctxFavorite');
const ctxNewFile = $('#ctxNewFile');
const ctxNewFolder = $('#ctxNewFolder');
const airPopupOverlay = $('#airPopupOverlay');
const airPopupTitle = $('#airPopupTitle');
const airPopupBody = $('#airPopupBody');
const airPopupInput = $('#airPopupInput');
const airPopupOk = $('#airPopupOk');
const airPopupCancel = $('#airPopupCancel');
const saveErrorBanner = $('#saveErrorBanner');
const saveErrorMsg = $('#saveErrorMsg');
const saveErrorRetry = $('#saveErrorRetry');
const saveErrorDismiss = $('#saveErrorDismiss');
const mdToolbar = $('#mdToolbar');
const btnWrap = $('#btnWrap');
const btnFocus = $('#btnFocus');
const btnImgZoomIn = $('#btnImgZoomIn');
const btnImgZoomOut = $('#btnImgZoomOut');
const btnImgZoomReset = $('#btnImgZoomReset');
const shortcutsOverlay = $('#shortcutsOverlay');
const shortcutsClose = $('#shortcutsClose');
const layoutEl = $('.layout');
const statusBar = $('#statusBar');
const statusInfo = $('#statusInfo');
const statusCursor = $('#statusCursor');

/* === Common UI Controls === */
function createPopupMenu({ containerEl, onClose }) {
  let open = false;
  function show(x, y) {
    open = true;
    containerEl.style.display = 'block';
    containerEl.style.left = `${x}px`;
    containerEl.style.top = `${y}px`;
    const rect = containerEl.getBoundingClientRect();
    if (rect.right > window.innerWidth) containerEl.style.left = `${window.innerWidth - rect.width - 4}px`;
    if (rect.bottom > window.innerHeight) containerEl.style.top = `${window.innerHeight - rect.height - 4}px`;
  }
  function close() {
    if (!open) return;
    open = false;
    containerEl.style.display = 'none';
    if (onClose) onClose();
  }
  document.addEventListener('click', (e) => {
    if (open && !containerEl.contains(e.target)) close();
  });
  return { show, close, isOpen: () => open };
}

function createModalDialog({ overlayEl, closeBtn, onOpen, onClose }) {
  let open = false;
  function doOpen() {
    if (onOpen) onOpen();
    open = true;
    overlayEl.style.display = 'flex';
  }
  function doClose() {
    if (!open) return;
    open = false;
    overlayEl.style.display = 'none';
    if (onClose) onClose();
  }
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) doClose();
  });
  if (closeBtn) closeBtn.addEventListener('click', doClose);
  return { open: doOpen, close: doClose, isOpen: () => open };
}

function onOutsideClick({ el, ignoreEls = [], onClose }) {
  document.addEventListener('click', (e) => {
    if (el.contains(e.target)) return;
    for (const ig of ignoreEls) { if (ig.contains(e.target) || ig === e.target) return; }
    onClose(e);
  });
}

/* === Init marked === */
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

marked.use({
  renderer: {
    image({ href, title, text }) {
      if (!href) return '';
      // Block dangerous protocols
      if (isDangerousHref(href)) {
        return `<img src="" alt="${(text || '').replace(/"/g, '&quot;')}" loading="lazy">`;
      }
      const safeHref = href.replace(/"/g, '&quot;');
      const safeText = (text || '').replace(/"/g, '&quot;');
      const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
      return `<img src="${safeHref}" alt="${safeText}"${titleAttr} loading="lazy">`;
    },
    // Sanitize: strip dangerous HTML tags and attributes
    html({ text }) {
      return sanitizeHtml(text);
    }
  }
});

/* ============================================================
   1. TOAST NOTIFICATIONS
   ============================================================ */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  // Limit max visible toasts
  while (toastContainer.children.length > 5) {
    toastContainer.firstChild.remove();
  }
  setTimeout(() => toast.remove(), 3000);
}

/* ============================================================
   1-B. AIR POPUP (common dialog component)
   ============================================================ */
function airError(title, errorMsg) {
  return new Promise(resolve => {
    airPopupTitle.textContent = title;
    airPopupBody.innerHTML = '';
    const msgEl = document.createElement('div');
    msgEl.className = 'dialog-error-msg';
    msgEl.textContent = errorMsg || '';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'dialog-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = async () => {
      const text = errorMsg || '';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    };
    airPopupBody.appendChild(msgEl);
    airPopupBody.appendChild(copyBtn);
    airPopupInput.style.display = 'none';
    airPopupCancel.style.display = 'none';
    airPopupOk.textContent = 'OK';
    airPopupOk.className = 'dialog-btn ok';
    airPopupOverlay.style.display = 'flex';
    const done = () => { airPopupOverlay.style.display = 'none'; resolve(); };
    airPopupOk.onclick = done;
    airPopupCancel.onclick = null;
    airPopupOverlay.onclick = (e) => { if (e.target === airPopupOverlay) done(); };
    airPopupOk.focus();
  });
}

function airConfirm(title, { okText = 'OK', danger = false } = {}) {
  return new Promise(resolve => {
    airPopupTitle.textContent = title;
    airPopupBody.textContent = '';
    airPopupInput.style.display = 'none';
    airPopupCancel.style.display = '';
    airPopupCancel.textContent = 'Cancel';
    airPopupOk.textContent = okText;
    airPopupOk.className = 'dialog-btn ok' + (danger ? ' danger' : '');
    airPopupOverlay.style.display = 'flex';
    const done = (v) => { airPopupOverlay.style.display = 'none'; resolve(v); };
    airPopupOk.onclick = () => done(true);
    airPopupCancel.onclick = () => done(false);
    airPopupOverlay.onclick = (e) => { if (e.target === airPopupOverlay) done(false); };
    airPopupOk.focus();
  });
}

function airPrompt(title, defaultValue = '') {
  return new Promise(resolve => {
    airPopupTitle.textContent = title;
    airPopupBody.textContent = '';
    airPopupInput.style.display = '';
    airPopupInput.value = defaultValue;
    airPopupCancel.style.display = '';
    airPopupCancel.textContent = 'Cancel';
    airPopupOk.textContent = 'OK';
    airPopupOk.className = 'dialog-btn ok';
    airPopupOverlay.style.display = 'flex';
    airPopupInput.focus();
    airPopupInput.select();
    const done = (v) => {
      airPopupOverlay.style.display = 'none';
      airPopupInput.onkeydown = null;
      resolve(v);
    };
    airPopupOk.onclick = () => done(airPopupInput.value.trim() || null);
    airPopupCancel.onclick = () => done(null);
    airPopupOverlay.onclick = (e) => { if (e.target === airPopupOverlay) done(null); };
    airPopupInput.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); airPopupOk.click(); }
      if (e.key === 'Escape') { e.preventDefault(); airPopupCancel.click(); }
    };
  });
}

/* ============================================================
   2. THEME TOGGLE
   ============================================================ */
function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggle) themeToggle.innerHTML = theme === 'dark' ? '&#9790;' : '&#9728;';
  $('#hljs-dark').disabled = theme !== 'dark';
  $('#hljs-light').disabled = theme !== 'light';
  localStorage.setItem(THEME_KEY, theme);
}

if (themeToggle) themeToggle.addEventListener('click', () => {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
});

applyTheme(getTheme());

/* ============================================================
   3. RECENT FILES (localStorage)
   ============================================================ */
function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
  catch { return []; }
}

function addRecent(filePath) {
  let list = getRecent().filter(p => p !== filePath);
  list.unshift(filePath);
  if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  renderRecent();
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
  renderRecent();
}

function removeRecent(filePath) {
  const list = getRecent().filter(p => p !== filePath);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  renderRecent();
}

function initListItemLongPress(el, onLongPress) {
  let timer = null;
  let fired = false;
  let startX, startY;
  el.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    fired = false;
    timer = setTimeout(() => {
      fired = true; timer = null;
      onLongPress(t.clientX, t.clientY);
    }, LONG_PRESS_MS);
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (!timer) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) {
      clearTimeout(timer); timer = null;
    }
  }, { passive: true });
  const cancel = () => { clearTimeout(timer); timer = null; };
  el.addEventListener('touchend', cancel, { passive: true });
  el.addEventListener('touchcancel', cancel, { passive: true });
  el.addEventListener('click', (e) => {
    if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; }
  }, true);
}

function renderRecent() {
  const list = getRecent();
  recentListEl.innerHTML = '';
  recentClearBtn.style.display = list.length ? '' : 'none';
  if (list.length === 0) {
    recentListEl.innerHTML = '<div class="sidebar-section-empty">No recent files</div>';
    return;
  }
  list.forEach(p => {
    const item = document.createElement('div');
    item.className = 'sidebar-list-item';
    const name = getFileName(p);
    item.innerHTML = `<span class="icon">${getFileIcon(name)}</span><span class="name" title="${esc(p)}">${esc(name)}</span><button class="list-item-del" title="Remove">&times;</button>`;
    item.querySelector('.list-item-del').addEventListener('click', (e) => {
      e.stopPropagation();
      removeRecent(p);
    });
    item.addEventListener('click', () => {
      const row = getTreeRow(p);
      openFile(p, row);
    });
    initListItemLongPress(item, (x, y) => showListCtxMenu(x, y, p, 'recent'));
    item.addEventListener('contextmenu', (e) => { e.preventDefault(); showListCtxMenu(e.clientX, e.clientY, p, 'recent'); });
    recentListEl.appendChild(item);
  });
}

/* ============================================================
   3b. FAVORITES
   ============================================================ */
function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
  catch { return []; }
}

function isFavorite(filePath) {
  return getFavorites().includes(filePath);
}

function toggleFavorite(filePath) {
  let list = getFavorites();
  if (list.includes(filePath)) {
    list = list.filter(p => p !== filePath);
  } else {
    list.push(filePath);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  renderFavorites();
}

function removeFavorite(filePath) {
  const list = getFavorites().filter(p => p !== filePath);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  renderFavorites();
}

function clearFavorites() {
  localStorage.removeItem(FAVORITES_KEY);
  renderFavorites();
}

function renderFavorites() {
  const list = getFavorites();
  favoritesList.innerHTML = '';
  favoritesClearBtn.style.display = list.length ? '' : 'none';
  if (list.length === 0) {
    favoritesList.innerHTML = '<div class="sidebar-section-empty">No favorites</div>';
    return;
  }
  list.forEach(p => {
    const item = document.createElement('div');
    item.className = 'sidebar-list-item';
    const name = getFileName(p);
    item.innerHTML = `<span class="icon">${getFileIcon(name)}</span><span class="name" title="${esc(p)}">${esc(name)}</span><button class="list-item-del" title="Remove">&times;</button>`;
    item.querySelector('.list-item-del').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(p);
    });
    item.addEventListener('click', () => {
      const row = getTreeRow(p);
      openFile(p, row);
    });
    initListItemLongPress(item, (x, y) => showListCtxMenu(x, y, p, 'favorite'));
    item.addEventListener('contextmenu', (e) => { e.preventDefault(); showListCtxMenu(e.clientX, e.clientY, p, 'favorite'); });
    favoritesList.appendChild(item);
  });
}

/* ============================================================
   4. TREE — build, render, auto-expand
   ============================================================ */
function getOpenDirPaths() {
  const paths = [];
  treeEl.querySelectorAll('.tree-children.open').forEach(ch => {
    const dirEl = ch.closest('.tree-dir');
    if (dirEl && dirEl.dataset.dirpath) paths.push(dirEl.dataset.dirpath);
  });
  return paths;
}

function restoreOpenDirs(paths) {
  const set = new Set(paths);
  treeEl.querySelectorAll('.tree-dir').forEach(dirEl => {
    if (set.has(dirEl.dataset.dirpath)) {
      const ch = dirEl.querySelector(':scope > .tree-children');
      if (ch) expandDir(ch);
    }
  });
}

async function loadTree() {
  const openPaths = getOpenDirPaths();
  try {
    const showIgnored = localStorage.getItem(SHOW_IGNORED_KEY) === 'true';
    const res = await fetch('/api/tree' + (showIgnored ? '?showIgnored=true' : ''));
    if (!res.ok) throw new Error('Server error');
    treeData = await res.json();
  } catch (err) {
    airError('Failed to load file tree', err.message);
    return;
  }
  treeEl.innerHTML = '';
  focusedTreeItem = null;
  renderTree(treeData, treeEl, 0);
  // Restore previously open directories (in-memory first, then localStorage)
  const dirsToRestore = openPaths.length ? openPaths
    : (() => { try { return JSON.parse(localStorage.getItem(OPEN_DIRS_KEY) || '[]'); } catch { return []; } })();
  if (dirsToRestore.length) restoreOpenDirs(dirsToRestore);
  // Restore active highlight for current file
  if (currentPath) setTreeItemActive(getTreeRow(currentPath));
  renderRecent();
  // Reapply active filter after tree rebuild
  applyFilter();
  // Refresh custom filter panels
  if (typeof renderAllCustomFilters === 'function') renderAllCustomFilters();
}

function renderTree(items, parentEl, depth) {
  items.forEach(item => {
    if (item.type === 'dir') {
      const dirEl = document.createElement('div');
      dirEl.className = 'tree-dir';
      dirEl.dataset.dirpath = item.path;

      const row = document.createElement('div');
      row.className = 'tree-item' + (item.ignored ? ' ignored' : '');
      row.style.setProperty('--indent', `${12 + depth * 16}px`);
      const fileCount = countFiles(item.children);
      row.innerHTML = `<span class="icon">&#9654;</span><span class="name" title="${esc(item.path)}">${esc(item.name)}</span><span class="file-count">${fileCount}</span>`;

      const childrenEl = document.createElement('div');
      childrenEl.className = 'tree-children';

      row.addEventListener('click', () => toggleDir(row, childrenEl));
      row.addEventListener('contextmenu', (e) => showContextMenu(e, item.path, 'dir'));
      initLongPress(row, item.path, 'dir');

      // Drop target (directories)
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const sourcePath = e.dataTransfer.getData('text/plain');
        if (!sourcePath) return;
        const fileName = getFileName(sourcePath);
        const newPath = item.path + '/' + fileName;
        if (sourcePath === newPath) return;
        try {
          const res = await fetch(API.rename(sourcePath, newPath), { method: 'PATCH' });
          await throwIfNotOk(res);
          showToast(`Moved: ${fileName} → ${item.name}/`, 'success');
          removeRecent(sourcePath);
          if (currentPath === sourcePath) {
            if (isEditing && isDirty) {
              clearDraft(sourcePath);
              currentPath = newPath;
              saveDraft();
            } else {
              clearDraft(sourcePath);
              currentPath = newPath;
            }
            renderBreadcrumb(newPath);
            addRecent(newPath);
            updateFileUrl(newPath);
          }
          await refreshTreeAndSelect(currentPath === newPath ? newPath : null);
        } catch (err) {
          airError('Move failed', err.message);
        }
      });

      dirEl.appendChild(row);
      dirEl.appendChild(childrenEl);
      parentEl.appendChild(dirEl);

      renderTree(item.children, childrenEl, depth + 1);
    } else {
      const row = document.createElement('div');
      row.className = 'tree-item' + (item.ignored ? ' ignored' : '');
      row.style.setProperty('--indent', `${12 + depth * 16}px`);

      const icon = getFileIcon(item.name);
      row.innerHTML = `<span class="icon">${icon}</span><span class="name" title="${esc(item.path)}">${esc(item.name)}</span>`;
      row.dataset.path = item.path;

      row.addEventListener('click', () => openFile(item.path, row));
      row.addEventListener('contextmenu', (e) => showContextMenu(e, item.path));
      initLongPress(row, item.path, 'file');

      // Drag source (files) — desktop only
      if (!('ontouchstart' in window)) {
        row.draggable = true;
        row.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', item.path);
          e.dataTransfer.effectAllowed = 'move';
          row.classList.add('dragging');
        });
        row.addEventListener('dragend', () => row.classList.remove('dragging'));
      }

      parentEl.appendChild(row);
    }
  });
}

function saveOpenDirs() {
  localStorage.setItem(OPEN_DIRS_KEY, JSON.stringify(getOpenDirPaths()));
}

function toggleDir(row, childrenEl) {
  const isOpen = childrenEl.classList.toggle('open');
  row.querySelector('.icon').innerHTML = isOpen ? '&#9660;' : '&#9654;';
  saveOpenDirs();
}

function expandDir(childrenEl) {
  if (!childrenEl.classList.contains('open')) {
    childrenEl.classList.add('open');
    const row = childrenEl.previousElementSibling;
    if (row) row.querySelector('.icon').innerHTML = '&#9660;';
  }
}

function collapseDir(childrenEl) {
  if (childrenEl.classList.contains('open')) {
    childrenEl.classList.remove('open');
    const row = childrenEl.previousElementSibling;
    if (row) row.querySelector('.icon').innerHTML = '&#9654;';
  }
}

function autoExpandDepth(maxDepth) {
  function expand(el, depth) {
    if (depth > maxDepth) return;
    el.querySelectorAll(':scope > .tree-dir > .tree-children').forEach(ch => {
      expandDir(ch);
      expand(ch, depth + 1);
    });
  }
  expand(treeEl, 1);
}

function collapseAll() {
  treeEl.querySelectorAll('.tree-children.open').forEach(ch => collapseDir(ch));
  saveOpenDirs();
}

function expandAllFirstLevel() {
  collapseAll();
  treeEl.querySelectorAll(':scope > .tree-dir > .tree-children').forEach(ch => {
    expandDir(ch);
  });
  saveOpenDirs();
}


function expandPathTo(filePath) {
  const parts = filePath.split('/');
  let accumulated = '';
  for (let i = 0; i < parts.length - 1; i++) {
    accumulated = accumulated ? accumulated + '/' + parts[i] : parts[i];
    const dirEl = treeEl.querySelector(`[data-dirpath="${CSS.escape(accumulated)}"]`);
    if (dirEl) {
      const ch = dirEl.querySelector(':scope > .tree-children');
      if (ch) expandDir(ch);
    }
  }
  saveOpenDirs();
}

/* === Marquee scroll helpers === */
function applyMarquee(rowEl) {
  if (!rowEl) return;
  const nameEl = rowEl.querySelector('.name');
  if (!nameEl) return;
  // Wait for layout to compute before measuring
  requestAnimationFrame(() => {
    const overflow = nameEl.scrollWidth - nameEl.clientWidth;
    if (overflow > 0) {
      nameEl.style.setProperty('--overflow-px', overflow);
      nameEl.classList.add('marquee');
    }
  });
}

function removeMarquee(rowEl) {
  if (!rowEl) return;
  const nameEl = rowEl.querySelector('.name');
  if (!nameEl) return;
  nameEl.classList.remove('marquee');
  nameEl.style.removeProperty('--overflow-px');
}

/* === Long-press for mobile context menu === */
function initLongPress(rowEl, targetPath, type) {
  let startX, startY;
  let timer = null;
  let fired = false;

  rowEl.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    fired = false;
    rowEl.classList.add('long-press-holding');

    timer = setTimeout(() => {
      fired = true;
      timer = null;
      rowEl.classList.remove('long-press-holding');
      showContextMenu({
        preventDefault() {},
        clientX: touch.clientX,
        clientY: touch.clientY
      }, targetPath, type);
    }, LONG_PRESS_MS);
  }, { passive: true });

  rowEl.addEventListener('touchmove', (e) => {
    if (!timer) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (dx > 10 || dy > 10) {
      clearTimeout(timer);
      timer = null;
      rowEl.classList.remove('long-press-holding');
    }
  }, { passive: true });

  const cancelPress = () => {
    clearTimeout(timer);
    timer = null;
    rowEl.classList.remove('long-press-holding');
  };
  rowEl.addEventListener('touchend', cancelPress, { passive: true });
  rowEl.addEventListener('touchcancel', cancelPress, { passive: true });

  // Suppress click after long-press fires (prevents file from opening)
  rowEl.addEventListener('click', (e) => {
    if (fired) {
      e.stopImmediatePropagation();
      e.preventDefault();
      fired = false;
    }
  }, true); // capture phase
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.ico'];

function isImageFile(name) {
  const lower = name.toLowerCase();
  return IMAGE_EXTS.some(ext => lower.endsWith(ext));
}

function getFileIcon(name) {
  if (materialGetIcon) {
    try {
      // Normalize to extension-only so same ext always gets the same icon
      const dotIdx = name.lastIndexOf('.');
      const lookup = dotIdx > 0 ? 'file' + name.substring(dotIdx) : name;
      const result = materialGetIcon(lookup);
      if (result && result.svg) return result.svg;
    } catch (_) { /* fallback below */ }
  }
  if (name.endsWith('.md')) return '&#128196;';
  if (name.endsWith('.json')) return '&#123;&#125;';
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return '&#9881;';
  if (isImageFile(name)) return '&#128444;';
  return '&#128220;';
}

// countFiles, countDirs — defined in utils.js

/* ============================================================
   5. SEARCH / FILTER (sidebar)
   ============================================================ */
const searchClear = $('#searchClear');

function updateSearchClear() {
  searchClear.style.display = searchInput.value ? '' : 'none';
}

searchInput.addEventListener('input', () => {
  updateSearchClear();
  applyFilter();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  updateSearchClear();
  applyFilter();
  searchInput.focus();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.stopPropagation(); searchInput.value = ''; updateSearchClear(); applyFilter(); searchInput.blur(); }
});

// --- Filter presets ---
const DEFAULT_PRESETS = [
  { label: 'Markdown', exts: '.md' },
  { label: 'YAML', exts: '.yml .yaml' },
  { label: 'JSON', exts: '.json' },
  { label: 'Images', exts: '.png .jpg .jpeg .gif .svg .webp .bmp .ico' },
  { label: 'HTML', exts: '.html .htm' },
  { label: 'CSS', exts: '.css .scss .less' },
  { label: 'JavaScript', exts: '.js .ts .jsx .tsx' },
  { label: 'Text', exts: '.txt .log .csv' },
];
const PRESET_KEY = 'rwf-filter-presets';

function loadPresets() {
  const stored = localStorage.getItem(PRESET_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }
  return DEFAULT_PRESETS.map(p => ({ ...p }));
}

function savePresets(presets) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
}

let filterPresets = loadPresets();
let activePreset = null;
let presetEditMode = false;

function buildPresetMenu() {
  filterPresetMenu.innerHTML = '';

  // All (clear filter)
  const allItem = document.createElement('div');
  allItem.className = 'filter-preset-item' + (!activePreset ? ' selected' : '');
  allItem.innerHTML = '<span class="preset-label">All</span>';
  allItem.addEventListener('click', () => {
    activePreset = null;
    filterPresetBtn.classList.remove('active');
    filterPresetMenu.classList.remove('open');
    presetEditMode = false;
    applyFilter();
  });
  filterPresetMenu.appendChild(allItem);

  // Presets
  filterPresets.forEach((preset, idx) => {
    const item = document.createElement('div');
    item.className = 'filter-preset-item' + (activePreset === preset ? ' selected' : '');

    if (presetEditMode) {
      // Edit mode: inline inputs + delete button
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'preset-edit-input preset-edit-label';
      labelInput.value = preset.label;
      labelInput.placeholder = 'Name';

      const extsInput = document.createElement('input');
      extsInput.type = 'text';
      extsInput.className = 'preset-edit-input preset-edit-exts';
      extsInput.value = preset.exts;
      extsInput.placeholder = '.md .txt ...';

      const delBtn = document.createElement('button');
      delBtn.className = 'preset-del-btn';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterPresets.splice(idx, 1);
        if (activePreset === preset) { activePreset = null; filterPresetBtn.classList.remove('active'); }
        savePresets(filterPresets);
        buildPresetMenu();
      });

      // Save on blur
      const saveEdit = () => {
        const newLabel = labelInput.value.trim();
        const newExts = extsInput.value.trim();
        if (newLabel && newExts) {
          preset.label = newLabel;
          preset.exts = newExts;
          savePresets(filterPresets);
        }
      };
      labelInput.addEventListener('blur', saveEdit);
      extsInput.addEventListener('blur', saveEdit);
      labelInput.addEventListener('click', (e) => e.stopPropagation());
      extsInput.addEventListener('click', (e) => e.stopPropagation());

      item.appendChild(labelInput);
      item.appendChild(extsInput);
      item.appendChild(delBtn);
      item.style.cursor = 'default';
    } else {
      // Normal mode
      const label = document.createElement('span');
      label.className = 'preset-label';
      label.textContent = preset.label;
      item.appendChild(label);
      const exts = document.createElement('span');
      exts.className = 'preset-exts';
      exts.textContent = preset.exts;
      item.appendChild(exts);
      item.addEventListener('click', () => {
        if (activePreset === preset) {
          activePreset = null;
          filterPresetBtn.classList.remove('active');
        } else {
          activePreset = preset;
          filterPresetBtn.classList.add('active');
        }
        filterPresetMenu.classList.remove('open');
        applyFilter();
      });
    }
    filterPresetMenu.appendChild(item);
  });

  // Footer: Edit / Add / Reset buttons
  const footer = document.createElement('div');
  footer.className = 'preset-footer';

  if (presetEditMode) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-sm';
    addBtn.textContent = '+ Add';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterPresets.push({ label: 'New', exts: '.ext' });
      savePresets(filterPresets);
      buildPresetMenu();
    });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-sm';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterPresets = DEFAULT_PRESETS.map(p => ({ ...p }));
      activePreset = null;
      filterPresetBtn.classList.remove('active');
      savePresets(filterPresets);
      buildPresetMenu();
      applyFilter();
    });

    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn-sm accent';
    doneBtn.textContent = 'Done';
    doneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      presetEditMode = false;
      buildPresetMenu();
    });

    footer.appendChild(addBtn);
    footer.appendChild(resetBtn);
    footer.appendChild(doneBtn);
  } else {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      presetEditMode = true;
      buildPresetMenu();
    });
    footer.appendChild(editBtn);
  }

  filterPresetMenu.appendChild(footer);
}

buildPresetMenu();

filterPresetBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = filterPresetMenu.classList.contains('open');
  if (isOpen) {
    presetEditMode = false;
  }
  filterPresetMenu.classList.toggle('open', !isOpen);
  if (!isOpen) buildPresetMenu();
});

onOutsideClick({
  el: filterPresetMenu,
  ignoreEls: [filterPresetBtn],
  onClose() {
    filterPresetMenu.classList.remove('open');
    presetEditMode = false;
  }
});

function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q && !activePreset) {
    treeEl.querySelectorAll('.tree-item.hidden, .tree-dir.hidden').forEach(el => el.classList.remove('hidden'));
    filterCountEl.classList.remove('visible', 'no-matches');
    filterCountEl.textContent = '';
    searchInput.classList.remove('no-matches');
    if (typeof renderAllCustomFilters === 'function') renderAllCustomFilters();
    return;
  }
  const exts = activePreset ? activePreset.exts.split(/\s+/).filter(Boolean) : null;
  filterTree(treeEl, q, exts);

  // Update filter result counter
  const visibleFiles = treeEl.querySelectorAll('.tree-item[data-path]:not(.hidden)').length;
  const totalFiles = treeEl.querySelectorAll('.tree-item[data-path]').length;
  filterCountEl.textContent = visibleFiles === 0 ? 'No matches' : `${visibleFiles} / ${totalFiles}`;
  filterCountEl.classList.add('visible');
  filterCountEl.classList.toggle('no-matches', visibleFiles === 0);
  searchInput.classList.toggle('no-matches', visibleFiles === 0);
  if (typeof renderAllCustomFilters === 'function') renderAllCustomFilters();
}

function filterTree(container, query, exts) {
  let hasVisible = false;

  container.querySelectorAll(':scope > .tree-dir').forEach(dirEl => {
    const childrenEl = dirEl.querySelector(':scope > .tree-children');
    const dirVisible = filterTree(childrenEl, query, exts);
    if (dirVisible) {
      dirEl.classList.remove('hidden');
      expandDir(childrenEl);
      hasVisible = true;
    } else {
      dirEl.classList.add('hidden');
    }
  });

  container.querySelectorAll(':scope > .tree-item[data-path]').forEach(item => {
    const filePath = (item.dataset.path || '').toLowerCase();
    const name = getFileName(filePath);
    const matchesQuery = !query || filePath.includes(query);
    const matchesExt = !exts || exts.some(ext => name.endsWith(ext));
    if (matchesQuery && matchesExt) {
      item.classList.remove('hidden');
      hasVisible = true;
    } else {
      item.classList.add('hidden');
    }
  });

  return hasVisible;
}

/* ============================================================
   6. BREADCRUMB + UNSAVED INDICATOR
   ============================================================ */
function renderBreadcrumb(filePath) {
  breadcrumbEl.innerHTML = '';
  if (!filePath) return;

  const parts = filePath.split('/');
  let accumulated = '';

  parts.forEach((part, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-sep';
      sep.textContent = '/';
      breadcrumbEl.appendChild(sep);
    }

    accumulated = accumulated ? accumulated + '/' + part : part;
    const span = document.createElement('span');
    span.className = 'breadcrumb-item';
    span.textContent = part;

    if (i === parts.length - 1) {
      span.classList.add('current');
    } else {
      const dirPath = accumulated;
      span.addEventListener('click', () => {
        expandPathTo(dirPath + '/dummy');
        const dirEl = treeEl.querySelector(`[data-dirpath="${CSS.escape(dirPath)}"]`);
        if (dirEl) {
          const ch = dirEl.querySelector(':scope > .tree-children');
          if (ch) expandDir(ch);
          dirEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    breadcrumbEl.appendChild(span);
  });

  updateDirtyIndicator();
}

function updateDirtyIndicator() {
  // Remove existing dot
  const existing = breadcrumbEl.querySelector('.breadcrumb-unsaved');
  if (existing) existing.remove();

  if (isDirty) {
    const dot = document.createElement('span');
    dot.className = 'breadcrumb-unsaved';
    dot.title = 'Unsaved changes';
    breadcrumbEl.appendChild(dot);
  }

  // Tab title
  const fileName = getFileName(currentPath);
  document.title = isDirty ? `* ${fileName} — ${BASE_TITLE}` : (fileName ? `${fileName} — ${BASE_TITLE}` : BASE_TITLE);
}

function setDirty(dirty) {
  isDirty = dirty;
  updateDirtyIndicator();
}

/* ============================================================
   7. FILE OPERATIONS
   ============================================================ */
async function openFile(filePath, rowEl, { pushHistory = true } = {}) {
  if (isDirty) {
    if (!(await airConfirm('Discard unsaved changes?'))) return;
  }

  // Abort in-flight save for previous file
  if (saveController) { saveController.abort(); saveController = null; }
  // Save scroll position of previous file
  saveScrollPosition();
  // Stop timers for previous file
  stopDraftTimer();
  clearTimeout(livePreviewTimer);

  setTreeItemActive(rowEl);

  expandPathTo(filePath);

  currentPath = filePath;
  setDirty(false);
  renderBreadcrumb(filePath);
  toolbarEl.classList.add('has-file');
  hideImageZoomButtons();

  // Update URL for sharing / history navigation
  if (pushHistory) {
    updateFileUrl(filePath, true);
  }

  closeSidebar();
  closeContentSearch();
  closeContextMenu();
  hideSaveErrorBanner();
  addRecent(filePath);

  // Abort previous file load if still in-flight
  if (openFileController) openFileController.abort();
  openFileController = new AbortController();
  const { signal } = openFileController;

  // Image file — show image directly
  if (isImageFile(filePath)) {
    originalContent = '';
    showImagePreview(filePath);
    return;
  }

  // Large file warning
  isLargeFile = false;
  try {
    const headRes = await fetch(API.file(filePath), { method: 'HEAD', signal });
    const size = parseInt(headRes.headers.get('Content-Length'), 10) || 0;
    if (size > 1024 * 1024) {
      isLargeFile = true;
      const sizeMB = (size / (1024 * 1024)).toFixed(1);
      if (!(await airConfirm(`This file is ${sizeMB} MB (read-only). It may take a while to load.`, { okText: 'Open anyway' }))) return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
    console.warn('HEAD request failed:', e);
  }

  try {
    const res = await fetch(API.file(filePath), { signal });
    if (!res.ok) {
      if (res.status === 404) {
        removeRecent(filePath);
        const u = new URL(window.location);
        if (u.searchParams.get('file') === filePath) {
          u.searchParams.delete('file');
          history.replaceState(null, '', u);
        }
        throw new Error('File not found (may have been deleted)');
      }
      const errText = await res.text();
      if (signal.aborted) return;
      throw new Error(errText);
    }
    const text = await res.text();
    originalContent = text;

    // Check for draft recovery
    const draft = getDraft(filePath);
    if (draft !== null && draft !== text) {
      if (await airConfirm('Unsaved draft found. Restore it?', { okText: 'Restore' })) {
        originalContent = text;
        showPreview(text, filePath);
        // Go straight to edit mode with draft content
        enterEditMode();
        editorEl.value = draft;
        updateLineNumbers();
        setDirty(true);
        if (livePreviewEl.style.display !== 'none') updateLivePreview();
        startDraftTimer();
        restoreScrollPosition(filePath);
        return;
      } else {
        clearDraft(filePath);
      }
    }

    showPreview(text, filePath);
    if (isLargeFile) {
      btnEdit.style.display = 'none';
      btnSearch.style.display = 'inline-block';
    }
    // Restore scroll position after render
    restoreScrollPosition(filePath);
  } catch (err) {
    if (err.name === 'AbortError') return; // superseded by newer openFile call
    previewEl.innerHTML = `<div style="color:var(--btn-cancel);padding:20px">Error loading file: ${esc(err.message)}</div>`;
    showPreviewMode();
  }
}

/* ============================================================
   8. FILE CREATE / DELETE
   ============================================================ */
let ctxTargetPath = null;
let ctxTargetType = 'file'; // 'file' or 'dir'

const ctxMenu = createPopupMenu({
  containerEl: contextMenu,
  onClose() { ctxTargetPath = null; }
});

function showContextMenu(e, targetPath, type = 'file') {
  e.preventDefault();
  ctxTargetPath = targetPath;
  ctxTargetType = type;
  // Show/hide menu items based on type
  const isDir = type === 'dir';
  const fav = !isDir && isFavorite(targetPath);
  ctxFavorite.textContent = fav ? '☆ Unfavorite' : '★ Favorite';
  ctxFavorite.style.display = isDir ? 'none' : '';
  ctxCopy.style.display = isDir ? 'none' : '';
  ctxNewFile.style.display = isDir ? '' : 'none';
  ctxNewFolder.style.display = isDir ? '' : 'none';
  ctxDelete.style.display = '';
  ctxMenu.show(e.clientX, e.clientY);
}

function closeContextMenu() { ctxMenu.close(); }

/* === List item context menu (recent / favorites) === */
const listCtxMenuEl = $('#listCtxMenu');
const listCtxRemove = $('#listCtxRemove');
let listCtxTarget = null; // { path, type: 'recent' | 'favorite' }

const listCtxMenu = createPopupMenu({
  containerEl: listCtxMenuEl,
  onClose() { listCtxTarget = null; }
});

function showListCtxMenu(x, y, filePath, type) {
  listCtxTarget = { path: filePath, type };
  listCtxMenu.show(x, y);
}

listCtxRemove.addEventListener('click', () => {
  if (!listCtxTarget) return;
  const { path, type } = listCtxTarget;
  const name = getFileName(path);
  listCtxMenu.close();
  if (type === 'recent') {
    removeRecent(path);
    showToast(`Removed from recent: ${name}`, 'info');
  } else {
    removeFavorite(path);
    showToast(`Removed from favorites: ${name}`, 'info');
  }
});

function showWelcomeScreen() {
  if (isEditing) {
    isEditing = false;
    if (saveController) saveController.abort();
  }
  stopDraftTimer();
  clearTimeout(livePreviewTimer);
  resetPanelMode();
  closeContentSearch();
  hideSaveErrorBanner();
  hideTOC();
  hideImageZoomButtons();
  setTreeItemActive(null);
  currentPath = null;
  setDirty(false);
  toolbarEl.classList.remove('has-file');
  breadcrumbEl.innerHTML = '<span class="breadcrumb-item current">&#128270; Remote Web Finder</span>';
  document.title = BASE_TITLE;
  statusBar.style.display = 'none';

  // Build dashboard
  const files = countFiles(treeData);
  const dirs = countDirs(treeData);
  const recent = getRecent();

  const DASH_VISIBLE = 3;

  function buildDashList(title, items) {
    if (items.length === 0) return '';
    let html = `<div class="dash-section"><div class="dash-section-title">${title}</div>`;
    items.forEach((p, i) => {
      const name = getFileName(p);
      const dir = getDirPath(p);
      const hidden = i >= DASH_VISIBLE ? ' style="display:none"' : '';
      html += `<div class="dash-recent-item" data-path="${esc(p)}"${hidden}><span class="icon">${getFileIcon(name)}</span><span class="dash-recent-name">${esc(name)}</span><span class="dash-recent-path">${esc(dir)}</span></div>`;
    });
    if (items.length > DASH_VISIBLE) {
      html += `<div class="dash-more">more (${items.length - DASH_VISIBLE})</div>`;
    }
    html += `</div>`;
    return html;
  }

  const recentHtml = buildDashList('Recent Files', recent.slice(0, 5));
  const favs = getFavorites();
  const favsHtml = buildDashList('Favorites', favs);

  previewEl.innerHTML = `<div class="dashboard">
    <div class="dash-stats">
      <div class="dash-stat"><span class="dash-stat-value">${files}</span><span class="dash-stat-label">Files</span></div>
      <div class="dash-stat"><span class="dash-stat-value">${dirs}</span><span class="dash-stat-label">Folders</span></div>
    </div>
    ${favsHtml}
    ${recentHtml}
    <div class="dash-hint">Select a file from the sidebar to view</div>
  </div>`;

  // Click handler for dashboard items (recent + favorites)
  previewEl.querySelectorAll('.dash-recent-item').forEach(el => {
    el.addEventListener('click', () => {
      const p = el.dataset.path;
      const row = getTreeRow(p);
      openFile(p, row);
    });
  });

  // "more" expand handler
  previewEl.querySelectorAll('.dash-more').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.dash-section');
      section.querySelectorAll('.dash-recent-item[style]').forEach(el => el.style.display = '');
      btn.remove();
    });
  });
}

ctxFavorite.addEventListener('click', () => {
  const target = ctxTargetPath;
  closeContextMenu();
  if (!target) return;
  toggleFavorite(target);
});

ctxDelete.addEventListener('click', async () => {
  const target = ctxTargetPath;
  const type = ctxTargetType;
  closeContextMenu();
  if (!target) return;

  const label = type === 'dir' ? 'folder' : 'file';
  if (!(await airConfirm(`Delete ${label} "${target}"?`, { okText: 'Delete', danger: true }))) return;

  try {
    const endpoint = type === 'dir' ? API.folder(target) : API.file(target);
    const res = await fetch(endpoint, { method: 'DELETE' });
    await throwIfNotOk(res);
    showToast(`Deleted: ${target}`, 'success');
    if (type === 'file') {
      removeRecent(target);
      clearDraft(target);
      if (currentPath === target) {
        showWelcomeScreen();
        updateFileUrl(null);
      }
    }
    await loadTree();
  } catch (err) {
    airError('Delete failed', err.message);
  }
});

ctxRename.addEventListener('click', async () => {
  const target = ctxTargetPath;
  const type = ctxTargetType;
  closeContextMenu();
  if (!target) return;

  const name = getFileName(target);
  const dirPart = getDirPath(target);
  const newName = await airPrompt('Rename to:', name);
  if (!newName || newName === name) return;

  const newPath = dirPart + newName;
  try {
    const res = await fetch(API.rename(target, newPath), { method: 'PATCH' });
    await throwIfNotOk(res);
    showToast(`Renamed: ${name} → ${newName}`, 'success');

    if (type === 'file') {
      removeRecent(target);
      if (currentPath === target) {
        clearDraft(target);
        currentPath = newPath;
        if (isEditing && isDirty) saveDraft();
        renderBreadcrumb(newPath);
        addRecent(newPath);
        updateFileUrl(newPath);
      }
    } else if (type === 'dir' && currentPath && currentPath.startsWith(target + '/')) {
      // Current file is inside renamed directory — update path
      const updatedPath = newPath + currentPath.substring(target.length);
      clearDraft(currentPath);
      currentPath = updatedPath;
      if (isEditing && isDirty) saveDraft();
      renderBreadcrumb(updatedPath);
      updateFileUrl(updatedPath);
    }

    await refreshTreeAndSelect(currentPath);
  } catch (err) {
    airError('Rename failed', err.message);
  }
});

ctxMove.addEventListener('click', async () => {
  const target = ctxTargetPath;
  const type = ctxTargetType;
  closeContextMenu();
  if (!target) return;

  const name = getFileName(target);
  const currentDir = getDirName(target);
  const destDir = await airPrompt('Move to folder:', currentDir);
  if (destDir == null || destDir === currentDir) return;

  const newPath = destDir ? destDir + '/' + name : name;
  try {
    const res = await fetch(API.rename(target, newPath), { method: 'PATCH' });
    await throwIfNotOk(res);
    showToast(`Moved: ${name} → ${destDir || '/'}`, 'success');

    if (type === 'file') {
      removeRecent(target);
      if (currentPath === target) {
        clearDraft(target);
        currentPath = newPath;
        if (isEditing && isDirty) saveDraft();
        renderBreadcrumb(newPath);
        addRecent(newPath);
        updateFileUrl(newPath);
      }
    } else if (type === 'dir' && currentPath && currentPath.startsWith(target + '/')) {
      const updatedPath = newPath + currentPath.substring(target.length);
      clearDraft(currentPath);
      currentPath = updatedPath;
      if (isEditing && isDirty) saveDraft();
      renderBreadcrumb(updatedPath);
      updateFileUrl(updatedPath);
    }

    await refreshTreeAndSelect(currentPath);
  } catch (err) {
    airError('Move failed', err.message);
  }
});

ctxCopy.addEventListener('click', async () => {
  const target = ctxTargetPath;
  closeContextMenu();
  if (!target) return;

  const name = getFileName(target);
  const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
  const base = ext ? name.substring(0, name.lastIndexOf('.')) : name;
  const defaultName = `${base} (copy)${ext}`;
  const newName = await airPrompt('Copy as:', defaultName);
  if (!newName || newName === name) return;

  const dirPart = getDirPath(target);
  const newPath = dirPart + newName;
  try {
    // Read source, then create copy
    const srcRes = await fetch(API.file(target));
    await throwIfNotOk(srcRes);
    const content = await srcRes.text();
    const createRes = await fetch(API.file(newPath), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: content
    });
    await throwIfNotOk(createRes);
    showToast(`Copied: ${newName}`, 'success');
    await loadTree();
    await expandAndOpenFile(newPath);
  } catch (err) {
    airError('Copy failed', err.message);
  }
});

ctxNewFile.addEventListener('click', async () => {
  const dirPath = ctxTargetPath;
  closeContextMenu();
  if (!dirPath) return;

  const fileName = await airPrompt('New file name:');
  if (!fileName) return;

  const newPath = dirPath + '/' + fileName;
  try {
    const res = await fetch(API.file(newPath), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: ''
    });
    await throwIfNotOk(res);
    showToast(`Created: ${fileName}`, 'success');
    await loadTree();
    await expandAndOpenFile(newPath, true);
  } catch (err) {
    airError('Create failed', err.message);
  }
});

ctxNewFolder.addEventListener('click', async () => {
  const dirPath = ctxTargetPath;
  closeContextMenu();
  if (!dirPath) return;

  const folderName = await airPrompt('New folder name:');
  if (!folderName) return;

  const newPath = dirPath + '/' + folderName;
  try {
    const res = await fetch(API.folder(newPath), { method: 'POST' });
    await throwIfNotOk(res);
    showToast(`Created folder: ${folderName}`, 'success');
    await loadTree();
    expandPathTo(newPath + '/dummy');
  } catch (err) {
    airError('Create folder failed', err.message);
  }
});

/* ============================================================
   9. PREVIEW + TOC
   ============================================================ */
function showImageZoomButtons() {
  btnImgZoomIn.style.display = 'inline-block';
  btnImgZoomOut.style.display = 'inline-block';
  btnImgZoomReset.style.display = 'inline-block';
  btnWrap.style.display = 'none';
}

function hideImageZoomButtons() {
  btnImgZoomIn.style.display = 'none';
  btnImgZoomOut.style.display = 'none';
  btnImgZoomReset.style.display = 'none';
  btnWrap.style.display = '';
}

function showImagePreview(filePath) {
  isEditing = false;
  setDirty(false);
  resetPanelMode();
  setEditButtons(false);
  btnEdit.style.display = 'none'; // image: hide edit too
  showImageZoomButtons();
  hideTOC();

  const src = API.raw(filePath);
  const name = getFileName(filePath);
  previewEl.innerHTML = `<div class="image-preview"><img src="${src}" alt="${esc(name)}" /></div>`;
  const img = previewEl.querySelector('img');
  if (img) {
    img.onerror = () => {
      removeRecent(filePath);
      if (currentPath !== filePath) return; // user navigated away
      const u = new URL(window.location);
      if (u.searchParams.get('file') === filePath) {
        u.searchParams.delete('file');
        history.replaceState(null, '', u);
      }
      showToast('Image not found (removed from recent)', 'error');
      previewEl.innerHTML = `<div class="welcome"><h1>Image not found</h1><p>${esc(filePath)}</p></div>`;
    };
  }
  // Pinch-to-zoom on image
  const container = previewEl.querySelector('.image-preview');
  if (container) {
    // Trackpad / mouse wheel pinch (ctrlKey indicates pinch gesture)
    container.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      imageZoomLevel = Math.max(0.3, Math.min(3.0, imageZoomLevel + delta));
      applyImageZoom();
    }, { passive: false });

    // Touch pinch gesture
    let pinchStartDist = 0;
    let pinchStartZoom = 1.0;
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartZoom = imageZoomLevel;
      }
    }, { passive: true });
    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (pinchStartDist === 0) return;
        const scale = dist / pinchStartDist;
        imageZoomLevel = Math.max(0.3, Math.min(3.0, pinchStartZoom * scale));
        applyImageZoom();
      }
    }, { passive: false });
  }

  updateStatusBar();
}

function showPreview(text, filePath) {
  isEditing = false;
  setDirty(false);
  lastSearchQuery = ''; // reset search cache since preview content changes
  resetPanelMode();
  setEditButtons(false);

  if (filePath && filePath.endsWith('.md')) {
    previewEl.innerHTML = marked.parse(text);
    buildTOC(previewEl);
  } else if (filePath && /\.(html?|htm)$/i.test(filePath)) {
    const iframe = document.createElement('iframe');
    iframe.className = 'html-preview-iframe';
    iframe.sandbox = 'allow-same-origin';
    iframe.srcdoc = text;
    previewEl.innerHTML = '';
    previewEl.appendChild(iframe);
    hideTOC();
  } else {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text;
    pre.appendChild(code);
    previewEl.innerHTML = '';
    previewEl.appendChild(pre);
    hideTOC();
  }

  if (text.length < 500000) {
    previewEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
  }
  addCopyButtons(previewEl);
  updateStatusBar();
}

function addCopyButtons(container) {
  container.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.code-copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      if (btn.classList.contains('copied')) return;
      const code = pre.querySelector('code');
      const text = code ? code.textContent : pre.textContent;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      } catch { showToast('Copy failed', 'error'); }
    });
    pre.appendChild(btn);
  });
}

/* Internal link navigation */
previewEl.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href) return;

  // External URL → new tab
  if (/^https?:\/\//i.test(href)) {
    e.preventDefault();
    window.open(href, '_blank', 'noopener');
    return;
  }

  // Anchor links → let browser handle
  if (href.startsWith('#')) return;

  e.preventDefault();

  // Resolve relative path against current file's directory
  const currentDir = getDirName(currentPath);
  let targetPath = href.split('#')[0]; // strip anchor
  if (!targetPath) return;

  if (targetPath.startsWith('./')) {
    targetPath = currentDir ? currentDir + '/' + targetPath.substring(2) : targetPath.substring(2);
  } else if (targetPath.startsWith('../')) {
    const parts = currentDir ? currentDir.split('/') : [];
    let rel = targetPath;
    while (rel.startsWith('../')) {
      parts.pop();
      rel = rel.substring(3);
    }
    targetPath = parts.length > 0 ? parts.join('/') + '/' + rel : rel;
  } else if (!targetPath.startsWith('/')) {
    targetPath = currentDir ? currentDir + '/' + targetPath : targetPath;
  }

  // Clean up
  targetPath = targetPath.replace(/\/+/g, '/').replace(/^\//, '');

  const row = getTreeRow(targetPath);
  if (row) {
    openFile(targetPath, row);
  } else {
    showToast(`File not found: ${targetPath}`, 'error');
  }
});

function showPreviewMode() {
  isEditing = false;
  resetPanelMode();
  setEditButtons(false);
}

/* ============================================================
   10. TOC (Table of Contents)
   ============================================================ */
function buildTOC(container) {
  // Cleanup previous observer
  if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }

  const headings = container.querySelectorAll('h1, h2, h3');
  if (headings.length < 2) {
    hideTOC();
    return;
  }

  tocListEl.innerHTML = '';
  const tocItems = [];
  headings.forEach((h, i) => {
    const id = `toc-heading-${i}`;
    h.id = id;
    const link = document.createElement('a');
    link.className = `toc-item toc-${h.tagName.toLowerCase()}`;
    link.textContent = h.textContent;
    link.dataset.headingId = id;
    link.addEventListener('click', () => {
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tocListEl.appendChild(link);
    tocItems.push({ heading: h, link });
  });

  tocEl.style.display = 'block';

  // Scroll tracking with IntersectionObserver
  tocObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tocListEl.querySelectorAll('.toc-item').forEach(item => item.classList.remove('active'));
        const activeLink = tocListEl.querySelector(`[data-heading-id="${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
          activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    });
  }, {
    root: previewEl,
    rootMargin: '0px 0px -80% 0px',
    threshold: 0
  });

  tocItems.forEach(({ heading }) => tocObserver.observe(heading));
}

function hideTOC() {
  if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
  tocEl.style.display = 'none';
}

/* ============================================================
   11. LINE NUMBERS
   ============================================================ */
let _prevLineCount = 0;
function updateLineNumbers() {
  const lines = editorEl.value.split('\n').length;
  if (lines === _prevLineCount) return;
  _prevLineCount = lines;
  let html = '';
  for (let i = 1; i <= lines; i++) {
    html += `<span class="ln">${i}</span>`;
  }
  lineNumbersEl.innerHTML = html;
}

function syncLineNumbersScroll() {
  lineNumbersEl.scrollTop = editorEl.scrollTop;
}

editorEl.addEventListener('scroll', syncLineNumbersScroll);

/* ============================================================
   12. EDITOR + LIVE PREVIEW
   ============================================================ */
function enterEditMode() {
  if (isLargeFile) { showToast('File too large to edit', 'error'); return; }
  isEditing = true;
  hideSaveErrorBanner();
  closeContentSearch();
  previewEl.style.display = 'none';
  editorPanel.style.display = 'flex';
  editorEl.value = originalContent;
  updateLineNumbers();
  setDirty(false);
  setEditButtons(true);

  // Show markdown toolbar for .md files
  if (currentPath && currentPath.endsWith('.md')) {
    mdToolbar.style.display = 'flex';
  } else {
    mdToolbar.style.display = 'none';
  }

  if (currentPath && currentPath.endsWith('.md') && window.innerWidth > 768) {
    contentBody.classList.add('split-mode');
    livePreviewEl.style.display = 'block';
    updateLivePreview();
    hideTOC();
  } else {
    contentBody.classList.remove('split-mode');
    livePreviewEl.style.display = 'none';
    hideTOC();
  }

  editorEl.focus();
  startDraftTimer();
  updateStatusBar();
}

function updateLivePreview() {
  livePreviewEl.innerHTML = marked.parse(editorEl.value);
  livePreviewEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
  addCopyButtons(livePreviewEl);
}

editorEl.addEventListener('input', () => {
  updateLineNumbers();
  // Track dirty state
  if (editorEl.value !== originalContent) {
    setDirty(true);
  } else {
    setDirty(false);
  }
  updateStatusBar();
  if (!isEditing || livePreviewEl.style.display === 'none') return;
  clearTimeout(livePreviewTimer);
  livePreviewTimer = setTimeout(updateLivePreview, 150);
});

let isSaving = false;
let bannerHideHandler = null;

function showSaveErrorBanner(msg) {
  // Cancel any pending slide-up animation
  if (bannerHideHandler) {
    saveErrorBanner.removeEventListener('animationend', bannerHideHandler);
    bannerHideHandler = null;
  }
  const fullMsg = 'Save failed: ' + msg;
  saveErrorMsg.textContent = fullMsg;
  saveErrorMsg.title = fullMsg; // tooltip for truncated messages
  saveErrorRetry.disabled = false;
  saveErrorRetry.textContent = 'Retry';
  saveErrorBanner.style.display = 'flex';
  // Force restart slide-down animation
  saveErrorBanner.style.animation = 'none';
  saveErrorBanner.offsetHeight; // reflow
  saveErrorBanner.style.animation = '';
}

function hideSaveErrorBanner() {
  if (saveErrorBanner.style.display !== 'flex' || bannerHideHandler) return;
  bannerHideHandler = function() {
    saveErrorBanner.removeEventListener('animationend', bannerHideHandler);
    bannerHideHandler = null;
    saveErrorBanner.style.display = 'none';
    saveErrorBanner.style.animation = '';
  };
  saveErrorBanner.style.animation = 'bannerSlideUp 0.2s ease forwards';
  saveErrorBanner.addEventListener('animationend', bannerHideHandler);
}

function isSaveErrorBannerVisible() {
  return saveErrorBanner.style.display === 'flex' && !bannerHideHandler;
}

saveErrorRetry.addEventListener('click', () => {
  hideSaveErrorBanner();
  saveFile();
});

saveErrorDismiss.addEventListener('click', hideSaveErrorBanner);

let saveController = null;

async function saveFile() {
  if (!currentPath || !isEditing || isSaving) return;
  isSaving = true;
  btnSave.disabled = true;
  if (saveController) saveController.abort();
  saveController = new AbortController();
  // Disable retry button during save
  saveErrorRetry.disabled = true;
  saveErrorRetry.textContent = 'Saving...';
  const content = editorEl.value;
  try {
    const res = await fetch(API.file(currentPath), {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
      signal: saveController.signal,
    });
    await throwIfNotOk(res);
    originalContent = content;
    setDirty(false);
    clearDraft(currentPath);
    stopDraftTimer();
    hideSaveErrorBanner();
    showToast('Saved successfully', 'success');
    showPreview(content, currentPath);
  } catch (err) {
    if (err.name === 'AbortError') return;
    showSaveErrorBanner(err.message);
  } finally {
    isSaving = false;
    btnSave.disabled = false;
  }
}

async function cancelEdit() {
  if (isDirty && !(await airConfirm('Discard unsaved changes?'))) return;
  if (saveController) saveController.abort();
  setDirty(false);
  clearDraft(currentPath);
  stopDraftTimer();
  clearTimeout(livePreviewTimer);
  hideSaveErrorBanner();
  showPreview(originalContent, currentPath);
}

/* ============================================================
   12.5. MARKDOWN TOOLBAR
   ============================================================ */

// Helper: insert text at [start, end) preserving undo/redo history
function editorInsertAt(start, end, text) {
  editorEl.focus();
  editorEl.selectionStart = start;
  editorEl.selectionEnd = end;
  // execCommand preserves native undo/redo stack
  if (!document.execCommand('insertText', false, text)) {
    // Fallback for browsers where execCommand is unsupported
    const val = editorEl.value;
    editorEl.value = val.substring(0, start) + text + val.substring(end);
    editorEl.selectionStart = editorEl.selectionEnd = start + text.length;
    editorEl.dispatchEvent(new Event('input'));
  }
}

function mdWrap(before, after) {
  const start = editorEl.selectionStart;
  const end = editorEl.selectionEnd;
  const selected = editorEl.value.substring(start, end);
  const replacement = before + (selected || 'text') + (after || '');
  editorInsertAt(start, end, replacement);
  // Select the inner text
  editorEl.selectionStart = start + before.length;
  editorEl.selectionEnd = start + before.length + (selected || 'text').length;
}

function mdLinePrefix(prefix) {
  const start = editorEl.selectionStart;
  const val = editorEl.value;
  // Find start of current line
  const lineStart = val.lastIndexOf('\n', start - 1) + 1;
  editorInsertAt(lineStart, lineStart, prefix);
  editorEl.selectionStart = editorEl.selectionEnd = start + prefix.length;
}

const mdActions = {
  bold:    () => mdWrap('**', '**'),
  italic:  () => mdWrap('*', '*'),
  heading: () => mdLinePrefix('## '),
  link:    () => mdWrap('[', '](url)'),
  ul:      () => mdLinePrefix('- '),
  ol:      () => mdLinePrefix('1. '),
  code:    () => mdWrap('`', '`'),
  quote:   () => mdLinePrefix('> '),
  table:   async () => {
    const input = await airPrompt('Table size (rows x cols):', '3x3');
    if (!input) return;
    const match = input.match(/(\d+)\s*[x×X]\s*(\d+)/);
    if (!match) { showToast('Format: 3x3', 'error'); return; }
    const rows = Math.min(parseInt(match[1]), 20);
    const cols = Math.min(parseInt(match[2]), 10);
    let tbl = '| ' + Array.from({length: cols}, (_, i) => `Col ${i+1}`).join(' | ') + ' |\n';
    tbl += '| ' + Array.from({length: cols}, () => '---').join(' | ') + ' |\n';
    for (let r = 0; r < rows; r++) {
      tbl += '| ' + Array.from({length: cols}, () => '   ').join(' | ') + ' |\n';
    }
    const pos = editorEl.selectionStart;
    const val = editorEl.value;
    const before = val.substring(0, pos);
    const needNl = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const insertText = needNl + '\n' + tbl;
    editorInsertAt(pos, pos, insertText);
    editorEl.selectionStart = editorEl.selectionEnd = pos + insertText.length;
  },
  hr:      () => {
    const pos = editorEl.selectionStart;
    const val = editorEl.value;
    const before = val.substring(0, pos);
    const needNl = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const insertText = needNl + '\n---\n\n';
    editorInsertAt(pos, pos, insertText);
    editorEl.selectionStart = editorEl.selectionEnd = pos + insertText.length;
  },
};

mdToolbar.addEventListener('click', (e) => {
  const btn = e.target.closest('.md-btn');
  if (!btn) return;
  const action = btn.dataset.action;
  if (mdActions[action]) mdActions[action]();
});

/* ============================================================
   13. IN-CONTENT SEARCH (Ctrl+F)
   ============================================================ */
let searchMatches = [];
let searchIdx = -1;
let lastSearchQuery = '';

function openContentSearch() {
  searchBar.style.display = 'flex';
  searchText.focus();
  searchText.select();
  if (searchText.value.trim()) performContentSearch();
}

function closeContentSearch() {
  searchBar.style.display = 'none';
  searchText.classList.remove('no-results');
  searchCount.classList.remove('no-results');
  searchCount.textContent = '';
  clearTimeout(searchTimer);
  clearSearchHighlights();
  searchMatches = [];
  searchIdx = -1;
  lastSearchQuery = '';
  searchPrev.disabled = false;
  searchNext.disabled = false;
}

function clearSearchHighlights() {
  previewEl.querySelectorAll('mark.search-hl').forEach(m => {
    const parent = m.parentNode;
    parent.replaceChild(document.createTextNode(m.textContent), m);
    parent.normalize();
  });
}

// Large-file text search state
let largeSearchPositions = [];
let largeSearchFullText = '';

function performContentSearch() {
  const query = searchText.value.trim();
  if (query === lastSearchQuery) return;
  lastSearchQuery = query;
  clearSearchHighlights();
  searchMatches = [];
  largeSearchPositions = [];
  searchIdx = -1;

  if (!query || isEditing) {
    searchCount.textContent = '';
    searchText.classList.remove('no-results');
    searchCount.classList.remove('no-results');
    searchPrev.disabled = true;
    searchNext.disabled = true;
    return;
  }

  if (isLargeFile) {
    performLargeFileSearch(query);
  } else {
    highlightTextNodes(previewEl, query);
    searchMatches = Array.from(previewEl.querySelectorAll('mark.search-hl'));
    if (searchMatches.length > 0) {
      searchIdx = 0;
      activateMatch(0);
    }
  }

  const total = isLargeFile ? largeSearchPositions.length : searchMatches.length;
  const noResults = total === 0 && query.length > 0;
  searchCount.textContent = total > 0
    ? `${searchIdx + 1}/${total}`
    : 'No results';
  searchText.classList.toggle('no-results', noResults);
  searchCount.classList.toggle('no-results', noResults);
  searchPrev.disabled = total === 0;
  searchNext.disabled = total === 0;
}

function performLargeFileSearch(query) {
  const codeEl = previewEl.querySelector('code');
  if (!codeEl) return;
  largeSearchFullText = codeEl.textContent;
  const lowerText = largeSearchFullText.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let pos = 0;
  while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
    largeSearchPositions.push(pos);
    pos += lowerQuery.length;
  }
  if (largeSearchPositions.length > 0) {
    searchIdx = 0;
    activateLargeMatch(0, query);
  }
}

function activateLargeMatch(idx, query) {
  const codeEl = previewEl.querySelector('code');
  if (!codeEl) return;
  // Remove previous highlight
  const prev = codeEl.querySelector('mark.search-hl');
  if (prev) {
    prev.replaceWith(document.createTextNode(prev.textContent));
    codeEl.normalize();
  }
  // Find the text node containing the match position
  const pos = largeSearchPositions[idx];
  const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
  let offset = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLen = node.textContent.length;
    if (offset + nodeLen > pos) {
      const localPos = pos - offset;
      const before = node.textContent.slice(0, localPos);
      const match = node.textContent.slice(localPos, localPos + query.length);
      const after = node.textContent.slice(localPos + query.length);
      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      const mark = document.createElement('mark');
      mark.className = 'search-hl active';
      mark.textContent = match;
      frag.appendChild(mark);
      if (after) frag.appendChild(document.createTextNode(after));
      node.parentNode.replaceChild(frag, node);
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;
    }
    offset += nodeLen;
  }
  searchCount.textContent = `${idx + 1}/${largeSearchPositions.length}`;
}

function highlightTextNodes(root, query) {
  const lowerQuery = query.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (parent && ['SCRIPT', 'STYLE', 'MARK'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.textContent.toLowerCase().includes(lowerQuery)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(textNode => {
    const text = textNode.textContent;
    const lowerText = text.toLowerCase();
    const frag = document.createDocumentFragment();
    let lastIdx = 0;

    let pos = lowerText.indexOf(lowerQuery, lastIdx);
    while (pos !== -1) {
      if (pos > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, pos)));
      const mark = document.createElement('mark');
      mark.className = 'search-hl';
      mark.textContent = text.slice(pos, pos + query.length);
      frag.appendChild(mark);
      lastIdx = pos + query.length;
      pos = lowerText.indexOf(lowerQuery, lastIdx);
    }

    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    textNode.parentNode.replaceChild(frag, textNode);
  });
}

function activateMatch(idx) {
  searchMatches.forEach(m => m.classList.remove('active'));
  if (searchMatches[idx]) {
    searchMatches[idx].classList.add('active');
    searchMatches[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchCount.textContent = `${idx + 1}/${searchMatches.length}`;
  }
}

function searchNextMatch() {
  if (isLargeFile) {
    if (largeSearchPositions.length === 0) return;
    searchIdx = (searchIdx + 1) % largeSearchPositions.length;
    activateLargeMatch(searchIdx, lastSearchQuery);
  } else {
    if (searchMatches.length === 0) return;
    searchIdx = (searchIdx + 1) % searchMatches.length;
    activateMatch(searchIdx);
  }
}

function searchPrevMatch() {
  if (isLargeFile) {
    if (largeSearchPositions.length === 0) return;
    searchIdx = (searchIdx - 1 + largeSearchPositions.length) % largeSearchPositions.length;
    activateLargeMatch(searchIdx, lastSearchQuery);
  } else {
    if (searchMatches.length === 0) return;
    searchIdx = (searchIdx - 1 + searchMatches.length) % searchMatches.length;
    activateMatch(searchIdx);
  }
}

let searchTimer = null;
searchText.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(performContentSearch, 300);
});

searchText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.shiftKey ? searchPrevMatch() : searchNextMatch();
  }
  if (e.key === 'Escape') closeContentSearch();
});

searchNext.addEventListener('click', searchNextMatch);
searchPrev.addEventListener('click', searchPrevMatch);
searchClose.addEventListener('click', closeContentSearch);

/* ============================================================
   14. SIDEBAR RESIZE
   ============================================================ */
let isResizing = false;

// Restore saved width
const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
if (savedWidth && window.innerWidth > 768) {
  const w = parseInt(savedWidth, 10);
  if (w >= 180 && w <= 500) {
    sidebar.style.width = `${w}px`;
    sidebar.style.minWidth = `${w}px`;
  }
}

resizeHandle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isResizing = true;
  resizeHandle.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  let w = e.clientX;
  if (w < 180) w = 180;
  if (w > 500) w = 500;
  sidebar.style.width = `${w}px`;
  sidebar.style.minWidth = `${w}px`;
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  resizeHandle.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  localStorage.setItem(SIDEBAR_WIDTH_KEY, parseInt(sidebar.style.width, 10));
});

/* ============================================================
   15. KEYBOARD NAVIGATION (tree)
   ============================================================ */
function getVisibleTreeItems() {
  return Array.from(treeEl.querySelectorAll('.tree-item:not(.hidden)'))
    .filter(el => {
      // Check all ancestor tree-children are open
      let p = el.parentElement;
      while (p && p !== treeEl) {
        if (p.classList.contains('tree-children') && !p.classList.contains('open')) return false;
        p = p.parentElement;
      }
      return true;
    });
}

function setFocusedItem(item) {
  if (focusedTreeItem) focusedTreeItem.classList.remove('focused');
  focusedTreeItem = item;
  if (item) {
    item.classList.add('focused');
    item.scrollIntoView({ block: 'nearest' });
  }
}

treeEl.addEventListener('keydown', (e) => {
  const items = getVisibleTreeItems();
  if (items.length === 0) return;

  const idx = focusedTreeItem ? items.indexOf(focusedTreeItem) : -1;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setFocusedItem(items[Math.min(idx + 1, items.length - 1)]);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setFocusedItem(items[Math.max(idx - 1, 0)]);
  } else if (e.key === 'ArrowRight' && focusedTreeItem) {
    e.preventDefault();
    // If dir, expand; if file, do nothing
    const dirEl = focusedTreeItem.closest('.tree-dir');
    if (dirEl && focusedTreeItem === dirEl.querySelector(':scope > .tree-item')) {
      const ch = dirEl.querySelector(':scope > .tree-children');
      if (ch) expandDir(ch);
    }
  } else if (e.key === 'ArrowLeft' && focusedTreeItem) {
    e.preventDefault();
    const dirEl = focusedTreeItem.closest('.tree-dir');
    if (dirEl && focusedTreeItem === dirEl.querySelector(':scope > .tree-item')) {
      const ch = dirEl.querySelector(':scope > .tree-children');
      if (ch) collapseDir(ch);
    } else {
      // Go to parent dir
      const parentDir = focusedTreeItem.closest('.tree-children')?.closest('.tree-dir');
      if (parentDir) {
        const parentRow = parentDir.querySelector(':scope > .tree-item');
        if (parentRow) setFocusedItem(parentRow);
      }
    }
  } else if (e.key === 'Enter' && focusedTreeItem) {
    e.preventDefault();
    focusedTreeItem.click();
  }
});

treeEl.addEventListener('focus', () => {
  if (!focusedTreeItem) {
    const items = getVisibleTreeItems();
    if (items.length > 0) setFocusedItem(items[0]);
  }
});

/* ============================================================
   16. MOBILE SIDEBAR
   ============================================================ */
function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('open');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

/* ============================================================
   17. KEYBOARD SHORTCUTS
   ============================================================ */
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's' && isEditing) {
    e.preventDefault();
    saveFile();
    return;
  }
  if (e.key === 'Escape') {
    if (ctxMenu.isOpen()) { ctxMenu.close(); return; }
    if (listCtxMenu.isOpen()) { listCtxMenu.close(); return; }
    if (isSaveErrorBannerVisible()) { hideSaveErrorBanner(); return; }
    if (settingsDialog.isOpen()) { settingsDialog.close(); return; }
    if (shortcutsDialog.isOpen()) { shortcutsDialog.close(); return; }
    if (searchBar.style.display === 'flex') { closeContentSearch(); return; }
    if (isFocusMode) { toggleFocusMode(); return; }
    if (isEditing) { cancelEdit(); return; }
  }
  // Save error banner: Enter to retry (only when not typing in editor/inputs)
  if (e.key === 'Enter' && isSaveErrorBannerVisible() && !saveErrorRetry.disabled
      && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    hideSaveErrorBanner();
    saveFile();
    return;
  }
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }
  if (e.ctrlKey && e.key === 'f' && !isEditing && currentPath) {
    e.preventDefault();
    openContentSearch();
    return;
  }
  if (isEditing && currentPath && currentPath.endsWith('.md')) {
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); mdActions.bold(); return; }
    if (e.ctrlKey && e.key === 'i') { e.preventDefault(); mdActions.italic(); return; }
  }
  if (e.ctrlKey && (e.key === '=' || e.key === '+')) { e.preventDefault(); adjustZoom(0.1); return; }
  if (e.ctrlKey && e.key === '-') { e.preventDefault(); adjustZoom(-0.1); return; }
  if (e.ctrlKey && e.key === '0') { e.preventDefault(); adjustZoom(0); return; }
  if (e.ctrlKey && e.key === ',') { e.preventDefault(); openSettings(); return; }
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFocusMode();
    return;
  }
  if (e.key === '?' && !isEditing && !e.ctrlKey && !e.metaKey) {
    if (shortcutsDialog.isOpen()) { closeShortcutsHelp(); return; }
    openShortcutsHelp();
    return;
  }
});

/* ============================================================
   17.5. WORD WRAP TOGGLE (default: ON)
   ============================================================ */
function getWrapPref() {
  const v = localStorage.getItem(WRAP_KEY);
  return v === null ? true : v === 'true'; // default ON
}

function applyWrap(on) {
  if (on) {
    editorEl.classList.add('word-wrap');
    contentBody.classList.add('word-wrap');
    btnWrap.classList.add('active');
  } else {
    editorEl.classList.remove('word-wrap');
    contentBody.classList.remove('word-wrap');
    btnWrap.classList.remove('active');
  }
  localStorage.setItem(WRAP_KEY, on);
}

applyWrap(getWrapPref());

btnWrap.addEventListener('click', () => {
  const next = !editorEl.classList.contains('word-wrap');
  applyWrap(next);
});

/* ============================================================
   17.6. FOCUS MODE
   ============================================================ */
let isFocusMode = false;
let focusBarsTimer = null;
let focusMoveThrottled = false;

function toggleFocusMode() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function showFocusBars() {
  layoutEl.classList.add('focus-bars-visible');
  clearTimeout(focusBarsTimer);
  focusBarsTimer = setTimeout(() => {
    layoutEl.classList.remove('focus-bars-visible');
  }, 2000);
}

function onFocusBarsEnter() { clearTimeout(focusBarsTimer); }
function onFocusBarsLeave() { showFocusBars(); }

function setupFocusBarListeners() {
  document.addEventListener('mousemove', onFocusMouseMove);
  document.addEventListener('keydown', onFocusKeyDown);
  toolbarEl.addEventListener('mouseenter', onFocusBarsEnter);
  toolbarEl.addEventListener('mouseleave', onFocusBarsLeave);
  statusBar.addEventListener('mouseenter', onFocusBarsEnter);
  statusBar.addEventListener('mouseleave', onFocusBarsLeave);
}

function cleanupFocusBarListeners() {
  document.removeEventListener('mousemove', onFocusMouseMove);
  document.removeEventListener('keydown', onFocusKeyDown);
  toolbarEl.removeEventListener('mouseenter', onFocusBarsEnter);
  toolbarEl.removeEventListener('mouseleave', onFocusBarsLeave);
  statusBar.removeEventListener('mouseenter', onFocusBarsEnter);
  statusBar.removeEventListener('mouseleave', onFocusBarsLeave);
  clearTimeout(focusBarsTimer);
  focusMoveThrottled = false;
  layoutEl.classList.remove('focus-bars-visible');
}

function onFocusMouseMove() {
  if (focusMoveThrottled) return;
  focusMoveThrottled = true;
  showFocusBars();
  setTimeout(() => { focusMoveThrottled = false; }, 100);
}

function onFocusKeyDown() {
  showFocusBars();
}

document.addEventListener('fullscreenchange', () => {
  isFocusMode = !!document.fullscreenElement;
  layoutEl.classList.toggle('focus-mode', isFocusMode);
  btnFocus.classList.toggle('active', isFocusMode);
  if (isFocusMode) {
    showFocusBars();
    setupFocusBarListeners();
  } else {
    cleanupFocusBarListeners();
  }
});

btnFocus.addEventListener('click', toggleFocusMode);

// Image zoom header buttons
btnImgZoomIn.addEventListener('click', () => adjustZoom(0.1));
btnImgZoomOut.addEventListener('click', () => adjustZoom(-0.1));
btnImgZoomReset.addEventListener('click', () => adjustZoom(0));

/* ============================================================
   17.7. KEYBOARD SHORTCUTS HELP
   ============================================================ */
const shortcutsDialog = createModalDialog({
  overlayEl: shortcutsOverlay,
  closeBtn: shortcutsClose,
});

function openShortcutsHelp() { shortcutsDialog.open(); }
function closeShortcutsHelp() { shortcutsDialog.close(); }

// beforeunload warning + draft flush
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    saveDraft(); // flush draft immediately
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ============================================================
   18. EVENTS
   ============================================================ */
btnEdit.addEventListener('click', enterEditMode);
btnSearch.addEventListener('click', openContentSearch);
btnSave.addEventListener('click', saveFile);
btnCancel.addEventListener('click', cancelEdit);
hamburger.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});
overlay.addEventListener('click', closeSidebar);

/* Tab support in editor */
editorEl.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editorEl.selectionStart;
    const end = editorEl.selectionEnd;
    editorInsertAt(start, end, '  ');
    editorEl.selectionStart = editorEl.selectionEnd = start + 2;
  }
});

/* ============================================================
   19. UTILS
   ============================================================ */
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML.replace(/"/g, '&quot;');
}

/* ============================================================
   20. MOBILE VIEWPORT (keyboard-aware height)
   ============================================================ */
function updateViewportHeight() {
  if (window.visualViewport) {
    const vh = window.visualViewport.height * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  } else {
    document.documentElement.style.setProperty('--vh', '1vh');
  }
}

updateViewportHeight();

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateViewportHeight);
  window.visualViewport.addEventListener('scroll', updateViewportHeight);
}
window.addEventListener('resize', updateViewportHeight);

/* ============================================================
   21. SCROLL POSITION MEMORY
   ============================================================ */
function saveScrollPosition() {
  if (!currentPath) return;
  const target = isEditing ? editorEl : previewEl;
  scrollPositions.set(currentPath, target.scrollTop);
  // Cap scroll positions map to prevent unbounded growth
  if (scrollPositions.size > 50) {
    const first = scrollPositions.keys().next().value;
    scrollPositions.delete(first);
  }
}

function restoreScrollPosition(filePath) {
  const pos = scrollPositions.get(filePath);
  if (pos == null) return;
  // Delay slightly to ensure content is rendered
  requestAnimationFrame(() => {
    const target = isEditing ? editorEl : previewEl;
    target.scrollTop = pos;
  });
}

/* ============================================================
   22. EDITOR DRAFT AUTO-SAVE
   ============================================================ */
function getDraft(filePath) {
  try { return localStorage.getItem(DRAFT_PREFIX + filePath); }
  catch { return null; }
}

function saveDraft() {
  if (!currentPath || !isEditing) return;
  if (!isDirty) return;
  try { localStorage.setItem(DRAFT_PREFIX + currentPath, editorEl.value); }
  catch { /* quota exceeded — silently ignore */ }
}

function clearDraft(filePath) {
  try { localStorage.removeItem(DRAFT_PREFIX + (filePath || currentPath)); }
  catch { /* ignore */ }
}

function startDraftTimer() {
  stopDraftTimer();
  draftTimer = setInterval(saveDraft, 5000);
}

function stopDraftTimer() {
  if (draftTimer) { clearInterval(draftTimer); draftTimer = null; }
}

/* ============================================================
   23. STATUS BAR
   ============================================================ */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function updateStatusBar() {
  if (!currentPath) {
    statusBar.style.display = 'none';
    return;
  }

  statusBar.style.display = 'flex';
  const text = isEditing ? editorEl.value : originalContent;
  const lines = text.split('\n').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const size = formatFileSize(new Blob([text]).size);
  statusInfo.textContent = `${lines} lines \u00b7 ${words.toLocaleString()} words \u00b7 ${size}`;

  if (isEditing) {
    const pos = editorEl.selectionStart;
    const before = editorEl.value.substring(0, pos);
    const ln = before.split('\n').length;
    const col = pos - before.lastIndexOf('\n');
    statusCursor.textContent = `Ln ${ln}, Col ${col}`;
  } else {
    statusCursor.textContent = '';
  }
}

editorEl.addEventListener('click', updateStatusBar);
editorEl.addEventListener('keyup', updateStatusBar);

/* ============================================================
   24. FONT ZOOM (text) + IMAGE ZOOM
   ============================================================ */
let zoomLevel = parseFloat(localStorage.getItem(ZOOM_KEY)) || 1.0;
let imageZoomLevel = parseFloat(localStorage.getItem(IMAGE_ZOOM_KEY)) || 1.0;
let baseFontSize = parseInt(localStorage.getItem(FONT_SIZE_KEY), 10) || 14;

function applyZoom() {
  document.documentElement.style.setProperty('--zoom', zoomLevel);
  localStorage.setItem(ZOOM_KEY, zoomLevel);
}

function applyImageZoom() {
  document.documentElement.style.setProperty('--image-zoom', imageZoomLevel);
  localStorage.setItem(IMAGE_ZOOM_KEY, imageZoomLevel);
}

function applyFontSize() {
  document.documentElement.style.setProperty('--base-font-size', baseFontSize + 'px');
  localStorage.setItem(FONT_SIZE_KEY, baseFontSize);
  // Update settings dialog display if open
  const display = $('#settingsFontSizeValue');
  if (display) display.textContent = baseFontSize + 'px';
}

function adjustZoom(delta) {
  const isImage = currentPath && isImageFile(currentPath);
  if (isImage) {
    imageZoomLevel = delta === 0 ? 1.0 : Math.max(0.3, Math.min(3.0, imageZoomLevel + delta));
    applyImageZoom();
    showToast(`Image Zoom: ${Math.round(imageZoomLevel * 100)}%`, 'info');
  } else {
    zoomLevel = delta === 0 ? 1.0 : Math.max(0.5, Math.min(2.0, zoomLevel + delta));
    applyZoom();
    showToast(`Zoom: ${Math.round(zoomLevel * 100)}%`, 'info');
  }
}

applyZoom();
applyImageZoom();
applyFontSize();

/* ============================================================
   25. SETTINGS DIALOG
   ============================================================ */
const settingsOverlay = $('#settingsOverlay');
const settingsClose = $('#settingsClose');
const btnSettings = $('#btnSettings');

const settingsDialog = createModalDialog({
  overlayEl: settingsOverlay,
  closeBtn: settingsClose,
  onOpen() {
    const fontDisplay = $('#settingsFontSizeValue');
    if (fontDisplay) fontDisplay.textContent = baseFontSize + 'px';
    setSegActive($('#settingsThemeToggle'), getTheme());
    setSegActive($('#settingsWrapToggle'), getWrapPref() ? 'on' : 'off');
    setSegActive($('#settingsIgnoreToggle'), localStorage.getItem(SHOW_IGNORED_KEY) === 'true' ? 'on' : 'off');
  }
});

function openSettings() { settingsDialog.open(); }
function closeSettings() { settingsDialog.close(); }

if (btnSettings) btnSettings.addEventListener('click', openSettings);

// Font size +/-
$('#settingsFontInc')?.addEventListener('click', () => {
  baseFontSize = Math.min(baseFontSize + 1, 24);
  applyFontSize();
});
$('#settingsFontDec')?.addEventListener('click', () => {
  baseFontSize = Math.max(baseFontSize - 1, 10);
  applyFontSize();
});

// Segmented toggle helper
function setSegActive(container, value) {
  if (!container) return;
  container.querySelectorAll('.seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
}

// Theme toggle in settings
$('#settingsThemeToggle')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  applyTheme(btn.dataset.value);
  setSegActive($('#settingsThemeToggle'), btn.dataset.value);
});

// Wrap toggle in settings
$('#settingsWrapToggle')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  applyWrap(btn.dataset.value === 'on');
  setSegActive($('#settingsWrapToggle'), btn.dataset.value);
});

// Show ignored files toggle in settings
$('#settingsIgnoreToggle')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  const show = btn.dataset.value === 'on';
  localStorage.setItem(SHOW_IGNORED_KEY, show ? 'true' : 'false');
  setSegActive($('#settingsIgnoreToggle'), btn.dataset.value);
  loadTree();
});

/* ============================================================
   CUSTOM FILTER PANELS
   ============================================================ */
const customFiltersBody = $('#customFiltersBody');
const customFilterAdd = $('#customFilterAdd');

function loadCustomFilters() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_FILTERS_KEY) || '[]'); } catch { return []; }
}

function saveCustomFilters(filters) {
  localStorage.setItem(CUSTOM_FILTERS_KEY, JSON.stringify(filters));
}

// collectFiles — defined in utils.js

function findSubtree(items, folderPath) {
  if (!folderPath) return items;
  for (const item of items) {
    if (item.type === 'dir') {
      if (item.path === folderPath) return item.children || [];
      if (item.children) {
        const found = findSubtree(item.children, folderPath);
        if (found) return found;
      }
    }
  }
  return null;
}

function filterByQuery(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  const result = [];
  for (const item of items) {
    if (item.type === 'file') {
      if (item.path.toLowerCase().includes(q)) result.push(item);
    } else if (item.type === 'dir' && item.children) {
      const filtered = filterByQuery(item.children, query);
      if (filtered.length > 0) {
        result.push({ ...item, children: filtered });
      }
    }
  }
  return result;
}

function filterByPattern(items, pattern) {
  if (!pattern) return items;
  const result = [];
  for (const item of items) {
    if (item.type === 'file') {
      if (matchFilterPattern(item.name, pattern)) result.push(item);
    } else if (item.type === 'dir' && item.children) {
      const filtered = filterByPattern(item.children, pattern);
      if (filtered.length > 0) {
        result.push({ ...item, children: filtered });
      }
    }
  }
  return result;
}

function matchFilterPattern(name, pattern) {
  const lowerName = name.toLowerCase();
  const parts = pattern.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith('*.')) {
      if (lowerName.endsWith(part.substring(1))) return true;
    } else if (part.startsWith('.')) {
      if (lowerName.endsWith(part)) return true;
    } else {
      if (lowerName.includes(part)) return true;
    }
  }
  return false;
}

function renderCustomFilterPanel(filter, index) {
  const panel = document.createElement('div');
  panel.className = 'custom-filter-panel';
  panel.dataset.index = index;

  const subtree = findSubtree(treeData, filter.folder);
  const q = searchInput.value.trim();
  const byPattern = subtree ? filterByPattern(subtree, filter.pattern) : [];
  const items = filterByQuery(byPattern, q);
  const allFiles = collectFiles(items);
  const count = allFiles.length;
  const label = (filter.folder || '/') + (filter.pattern ? ` (${filter.pattern})` : '');

  // Header
  const header = document.createElement('div');
  header.className = 'custom-filter-panel-header';
  header.innerHTML = `
    <span class="custom-filter-panel-title" title="${esc(label)}">${esc(label)}<span class="cf-count">${count}</span></span>
    <div class="custom-filter-panel-actions">
      <button class="section-btn cf-view-toggle" title="Toggle tree/list">${filter.viewMode === 'list' ? '&#9776;' : '&#9660;'}</button>
      <button class="section-btn cf-delete" title="Delete filter">✕</button>
    </div>`;

  // Body
  const body = document.createElement('div');
  body.className = 'custom-filter-panel-body';

  if (count === 0) {
    body.innerHTML = '<div class="sidebar-section-empty">No matching files</div>';
  } else if (filter.viewMode === 'list') {
    renderCfList(body, allFiles);
  } else {
    renderCfTree(body, items, 0);
  }

  // Toggle collapse
  header.addEventListener('click', (e) => {
    if (e.target.closest('.section-btn')) return;
    body.classList.toggle('collapsed');
  });

  // View toggle
  header.querySelector('.cf-view-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    const filters = loadCustomFilters();
    filters[index].viewMode = filters[index].viewMode === 'list' ? 'tree' : 'list';
    saveCustomFilters(filters);
    renderAllCustomFilters();
  });

  // Delete
  header.querySelector('.cf-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    const filters = loadCustomFilters();
    filters.splice(index, 1);
    saveCustomFilters(filters);
    renderAllCustomFilters();
  });

  panel.appendChild(header);
  panel.appendChild(body);
  return panel;
}

function renderCfList(container, files) {
  for (const file of files) {
    const row = document.createElement('div');
    row.className = 'sidebar-list-item';
    const icon = getFileIcon(file.name);
    const dir = getDirPath(file.path);
    row.innerHTML = `<span class="icon">${icon}</span><span class="name">${esc(file.name)}</span>${dir ? `<span class="cf-path">${esc(dir)}</span>` : ''}`;
    row.addEventListener('click', () => {
      expandPathTo(file.path);
      const treeRow = getTreeRow(file.path);
      openFile(file.path, treeRow);
    });
    row.addEventListener('contextmenu', (e) => showContextMenu(e, file.path));
    container.appendChild(row);
  }
}

function renderCfTree(container, items, depth) {
  for (const item of items) {
    if (item.type === 'dir') {
      const dirRow = document.createElement('div');
      dirRow.className = 'cf-dir-row';
      dirRow.style.setProperty('--cf-indent', `${16 + depth * 16}px`);
      dirRow.innerHTML = `<span class="icon">&#9654;</span><span class="name">${esc(item.name)}</span>`;

      const children = document.createElement('div');
      children.className = 'cf-dir-children open';
      dirRow.querySelector('.icon').innerHTML = '&#9660;';

      dirRow.addEventListener('click', () => {
        const isOpen = children.classList.toggle('open');
        dirRow.querySelector('.icon').innerHTML = isOpen ? '&#9660;' : '&#9654;';
      });

      container.appendChild(dirRow);
      container.appendChild(children);
      renderCfTree(children, item.children, depth + 1);
    } else {
      const row = document.createElement('div');
      row.className = 'sidebar-list-item cf-tree-indent';
      row.style.setProperty('--cf-indent', `${16 + depth * 16}px`);
      const icon = getFileIcon(item.name);
      row.innerHTML = `<span class="icon">${icon}</span><span class="name">${esc(item.name)}</span>`;
      row.addEventListener('click', () => {
        expandPathTo(item.path);
        const treeRow = getTreeRow(item.path);
        openFile(item.path, treeRow);
      });
      row.addEventListener('contextmenu', (e) => showContextMenu(e, item.path));
      container.appendChild(row);
    }
  }
}

function renderAllCustomFilters() {
  customFiltersBody.innerHTML = '';
  const filters = loadCustomFilters();
  if (filters.length === 0) {
    customFiltersBody.innerHTML = '<div class="sidebar-section-empty">No filters. Press + to add.</div>';
    return;
  }
  filters.forEach((f, i) => {
    customFiltersBody.appendChild(renderCustomFilterPanel(f, i));
  });
}

// --- Add Filter Dialog ---
const afOverlay = $('#addFilterOverlay');
const afFolderInput = $('#afFolderInput');
const afPatternInput = $('#afPatternInput');
const afFolderBrowse = $('#afFolderBrowse');
const afPresetBrowse = $('#afPresetBrowse');
const afFolderDropdown = $('#afFolderDropdown');
const afPresetDropdown = $('#afPresetDropdown');
const afOk = $('#addFilterOk');
const afCancel = $('#addFilterCancel');
const afClose = $('#addFilterClose');

function buildFolderDropdown() {
  afFolderDropdown.innerHTML = '';
  // Root option
  const rootItem = document.createElement('div');
  rootItem.className = 'af-dir-row';
  rootItem.style.setProperty('--af-indent', '8px');
  rootItem.innerHTML = '<span class="af-dir-toggle"></span><span class="af-dir-icon">&#128193;</span><span class="af-dir-name">/ (root)</span>';
  rootItem.addEventListener('click', (e) => {
    if (e.target.classList.contains('af-dir-toggle')) return;
    afFolderInput.value = '';
    afFolderDropdown.style.display = 'none';
  });
  afFolderDropdown.appendChild(rootItem);

  buildFolderTreeNodes(treeData, afFolderDropdown, 0);
}

function buildFolderTreeNodes(items, container, depth) {
  for (const item of items) {
    if (item.type !== 'dir') continue;
    const hasSubs = item.children && item.children.some(c => c.type === 'dir');

    const row = document.createElement('div');
    row.className = 'af-dir-row';
    row.style.setProperty('--af-indent', `${8 + (depth + 1) * 14}px`);
    row.innerHTML = `<span class="af-dir-toggle">${hasSubs ? '&#9654;' : ''}</span><span class="af-dir-icon">&#128193;</span><span class="af-dir-name">${esc(item.name)}</span>`;

    container.appendChild(row);

    if (hasSubs) {
      const childrenEl = document.createElement('div');
      childrenEl.className = 'af-dir-children';
      container.appendChild(childrenEl);

      const toggleEl = row.querySelector('.af-dir-toggle');
      toggleEl.style.cursor = 'pointer';
      toggleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = childrenEl.classList.toggle('open');
        toggleEl.innerHTML = isOpen ? '&#9660;' : '&#9654;';
      });

      buildFolderTreeNodes(item.children, childrenEl, depth + 1);
    }

    // Click row (not toggle) → select folder
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('af-dir-toggle')) return;
      afFolderInput.value = item.path;
      afFolderDropdown.style.display = 'none';
    });
  }
}

function buildPresetDropdown() {
  afPresetDropdown.innerHTML = '';
  // All (no filter)
  const allItem = document.createElement('div');
  allItem.className = 'af-dropdown-item';
  allItem.innerHTML = '<span>All</span>';
  allItem.addEventListener('click', () => {
    afPatternInput.value = '';
    afPresetDropdown.style.display = 'none';
  });
  afPresetDropdown.appendChild(allItem);

  const presets = loadPresets();
  for (const preset of presets) {
    const item = document.createElement('div');
    item.className = 'af-dropdown-item';
    item.innerHTML = `<span>${esc(preset.label)}</span><span class="af-preset-exts">${esc(preset.exts)}</span>`;
    item.addEventListener('click', () => {
      // Convert ".md .txt" format to "*.md, *.txt"
      const pattern = preset.exts.split(/\s+/).map(e => e.startsWith('.') ? '*' + e : e).join(', ');
      afPatternInput.value = pattern;
      afPresetDropdown.style.display = 'none';
    });
    afPresetDropdown.appendChild(item);
  }
}

function showAddFilterDialog() {
  return new Promise(resolve => {
    afFolderInput.value = '';
    afPatternInput.value = '';
    afFolderDropdown.style.display = 'none';
    afPresetDropdown.style.display = 'none';
    afOverlay.style.display = 'flex';
    afFolderInput.focus();

    const cleanup = () => {
      afOverlay.style.display = 'none';
      afFolderDropdown.style.display = 'none';
      afPresetDropdown.style.display = 'none';
      afOk.onclick = null;
      afCancel.onclick = null;
      afClose.onclick = null;
      afOverlay.onclick = null;
    };

    afOk.onclick = () => {
      const folder = afFolderInput.value.trim().replace(/\/$/, '');
      const pattern = afPatternInput.value.trim();
      cleanup();
      resolve({ folder, pattern });
    };

    const cancel = () => { cleanup(); resolve(null); };
    afCancel.onclick = cancel;
    afClose.onclick = cancel;
    afOverlay.onclick = (e) => { if (e.target === afOverlay) cancel(); };
  });
}

afFolderBrowse.addEventListener('click', (e) => {
  e.stopPropagation();
  afPresetDropdown.style.display = 'none';
  const isOpen = afFolderDropdown.style.display !== 'none';
  if (isOpen) {
    afFolderDropdown.style.display = 'none';
  } else {
    buildFolderDropdown();
    afFolderDropdown.style.display = 'block';
  }
});

afPresetBrowse.addEventListener('click', (e) => {
  e.stopPropagation();
  afFolderDropdown.style.display = 'none';
  const isOpen = afPresetDropdown.style.display !== 'none';
  if (isOpen) {
    afPresetDropdown.style.display = 'none';
  } else {
    buildPresetDropdown();
    afPresetDropdown.style.display = 'block';
  }
});

// Close dropdowns when clicking outside
afOverlay.addEventListener('click', (e) => {
  if (!afFolderDropdown.contains(e.target) && e.target !== afFolderBrowse) {
    afFolderDropdown.style.display = 'none';
  }
  if (!afPresetDropdown.contains(e.target) && e.target !== afPresetBrowse) {
    afPresetDropdown.style.display = 'none';
  }
});

customFilterAdd.addEventListener('click', async (e) => {
  e.stopPropagation();
  const result = await showAddFilterDialog();
  if (!result) return;

  const filters = loadCustomFilters();
  filters.push({ folder: result.folder, pattern: result.pattern, viewMode: 'tree' });
  saveCustomFilters(filters);
  renderAllCustomFilters();
});

/* ============================================================
   BOOT
   ============================================================ */
// Section header toggle (common behavior) with localStorage persistence
function getSectionCollapsed() {
  try { return JSON.parse(localStorage.getItem(SECTIONS_KEY) || '{}'); } catch { return {}; }
}

function saveSectionCollapsed(sectionId, collapsed) {
  const state = getSectionCollapsed();
  state[sectionId] = collapsed;
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(state));
}

function initSectionToggle(headerEl, toggleEl, bodyEl, sectionId) {
  // Restore persisted state
  const state = getSectionCollapsed();
  if (state[sectionId]) {
    toggleEl.classList.add('collapsed');
    bodyEl.classList.add('collapsed');
  }
  headerEl.addEventListener('click', (e) => {
    if (e.target.closest('.section-btn')) return;
    toggleEl.classList.toggle('collapsed');
    bodyEl.classList.toggle('collapsed');
    saveSectionCollapsed(sectionId, toggleEl.classList.contains('collapsed'));
  });
}
initSectionToggle($('#recentHeader'), $('#recentToggle'), recentListEl, 'recent');
initSectionToggle($('#favoritesHeader'), $('#favoritesToggle'), favoritesList, 'favorites');
initSectionToggle($('#treeHeader'), $('#treeToggle'), treeEl, 'tree');
initSectionToggle($('#customFiltersHeader'), $('#customFiltersToggle'), customFiltersBody, 'customFilters');

recentClearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearRecent(); });
favoritesClearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearFavorites(); });
btnExpandAll.addEventListener('click', (e) => { e.stopPropagation(); expandAllFirstLevel(); });
btnCollapseAll.addEventListener('click', (e) => { e.stopPropagation(); collapseAll(); });
await loadTree();
renderFavorites();
renderAllCustomFilters();

// Set initial history state
const urlFileParam = new URLSearchParams(window.location.search).get('file');
history.replaceState({ file: urlFileParam || null }, '');

if (urlFileParam) {
  const row = getTreeRow(urlFileParam);
  if (row) row.scrollIntoView({ block: 'nearest' });
  openFile(urlFileParam, row);
} else {
  showWelcomeScreen();
}

// Browser back/forward navigation
window.addEventListener('popstate', async (e) => {
  const filePath = e.state?.file || new URLSearchParams(window.location.search).get('file');
  if (filePath) {
    const row = getTreeRow(filePath);
    // Use openFile but prevent it from pushing another history entry
    if (isDirty) {
      if (!(await airConfirm('Discard unsaved changes?'))) {
        // Re-push current state to cancel back
        updateFileUrl(currentPath, true);
        return;
      }
    }
    setDirty(false);
    openFile(filePath, row, { pushHistory: false });
  } else {
    if (isDirty) {
      if (!(await airConfirm('Discard unsaved changes?'))) {
        updateFileUrl(currentPath, true);
        return;
      }
    }
    showWelcomeScreen();
  }
});

// Open sidebar on mobile when no file is selected
if (!currentPath && window.innerWidth <= 768) {
  openSidebar();
}
