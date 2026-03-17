import { $ } from '../../utils/dom';
import { state } from '../../state';
import { expandDir, collapseDir } from './helpers';

const treeEl = $('#tree');

function getVisibleTreeItems(): HTMLElement[] {
  return Array.from(treeEl.querySelectorAll<HTMLElement>('.tree-item:not(.hidden)'))
    .filter(el => {
      let p = el.parentElement;
      while (p && p !== treeEl) {
        if (p.classList.contains('tree-children') && !p.classList.contains('open')) return false;
        p = p.parentElement;
      }
      return true;
    });
}

function setFocusedItem(item: HTMLElement | null): void {
  if (state.focusedTreeItem) state.focusedTreeItem.classList.remove('focused');
  state.focusedTreeItem = item;
  if (item) {
    item.classList.add('focused');
    item.scrollIntoView({ block: 'nearest' });
  }
}

export function initTreeNavigation(): void {
  treeEl.addEventListener('keydown', (e) => {
    const items = getVisibleTreeItems();
    if (items.length === 0) return;
    const idx = state.focusedTreeItem ? items.indexOf(state.focusedTreeItem) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedItem(items[Math.min(idx + 1, items.length - 1)]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedItem(items[Math.max(idx - 1, 0)]);
    } else if (e.key === 'ArrowRight' && state.focusedTreeItem) {
      e.preventDefault();
      const dirEl = state.focusedTreeItem.closest('.tree-dir') as HTMLElement;
      if (dirEl && state.focusedTreeItem === dirEl.querySelector(':scope > .tree-item')) {
        const ch = dirEl.querySelector(':scope > .tree-children') as HTMLElement;
        if (ch) expandDir(ch);
      }
    } else if (e.key === 'ArrowLeft' && state.focusedTreeItem) {
      e.preventDefault();
      const dirEl = state.focusedTreeItem.closest('.tree-dir') as HTMLElement;
      if (dirEl && state.focusedTreeItem === dirEl.querySelector(':scope > .tree-item')) {
        const ch = dirEl.querySelector(':scope > .tree-children') as HTMLElement;
        if (ch) collapseDir(ch);
      } else {
        const parentDir = state.focusedTreeItem.closest('.tree-children')?.closest('.tree-dir') as HTMLElement | null;
        if (parentDir) {
          const parentRow = parentDir.querySelector(':scope > .tree-item') as HTMLElement;
          if (parentRow) setFocusedItem(parentRow);
        }
      }
    } else if (e.key === 'Enter' && state.focusedTreeItem) {
      e.preventDefault();
      state.focusedTreeItem.click();
    }
  });

  treeEl.addEventListener('focus', () => {
    if (!state.focusedTreeItem) {
      const items = getVisibleTreeItems();
      if (items.length > 0) setFocusedItem(items[0]);
    }
  });
}
