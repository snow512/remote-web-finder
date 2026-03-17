import { $ } from '../utils/dom';
import { state } from '../state';

const editorEl = $('#editor') as HTMLTextAreaElement;
const statusBar = $('#statusBar');
const statusInfo = $('#statusInfo');
const statusCursor = $('#statusCursor');

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function updateStatusBar(): void {
  if (!state.currentPath) {
    statusBar.style.display = 'none';
    return;
  }

  statusBar.style.display = 'flex';
  const text = state.isEditing ? editorEl.value : state.originalContent;
  const lines = text.split('\n').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const size = formatFileSize(new Blob([text]).size);
  statusInfo.textContent = `${lines} lines \u00b7 ${words.toLocaleString()} words \u00b7 ${size}`;

  if (state.isEditing) {
    const pos = editorEl.selectionStart;
    const before = editorEl.value.substring(0, pos);
    const ln = before.split('\n').length;
    const col = pos - before.lastIndexOf('\n');
    statusCursor.textContent = `Ln ${ln}, Col ${col}`;
  } else {
    statusCursor.textContent = '';
  }
}
