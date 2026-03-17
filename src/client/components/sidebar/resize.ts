import { $ } from '../../utils/dom';
import { state } from '../../state';
import { SIDEBAR_WIDTH_KEY } from '../../constants';

const sidebar = $('#sidebar');
const resizeHandle = $('#resizeHandle');

export function initSidebarResize(): void {
  const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
  if (savedWidth && window.innerWidth > 768) {
    const w = parseInt(savedWidth, 10);
    if (w >= 180 && w <= 500) {
      sidebar.style.width = `${w}px`;
      sidebar.style.minWidth = `${w}px`;
    }
  }

  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    state.isResizing = true;
    resizeHandle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!state.isResizing) return;
    let w = e.clientX;
    if (w < 180) w = 180;
    if (w > 500) w = 500;
    sidebar.style.width = `${w}px`;
    sidebar.style.minWidth = `${w}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!state.isResizing) return;
    state.isResizing = false;
    resizeHandle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(parseInt(sidebar.style.width, 10)));
  });
}
