import { $ , esc } from '../utils/dom';
import { createLogger } from '../utils/logger';
import { state } from '../state';
import { API } from '../api';
import { getFileName, getDirName, sanitizeHtml, isDangerousHref } from '@shared/utils';
import { isImageFile } from './icons';
import { showToast } from './toast';
import { setDirty } from './breadcrumb';
import { addCopyButtons } from './editor/editor';
import { removeRecent } from './sidebar/recent';

const log = createLogger('Preview');

const previewEl = $('#preview');
const editorPanel = $('#editorPanel');
const livePreviewEl = $('#livePreview');
const contentBody = $('#contentBody');
const mdToolbar = $('#mdToolbar');
const tocEl = $('#toc');
const tocListEl = $('#tocList');
const btnEdit = $('#btnEdit');
const btnSave = $('#btnSave');
const btnCancel = $('#btnCancel');
const btnSearch = $('#btnSearch');
const btnImgZoomIn = $('#btnImgZoomIn');
const btnImgZoomOut = $('#btnImgZoomOut');
const btnImgZoomReset = $('#btnImgZoomReset');
const btnWrap = $('#btnWrap');
const statusBar = $('#statusBar');

let openFileFn: ((filePath: string, rowEl: HTMLElement | null) => Promise<void>) | null = null;
let updateStatusBarFn: (() => void) | null = null;
let getTreeRowFn: ((filePath: string) => HTMLElement | null) | null = null;

export function setPreviewDeps(deps: {
  openFile: typeof openFileFn;
  updateStatusBar: typeof updateStatusBarFn;
  getTreeRow: typeof getTreeRowFn;
}) {
  openFileFn = deps.openFile;
  updateStatusBarFn = deps.updateStatusBar;
  getTreeRowFn = deps.getTreeRow;
}

function setEditButtons(editing: boolean): void {
  btnEdit.style.display = editing ? 'none' : 'inline-block';
  btnSave.style.display = editing ? 'inline-block' : 'none';
  btnCancel.style.display = editing ? 'inline-block' : 'none';
  btnSearch.style.display = 'none';
}

function resetPanelMode(): void {
  contentBody.classList.remove('split-mode');
  editorPanel.style.display = 'none';
  livePreviewEl.style.display = 'none';
  previewEl.style.display = 'block';
  mdToolbar.style.display = 'none';
}

export function hideTOC(): void {
  if (state.tocObserver) { state.tocObserver.disconnect(); state.tocObserver = null; }
  tocEl.style.display = 'none';
}

function buildTOC(container: HTMLElement): void {
  if (state.tocObserver) { state.tocObserver.disconnect(); state.tocObserver = null; }
  const headings = container.querySelectorAll('h1, h2, h3');
  if (headings.length < 2) { hideTOC(); return; }

  tocListEl.innerHTML = '';
  const tocItems: { heading: HTMLElement; link: HTMLElement }[] = [];
  headings.forEach((h, i) => {
    const id = `toc-heading-${i}`;
    (h as HTMLElement).id = id;
    const link = document.createElement('a');
    link.className = `toc-item toc-${h.tagName.toLowerCase()}`;
    link.textContent = h.textContent || '';
    link.dataset.headingId = id;
    link.addEventListener('click', () => { h.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    tocListEl.appendChild(link);
    tocItems.push({ heading: h as HTMLElement, link });
  });

  tocEl.style.display = 'block';

  state.tocObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = (entry.target as HTMLElement).id;
        tocListEl.querySelectorAll('.toc-item').forEach(item => item.classList.remove('active'));
        const activeLink = tocListEl.querySelector(`[data-heading-id="${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
          activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    });
  }, { root: previewEl, rootMargin: '0px 0px -80% 0px', threshold: 0 });

  tocItems.forEach(({ heading }) => state.tocObserver!.observe(heading));
}

export function showImageZoomButtons(): void {
  btnImgZoomIn.style.display = 'inline-block';
  btnImgZoomOut.style.display = 'inline-block';
  btnImgZoomReset.style.display = 'inline-block';
  btnWrap.style.display = 'none';
}

export function hideImageZoomButtons(): void {
  btnImgZoomIn.style.display = 'none';
  btnImgZoomOut.style.display = 'none';
  btnImgZoomReset.style.display = 'none';
  btnWrap.style.display = '';
}

export function showImagePreview(filePath: string): void {
  state.isEditing = false;
  setDirty(false);
  resetPanelMode();
  setEditButtons(false);
  btnEdit.style.display = 'none';
  showImageZoomButtons();
  hideTOC();

  const src = API.raw(filePath);
  const name = getFileName(filePath);
  previewEl.innerHTML = `<div class="image-preview"><img src="${src}" alt="${esc(name)}" /></div>`;
  const img = previewEl.querySelector('img');
  if (img) {
    img.onerror = () => {
      removeRecent(filePath);
      if (state.currentPath !== filePath) return;
      const u = new URL(window.location.href);
      if (u.searchParams.get('file') === filePath) {
        u.searchParams.delete('file');
        history.replaceState(null, '', u.toString());
      }
      showToast('Image not found (removed from recent)', 'error');
      previewEl.innerHTML = `<div class="welcome"><h1>Image not found</h1><p>${esc(filePath)}</p></div>`;
    };
  }

  const container = previewEl.querySelector('.image-preview');
  if (container) {
    container.addEventListener('wheel', (e) => {
      if (!(e as WheelEvent).ctrlKey) return;
      e.preventDefault();
      const delta = (e as WheelEvent).deltaY > 0 ? -0.05 : 0.05;
      state.imageZoomLevel = Math.max(0.3, Math.min(3.0, state.imageZoomLevel + delta));
      applyImageZoom();
    }, { passive: false });

    let pinchStartDist = 0;
    let pinchStartZoom = 1.0;
    container.addEventListener('touchstart', (e) => {
      if ((e as TouchEvent).touches.length === 2) {
        const t = (e as TouchEvent).touches;
        pinchStartDist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
        pinchStartZoom = state.imageZoomLevel;
      }
    }, { passive: true });
    container.addEventListener('touchmove', (e) => {
      if ((e as TouchEvent).touches.length === 2) {
        e.preventDefault();
        const t = (e as TouchEvent).touches;
        const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
        if (pinchStartDist === 0) return;
        const scale = dist / pinchStartDist;
        state.imageZoomLevel = Math.max(0.3, Math.min(3.0, pinchStartZoom * scale));
        applyImageZoom();
      }
    }, { passive: false });
  }

  if (updateStatusBarFn) updateStatusBarFn();
}

function applyImageZoom(): void {
  document.documentElement.style.setProperty('--image-zoom', String(state.imageZoomLevel));
  localStorage.setItem('rwf-image-zoom', String(state.imageZoomLevel));
}

export function showPreview(text: string, filePath: string): void {
  state.isEditing = false;
  setDirty(false);
  state.lastSearchQuery = '';
  resetPanelMode();
  setEditButtons(false);

  if (filePath?.endsWith('.md')) {
    try {
      previewEl.innerHTML = (window as any).marked.parse(text);
    } catch (e) {
      log.error('Markdown parse failed', e);
      showToast('Markdown rendering failed, showing raw text', 'error');
      const pre = document.createElement('pre');
      pre.textContent = text;
      previewEl.innerHTML = '';
      previewEl.appendChild(pre);
    }
    buildTOC(previewEl);
  } else if (filePath && /\.(html?|htm)$/i.test(filePath)) {
    const iframe = document.createElement('iframe');
    iframe.className = 'html-preview-iframe';
    iframe.sandbox.add('allow-same-origin');
    iframe.srcdoc = text;
    previewEl.innerHTML = '';
    previewEl.appendChild(iframe);
    hideTOC();
  } else {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text;
    pre.appendChild(code);
    previewEl.innerHTML = '';
    previewEl.appendChild(pre);
    hideTOC();
  }

  if (text.length < 500000) {
    previewEl.querySelectorAll('pre code').forEach(block => {
      try {
        (window as any).hljs.highlightElement(block);
      } catch (e) {
        log.error('Syntax highlight failed', e);
      }
    });
  }
  addCopyButtons(previewEl);
  if (updateStatusBarFn) updateStatusBarFn();
}

export function showPreviewMode(): void {
  state.isEditing = false;
  resetPanelMode();
  setEditButtons(false);
}

export function initPreviewLinks(): void {
  previewEl.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;

    if (/^https?:\/\//i.test(href)) {
      e.preventDefault();
      window.open(href, '_blank', 'noopener');
      return;
    }
    if (href.startsWith('#')) return;
    e.preventDefault();

    const currentDir = getDirName(state.currentPath || '');
    let targetPath = href.split('#')[0];
    if (!targetPath) return;

    if (targetPath.startsWith('./')) {
      targetPath = currentDir ? currentDir + '/' + targetPath.substring(2) : targetPath.substring(2);
    } else if (targetPath.startsWith('../')) {
      const parts = currentDir ? currentDir.split('/') : [];
      let rel = targetPath;
      while (rel.startsWith('../')) { parts.pop(); rel = rel.substring(3); }
      targetPath = parts.length > 0 ? parts.join('/') + '/' + rel : rel;
    } else if (!targetPath.startsWith('/')) {
      targetPath = currentDir ? currentDir + '/' + targetPath : targetPath;
    }
    targetPath = targetPath.replace(/\/+/g, '/').replace(/^\//, '');

    const row = getTreeRowFn ? getTreeRowFn(targetPath) : null;
    if (row && openFileFn) {
      openFileFn(targetPath, row);
    } else {
      showToast(`File not found: ${targetPath}`, 'error');
    }
  });
}

export function initMarked(): void {
  try {
    const marked = (window as any).marked;
    const hljs = (window as any).hljs;

    marked.setOptions({
      highlight: (code: string, lang: string) => {
        try {
          if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
          return hljs.highlightAuto(code).value;
        } catch {
          return code;
        }
      },
      breaks: true,
      gfm: true,
    });

    marked.use({
      renderer: {
        image({ href, title, text }: { href?: string; title?: string; text?: string }) {
          if (!href) return '';
          if (isDangerousHref(href)) return `<img src="" alt="${(text || '').replace(/"/g, '&quot;')}" loading="lazy">`;
          const safeHref = href.replace(/"/g, '&quot;');
          const safeText = (text || '').replace(/"/g, '&quot;');
          const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
          return `<img src="${safeHref}" alt="${safeText}"${titleAttr} loading="lazy">`;
        },
        html({ text }: { text: string }) { return sanitizeHtml(text); }
      }
    });
  } catch (e) {
    log.error('Failed to initialize marked', e);
    showToast('Markdown engine initialization failed', 'error');
  }
}
