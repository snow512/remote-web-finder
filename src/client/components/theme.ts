import { $ } from '../utils/dom';
import { THEME_KEY } from '../constants';

export function getTheme(): string {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function applyTheme(theme: string): void {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggle = $('#themeToggle');
  if (themeToggle) themeToggle.innerHTML = theme === 'dark' ? '&#9790;' : '&#9728;';
  ($('#hljs-dark') as HTMLLinkElement).disabled = theme !== 'dark';
  ($('#hljs-light') as HTMLLinkElement).disabled = theme !== 'light';
  localStorage.setItem(THEME_KEY, theme);
}

export function initTheme(): void {
  const themeToggle = document.querySelector('#themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  }
  applyTheme(getTheme());
}
