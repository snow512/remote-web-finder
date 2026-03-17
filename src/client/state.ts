import type { TreeItem } from '@shared/types';

export const state = {
  appVersion: '',
  currentPath: null as string | null,
  isEditing: false,
  isDirty: false,
  originalContent: '',
  treeData: [] as TreeItem[],
  livePreviewTimer: null as ReturnType<typeof setTimeout> | null,
  focusedTreeItem: null as HTMLElement | null,
  openFileController: null as AbortController | null,
  isLargeFile: false,
  draftTimer: null as ReturnType<typeof setInterval> | null,
  tocObserver: null as IntersectionObserver | null,
  scrollPositions: new Map<string, number>(),
  saveController: null as AbortController | null,
  isSaving: false,
  isFocusMode: false,
  zoomLevel: 1.0,
  imageZoomLevel: 1.0,
  baseFontSize: 14,

  // Context menu
  ctxTargetPath: null as string | null,
  ctxTargetType: 'file' as 'file' | 'dir',

  // Search
  searchMatches: [] as HTMLElement[],
  searchIdx: -1,
  lastSearchQuery: '',
  searchTimer: null as ReturnType<typeof setTimeout> | null,
  largeSearchPositions: [] as number[],
  largeSearchFullText: '',

  // Filter presets
  activePreset: null as { label: string; exts: string } | null,
  presetEditMode: false,

  // List context menu
  listCtxTarget: null as { path: string; type: 'recent' | 'favorite' } | null,

  // Internal
  _prevLineCount: 0,
  isResizing: false,
  bannerHideHandler: null as (() => void) | null,
  focusBarsTimer: null as ReturnType<typeof setTimeout> | null,
  focusMoveThrottled: false,
  materialGetIcon: null as ((name: string) => { svg?: string } | null) | null,
};
