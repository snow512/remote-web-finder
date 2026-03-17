import { $ , esc } from '../utils/dom';
import { state } from '../state';
import { BASE_TITLE } from '../constants';
import { getFileName } from '@shared/utils';

const breadcrumbEl = $('#breadcrumb');
const treeEl = $('#tree');

export function renderBreadcrumb(filePath: string): void {
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
        // expand to dir
        const dirEl = treeEl.querySelector(`[data-dirpath="${CSS.escape(dirPath)}"]`);
        if (dirEl) {
          const ch = dirEl.querySelector(':scope > .tree-children') as HTMLElement;
          if (ch && !ch.classList.contains('open')) {
            ch.classList.add('open');
            const row = ch.previousElementSibling as HTMLElement;
            if (row) row.querySelector('.icon')!.innerHTML = '&#9660;';
          }
          dirEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    breadcrumbEl.appendChild(span);
  });

  updateDirtyIndicator();
}

export function updateDirtyIndicator(): void {
  const existing = breadcrumbEl.querySelector('.breadcrumb-unsaved');
  if (existing) existing.remove();

  if (state.isDirty) {
    const dot = document.createElement('span');
    dot.className = 'breadcrumb-unsaved';
    dot.title = 'Unsaved changes';
    breadcrumbEl.appendChild(dot);
  }

  const fileName = getFileName(state.currentPath || '');
  document.title = state.isDirty
    ? `* ${fileName} — ${BASE_TITLE}`
    : (fileName ? `${fileName} — ${BASE_TITLE}` : BASE_TITLE);
}

export function setDirty(dirty: boolean): void {
  state.isDirty = dirty;
  updateDirtyIndicator();
}
