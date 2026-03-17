import { $ } from '../../utils/dom';
import { state } from '../../state';
import { OPEN_DIRS_KEY } from '../../constants';

const treeEl = $('#tree');

export function getTreeRow(filePath: string): HTMLElement | null {
  return treeEl.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
}

export function setTreeItemActive(rowEl: HTMLElement | null): void {
  treeEl.querySelectorAll('.tree-item.active').forEach(el => {
    removeMarquee(el as HTMLElement);
    el.classList.remove('active');
  });
  if (rowEl) {
    rowEl.classList.add('active');
    applyMarquee(rowEl);
  }
}

export function applyMarquee(rowEl: HTMLElement): void {
  const nameEl = rowEl.querySelector('.name') as HTMLElement;
  if (!nameEl) return;
  requestAnimationFrame(() => {
    const overflow = nameEl.scrollWidth - nameEl.clientWidth;
    if (overflow > 0) {
      nameEl.style.setProperty('--overflow-px', String(overflow));
      nameEl.classList.add('marquee');
    }
  });
}

export function removeMarquee(rowEl: HTMLElement): void {
  const nameEl = rowEl.querySelector('.name') as HTMLElement;
  if (!nameEl) return;
  nameEl.classList.remove('marquee');
  nameEl.style.removeProperty('--overflow-px');
}

export function expandDir(childrenEl: HTMLElement): void {
  if (!childrenEl.classList.contains('open')) {
    childrenEl.classList.add('open');
    const row = childrenEl.previousElementSibling as HTMLElement;
    if (row) row.querySelector('.icon')!.innerHTML = '&#9660;';
  }
}

export function collapseDir(childrenEl: HTMLElement): void {
  if (childrenEl.classList.contains('open')) {
    childrenEl.classList.remove('open');
    const row = childrenEl.previousElementSibling as HTMLElement;
    if (row) row.querySelector('.icon')!.innerHTML = '&#9654;';
  }
}

export function toggleDir(row: HTMLElement, childrenEl: HTMLElement): void {
  const isOpen = childrenEl.classList.toggle('open');
  row.querySelector('.icon')!.innerHTML = isOpen ? '&#9660;' : '&#9654;';
  saveOpenDirs();
}

export function getOpenDirPaths(): string[] {
  const paths: string[] = [];
  treeEl.querySelectorAll('.tree-children.open').forEach(ch => {
    const dirEl = (ch as HTMLElement).closest('.tree-dir') as HTMLElement;
    if (dirEl?.dataset.dirpath) paths.push(dirEl.dataset.dirpath);
  });
  return paths;
}

export function restoreOpenDirs(paths: string[]): void {
  const set = new Set(paths);
  treeEl.querySelectorAll('.tree-dir').forEach(dirEl => {
    if (set.has((dirEl as HTMLElement).dataset.dirpath!)) {
      const ch = dirEl.querySelector(':scope > .tree-children') as HTMLElement;
      if (ch) expandDir(ch);
    }
  });
}

export function saveOpenDirs(): void {
  localStorage.setItem(OPEN_DIRS_KEY, JSON.stringify(getOpenDirPaths()));
}

export function expandPathTo(filePath: string): void {
  const parts = filePath.split('/');
  let accumulated = '';
  for (let i = 0; i < parts.length - 1; i++) {
    accumulated = accumulated ? accumulated + '/' + parts[i] : parts[i];
    const dirEl = treeEl.querySelector(`[data-dirpath="${CSS.escape(accumulated)}"]`);
    if (dirEl) {
      const ch = dirEl.querySelector(':scope > .tree-children') as HTMLElement;
      if (ch) expandDir(ch);
    }
  }
  saveOpenDirs();
}

export function collapseAll(): void {
  treeEl.querySelectorAll('.tree-children.open').forEach(ch => collapseDir(ch as HTMLElement));
  saveOpenDirs();
}

export function expandAllFirstLevel(): void {
  collapseAll();
  treeEl.querySelectorAll(':scope > .tree-dir > .tree-children').forEach(ch => {
    expandDir(ch as HTMLElement);
  });
  saveOpenDirs();
}

export function updateFileUrl(filePath: string | null, push: boolean = false): void {
  const url = new URL(window.location.href);
  if (filePath) url.searchParams.set('file', filePath);
  else url.searchParams.delete('file');
  history[push ? 'pushState' : 'replaceState'](filePath ? { file: filePath } : null, '', url.toString());
}

export function resetPanelMode(): void {
  const contentBody = $('#contentBody');
  const editorPanel = $('#editorPanel');
  const livePreviewEl = $('#livePreview');
  const previewEl = $('#preview');
  const mdToolbar = $('#mdToolbar');
  contentBody.classList.remove('split-mode');
  editorPanel.style.display = 'none';
  livePreviewEl.style.display = 'none';
  previewEl.style.display = 'block';
  mdToolbar.style.display = 'none';
}

export function setEditButtons(editing: boolean): void {
  const btnEdit = $('#btnEdit');
  const btnSave = $('#btnSave');
  const btnCancel = $('#btnCancel');
  const btnSearch = $('#btnSearch');
  btnEdit.style.display = editing ? 'none' : 'inline-block';
  btnSave.style.display = editing ? 'inline-block' : 'none';
  btnCancel.style.display = editing ? 'inline-block' : 'none';
  btnSearch.style.display = 'none';
}
