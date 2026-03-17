import { $ } from '../utils/dom';
import { state } from '../state';
import { ZOOM_KEY, IMAGE_ZOOM_KEY, FONT_SIZE_KEY } from '../constants';
import { isImageFile } from './icons';
import { showToast } from './toast';

export function applyZoom(): void {
  document.documentElement.style.setProperty('--zoom', String(state.zoomLevel));
  localStorage.setItem(ZOOM_KEY, String(state.zoomLevel));
}

export function applyImageZoom(): void {
  document.documentElement.style.setProperty('--image-zoom', String(state.imageZoomLevel));
  localStorage.setItem(IMAGE_ZOOM_KEY, String(state.imageZoomLevel));
}

export function applyFontSize(): void {
  document.documentElement.style.setProperty('--base-font-size', state.baseFontSize + 'px');
  localStorage.setItem(FONT_SIZE_KEY, String(state.baseFontSize));
  const display = document.querySelector('#settingsFontSizeValue');
  if (display) display.textContent = state.baseFontSize + 'px';
}

export function adjustZoom(delta: number): void {
  const isImage = state.currentPath && isImageFile(state.currentPath);
  if (isImage) {
    state.imageZoomLevel = delta === 0 ? 1.0 : Math.max(0.3, Math.min(3.0, state.imageZoomLevel + delta));
    applyImageZoom();
    showToast(`Image Zoom: ${Math.round(state.imageZoomLevel * 100)}%`, 'info');
  } else {
    state.zoomLevel = delta === 0 ? 1.0 : Math.max(0.5, Math.min(2.0, state.zoomLevel + delta));
    applyZoom();
    showToast(`Zoom: ${Math.round(state.zoomLevel * 100)}%`, 'info');
  }
}

export function initZoom(): void {
  state.zoomLevel = parseFloat(localStorage.getItem(ZOOM_KEY) || '1');
  state.imageZoomLevel = parseFloat(localStorage.getItem(IMAGE_ZOOM_KEY) || '1');
  state.baseFontSize = parseInt(localStorage.getItem(FONT_SIZE_KEY) || '14', 10);
  applyZoom();
  applyImageZoom();
  applyFontSize();

  $('#btnImgZoomIn').addEventListener('click', () => adjustZoom(0.1));
  $('#btnImgZoomOut').addEventListener('click', () => adjustZoom(-0.1));
  $('#btnImgZoomReset').addEventListener('click', () => adjustZoom(0));
}
