import { $ , esc } from '../../utils/dom';
import { state } from '../../state';
import { RECENT_KEY, MAX_RECENT, LONG_PRESS_MS } from '../../constants';
import { getFileName } from '@shared/utils';
import { getFileIcon } from '../icons';

const recentListEl = $('#recentList');
const recentClearBtn = $('#recentClear');
const treeEl = $('#tree');

let showListCtxMenuFn: ((x: number, y: number, path: string, type: 'recent' | 'favorite') => void) | null = null;
let openFileFn: ((filePath: string, rowEl: HTMLElement | null) => void) | null = null;

export function setRecentDeps(deps: {
  showListCtxMenu: typeof showListCtxMenuFn;
  openFile: typeof openFileFn;
}) {
  showListCtxMenuFn = deps.showListCtxMenu;
  openFileFn = deps.openFile;
}

export function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

export function addRecent(filePath: string): void {
  let list = getRecent().filter(p => p !== filePath);
  list.unshift(filePath);
  if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  renderRecent();
}

export function clearRecent(): void {
  localStorage.removeItem(RECENT_KEY);
  renderRecent();
}

export function removeRecent(filePath: string): void {
  const list = getRecent().filter(p => p !== filePath);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  renderRecent();
}

function initListItemLongPress(el: HTMLElement, onLongPress: (x: number, y: number) => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let fired = false;
  let startX: number, startY: number;
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
  const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
  el.addEventListener('touchend', cancel, { passive: true });
  el.addEventListener('touchcancel', cancel, { passive: true });
  el.addEventListener('click', (e) => {
    if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; }
  }, true);
}

export function getTreeRow(filePath: string): HTMLElement | null {
  return treeEl.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
}

export function renderRecent(): void {
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
    item.querySelector('.list-item-del')!.addEventListener('click', (e) => {
      e.stopPropagation();
      removeRecent(p);
    });
    item.addEventListener('click', () => {
      const row = getTreeRow(p);
      if (openFileFn) openFileFn(p, row);
    });
    initListItemLongPress(item, (x, y) => {
      if (showListCtxMenuFn) showListCtxMenuFn(x, y, p, 'recent');
    });
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (showListCtxMenuFn) showListCtxMenuFn(e.clientX, e.clientY, p, 'recent');
    });
    recentListEl.appendChild(item);
  });
}
