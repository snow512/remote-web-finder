import { $ } from '../../utils/dom';
import { state } from '../../state';
import { PRESET_KEY, DEFAULT_PRESETS } from '../../constants';
import { getFileName } from '@shared/utils';
import { onOutsideClick } from '../dialog';
import { expandDir } from './helpers';

const searchInput = $('#searchInput') as HTMLInputElement;
const searchClear = $('#searchClear');
const filterPresetBtn = $('#filterPresetBtn');
const filterPresetMenu = $('#filterPresetMenu');
const filterCountEl = $('#filterCount');
const treeEl = $('#tree');

let filterPresets = loadPresets();
let renderAllCustomFiltersFn: (() => void) | null = null;

export function setFilterDeps(deps: { renderAllCustomFilters: () => void }) {
  renderAllCustomFiltersFn = deps.renderAllCustomFilters;
}

function loadPresets(): Array<{ label: string; exts: string }> {
  const stored = localStorage.getItem(PRESET_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fallback */ }
  }
  return DEFAULT_PRESETS.map(p => ({ ...p }));
}

function savePresets(presets: Array<{ label: string; exts: string }>): void {
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
}

function buildPresetMenu(): void {
  filterPresetMenu.innerHTML = '';

  const allItem = document.createElement('div');
  allItem.className = 'filter-preset-item' + (!state.activePreset ? ' selected' : '');
  allItem.innerHTML = '<span class="preset-label">All</span>';
  allItem.addEventListener('click', () => {
    state.activePreset = null;
    filterPresetBtn.classList.remove('active');
    filterPresetMenu.classList.remove('open');
    state.presetEditMode = false;
    applyFilter();
  });
  filterPresetMenu.appendChild(allItem);

  filterPresets.forEach((preset, idx) => {
    const item = document.createElement('div');
    item.className = 'filter-preset-item' + (state.activePreset === preset ? ' selected' : '');

    if (state.presetEditMode) {
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'preset-edit-input preset-edit-label';
      labelInput.value = preset.label;
      labelInput.placeholder = 'Name';

      const extsInput = document.createElement('input');
      extsInput.type = 'text';
      extsInput.className = 'preset-edit-input preset-edit-exts';
      extsInput.value = preset.exts;
      extsInput.placeholder = '.md .txt ...';

      const delBtn = document.createElement('button');
      delBtn.className = 'preset-del-btn';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterPresets.splice(idx, 1);
        if (state.activePreset === preset) { state.activePreset = null; filterPresetBtn.classList.remove('active'); }
        savePresets(filterPresets);
        buildPresetMenu();
      });

      const saveEdit = () => {
        const newLabel = labelInput.value.trim();
        const newExts = extsInput.value.trim();
        if (newLabel && newExts) { preset.label = newLabel; preset.exts = newExts; savePresets(filterPresets); }
      };
      labelInput.addEventListener('blur', saveEdit);
      extsInput.addEventListener('blur', saveEdit);
      labelInput.addEventListener('click', (e) => e.stopPropagation());
      extsInput.addEventListener('click', (e) => e.stopPropagation());

      item.appendChild(labelInput);
      item.appendChild(extsInput);
      item.appendChild(delBtn);
      item.style.cursor = 'default';
    } else {
      const label = document.createElement('span');
      label.className = 'preset-label';
      label.textContent = preset.label;
      item.appendChild(label);
      const exts = document.createElement('span');
      exts.className = 'preset-exts';
      exts.textContent = preset.exts;
      item.appendChild(exts);
      item.addEventListener('click', () => {
        if (state.activePreset === preset) {
          state.activePreset = null;
          filterPresetBtn.classList.remove('active');
        } else {
          state.activePreset = preset;
          filterPresetBtn.classList.add('active');
        }
        filterPresetMenu.classList.remove('open');
        applyFilter();
      });
    }
    filterPresetMenu.appendChild(item);
  });

  const footer = document.createElement('div');
  footer.className = 'preset-footer';

  if (state.presetEditMode) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-sm';
    addBtn.textContent = '+ Add';
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); filterPresets.push({ label: 'New', exts: '.ext' }); savePresets(filterPresets); buildPresetMenu(); });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-sm';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterPresets = DEFAULT_PRESETS.map(p => ({ ...p }));
      state.activePreset = null;
      filterPresetBtn.classList.remove('active');
      savePresets(filterPresets);
      buildPresetMenu();
      applyFilter();
    });

    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn-sm accent';
    doneBtn.textContent = 'Done';
    doneBtn.addEventListener('click', (e) => { e.stopPropagation(); state.presetEditMode = false; buildPresetMenu(); });

    footer.appendChild(addBtn);
    footer.appendChild(resetBtn);
    footer.appendChild(doneBtn);
  } else {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); state.presetEditMode = true; buildPresetMenu(); });
    footer.appendChild(editBtn);
  }

  filterPresetMenu.appendChild(footer);
}

function filterTree(container: HTMLElement, query: string, exts: string[] | null): boolean {
  let hasVisible = false;

  container.querySelectorAll(':scope > .tree-dir').forEach(dirElRaw => {
    const dirEl = dirElRaw as HTMLElement;
    const childrenEl = dirEl.querySelector(':scope > .tree-children') as HTMLElement;
    const dirVisible = filterTree(childrenEl, query, exts);
    if (dirVisible) {
      dirEl.classList.remove('hidden');
      expandDir(childrenEl);
      hasVisible = true;
    } else {
      dirEl.classList.add('hidden');
    }
  });

  container.querySelectorAll(':scope > .tree-item[data-path]').forEach(itemRaw => {
    const item = itemRaw as HTMLElement;
    const filePath = (item.dataset.path || '').toLowerCase();
    const name = getFileName(filePath);
    const matchesQuery = !query || filePath.includes(query);
    const matchesExt = !exts || exts.some(ext => name.endsWith(ext));
    if (matchesQuery && matchesExt) {
      item.classList.remove('hidden');
      hasVisible = true;
    } else {
      item.classList.add('hidden');
    }
  });

  return hasVisible;
}

export function applyFilter(): void {
  const q = searchInput.value.trim().toLowerCase();
  if (!q && !state.activePreset) {
    treeEl.querySelectorAll('.tree-item.hidden, .tree-dir.hidden').forEach(el => el.classList.remove('hidden'));
    filterCountEl.classList.remove('visible', 'no-matches');
    filterCountEl.textContent = '';
    searchInput.classList.remove('no-matches');
    if (renderAllCustomFiltersFn) renderAllCustomFiltersFn();
    return;
  }
  const exts = state.activePreset ? state.activePreset.exts.split(/\s+/).filter(Boolean) : null;
  filterTree(treeEl, q, exts);

  const visibleFiles = treeEl.querySelectorAll('.tree-item[data-path]:not(.hidden)').length;
  const totalFiles = treeEl.querySelectorAll('.tree-item[data-path]').length;
  filterCountEl.textContent = visibleFiles === 0 ? 'No matches' : `${visibleFiles} / ${totalFiles}`;
  filterCountEl.classList.add('visible');
  filterCountEl.classList.toggle('no-matches', visibleFiles === 0);
  searchInput.classList.toggle('no-matches', visibleFiles === 0);
  if (renderAllCustomFiltersFn) renderAllCustomFiltersFn();
}

function updateSearchClear(): void {
  searchClear.style.display = searchInput.value ? '' : 'none';
}

export function initFilter(): void {
  buildPresetMenu();

  searchInput.addEventListener('input', () => { updateSearchClear(); applyFilter(); });
  searchClear.addEventListener('click', () => { searchInput.value = ''; updateSearchClear(); applyFilter(); searchInput.focus(); });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); searchInput.value = ''; updateSearchClear(); applyFilter(); searchInput.blur(); }
  });

  filterPresetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = filterPresetMenu.classList.contains('open');
    if (isOpen) state.presetEditMode = false;
    filterPresetMenu.classList.toggle('open', !isOpen);
    if (!isOpen) buildPresetMenu();
  });

  onOutsideClick({
    el: filterPresetMenu,
    ignoreEls: [filterPresetBtn],
    onClose() { filterPresetMenu.classList.remove('open'); state.presetEditMode = false; }
  });
}
