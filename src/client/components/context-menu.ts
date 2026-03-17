import { $ } from '../utils/dom';
import { state } from '../state';
import { getFileName, getDirPath, getDirName } from '@shared/utils';
import { API, throwIfNotOk } from '../api';
import { createPopupMenu } from './dialog';
import { airError, airConfirm, airPrompt } from './dialog';
import { showToast } from './toast';
import { isFavorite, toggleFavorite, removeFavorite } from './sidebar/favorites';
import { addRecent, removeRecent, getTreeRow } from './sidebar/recent';
import { renderBreadcrumb } from './breadcrumb';
import { expandPathTo, updateFileUrl } from './tree/helpers';
import { clearDraft, saveDraft } from './editor/draft';

const contextMenu = $('#contextMenu');
const ctxFavorite = $('#ctxFavorite');
const ctxRename = $('#ctxRename');
const ctxMove = $('#ctxMove');
const ctxCopy = $('#ctxCopy');
const ctxNewFile = $('#ctxNewFile');
const ctxNewFolder = $('#ctxNewFolder');
const ctxDelete = $('#ctxDelete');
const listCtxMenuEl = $('#listCtxMenu');
const listCtxRemove = $('#listCtxRemove');

let loadTreeFn: (() => Promise<void>) | null = null;
let refreshTreeAndSelectFn: ((filePath: string | null) => Promise<void>) | null = null;
let expandAndOpenFileFn: ((filePath: string, enterEdit?: boolean) => Promise<void>) | null = null;
let showWelcomeScreenFn: (() => void) | null = null;

export function setContextMenuDeps(deps: {
  loadTree: typeof loadTreeFn;
  refreshTreeAndSelect: typeof refreshTreeAndSelectFn;
  expandAndOpenFile: typeof expandAndOpenFileFn;
  showWelcomeScreen: typeof showWelcomeScreenFn;
}) {
  loadTreeFn = deps.loadTree;
  refreshTreeAndSelectFn = deps.refreshTreeAndSelect;
  expandAndOpenFileFn = deps.expandAndOpenFile;
  showWelcomeScreenFn = deps.showWelcomeScreen;
}

const ctxMenu = createPopupMenu({
  containerEl: contextMenu,
  onClose() { state.ctxTargetPath = null; }
});

const listCtxMenu = createPopupMenu({
  containerEl: listCtxMenuEl,
  onClose() { state.listCtxTarget = null; }
});

export function showContextMenu(e: { preventDefault: () => void; clientX: number; clientY: number }, targetPath: string, type: string = 'file'): void {
  e.preventDefault();
  state.ctxTargetPath = targetPath;
  state.ctxTargetType = type as 'file' | 'dir';
  const isDir = type === 'dir';
  const fav = !isDir && isFavorite(targetPath);
  ctxFavorite.textContent = fav ? '☆ Unfavorite' : '★ Favorite';
  ctxFavorite.style.display = isDir ? 'none' : '';
  ctxCopy.style.display = isDir ? 'none' : '';
  ctxNewFile.style.display = isDir ? '' : 'none';
  ctxNewFolder.style.display = isDir ? '' : 'none';
  ctxDelete.style.display = '';
  ctxMenu.show(e.clientX, e.clientY);
}

export function closeContextMenu(): void { ctxMenu.close(); }

export function showListCtxMenu(x: number, y: number, filePath: string, type: 'recent' | 'favorite'): void {
  state.listCtxTarget = { path: filePath, type };
  listCtxMenu.show(x, y);
}

export { ctxMenu, listCtxMenu };

export function initContextMenu(): void {
  listCtxRemove.addEventListener('click', () => {
    if (!state.listCtxTarget) return;
    const { path, type } = state.listCtxTarget;
    const name = getFileName(path);
    listCtxMenu.close();
    if (type === 'recent') {
      removeRecent(path);
      showToast(`Removed from recent: ${name}`, 'info');
    } else {
      removeFavorite(path);
      showToast(`Removed from favorites: ${name}`, 'info');
    }
  });

  ctxFavorite.addEventListener('click', () => {
    const target = state.ctxTargetPath;
    closeContextMenu();
    if (target) toggleFavorite(target);
  });

  ctxDelete.addEventListener('click', async () => {
    const target = state.ctxTargetPath;
    const type = state.ctxTargetType;
    closeContextMenu();
    if (!target) return;
    const label = type === 'dir' ? 'folder' : 'file';
    if (!(await airConfirm(`Delete ${label} "${target}"?`, { okText: 'Delete', danger: true }))) return;
    try {
      const endpoint = type === 'dir' ? API.folder(target) : API.file(target);
      const res = await fetch(endpoint, { method: 'DELETE' });
      await throwIfNotOk(res);
      showToast(`Deleted: ${target}`, 'success');
      if (type === 'file') {
        removeRecent(target);
        clearDraft(target);
        if (state.currentPath === target) {
          if (showWelcomeScreenFn) showWelcomeScreenFn();
          updateFileUrl(null);
        }
      }
      if (loadTreeFn) await loadTreeFn();
    } catch (err: any) { airError('Delete failed', err.message); }
  });

  ctxRename.addEventListener('click', async () => {
    const target = state.ctxTargetPath;
    const type = state.ctxTargetType;
    closeContextMenu();
    if (!target) return;
    const name = getFileName(target);
    const dirPart = getDirPath(target);
    const newName = await airPrompt('Rename to:', name);
    if (!newName || newName === name) return;
    const newPath = dirPart + newName;
    try {
      const res = await fetch(API.rename(target, newPath), { method: 'PATCH' });
      await throwIfNotOk(res);
      showToast(`Renamed: ${name} → ${newName}`, 'success');
      if (type === 'file') {
        removeRecent(target);
        if (state.currentPath === target) {
          clearDraft(target);
          state.currentPath = newPath;
          if (state.isEditing && state.isDirty) saveDraft();
          renderBreadcrumb(newPath);
          addRecent(newPath);
          updateFileUrl(newPath);
        }
      } else if (type === 'dir' && state.currentPath?.startsWith(target + '/')) {
        const updatedPath = newPath + state.currentPath.substring(target.length);
        clearDraft(state.currentPath);
        state.currentPath = updatedPath;
        if (state.isEditing && state.isDirty) saveDraft();
        renderBreadcrumb(updatedPath);
        updateFileUrl(updatedPath);
      }
      if (refreshTreeAndSelectFn) await refreshTreeAndSelectFn(state.currentPath);
    } catch (err: any) { airError('Rename failed', err.message); }
  });

  ctxMove.addEventListener('click', async () => {
    const target = state.ctxTargetPath;
    const type = state.ctxTargetType;
    closeContextMenu();
    if (!target) return;
    const name = getFileName(target);
    const currentDir = getDirName(target);
    const destDir = await airPrompt('Move to folder:', currentDir);
    if (destDir == null || destDir === currentDir) return;
    const newPath = destDir ? destDir + '/' + name : name;
    try {
      const res = await fetch(API.rename(target, newPath), { method: 'PATCH' });
      await throwIfNotOk(res);
      showToast(`Moved: ${name} → ${destDir || '/'}`, 'success');
      if (type === 'file') {
        removeRecent(target);
        if (state.currentPath === target) {
          clearDraft(target);
          state.currentPath = newPath;
          if (state.isEditing && state.isDirty) saveDraft();
          renderBreadcrumb(newPath);
          addRecent(newPath);
          updateFileUrl(newPath);
        }
      } else if (type === 'dir' && state.currentPath?.startsWith(target + '/')) {
        const updatedPath = newPath + state.currentPath.substring(target.length);
        clearDraft(state.currentPath);
        state.currentPath = updatedPath;
        if (state.isEditing && state.isDirty) saveDraft();
        renderBreadcrumb(updatedPath);
        updateFileUrl(updatedPath);
      }
      if (refreshTreeAndSelectFn) await refreshTreeAndSelectFn(state.currentPath);
    } catch (err: any) { airError('Move failed', err.message); }
  });

  ctxCopy.addEventListener('click', async () => {
    const target = state.ctxTargetPath;
    closeContextMenu();
    if (!target) return;
    const name = getFileName(target);
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
    const base = ext ? name.substring(0, name.lastIndexOf('.')) : name;
    const defaultName = `${base} (copy)${ext}`;
    const newName = await airPrompt('Copy as:', defaultName);
    if (!newName || newName === name) return;
    const dirPart = getDirPath(target);
    const newPath = dirPart + newName;
    try {
      const srcRes = await fetch(API.file(target));
      await throwIfNotOk(srcRes);
      const content = await srcRes.text();
      const createRes = await fetch(API.file(newPath), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: content });
      await throwIfNotOk(createRes);
      showToast(`Copied: ${newName}`, 'success');
      if (loadTreeFn) await loadTreeFn();
      if (expandAndOpenFileFn) await expandAndOpenFileFn(newPath);
    } catch (err: any) { airError('Copy failed', err.message); }
  });

  ctxNewFile.addEventListener('click', async () => {
    const dirPath = state.ctxTargetPath;
    closeContextMenu();
    if (!dirPath) return;
    const fileName = await airPrompt('New file name:');
    if (!fileName) return;
    const newPath = dirPath + '/' + fileName;
    try {
      const res = await fetch(API.file(newPath), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '' });
      await throwIfNotOk(res);
      showToast(`Created: ${fileName}`, 'success');
      if (loadTreeFn) await loadTreeFn();
      if (expandAndOpenFileFn) await expandAndOpenFileFn(newPath, true);
    } catch (err: any) { airError('Create failed', err.message); }
  });

  ctxNewFolder.addEventListener('click', async () => {
    const dirPath = state.ctxTargetPath;
    closeContextMenu();
    if (!dirPath) return;
    const folderName = await airPrompt('New folder name:');
    if (!folderName) return;
    const newPath = dirPath + '/' + folderName;
    try {
      const res = await fetch(API.folder(newPath), { method: 'POST' });
      await throwIfNotOk(res);
      showToast(`Created folder: ${folderName}`, 'success');
      if (loadTreeFn) await loadTreeFn();
      expandPathTo(newPath + '/dummy');
    } catch (err: any) { airError('Create folder failed', err.message); }
  });
}
