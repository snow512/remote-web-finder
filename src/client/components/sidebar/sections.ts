import { $ } from '../../utils/dom';
import { SECTIONS_KEY } from '../../constants';

function getSectionCollapsed(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(SECTIONS_KEY) || '{}'); } catch { return {}; }
}

function saveSectionCollapsed(sectionId: string, collapsed: boolean): void {
  const s = getSectionCollapsed();
  s[sectionId] = collapsed;
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(s));
}

function initSectionToggle(headerEl: HTMLElement, toggleEl: HTMLElement, bodyEl: HTMLElement, sectionId: string): void {
  const s = getSectionCollapsed();
  if (s[sectionId]) {
    toggleEl.classList.add('collapsed');
    bodyEl.classList.add('collapsed');
  }
  headerEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.section-btn')) return;
    toggleEl.classList.toggle('collapsed');
    bodyEl.classList.toggle('collapsed');
    saveSectionCollapsed(sectionId, toggleEl.classList.contains('collapsed'));
  });
}

export function initSections(): void {
  initSectionToggle($('#recentHeader'), $('#recentToggle'), $('#recentList'), 'recent');
  initSectionToggle($('#favoritesHeader'), $('#favoritesToggle'), $('#favoritesList'), 'favorites');
  initSectionToggle($('#treeHeader'), $('#treeToggle'), $('#tree'), 'tree');
  initSectionToggle($('#customFiltersHeader'), $('#customFiltersToggle'), $('#customFiltersBody'), 'customFilters');
}
