import { $ } from '../../utils/dom';
import { createLogger } from '../../utils/logger';
import { state } from '../../state';
import { API, throwIfNotOk } from '../../api';
import { showToast } from '../toast';
import { airConfirm } from '../dialog';
import { setDirty } from '../breadcrumb';
import { updateLineNumbers } from './line-numbers';
import { clearDraft, startDraftTimer, stopDraftTimer, saveDraft } from './draft';
import { editorInsertAt } from './toolbar';

const log = createLogger('Editor');

const editorEl = $('#editor') as HTMLTextAreaElement;
const editorPanel = $('#editorPanel');
const livePreviewEl = $('#livePreview');
const previewEl = $('#preview');
const contentBody = $('#contentBody');
const mdToolbar = $('#mdToolbar');
const btnEdit = $('#btnEdit');
const btnSave = $('#btnSave') as HTMLButtonElement;
const saveErrorBanner = $('#saveErrorBanner');
const saveErrorMsg = $('#saveErrorMsg');
const saveErrorRetry = $('#saveErrorRetry') as HTMLButtonElement;
const saveErrorDismiss = $('#saveErrorDismiss');
const statusBar = $('#statusBar');

let showPreviewFn: ((text: string, filePath: string) => void) | null = null;
let updateStatusBarFn: (() => void) | null = null;
let closeContentSearchFn: (() => void) | null = null;
let hideTOCFn: (() => void) | null = null;

export function setEditorDeps(deps: {
  showPreview: typeof showPreviewFn;
  updateStatusBar: typeof updateStatusBarFn;
  closeContentSearch: typeof closeContentSearchFn;
  hideTOC: typeof hideTOCFn;
}) {
  showPreviewFn = deps.showPreview;
  updateStatusBarFn = deps.updateStatusBar;
  closeContentSearchFn = deps.closeContentSearch;
  hideTOCFn = deps.hideTOC;
}

function setEditButtons(editing: boolean): void {
  btnEdit.style.display = editing ? 'none' : 'inline-block';
  btnSave.style.display = editing ? 'inline-block' : 'none';
  ($('#btnCancel')).style.display = editing ? 'inline-block' : 'none';
  ($('#btnSearch')).style.display = 'none';
}

function addCopyButtons(container: HTMLElement): void {
  container.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.code-copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      if (btn.classList.contains('copied')) return;
      const code = pre.querySelector('code');
      const text = code ? code.textContent || '' : pre.textContent || '';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      } catch { showToast('Copy failed', 'error'); }
    });
    pre.appendChild(btn);
  });
}

export function updateLivePreview(): void {
  try {
    livePreviewEl.innerHTML = (window as any).marked.parse(editorEl.value);
    livePreviewEl.querySelectorAll('pre code').forEach(block => {
      try {
        (window as any).hljs.highlightElement(block);
      } catch (e) {
        log.error('Live preview highlight failed', e);
      }
    });
    addCopyButtons(livePreviewEl);
  } catch (e) {
    log.error('Live preview render failed', e);
    const pre = document.createElement('pre');
    pre.textContent = editorEl.value;
    livePreviewEl.innerHTML = '';
    livePreviewEl.appendChild(pre);
  }
}

export function enterEditMode(): void {
  if (state.isLargeFile) { showToast('File too large to edit', 'error'); return; }
  state.isEditing = true;
  hideSaveErrorBanner();
  if (closeContentSearchFn) closeContentSearchFn();
  previewEl.style.display = 'none';
  editorPanel.style.display = 'flex';
  editorEl.value = state.originalContent;
  updateLineNumbers();
  setDirty(false);
  setEditButtons(true);

  if (state.currentPath?.endsWith('.md')) {
    mdToolbar.style.display = 'flex';
  } else {
    mdToolbar.style.display = 'none';
  }

  if (state.currentPath?.endsWith('.md') && window.innerWidth > 768) {
    contentBody.classList.add('split-mode');
    livePreviewEl.style.display = 'block';
    updateLivePreview();
    if (hideTOCFn) hideTOCFn();
  } else {
    contentBody.classList.remove('split-mode');
    livePreviewEl.style.display = 'none';
    if (hideTOCFn) hideTOCFn();
  }

  editorEl.focus();
  startDraftTimer();
  if (updateStatusBarFn) updateStatusBarFn();
}

export async function saveFile(): Promise<void> {
  if (!state.currentPath || !state.isEditing || state.isSaving) return;
  state.isSaving = true;
  btnSave.disabled = true;
  if (state.saveController) state.saveController.abort();
  state.saveController = new AbortController();
  saveErrorRetry.disabled = true;
  saveErrorRetry.textContent = 'Saving...';
  const content = editorEl.value;
  try {
    const res = await fetch(API.file(state.currentPath), {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
      signal: state.saveController.signal,
    });
    await throwIfNotOk(res);
    state.originalContent = content;
    setDirty(false);
    clearDraft(state.currentPath);
    stopDraftTimer();
    hideSaveErrorBanner();
    showToast('Saved successfully', 'success');
    if (showPreviewFn) showPreviewFn(content, state.currentPath);
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    showSaveErrorBanner(err.message);
  } finally {
    state.isSaving = false;
    btnSave.disabled = false;
  }
}

export async function cancelEdit(): Promise<void> {
  if (state.isDirty && !(await airConfirm('Discard unsaved changes?'))) return;
  if (state.saveController) state.saveController.abort();
  setDirty(false);
  clearDraft(state.currentPath || undefined);
  stopDraftTimer();
  clearTimeout(state.livePreviewTimer!);
  hideSaveErrorBanner();
  if (showPreviewFn && state.currentPath) showPreviewFn(state.originalContent, state.currentPath);
}

function showSaveErrorBanner(msg: string): void {
  if (state.bannerHideHandler) {
    saveErrorBanner.removeEventListener('animationend', state.bannerHideHandler);
    state.bannerHideHandler = null;
  }
  const fullMsg = 'Save failed: ' + msg;
  saveErrorMsg.textContent = fullMsg;
  saveErrorMsg.title = fullMsg;
  saveErrorRetry.disabled = false;
  saveErrorRetry.textContent = 'Retry';
  saveErrorBanner.style.display = 'flex';
  saveErrorBanner.style.animation = 'none';
  saveErrorBanner.offsetHeight; // reflow
  saveErrorBanner.style.animation = '';
}

export function hideSaveErrorBanner(): void {
  if (saveErrorBanner.style.display !== 'flex' || state.bannerHideHandler) return;
  state.bannerHideHandler = function() {
    saveErrorBanner.removeEventListener('animationend', state.bannerHideHandler!);
    state.bannerHideHandler = null;
    saveErrorBanner.style.display = 'none';
    saveErrorBanner.style.animation = '';
  };
  saveErrorBanner.style.animation = 'bannerSlideUp 0.2s ease forwards';
  saveErrorBanner.addEventListener('animationend', state.bannerHideHandler);
}

export function isSaveErrorBannerVisible(): boolean {
  return saveErrorBanner.style.display === 'flex' && !state.bannerHideHandler;
}

export function initEditor(): void {
  editorEl.addEventListener('input', () => {
    updateLineNumbers();
    if (editorEl.value !== state.originalContent) {
      setDirty(true);
    } else {
      setDirty(false);
    }
    if (updateStatusBarFn) updateStatusBarFn();
    if (!state.isEditing || livePreviewEl.style.display === 'none') return;
    clearTimeout(state.livePreviewTimer!);
    state.livePreviewTimer = setTimeout(updateLivePreview, 150);
  });

  saveErrorRetry.addEventListener('click', () => { hideSaveErrorBanner(); saveFile(); });
  saveErrorDismiss.addEventListener('click', hideSaveErrorBanner);

  editorEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editorEl.selectionStart;
      const end = editorEl.selectionEnd;
      editorInsertAt(start, end, '  ');
      editorEl.selectionStart = editorEl.selectionEnd = start + 2;
    }
  });

  editorEl.addEventListener('click', () => { if (updateStatusBarFn) updateStatusBarFn(); });
  editorEl.addEventListener('keyup', () => { if (updateStatusBarFn) updateStatusBarFn(); });
}

export { addCopyButtons };
