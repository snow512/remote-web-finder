# Task: Marquee Scroll + Long-Press Context Menu

- **Created:** 2026-03-02
- **Priority:** 🟡 Medium
- **Status:** ✅ Complete
- **Branch:** develop

---

## Goal
Fix long filenames being truncated with `...` in the sidebar tree.
Provide context menu access on mobile devices.

## Phase 1: Marquee Scroll on Active Tree Item
- [x] Add `overflow: hidden` to `.tree-item`
- [x] Add `@keyframes marqueeScroll` + `.marquee` styles
- [x] Implement `applyMarquee()` / `removeMarquee()` functions
- [x] Connect marquee to `openFile()`, `loadTree()`, drag-drop
- [x] Add `title` attribute to `.name` span (desktop hover tooltip)

## Phase 2: Long-Press Context Menu (Mobile)
- [x] Implement `initLongPress()` function (touchstart/touchmove/touchend)
- [x] Connect `initLongPress()` to file rows in `renderTree()`
- [x] Add `.long-press-holding` CSS style

## Post-implementation Fixes
- `applyMarquee()`: wrap in rAF for layout completion before measurement (`scrollWidth` accuracy)
- `initLongPress()`: `longPressTimer`/`longPressFired` global vars → closure-local vars for isolation
- CSS: `.tree-item .name` — add `flex: 1; min-width: 0` (fix truncation)

## Modified Files
- `public/style.css`
- `public/app.js`
