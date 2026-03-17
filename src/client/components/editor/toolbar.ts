import { $ } from '../../utils/dom';
import { airPrompt } from '../dialog';
import { showToast } from '../toast';

const editorEl = $('#editor') as HTMLTextAreaElement;
const mdToolbar = $('#mdToolbar');

function editorInsertAt(start: number, end: number, text: string): void {
  editorEl.focus();
  editorEl.selectionStart = start;
  editorEl.selectionEnd = end;
  if (!document.execCommand('insertText', false, text)) {
    const val = editorEl.value;
    editorEl.value = val.substring(0, start) + text + val.substring(end);
    editorEl.selectionStart = editorEl.selectionEnd = start + text.length;
    editorEl.dispatchEvent(new Event('input'));
  }
}

function mdWrap(before: string, after: string): void {
  const start = editorEl.selectionStart;
  const end = editorEl.selectionEnd;
  const selected = editorEl.value.substring(start, end);
  const replacement = before + (selected || 'text') + (after || '');
  editorInsertAt(start, end, replacement);
  editorEl.selectionStart = start + before.length;
  editorEl.selectionEnd = start + before.length + (selected || 'text').length;
}

function mdLinePrefix(prefix: string): void {
  const start = editorEl.selectionStart;
  const val = editorEl.value;
  const lineStart = val.lastIndexOf('\n', start - 1) + 1;
  editorInsertAt(lineStart, lineStart, prefix);
  editorEl.selectionStart = editorEl.selectionEnd = start + prefix.length;
}

export const mdActions: Record<string, () => void> = {
  bold: () => mdWrap('**', '**'),
  italic: () => mdWrap('*', '*'),
  heading: () => mdLinePrefix('## '),
  link: () => mdWrap('[', '](url)'),
  ul: () => mdLinePrefix('- '),
  ol: () => mdLinePrefix('1. '),
  code: () => mdWrap('`', '`'),
  quote: () => mdLinePrefix('> '),
  table: async () => {
    const input = await airPrompt('Table size (rows x cols):', '3x3');
    if (!input) return;
    const match = input.match(/(\d+)\s*[x×X]\s*(\d+)/);
    if (!match) { showToast('Format: 3x3', 'error'); return; }
    const rows = Math.min(parseInt(match[1]), 20);
    const cols = Math.min(parseInt(match[2]), 10);
    let tbl = '| ' + Array.from({ length: cols }, (_, i) => `Col ${i + 1}`).join(' | ') + ' |\n';
    tbl += '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |\n';
    for (let r = 0; r < rows; r++) {
      tbl += '| ' + Array.from({ length: cols }, () => '   ').join(' | ') + ' |\n';
    }
    const pos = editorEl.selectionStart;
    const val = editorEl.value;
    const before = val.substring(0, pos);
    const needNl = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const insertText = needNl + '\n' + tbl;
    editorInsertAt(pos, pos, insertText);
    editorEl.selectionStart = editorEl.selectionEnd = pos + insertText.length;
  },
  hr: () => {
    const pos = editorEl.selectionStart;
    const val = editorEl.value;
    const before = val.substring(0, pos);
    const needNl = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const insertText = needNl + '\n---\n\n';
    editorInsertAt(pos, pos, insertText);
    editorEl.selectionStart = editorEl.selectionEnd = pos + insertText.length;
  },
};

export { editorInsertAt };

export function initMdToolbar(): void {
  mdToolbar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.md-btn') as HTMLElement;
    if (!btn) return;
    const action = btn.dataset.action;
    if (action && mdActions[action]) mdActions[action]();
  });
}
