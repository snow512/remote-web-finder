import { $ , esc } from '../../utils/dom';
import { state } from '../../state';
import { OPEN_DIRS_KEY, LONG_PRESS_MS, SHOW_IGNORED_KEY } from '../../constants';
import { countFiles, getFileName } from '@shared/utils';
import type { TreeItem } from '@shared/types';
import { getFileIcon } from '../icons';
import { airError } from '../dialog';
import { showToast } from '../toast';
import { API, throwIfNotOk } from '../../api';
import { addRecent, removeRecent, renderRecent } from '../sidebar/recent';
import { renderBreadcrumb } from '../breadcrumb';
import {
  toggleDir, expandDir, expandPathTo, getOpenDirPaths, restoreOpenDirs,
  setTreeItemActive, getTreeRow, saveOpenDirs, updateFileUrl
} from './helpers';

const treeEl = $('#tree');

let openFileFn: ((filePath: string, rowEl: HTMLElement | null) => Promise<void>) | null = null;
let showContextMenuFn: ((e: any, path: string, type?: string) => void) | null = null;
let applyFilterFn: (() => void) | null = null;
let renderAllCustomFiltersFn: (() => void) | null = null;

export function setTreeRenderDeps(deps: {
  openFile: typeof openFileFn;
  showContextMenu: typeof showContextMenuFn;
  applyFilter: typeof applyFilterFn;
  renderAllCustomFilters: typeof renderAllCustomFiltersFn;
}) {
  openFileFn = deps.openFile;
  showContextMenuFn = deps.showContextMenu;
  applyFilterFn = deps.applyFilter;
  renderAllCustomFiltersFn = deps.renderAllCustomFilters;
}

function initLongPress(rowEl: HTMLElement, targetPath: string, type: string): void {
  let startX: number, startY: number;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let fired = false;

  rowEl.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startX = touch.clientX; startY = touch.clientY;
    fired = false;
    rowEl.classList.add('long-press-holding');
    timer = setTimeout(() => {
      fired = true; timer = null;
      rowEl.classList.remove('long-press-holding');
      if (showContextMenuFn) showContextMenuFn({ preventDefault() {}, clientX: touch.clientX, clientY: touch.clientY }, targetPath, type);
    }, LONG_PRESS_MS);
  }, { passive: true });

  rowEl.addEventListener('touchmove', (e) => {
    if (!timer) return;
    const touch = e.touches[0];
    if (Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10) {
      clearTimeout(timer); timer = null; rowEl.classList.remove('long-press-holding');
    }
  }, { passive: true });

  const cancelPress = () => { if (timer) clearTimeout(timer); timer = null; rowEl.classList.remove('long-press-holding'); };
  rowEl.addEventListener('touchend', cancelPress, { passive: true });
  rowEl.addEventListener('touchcancel', cancelPress, { passive: true });
  rowEl.addEventListener('click', (e) => { if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; } }, true);
}

function renderTree(items: TreeItem[], parentEl: HTMLElement, depth: number): void {
  items.forEach(item => {
    if (item.type === 'dir') {
      const dirEl = document.createElement('div');
      dirEl.className = 'tree-dir';
      dirEl.dataset.dirpath = item.path;

      const row = document.createElement('div');
      row.className = 'tree-item' + (item.ignored ? ' ignored' : '');
      row.style.setProperty('--indent', `${12 + depth * 16}px`);
      const fileCount = countFiles(item.children || []);
      row.innerHTML = `<span class="icon">&#9654;</span><span class="name" title="${esc(item.path)}">${esc(item.name)}</span><span class="file-count">${fileCount}</span>`;

      const childrenEl = document.createElement('div');
      childrenEl.className = 'tree-children';

      row.addEventListener('click', () => toggleDir(row, childrenEl));
      row.addEventListener('contextmenu', (e) => { if (showContextMenuFn) showContextMenuFn(e, item.path, 'dir'); });
      initLongPress(row, item.path, 'dir');

      // Drop target
      row.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer!.dropEffect = 'move'; row.classList.add('drag-over'); });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const sourcePath = e.dataTransfer!.getData('text/plain');
        if (!sourcePath) return;
        const fileName = getFileName(sourcePath);
        const newPath = item.path + '/' + fileName;
        if (sourcePath === newPath) return;
        try {
          const res = await fetch(API.rename(sourcePath, newPath), { method: 'PATCH' });
          await throwIfNotOk(res);
          showToast(`Moved: ${fileName} → ${item.name}/`, 'success');
          removeRecent(sourcePath);
          if (state.currentPath === sourcePath) {
            state.currentPath = newPath;
            renderBreadcrumb(newPath);
            addRecent(newPath);
            updateFileUrl(newPath);
          }
          await loadTree();
          if (state.currentPath) {
            expandPathTo(state.currentPath);
            setTreeItemActive(getTreeRow(state.currentPath));
          }
        } catch (err: any) {
          airError('Move failed', err.message);
        }
      });

      dirEl.appendChild(row);
      dirEl.appendChild(childrenEl);
      parentEl.appendChild(dirEl);
      renderTree(item.children || [], childrenEl, depth + 1);
    } else {
      const row = document.createElement('div');
      row.className = 'tree-item' + (item.ignored ? ' ignored' : '');
      row.style.setProperty('--indent', `${12 + depth * 16}px`);
      const icon = getFileIcon(item.name);
      row.innerHTML = `<span class="icon">${icon}</span><span class="name" title="${esc(item.path)}">${esc(item.name)}</span>`;
      row.dataset.path = item.path;
      row.addEventListener('click', () => { if (openFileFn) openFileFn(item.path, row); });
      row.addEventListener('contextmenu', (e) => { if (showContextMenuFn) showContextMenuFn(e, item.path); });
      initLongPress(row, item.path, 'file');

      if (!('ontouchstart' in window)) {
        row.draggable = true;
        row.addEventListener('dragstart', (e) => { e.dataTransfer!.setData('text/plain', item.path); e.dataTransfer!.effectAllowed = 'move'; row.classList.add('dragging'); });
        row.addEventListener('dragend', () => row.classList.remove('dragging'));
      }

      parentEl.appendChild(row);
    }
  });
}

export async function loadTree(): Promise<void> {
  const openPaths = getOpenDirPaths();
  try {
    const showIgnored = localStorage.getItem(SHOW_IGNORED_KEY) === 'true';
    const res = await fetch('/api/tree' + (showIgnored ? '?showIgnored=true' : ''));
    if (!res.ok) throw new Error('Server error');
    state.treeData = await res.json();
  } catch (err: any) {
    airError('Failed to load file tree', err.message);
    return;
  }
  treeEl.innerHTML = '';
  state.focusedTreeItem = null;
  renderTree(state.treeData, treeEl, 0);

  const dirsToRestore = openPaths.length ? openPaths
    : (() => { try { return JSON.parse(localStorage.getItem(OPEN_DIRS_KEY) || '[]'); } catch { return []; } })();
  if (dirsToRestore.length) restoreOpenDirs(dirsToRestore);
  if (state.currentPath) setTreeItemActive(getTreeRow(state.currentPath));
  renderRecent();
  if (applyFilterFn) applyFilterFn();
  if (renderAllCustomFiltersFn) renderAllCustomFiltersFn();
}

export async function refreshTreeAndSelect(filePath: string | null): Promise<void> {
  await loadTree();
  if (filePath) {
    expandPathTo(filePath);
    setTreeItemActive(getTreeRow(filePath));
  }
}

export async function expandAndOpenFile(filePath: string, enterEdit: boolean = false): Promise<void> {
  expandPathTo(filePath);
  const row = getTreeRow(filePath);
  if (row && openFileFn) {
    await openFileFn(filePath, row);
  }
}
