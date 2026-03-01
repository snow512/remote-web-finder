# Task: 7 UX/Feature Improvements

**Date:** 2026-03-01
**Priority:** 🟡 Medium
**Status:** ✅ Complete

## Summary
Implement 7 UX and feature improvements identified during bug hunting round 3 analysis.

## Changes

### #10. Search Highlight Performance
- Added `lastSearchQuery` cache to prevent duplicate searches
- Increased debounce from 200ms to 300ms
- Reset cache in `closeContentSearch()`

### #4. Markdown Image Lazy-Load
- Added `marked.use()` with custom image renderer
- All `<img>` tags now include `loading="lazy"` attribute

### #5. Sidebar Filter Result Counter
- Added `<span id="filterCount">` to search wrapper in `index.html`
- Counter shows visible file count during filtering
- Styled as compact badge between search input and preset button

### #1. File URL Sharing (`?file=path`)
- On boot: parse `?file=` URL param after `await loadTree()` and auto-open file
- In `openFile()`: update URL via `history.replaceState`

### #9. Save Error Retry Banner
- Added `.save-error-banner` element to `index.html`
- On save failure: show persistent red banner with Retry/Dismiss buttons (replaces toast)
- Banner hides on: successful save, file switch, entering edit mode

### #7. Focus Mode Toolbar/Status Bar Auto-Hide
- CSS: toolbar and status-bar fade out (`opacity:0`) in focus mode
- `.focus-bars-visible` class shows them temporarily
- JS: `mousemove`/`keydown` triggers 2-second visibility timer
- `fullscreenchange` handler cleans up listeners on exit

### #8. Editor Undo/Redo Preservation
- Added `editorInsertAt(start, end, text)` helper using `document.execCommand('insertText')`
- Replaced direct `.value =` assignments in: `mdWrap`, `mdLinePrefix`, Tab handler, table insertion, hr insertion
- Initial content load in `enterEditMode` unchanged (no undo history needed)

## Files Modified
- `public/app.js` — All items
- `public/style.css` — #5, #7, #9
- `public/index.html` — #5, #9
