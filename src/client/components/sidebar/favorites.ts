import { $ , esc } from '../../utils/dom';
import { FAVORITES_KEY, LONG_PRESS_MS } from '../../constants';
import { getFileName } from '@shared/utils';
import { getFileIcon } from '../icons';
import { getTreeRow } from './recent';

const favoritesList = $('#favoritesList');
const favoritesClearBtn = $('#favoritesClear');

let showListCtxMenuFn: ((x: number, y: number, path: string, type: 'recent' | 'favorite') => void) | null = null;
let openFileFn: ((filePath: string, rowEl: HTMLElement | null) => void) | null = null;

export function setFavoritesDeps(deps: {
  showListCtxMenu: typeof showListCtxMenuFn;
  openFile: typeof openFileFn;
}) {
  showListCtxMenuFn = deps.showListCtxMenu;
  openFileFn = deps.openFile;
}

export function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
  catch { return []; }
}

export function isFavorite(filePath: string): boolean {
  return getFavorites().includes(filePath);
}

export function toggleFavorite(filePath: string): void {
  let list = getFavorites();
  if (list.includes(filePath)) {
    list = list.filter(p => p !== filePath);
  } else {
    list.push(filePath);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  renderFavorites();
}

export function removeFavorite(filePath: string): void {
  const list = getFavorites().filter(p => p !== filePath);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  renderFavorites();
}

export function clearFavorites(): void {
  localStorage.removeItem(FAVORITES_KEY);
  renderFavorites();
}

function initListItemLongPress(el: HTMLElement, onLongPress: (x: number, y: number) => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let fired = false;
  let startX: number, startY: number;
  el.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    fired = false;
    timer = setTimeout(() => { fired = true; timer = null; onLongPress(t.clientX, t.clientY); }, LONG_PRESS_MS);
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (!timer) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) { clearTimeout(timer); timer = null; }
  }, { passive: true });
  const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
  el.addEventListener('touchend', cancel, { passive: true });
  el.addEventListener('touchcancel', cancel, { passive: true });
  el.addEventListener('click', (e) => { if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; } }, true);
}

export function renderFavorites(): void {
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
    item.querySelector('.list-item-del')!.addEventListener('click', (e) => { e.stopPropagation(); removeFavorite(p); });
    item.addEventListener('click', () => {
      const row = getTreeRow(p);
      if (openFileFn) openFileFn(p, row);
    });
    initListItemLongPress(item, (x, y) => { if (showListCtxMenuFn) showListCtxMenuFn(x, y, p, 'favorite'); });
    item.addEventListener('contextmenu', (e) => { e.preventDefault(); if (showListCtxMenuFn) showListCtxMenuFn(e.clientX, e.clientY, p, 'favorite'); });
    favoritesList.appendChild(item);
  });
}
