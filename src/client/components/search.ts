import { $ } from '../utils/dom';
import { state } from '../state';

const previewEl = $('#preview');
const searchBar = $('#searchBar');
const searchText = $('#searchText') as HTMLInputElement;
const searchCount = $('#searchCount');
const searchPrev = $('#searchPrev') as HTMLButtonElement;
const searchNext = $('#searchNext') as HTMLButtonElement;
const searchClose = $('#searchClose');

export function openContentSearch(): void {
  searchBar.style.display = 'flex';
  searchText.focus();
  searchText.select();
  if (searchText.value.trim()) performContentSearch();
}

export function closeContentSearch(): void {
  searchBar.style.display = 'none';
  searchText.classList.remove('no-results');
  searchCount.classList.remove('no-results');
  searchCount.textContent = '';
  clearTimeout(state.searchTimer!);
  clearSearchHighlights();
  state.searchMatches = [];
  state.searchIdx = -1;
  state.lastSearchQuery = '';
  searchPrev.disabled = false;
  searchNext.disabled = false;
}

function clearSearchHighlights(): void {
  previewEl.querySelectorAll('mark.search-hl').forEach(m => {
    const parent = m.parentNode!;
    parent.replaceChild(document.createTextNode(m.textContent || ''), m);
    parent.normalize();
  });
}

function performContentSearch(): void {
  const query = searchText.value.trim();
  if (query === state.lastSearchQuery) return;
  state.lastSearchQuery = query;
  clearSearchHighlights();
  state.searchMatches = [];
  state.largeSearchPositions = [];
  state.searchIdx = -1;

  if (!query || state.isEditing) {
    searchCount.textContent = '';
    searchText.classList.remove('no-results');
    searchCount.classList.remove('no-results');
    searchPrev.disabled = true;
    searchNext.disabled = true;
    return;
  }

  if (state.isLargeFile) {
    performLargeFileSearch(query);
  } else {
    highlightTextNodes(previewEl, query);
    state.searchMatches = Array.from(previewEl.querySelectorAll<HTMLElement>('mark.search-hl'));
    if (state.searchMatches.length > 0) {
      state.searchIdx = 0;
      activateMatch(0);
    }
  }

  const total = state.isLargeFile ? state.largeSearchPositions.length : state.searchMatches.length;
  const noResults = total === 0 && query.length > 0;
  searchCount.textContent = total > 0 ? `${state.searchIdx + 1}/${total}` : 'No results';
  searchText.classList.toggle('no-results', noResults);
  searchCount.classList.toggle('no-results', noResults);
  searchPrev.disabled = total === 0;
  searchNext.disabled = total === 0;
}

function performLargeFileSearch(query: string): void {
  const codeEl = previewEl.querySelector('code');
  if (!codeEl) return;
  state.largeSearchFullText = codeEl.textContent || '';
  const lowerText = state.largeSearchFullText.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let pos = 0;
  while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
    state.largeSearchPositions.push(pos);
    pos += lowerQuery.length;
  }
  if (state.largeSearchPositions.length > 0) {
    state.searchIdx = 0;
    activateLargeMatch(0, query);
  }
}

function activateLargeMatch(idx: number, query: string): void {
  const codeEl = previewEl.querySelector('code');
  if (!codeEl) return;
  const prev = codeEl.querySelector('mark.search-hl');
  if (prev) { prev.replaceWith(document.createTextNode(prev.textContent || '')); codeEl.normalize(); }

  const pos = state.largeSearchPositions[idx];
  const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
  let offset = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLen = node.textContent!.length;
    if (offset + nodeLen > pos) {
      const localPos = pos - offset;
      const before = node.textContent!.slice(0, localPos);
      const match = node.textContent!.slice(localPos, localPos + query.length);
      const after = node.textContent!.slice(localPos + query.length);
      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      const mark = document.createElement('mark');
      mark.className = 'search-hl active';
      mark.textContent = match;
      frag.appendChild(mark);
      if (after) frag.appendChild(document.createTextNode(after));
      node.parentNode!.replaceChild(frag, node);
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;
    }
    offset += nodeLen;
  }
  searchCount.textContent = `${idx + 1}/${state.largeSearchPositions.length}`;
}

function highlightTextNodes(root: HTMLElement, query: string): void {
  const lowerQuery = query.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = (node as Text).parentElement;
      if (parent && ['SCRIPT', 'STYLE', 'MARK'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return (node.textContent || '').toLowerCase().includes(lowerQuery) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach(textNode => {
    const text = textNode.textContent || '';
    const lowerText = text.toLowerCase();
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let pos = lowerText.indexOf(lowerQuery, lastIdx);
    while (pos !== -1) {
      if (pos > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, pos)));
      const mark = document.createElement('mark');
      mark.className = 'search-hl';
      mark.textContent = text.slice(pos, pos + query.length);
      frag.appendChild(mark);
      lastIdx = pos + query.length;
      pos = lowerText.indexOf(lowerQuery, lastIdx);
    }
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    textNode.parentNode!.replaceChild(frag, textNode);
  });
}

function activateMatch(idx: number): void {
  state.searchMatches.forEach(m => m.classList.remove('active'));
  if (state.searchMatches[idx]) {
    state.searchMatches[idx].classList.add('active');
    state.searchMatches[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchCount.textContent = `${idx + 1}/${state.searchMatches.length}`;
  }
}

function searchNextMatch(): void {
  if (state.isLargeFile) {
    if (state.largeSearchPositions.length === 0) return;
    state.searchIdx = (state.searchIdx + 1) % state.largeSearchPositions.length;
    activateLargeMatch(state.searchIdx, state.lastSearchQuery);
  } else {
    if (state.searchMatches.length === 0) return;
    state.searchIdx = (state.searchIdx + 1) % state.searchMatches.length;
    activateMatch(state.searchIdx);
  }
}

function searchPrevMatch(): void {
  if (state.isLargeFile) {
    if (state.largeSearchPositions.length === 0) return;
    state.searchIdx = (state.searchIdx - 1 + state.largeSearchPositions.length) % state.largeSearchPositions.length;
    activateLargeMatch(state.searchIdx, state.lastSearchQuery);
  } else {
    if (state.searchMatches.length === 0) return;
    state.searchIdx = (state.searchIdx - 1 + state.searchMatches.length) % state.searchMatches.length;
    activateMatch(state.searchIdx);
  }
}

export function initSearch(): void {
  searchText.addEventListener('input', () => {
    clearTimeout(state.searchTimer!);
    state.searchTimer = setTimeout(performContentSearch, 300);
  });
  searchText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? searchPrevMatch() : searchNextMatch(); }
    if (e.key === 'Escape') closeContentSearch();
  });
  searchNext.addEventListener('click', searchNextMatch);
  searchPrev.addEventListener('click', searchPrevMatch);
  searchClose.addEventListener('click', closeContentSearch);
}
