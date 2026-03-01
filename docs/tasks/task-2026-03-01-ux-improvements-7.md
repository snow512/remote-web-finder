# Task: 7 UX/Feature Improvements

**Date:** 2026-03-01
**Priority:** 🟡 Medium
**Status:** ✅ Complete

## Summary
Implement 7 UX and feature improvements identified during bug hunting round 3 analysis, followed by 6 rounds of reinforcement and polish.

## Core Implementation (7 features)

### #10. Search Highlight Performance
- Added `lastSearchQuery` cache to prevent duplicate searches
- Increased debounce from 200ms to 300ms
- Reset cache in `closeContentSearch()` and `showPreview()`

### #4. Markdown Image Lazy-Load
- Added `marked.use()` with custom image renderer
- All `<img>` tags include `loading="lazy"` attribute
- XSS protection: quote escaping + `javascript:`/`vbscript:`/`data:` protocol blocking
- Null `href` guard

### #5. Sidebar Filter Result Counter
- Added `<span id="filterCount">` badge between search input and preset button
- Shows `"N / total"` format, `"No matches"` with warning color when 0 results

### #1. File URL Sharing (`?file=path`)
- Boot: parse `?file=` URL param after `await loadTree()`, expand tree, scroll into view
- `openFile()`: update URL via `history.replaceState`
- Cleanup: remove `?file=` on file delete, update on rename

### #9. Save Error Retry Banner
- Persistent red banner with Retry/Dismiss buttons (replaces toast)
- `isSaving` guard prevents duplicate saves
- Keyboard: Enter=Retry (skips textarea/input), Esc=Dismiss (integrated in main Escape chain)
- Retry button disabled styling + "Saving..." text during save
- Slide-down animation, error tooltip for truncated messages
- Banner hides on: successful save, file switch, edit mode enter, cancel edit

### #7. Focus Mode Toolbar/Status Bar Auto-Hide
- CSS: `opacity:0` + `pointer-events:none` in focus mode, transition 0.3s
- `focus-bars-visible` class restores visibility
- mousemove throttled at 100ms, keydown shows bars immediately
- 2-second auto-hide timer, fullscreenchange cleanup

### #8. Editor Undo/Redo Preservation
- `editorInsertAt(start, end, text)` helper using `execCommand('insertText')`
- Fallback to `.value =` when `execCommand` fails
- Applied to: `mdWrap`, `mdLinePrefix`, Tab handler, table/hr insertion

## Reinforcement (6 rounds, 21 fixes)

| Round | Fixes | Key Items |
|-------|-------|-----------|
| 2nd | 6 | XSS escape, filter "N/total", URL cleanup, save guard, mousemove throttle, execCommand fallback |
| 3rd | 5 | cancelEdit banner fix, "No matches", tree scroll on boot, banner keyboard, javascript: block |
| 4th | 3 | Enter/Esc keyboard conflicts, Escape chain integration, disabled button styling |
| 5th | 2 | Rename URL update, href null guard |
| 6th | 2 | Rename-in-edit draft migration, search cache reset on preview change |
| 7th | 3 | Banner slide animation, filter warning color, error tooltip |

## Files Modified
- `public/app.js` — All items
- `public/style.css` — #5, #7, #9
- `public/index.html` — #5, #9
