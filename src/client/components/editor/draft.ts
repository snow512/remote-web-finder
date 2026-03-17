import { $ } from '../../utils/dom';
import { state } from '../../state';
import { DRAFT_PREFIX } from '../../constants';

const editorEl = $('#editor') as HTMLTextAreaElement;

export function getDraft(filePath: string): string | null {
  try { return localStorage.getItem(DRAFT_PREFIX + filePath); }
  catch { return null; }
}

export function saveDraft(): void {
  if (!state.currentPath || !state.isEditing || !state.isDirty) return;
  try { localStorage.setItem(DRAFT_PREFIX + state.currentPath, editorEl.value); }
  catch { /* quota exceeded */ }
}

export function clearDraft(filePath?: string): void {
  try { localStorage.removeItem(DRAFT_PREFIX + (filePath || state.currentPath || '')); }
  catch { /* ignore */ }
}

export function startDraftTimer(): void {
  stopDraftTimer();
  state.draftTimer = setInterval(saveDraft, 5000);
}

export function stopDraftTimer(): void {
  if (state.draftTimer) { clearInterval(state.draftTimer); state.draftTimer = null; }
}
