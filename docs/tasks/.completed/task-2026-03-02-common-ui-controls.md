# Task: Common UI Controls Refactoring

- **Date:** 2026-03-02
- **Priority:** 🟡 Medium
- **Status:** ✅ Complete

## Summary
Extract common popup/modal patterns into reusable factory functions to reduce duplication and improve consistency.

## Changes

### Utility Functions Added (`app.js`)
1. **`createPopupMenu({ containerEl, onClose })`** — Fixed-position popup with viewport clamping (rAF), auto outside-click close
2. **`createModalDialog({ overlayEl, closeBtn, onOpen, onClose })`** — Center overlay modal with backdrop click and close button auto-registration
3. **`onOutsideClick({ el, ignoreEls, onClose })`** — Generic outside-click handler with ignore list

### Refactored Components
| Component | Before | After |
|-----------|--------|-------|
| Context Menu | Manual position/display, separate outside-click handler | `createPopupMenu` instance |
| Settings Dialog | Manual open/close/backdrop handlers | `createModalDialog` instance |
| Shortcuts Dialog | Manual open/close/backdrop handlers | `createModalDialog` instance |
| Filter Preset Menu | Manual `document.addEventListener('click', ...)` | `onOutsideClick` call |
| Escape handler | `style.display` checks | `isOpen()` state checks |

### Not Changed
- Toast (already clean reusable function)
- Save Error Banner (unique animation state machine)
- Filter Preset Menu positioning (CSS relative, not popup)

## Verification
- [x] `npm test` — all 40 tests pass
- [ ] Context menu: right-click file → show/close
- [ ] Mobile long-press → context menu
- [ ] Settings dialog: open/close (button, backdrop, Escape)
- [ ] Shortcuts dialog: open/close (?, backdrop, Escape)
- [ ] Filter preset menu: outside-click close
