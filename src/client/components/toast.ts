import { $ } from '../utils/dom';

const toastContainer = $('#toastContainer');

export function showToast(message: string, type: string = 'info'): void {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  while (toastContainer.children.length > 5) {
    toastContainer.firstChild!.remove();
  }
  setTimeout(() => toast.remove(), 3000);
}
