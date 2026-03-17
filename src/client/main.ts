import { $ , esc } from './utils/dom';
import { createLogger } from './utils/logger';
import { state } from './state';
import { BASE_TITLE } from './constants';
import { API, throwIfNotOk } from './api';
import { getFileName, getDirPath, countFiles, countDirs } from '@shared/utils';

const log = createLogger('App');

// Components
import { loadMaterialIcons, getFileIcon, isImageFile } from './components/icons';
import { initTheme } from './components/theme';
import { showToast } from './components/toast';
import { airConfirm } from './components/dialog';
import { renderBreadcrumb, setDirty } from './components/breadcrumb';
import { setRecentDeps, addRecent, removeRecent, renderRecent, getRecent, clearRecent, getTreeRow } from './components/sidebar/recent';
import { setFavoritesDeps, renderFavorites, getFavorites, clearFavorites } from './components/sidebar/favorites';
import { initSections } from './components/sidebar/sections';
import { initSidebarResize } from './components/sidebar/resize';
import {
  setTreeItemActive, expandPathTo, updateFileUrl, resetPanelMode, setEditButtons
} from './components/tree/helpers';
import { setTreeRenderDeps, loadTree, refreshTreeAndSelect, expandAndOpenFile } from './components/tree/render';
import { initTreeNavigation } from './components/tree/navigation';
import { initFilter, applyFilter, setFilterDeps } from './components/tree/filter';
import { enterEditMode, saveFile, cancelEdit, hideSaveErrorBanner, isSaveErrorBannerVisible, setEditorDeps, initEditor, updateLivePreview } from './components/editor/editor';
import { initLineNumbers, updateLineNumbers } from './components/editor/line-numbers';
import { initMdToolbar, mdActions } from './components/editor/toolbar';
import { getDraft, clearDraft, saveDraft, startDraftTimer, stopDraftTimer } from './components/editor/draft';
import { showPreview, showPreviewMode, showImagePreview, hideImageZoomButtons, hideTOC, initPreviewLinks, initMarked, setPreviewDeps } from './components/preview';
import { openContentSearch, closeContentSearch, initSearch } from './components/search';
import { updateStatusBar } from './components/status-bar';
import { initZoom, adjustZoom } from './components/zoom';
import { settingsDialog, initSettings, setSettingsDeps } from './components/settings';
import { toggleFocusMode, initFocusMode } from './components/focus-mode';
import { showContextMenu, closeContextMenu, showListCtxMenu, ctxMenu, listCtxMenu, setContextMenuDeps, initContextMenu } from './components/context-menu';
import { renderAllCustomFilters, initCustomFilters, setCustomFilterDeps } from './components/sidebar/custom-filters';

// DOM refs
const sidebar = $('#sidebar');
const overlay = $('#sidebarOverlay');
const hamburger = $('#hamburger');
const btnEdit = $('#btnEdit');
const btnSearch = $('#btnSearch');
const btnSave = $('#btnSave');
const btnCancel = $('#btnCancel');
const recentClearBtn = $('#recentClear');
const favoritesClearBtn = $('#favoritesClear');
const btnExpandAll = $('#btnExpandAll');
const btnCollapseAll = $('#btnCollapseAll');
const toolbarEl = $('#toolbar');
const previewEl = $('#preview');
const searchInput = $('#searchInput') as HTMLInputElement;
const searchBar = $('#searchBar');
const statusBar = $('#statusBar');
const shortcutsOverlay = $('#shortcutsOverlay');
const shortcutsClose = $('#shortcutsClose');
const editorEl = $('#editor') as HTMLTextAreaElement;

import { createModalDialog } from './components/dialog';
import { collapseAll, expandAllFirstLevel } from './components/tree/helpers';

const shortcutsDialog = createModalDialog({ overlayEl: shortcutsOverlay, closeBtn: shortcutsClose });

// Scroll position memory
function saveScrollPosition(): void {
  if (!state.currentPath) return;
  const target = state.isEditing ? editorEl : previewEl;
  state.scrollPositions.set(state.currentPath, target.scrollTop);
  if (state.scrollPositions.size > 50) {
    const first = state.scrollPositions.keys().next().value;
    if (first) state.scrollPositions.delete(first);
  }
}

function restoreScrollPosition(filePath: string): void {
  const pos = state.scrollPositions.get(filePath);
  if (pos == null) return;
  requestAnimationFrame(() => {
    const target = state.isEditing ? editorEl : previewEl;
    target.scrollTop = pos;
  });
}

// Mobile sidebar
function openSidebar(): void { sidebar.classList.add('open'); overlay.classList.add('open'); }
function closeSidebar(): void { sidebar.classList.remove('open'); overlay.classList.remove('open'); }

// Mobile viewport
function updateViewportHeight(): void {
  if (window.visualViewport) {
    const vh = window.visualViewport.height * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  } else {
    document.documentElement.style.setProperty('--vh', '1vh');
  }
}

// Welcome screen
function showWelcomeScreen(): void {
  if (state.isEditing) {
    state.isEditing = false;
    if (state.saveController) state.saveController.abort();
  }
  stopDraftTimer();
  clearTimeout(state.livePreviewTimer!);
  resetPanelMode();
  closeContentSearch();
  hideSaveErrorBanner();
  hideTOC();
  hideImageZoomButtons();
  setTreeItemActive(null);
  state.currentPath = null;
  setDirty(false);
  toolbarEl.classList.remove('has-file');
  ($('#breadcrumb')).innerHTML = '<span class="breadcrumb-item current">&#128270; Remote Web Finder</span>';
  document.title = BASE_TITLE;
  statusBar.style.display = 'none';

  const files = countFiles(state.treeData);
  const dirs = countDirs(state.treeData);
  const recent = getRecent();
  const DASH_VISIBLE = 3;

  function buildDashList(title: string, items: string[]): string {
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
  const favsHtml = buildDashList('Favorites', getFavorites());

  previewEl.innerHTML = `<div class="dashboard">
    <div class="dash-stats">
      <div class="dash-stat"><span class="dash-stat-value">${files}</span><span class="dash-stat-label">Files</span></div>
      <div class="dash-stat"><span class="dash-stat-value">${dirs}</span><span class="dash-stat-label">Folders</span></div>
    </div>
    ${favsHtml}
    ${recentHtml}
    <div class="dash-hint">Select a file from the sidebar to view</div>
    <div class="dash-version" id="dashVersion">${state.appVersion}</div>
  </div>`;

  previewEl.querySelectorAll('.dash-recent-item').forEach(el => {
    el.addEventListener('click', () => {
      const p = (el as HTMLElement).dataset.path!;
      const row = getTreeRow(p);
      openFile(p, row);
    });
  });
  previewEl.querySelectorAll('.dash-more').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.dash-section')!;
      section.querySelectorAll('.dash-recent-item[style]').forEach(el => (el as HTMLElement).style.display = '');
      btn.remove();
    });
  });
}

// Main openFile function
async function openFile(filePath: string, rowEl: HTMLElement | null, opts: { pushHistory?: boolean } = {}): Promise<void> {
  const { pushHistory = true } = opts;
  if (state.isDirty) {
    if (!(await airConfirm('Discard unsaved changes?'))) return;
  }

  if (state.saveController) { state.saveController.abort(); state.saveController = null; }
  saveScrollPosition();
  stopDraftTimer();
  clearTimeout(state.livePreviewTimer!);

  setTreeItemActive(rowEl);
  expandPathTo(filePath);

  state.currentPath = filePath;
  setDirty(false);
  renderBreadcrumb(filePath);
  toolbarEl.classList.add('has-file');
  hideImageZoomButtons();

  if (pushHistory) updateFileUrl(filePath, true);

  closeSidebar();
  closeContentSearch();
  closeContextMenu();
  hideSaveErrorBanner();
  addRecent(filePath);

  if (state.openFileController) state.openFileController.abort();
  state.openFileController = new AbortController();
  const { signal } = state.openFileController;

  if (isImageFile(filePath)) {
    state.originalContent = '';
    showImagePreview(filePath);
    return;
  }

  state.isLargeFile = false;
  try {
    const headRes = await fetch(API.file(filePath), { method: 'HEAD', signal });
    const size = parseInt(headRes.headers.get('Content-Length') || '0', 10) || 0;
    if (size > 1024 * 1024) {
      state.isLargeFile = true;
      const sizeMB = (size / (1024 * 1024)).toFixed(1);
      if (!(await airConfirm(`This file is ${sizeMB} MB (read-only). It may take a while to load.`, { okText: 'Open anyway' }))) return;
    }
  } catch (e: any) {
    if (e.name === 'AbortError') return;
    console.warn('HEAD request failed:', e);
  }

  try {
    const res = await fetch(API.file(filePath), { signal });
    if (!res.ok) {
      if (res.status === 404) {
        removeRecent(filePath);
        const u = new URL(window.location.href);
        if (u.searchParams.get('file') === filePath) {
          u.searchParams.delete('file');
          history.replaceState(null, '', u.toString());
        }
        throw new Error('File not found (may have been deleted)');
      }
      const errText = await res.text();
      if (signal.aborted) return;
      throw new Error(errText);
    }
    const text = await res.text();
    state.originalContent = text;

    const draft = getDraft(filePath);
    if (draft !== null && draft !== text) {
      if (await airConfirm('Unsaved draft found. Restore it?', { okText: 'Restore' })) {
        state.originalContent = text;
        showPreview(text, filePath);
        enterEditMode();
        editorEl.value = draft;
        updateLineNumbers();
        setDirty(true);
        if ($('#livePreview').style.display !== 'none') updateLivePreview();
        startDraftTimer();
        restoreScrollPosition(filePath);
        return;
      } else {
        clearDraft(filePath);
      }
    }

    showPreview(text, filePath);
    if (state.isLargeFile) {
      btnEdit.style.display = 'none';
      btnSearch.style.display = 'inline-block';
    }
    restoreScrollPosition(filePath);
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    previewEl.innerHTML = `<div style="color:var(--btn-cancel);padding:20px">Error loading file: ${esc(err.message)}</div>`;
    showPreviewMode();
  }
}

// Wire up all dependencies
setRecentDeps({ showListCtxMenu, openFile });
setFavoritesDeps({ showListCtxMenu, openFile });
setTreeRenderDeps({ openFile, showContextMenu, applyFilter, renderAllCustomFilters });
setEditorDeps({ showPreview, updateStatusBar, closeContentSearch, hideTOC });
setPreviewDeps({ openFile, updateStatusBar, getTreeRow });
setSettingsDeps({ loadTree });
setContextMenuDeps({ loadTree, refreshTreeAndSelect, expandAndOpenFile, showWelcomeScreen });
setFilterDeps({ renderAllCustomFilters });
setCustomFilterDeps({ openFile, showContextMenu });

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's' && state.isEditing) { e.preventDefault(); saveFile(); return; }
  if (e.key === 'Escape') {
    if (ctxMenu.isOpen()) { ctxMenu.close(); return; }
    if (listCtxMenu.isOpen()) { listCtxMenu.close(); return; }
    if (isSaveErrorBannerVisible()) { hideSaveErrorBanner(); return; }
    if (settingsDialog.isOpen()) { settingsDialog.close(); return; }
    if (shortcutsDialog.isOpen()) { shortcutsDialog.close(); return; }
    if (searchBar.style.display === 'flex') { closeContentSearch(); return; }
    if (state.isFocusMode) { toggleFocusMode(); return; }
    if (state.isEditing) { cancelEdit(); return; }
  }
  if (e.key === 'Enter' && isSaveErrorBannerVisible()
    && (e.target as HTMLElement).tagName !== 'TEXTAREA'
    && (e.target as HTMLElement).tagName !== 'INPUT') {
    e.preventDefault(); hideSaveErrorBanner(); saveFile(); return;
  }
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); searchInput.focus(); searchInput.select(); return; }
  if (e.ctrlKey && e.key === 'f' && !state.isEditing && state.currentPath) { e.preventDefault(); openContentSearch(); return; }
  if (state.isEditing && state.currentPath?.endsWith('.md')) {
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); mdActions.bold(); return; }
    if (e.ctrlKey && e.key === 'i') { e.preventDefault(); mdActions.italic(); return; }
  }
  if (e.ctrlKey && (e.key === '=' || e.key === '+')) { e.preventDefault(); adjustZoom(0.1); return; }
  if (e.ctrlKey && e.key === '-') { e.preventDefault(); adjustZoom(-0.1); return; }
  if (e.ctrlKey && e.key === '0') { e.preventDefault(); adjustZoom(0); return; }
  if (e.ctrlKey && e.key === ',') { e.preventDefault(); settingsDialog.open(); return; }
  if (e.key === 'F11') { e.preventDefault(); toggleFocusMode(); return; }
  if (e.key === '?' && !state.isEditing && !e.ctrlKey && !e.metaKey) {
    if (shortcutsDialog.isOpen()) { shortcutsDialog.close(); return; }
    shortcutsDialog.open();
    return;
  }
});

// beforeunload
window.addEventListener('beforeunload', (e) => {
  if (state.isDirty) { saveDraft(); e.preventDefault(); e.returnValue = ''; }
});

// Init everything
async function boot(): Promise<void> {
  await loadMaterialIcons();
  initMarked();
  initTheme();
  initSections();
  initSidebarResize();
  initFilter();
  initTreeNavigation();
  initLineNumbers();
  initMdToolbar();
  initEditor();
  initSearch();
  initZoom();
  initSettings();
  initFocusMode();
  initContextMenu();
  initPreviewLinks();
  initCustomFilters();

  // Event bindings
  btnEdit.addEventListener('click', enterEditMode);
  btnSearch.addEventListener('click', openContentSearch);
  btnSave.addEventListener('click', saveFile);
  btnCancel.addEventListener('click', cancelEdit);
  hamburger.addEventListener('click', () => { sidebar.classList.contains('open') ? closeSidebar() : openSidebar(); });
  overlay.addEventListener('click', closeSidebar);
  recentClearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearRecent(); });
  favoritesClearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearFavorites(); });
  btnExpandAll.addEventListener('click', (e) => { e.stopPropagation(); expandAllFirstLevel(); });
  btnCollapseAll.addEventListener('click', (e) => { e.stopPropagation(); collapseAll(); });

  // Mobile viewport
  updateViewportHeight();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewportHeight);
    window.visualViewport.addEventListener('scroll', updateViewportHeight);
  }
  window.addEventListener('resize', updateViewportHeight);

  // Load tree and boot
  await loadTree();
  renderFavorites();

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
    const filePath = (e.state as any)?.file || new URLSearchParams(window.location.search).get('file');
    if (filePath) {
      const row = getTreeRow(filePath);
      if (state.isDirty) {
        if (!(await airConfirm('Discard unsaved changes?'))) {
          updateFileUrl(state.currentPath, true);
          return;
        }
      }
      setDirty(false);
      openFile(filePath, row, { pushHistory: false });
    } else {
      if (state.isDirty) {
        if (!(await airConfirm('Discard unsaved changes?'))) {
          updateFileUrl(state.currentPath, true);
          return;
        }
      }
      showWelcomeScreen();
    }
  });

  if (!state.currentPath && window.innerWidth <= 768) openSidebar();

  // Fetch version
  fetch('/api/version').then(r => r.json()).then(({ version }) => {
    state.appVersion = `v${version}`;
    const repoUrl = 'https://github.com/snow512/remote-web-finder';
    function makeVersionLink(text: string): HTMLAnchorElement {
      const a = document.createElement('a');
      a.href = repoUrl; a.target = '_blank'; a.rel = 'noopener'; a.textContent = text;
      return a;
    }
    const sidebarV = document.getElementById('sidebarVersion');
    const settingsV = document.getElementById('settingsVersion');
    const dashV = document.getElementById('dashVersion');
    if (sidebarV) { sidebarV.innerHTML = ''; sidebarV.appendChild(makeVersionLink(state.appVersion)); }
    if (settingsV) { settingsV.innerHTML = ''; settingsV.appendChild(makeVersionLink(`Remote Web Finder ${state.appVersion}`)); }
    if (dashV) { dashV.innerHTML = ''; dashV.appendChild(makeVersionLink(state.appVersion)); }
  }).catch(err => { console.warn('Failed to fetch version:', err); });
}

// Global error handlers
window.onerror = (_message, _source, _lineno, _colno, error) => {
  if (error?.name === 'AbortError') return;
  log.error('Uncaught error', error);
  showToast('An unexpected error occurred', 'error');
};

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.name === 'AbortError') return;
  log.error('Unhandled promise rejection', e.reason);
  showToast('An unexpected error occurred', 'error');
});

boot();
