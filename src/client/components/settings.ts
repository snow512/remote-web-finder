import { $ } from '../utils/dom';
import { WRAP_KEY, SHOW_IGNORED_KEY } from '../constants';
import { state } from '../state';
import { createModalDialog } from './dialog';
import { applyTheme, getTheme } from './theme';
import { applyFontSize } from './zoom';

const settingsOverlay = $('#settingsOverlay');
const settingsClose = $('#settingsClose');
const btnSettings = $('#btnSettings');
const editorEl = $('#editor');
const contentBody = $('#contentBody');
const btnWrap = $('#btnWrap');

let loadTreeFn: (() => Promise<void>) | null = null;

export function setSettingsDeps(deps: { loadTree: () => Promise<void> }) {
  loadTreeFn = deps.loadTree;
}

function getWrapPref(): boolean {
  const v = localStorage.getItem(WRAP_KEY);
  return v === null ? true : v === 'true';
}

function applyWrap(on: boolean): void {
  if (on) {
    editorEl.classList.add('word-wrap');
    contentBody.classList.add('word-wrap');
    btnWrap.classList.add('active');
  } else {
    editorEl.classList.remove('word-wrap');
    contentBody.classList.remove('word-wrap');
    btnWrap.classList.remove('active');
  }
  localStorage.setItem(WRAP_KEY, String(on));
}

function setSegActive(container: HTMLElement | null, value: string): void {
  if (!container) return;
  container.querySelectorAll('.seg-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.value === value);
  });
}

export const settingsDialog = createModalDialog({
  overlayEl: settingsOverlay,
  closeBtn: settingsClose,
  onOpen() {
    const fontDisplay = $('#settingsFontSizeValue');
    if (fontDisplay) fontDisplay.textContent = state.baseFontSize + 'px';
    setSegActive($('#settingsThemeToggle'), getTheme());
    setSegActive($('#settingsWrapToggle'), getWrapPref() ? 'on' : 'off');
    setSegActive($('#settingsIgnoreToggle'), localStorage.getItem(SHOW_IGNORED_KEY) === 'true' ? 'on' : 'off');
  }
});

export function initSettings(): void {
  applyWrap(getWrapPref());

  btnWrap.addEventListener('click', () => {
    const next = !editorEl.classList.contains('word-wrap');
    applyWrap(next);
  });

  if (btnSettings) btnSettings.addEventListener('click', () => settingsDialog.open());

  $('#settingsFontInc')?.addEventListener('click', () => {
    state.baseFontSize = Math.min(state.baseFontSize + 1, 24);
    applyFontSize();
  });
  $('#settingsFontDec')?.addEventListener('click', () => {
    state.baseFontSize = Math.max(state.baseFontSize - 1, 10);
    applyFontSize();
  });

  $('#settingsThemeToggle')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.seg-btn') as HTMLElement;
    if (!btn) return;
    applyTheme(btn.dataset.value!);
    setSegActive($('#settingsThemeToggle'), btn.dataset.value!);
  });

  $('#settingsWrapToggle')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.seg-btn') as HTMLElement;
    if (!btn) return;
    applyWrap(btn.dataset.value === 'on');
    setSegActive($('#settingsWrapToggle'), btn.dataset.value!);
  });

  $('#settingsIgnoreToggle')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.seg-btn') as HTMLElement;
    if (!btn) return;
    const show = btn.dataset.value === 'on';
    localStorage.setItem(SHOW_IGNORED_KEY, show ? 'true' : 'false');
    setSegActive($('#settingsIgnoreToggle'), btn.dataset.value!);
    if (loadTreeFn) loadTreeFn();
  });
}
