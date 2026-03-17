import { $ } from '../../utils/dom';
import { state } from '../../state';

const editorEl = $('#editor') as HTMLTextAreaElement;
const lineNumbersEl = $('#lineNumbers');

export function updateLineNumbers(): void {
  const lines = editorEl.value.split('\n').length;
  if (lines === state._prevLineCount) return;
  state._prevLineCount = lines;
  let html = '';
  for (let i = 1; i <= lines; i++) {
    html += `<span class="ln">${i}</span>`;
  }
  lineNumbersEl.innerHTML = html;
}

export function syncLineNumbersScroll(): void {
  lineNumbersEl.scrollTop = editorEl.scrollTop;
}

export function initLineNumbers(): void {
  editorEl.addEventListener('scroll', syncLineNumbersScroll);
}
