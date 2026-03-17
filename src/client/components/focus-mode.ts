import { $ } from '../utils/dom';
import { state } from '../state';

const layoutEl = $('.layout');
const toolbarEl = $('#toolbar');
const statusBar = $('#statusBar');
const btnFocus = $('#btnFocus');

export function toggleFocusMode(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function showFocusBars(): void {
  layoutEl.classList.add('focus-bars-visible');
  clearTimeout(state.focusBarsTimer!);
  state.focusBarsTimer = setTimeout(() => {
    layoutEl.classList.remove('focus-bars-visible');
  }, 2000);
}

function onFocusBarsEnter(): void { clearTimeout(state.focusBarsTimer!); }
function onFocusBarsLeave(): void { showFocusBars(); }

function onFocusMouseMove(): void {
  if (state.focusMoveThrottled) return;
  state.focusMoveThrottled = true;
  showFocusBars();
  setTimeout(() => { state.focusMoveThrottled = false; }, 100);
}

function onFocusKeyDown(): void { showFocusBars(); }

function setupFocusBarListeners(): void {
  document.addEventListener('mousemove', onFocusMouseMove);
  document.addEventListener('keydown', onFocusKeyDown);
  toolbarEl.addEventListener('mouseenter', onFocusBarsEnter);
  toolbarEl.addEventListener('mouseleave', onFocusBarsLeave);
  statusBar.addEventListener('mouseenter', onFocusBarsEnter);
  statusBar.addEventListener('mouseleave', onFocusBarsLeave);
}

function cleanupFocusBarListeners(): void {
  document.removeEventListener('mousemove', onFocusMouseMove);
  document.removeEventListener('keydown', onFocusKeyDown);
  toolbarEl.removeEventListener('mouseenter', onFocusBarsEnter);
  toolbarEl.removeEventListener('mouseleave', onFocusBarsLeave);
  statusBar.removeEventListener('mouseenter', onFocusBarsEnter);
  statusBar.removeEventListener('mouseleave', onFocusBarsLeave);
  clearTimeout(state.focusBarsTimer!);
  state.focusMoveThrottled = false;
  layoutEl.classList.remove('focus-bars-visible');
}

export function initFocusMode(): void {
  document.addEventListener('fullscreenchange', () => {
    state.isFocusMode = !!document.fullscreenElement;
    layoutEl.classList.toggle('focus-mode', state.isFocusMode);
    btnFocus.classList.toggle('active', state.isFocusMode);
    if (state.isFocusMode) {
      showFocusBars();
      setupFocusBarListeners();
    } else {
      cleanupFocusBarListeners();
    }
  });

  btnFocus.addEventListener('click', toggleFocusMode);
}
