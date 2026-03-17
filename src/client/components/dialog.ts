import { $ } from '../utils/dom';

const airPopupOverlay = $('#airPopupOverlay');
const airPopupTitle = $('#airPopupTitle');
const airPopupBody = $('#airPopupBody');
const airPopupInput = $('#airPopupInput') as HTMLInputElement;
const airPopupOk = $('#airPopupOk') as HTMLButtonElement;
const airPopupCancel = $('#airPopupCancel') as HTMLButtonElement;

export function airError(title: string, errorMsg?: string): Promise<void> {
  return new Promise(resolve => {
    airPopupTitle.textContent = title;
    airPopupBody.innerHTML = '';
    const msgEl = document.createElement('div');
    msgEl.className = 'dialog-error-msg';
    msgEl.textContent = errorMsg || '';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'dialog-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = async () => {
      const text = errorMsg || '';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    };
    airPopupBody.appendChild(msgEl);
    airPopupBody.appendChild(copyBtn);
    airPopupInput.style.display = 'none';
    airPopupCancel.style.display = 'none';
    airPopupOk.textContent = 'OK';
    airPopupOk.className = 'dialog-btn ok';
    airPopupOverlay.style.display = 'flex';
    const done = () => { airPopupOverlay.style.display = 'none'; resolve(); };
    airPopupOk.onclick = done;
    airPopupCancel.onclick = null;
    airPopupOverlay.onclick = (e) => { if (e.target === airPopupOverlay) done(); };
    airPopupOk.focus();
  });
}

export function airConfirm(title: string, opts: { okText?: string; danger?: boolean } = {}): Promise<boolean> {
  const { okText = 'OK', danger = false } = opts;
  return new Promise(resolve => {
    airPopupTitle.textContent = title;
    airPopupBody.textContent = '';
    airPopupInput.style.display = 'none';
    airPopupCancel.style.display = '';
    airPopupCancel.textContent = 'Cancel';
    airPopupOk.textContent = okText;
    airPopupOk.className = 'dialog-btn ok' + (danger ? ' danger' : '');
    airPopupOverlay.style.display = 'flex';
    const done = (v: boolean) => { airPopupOverlay.style.display = 'none'; resolve(v); };
    airPopupOk.onclick = () => done(true);
    airPopupCancel.onclick = () => done(false);
    airPopupOverlay.onclick = (e) => { if (e.target === airPopupOverlay) done(false); };
    airPopupOk.focus();
  });
}

export function airPrompt(title: string, defaultValue: string = ''): Promise<string | null> {
  return new Promise(resolve => {
    airPopupTitle.textContent = title;
    airPopupBody.textContent = '';
    airPopupInput.style.display = '';
    airPopupInput.value = defaultValue;
    airPopupCancel.style.display = '';
    airPopupCancel.textContent = 'Cancel';
    airPopupOk.textContent = 'OK';
    airPopupOk.className = 'dialog-btn ok';
    airPopupOverlay.style.display = 'flex';
    airPopupInput.focus();
    airPopupInput.select();
    const done = (v: string | null) => {
      airPopupOverlay.style.display = 'none';
      airPopupInput.onkeydown = null;
      resolve(v);
    };
    airPopupOk.onclick = () => done(airPopupInput.value.trim() || null);
    airPopupCancel.onclick = () => done(null);
    airPopupOverlay.onclick = (e) => { if (e.target === airPopupOverlay) done(null); };
    airPopupInput.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); airPopupOk.click(); }
      if (e.key === 'Escape') { e.preventDefault(); airPopupCancel.click(); }
    };
  });
}

interface PopupMenuOptions {
  containerEl: HTMLElement;
  onClose?: () => void;
}

export function createPopupMenu({ containerEl, onClose }: PopupMenuOptions) {
  let open = false;
  function show(x: number, y: number) {
    open = true;
    containerEl.style.display = 'block';
    containerEl.style.left = `${x}px`;
    containerEl.style.top = `${y}px`;
    const rect = containerEl.getBoundingClientRect();
    if (rect.right > window.innerWidth) containerEl.style.left = `${window.innerWidth - rect.width - 4}px`;
    if (rect.bottom > window.innerHeight) containerEl.style.top = `${window.innerHeight - rect.height - 4}px`;
  }
  function close() {
    if (!open) return;
    open = false;
    containerEl.style.display = 'none';
    if (onClose) onClose();
  }
  document.addEventListener('click', (e) => {
    if (open && !containerEl.contains(e.target as Node)) close();
  });
  return { show, close, isOpen: () => open };
}

interface ModalDialogOptions {
  overlayEl: HTMLElement;
  closeBtn?: HTMLElement | null;
  onOpen?: () => void;
  onClose?: () => void;
}

export function createModalDialog({ overlayEl, closeBtn, onOpen, onClose }: ModalDialogOptions) {
  let open = false;
  function doOpen() {
    if (onOpen) onOpen();
    open = true;
    overlayEl.style.display = 'flex';
  }
  function doClose() {
    if (!open) return;
    open = false;
    overlayEl.style.display = 'none';
    if (onClose) onClose();
  }
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) doClose();
  });
  if (closeBtn) closeBtn.addEventListener('click', doClose);
  return { open: doOpen, close: doClose, isOpen: () => open };
}

export function onOutsideClick({ el, ignoreEls = [], onClose }: { el: HTMLElement; ignoreEls?: HTMLElement[]; onClose: (e: Event) => void }) {
  document.addEventListener('click', (e) => {
    if (el.contains(e.target as Node)) return;
    for (const ig of ignoreEls) { if (ig.contains(e.target as Node) || ig === e.target) return; }
    onClose(e);
  });
}
