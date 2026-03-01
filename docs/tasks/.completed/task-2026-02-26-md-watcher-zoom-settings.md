# MD Watcher: Zoom Improvement + Settings Page

**Created:** 2026-02-26
**Priority:** 🟡 Medium
**Branch:** `feature/docs-viewer`
**Status:** Completed

---

## Goal
- Zoom (Ctrl++/-) operates separately for text and image contexts
- Add a settings dialog for font size, theme, word wrap, etc.

## Phase 1: Zoom System Refactor (Text/Image Separation)

- [x] Add `IMAGE_ZOOM_KEY` constant + `imageZoomLevel` state variable
- [x] `applyImageZoom()` → set CSS variable `--image-zoom`
- [x] Check `isImageFile(currentPath)` inside `zoomIn()`/`zoomOut()`/`zoomReset()`
- [x] CSS `.image-preview img` with `transform: scale(var(--image-zoom, 1))` + `overflow: auto`

## Phase 2: Settings Dialog UI (HTML + CSS)

- [x] `#settingsOverlay` HTML (font size, theme, word wrap, zoom reset)
- [x] Settings CSS (overlay, dialog, row styles)
- [x] Add gear icon `#btnSettings` to toolbar
- [x] Add `Ctrl+,` to keyboard shortcut help

## Phase 3: Settings Dialog Logic (app.js)

- [x] `FONT_SIZE_KEY`, `baseFontSize` state + `applyFontSize()`
- [x] Integrate CSS variable `--base-font-size` (preview, editor, line-numbers, live-preview)
- [x] Settings events: open/close, font size +/-, theme/word-wrap toggle, zoom reset

---

## Modified Files
- `public/app.js`
- `public/style.css`
- `public/index.html`
