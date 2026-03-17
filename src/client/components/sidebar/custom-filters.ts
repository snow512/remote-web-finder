import { $, esc } from '../../utils/dom';
import { state } from '../../state';
import { CUSTOM_FILTERS_KEY } from '../../constants';
import { getFileName, getDirPath, collectFiles } from '@shared/utils';
import type { TreeItem } from '@shared/types';
import { getFileIcon } from '../icons';
import { airPrompt } from '../dialog';
import { expandPathTo, getTreeRow } from '../tree/helpers';

const customFiltersBody = $('#customFiltersBody');
const customFilterAdd = $('#customFilterAdd');
const searchInput = $('#searchInput') as HTMLInputElement;

let openFileFn: ((filePath: string, rowEl: HTMLElement | null) => Promise<void>) | null = null;
let showContextMenuFn: ((e: any, path: string, type?: string) => void) | null = null;

export function setCustomFilterDeps(deps: {
  openFile: typeof openFileFn;
  showContextMenu: typeof showContextMenuFn;
}) {
  openFileFn = deps.openFile;
  showContextMenuFn = deps.showContextMenu;
}

interface CustomFilter {
  folder: string;
  pattern: string;
  viewMode?: 'tree' | 'list';
}

function loadCustomFilters(): CustomFilter[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_FILTERS_KEY) || '[]'); } catch { return []; }
}

function saveCustomFilters(filters: CustomFilter[]): void {
  localStorage.setItem(CUSTOM_FILTERS_KEY, JSON.stringify(filters));
}

function findSubtree(items: TreeItem[], folderPath: string): TreeItem[] | null {
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

function filterByQuery(items: TreeItem[], query: string): TreeItem[] {
  if (!query) return items;
  const q = query.toLowerCase();
  const result: TreeItem[] = [];
  for (const item of items) {
    if (item.type === 'file') {
      if (item.path.toLowerCase().includes(q)) result.push(item);
    } else if (item.type === 'dir' && item.children) {
      const filtered = filterByQuery(item.children, query);
      if (filtered.length > 0) result.push({ ...item, children: filtered });
    }
  }
  return result;
}

function filterByPattern(items: TreeItem[], pattern: string): TreeItem[] {
  if (!pattern) return items;
  const result: TreeItem[] = [];
  for (const item of items) {
    if (item.type === 'file') {
      if (matchFilterPattern(item.name, pattern)) result.push(item);
    } else if (item.type === 'dir' && item.children) {
      const filtered = filterByPattern(item.children, pattern);
      if (filtered.length > 0) result.push({ ...item, children: filtered });
    }
  }
  return result;
}

function matchFilterPattern(name: string, pattern: string): boolean {
  const lowerName = name.toLowerCase();
  const parts = pattern.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith('*.')) { if (lowerName.endsWith(part.substring(1))) return true; }
    else if (part.startsWith('.')) { if (lowerName.endsWith(part)) return true; }
    else { if (lowerName.includes(part)) return true; }
  }
  return false;
}

function renderCfList(container: HTMLElement, files: TreeItem[]): void {
  for (const file of files) {
    const row = document.createElement('div');
    row.className = 'sidebar-list-item';
    const icon = getFileIcon(file.name);
    const dir = getDirPath(file.path);
    row.innerHTML = `<span class="icon">${icon}</span><span class="name">${esc(file.name)}</span>${dir ? `<span class="cf-path">${esc(dir)}</span>` : ''}`;
    row.addEventListener('click', () => {
      expandPathTo(file.path);
      const treeRow = getTreeRow(file.path);
      if (openFileFn) openFileFn(file.path, treeRow);
    });
    row.addEventListener('contextmenu', (e) => { if (showContextMenuFn) showContextMenuFn(e, file.path); });
    container.appendChild(row);
  }
}

function renderCfTree(container: HTMLElement, items: TreeItem[], depth: number): void {
  for (const item of items) {
    if (item.type === 'dir') {
      const dirRow = document.createElement('div');
      dirRow.className = 'cf-dir-row';
      dirRow.style.setProperty('--cf-indent', `${16 + depth * 16}px`);
      dirRow.innerHTML = `<span class="icon">&#9660;</span><span class="name">${esc(item.name)}</span>`;

      const children = document.createElement('div');
      children.className = 'cf-dir-children open';

      dirRow.addEventListener('click', () => {
        const isOpen = children.classList.toggle('open');
        dirRow.querySelector('.icon')!.innerHTML = isOpen ? '&#9660;' : '&#9654;';
      });

      container.appendChild(dirRow);
      container.appendChild(children);
      renderCfTree(children, item.children || [], depth + 1);
    } else {
      const row = document.createElement('div');
      row.className = 'sidebar-list-item cf-tree-indent';
      row.style.setProperty('--cf-indent', `${16 + depth * 16}px`);
      const icon = getFileIcon(item.name);
      row.innerHTML = `<span class="icon">${icon}</span><span class="name">${esc(item.name)}</span>`;
      row.addEventListener('click', () => {
        expandPathTo(item.path);
        const treeRow = getTreeRow(item.path);
        if (openFileFn) openFileFn(item.path, treeRow);
      });
      row.addEventListener('contextmenu', (e) => { if (showContextMenuFn) showContextMenuFn(e, item.path); });
      container.appendChild(row);
    }
  }
}

function renderCustomFilterPanel(filter: CustomFilter, index: number): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'custom-filter-panel';
  panel.dataset.index = String(index);

  const subtree = findSubtree(state.treeData, filter.folder);
  const q = searchInput.value.trim();
  const byPattern = subtree ? filterByPattern(subtree, filter.pattern) : [];
  const items = filterByQuery(byPattern, q);
  const allFiles = collectFiles(items);
  const count = allFiles.length;
  const label = (filter.folder || '/') + (filter.pattern ? ` (${filter.pattern})` : '');

  const header = document.createElement('div');
  header.className = 'custom-filter-panel-header';
  header.innerHTML = `
    <span class="custom-filter-panel-title" title="${esc(label)}">${esc(label)}<span class="cf-count">${count}</span></span>
    <div class="custom-filter-panel-actions">
      <button class="section-btn cf-view-toggle" title="Toggle tree/list">${filter.viewMode === 'list' ? '&#9776;' : '&#9660;'}</button>
      <button class="section-btn cf-delete" title="Delete filter">✕</button>
    </div>`;

  const body = document.createElement('div');
  body.className = 'custom-filter-panel-body';

  if (count === 0) {
    body.innerHTML = '<div class="sidebar-section-empty">No matching files</div>';
  } else if (filter.viewMode === 'list') {
    renderCfList(body, allFiles);
  } else {
    renderCfTree(body, items, 0);
  }

  header.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.section-btn')) return;
    body.classList.toggle('collapsed');
  });

  header.querySelector('.cf-view-toggle')!.addEventListener('click', (e) => {
    e.stopPropagation();
    const filters = loadCustomFilters();
    filters[index].viewMode = filters[index].viewMode === 'list' ? 'tree' : 'list';
    saveCustomFilters(filters);
    renderAllCustomFilters();
  });

  header.querySelector('.cf-delete')!.addEventListener('click', (e) => {
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

export function renderAllCustomFilters(): void {
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

export function initCustomFilters(): void {
  customFilterAdd.addEventListener('click', async (e) => {
    e.stopPropagation();
    const folder = await airPrompt('Filter folder:', '');
    if (folder === null) return;
    const pattern = await airPrompt('File pattern (e.g. *.md):', '');
    if (pattern === null) return;

    const filters = loadCustomFilters();
    filters.push({ folder: folder.replace(/\/$/, ''), pattern, viewMode: 'tree' });
    saveCustomFilters(filters);
    renderAllCustomFilters();
  });

  renderAllCustomFilters();
}
