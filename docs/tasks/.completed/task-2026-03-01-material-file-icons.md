# Task: Apply material-file-icons to File Tree

- **Date:** 2026-03-01
- **Priority:** 🟡 Medium
- **Status:** ✅ Done

## Summary
Replace simple HTML entity emoji icons (📄, {}, ⚙, 🖼, 📰) with `material-file-icons` library (377 rich SVG icons) for proper file-type icon coverage.

## Approach
- Use `material-file-icons@2.4.0` via jsDelivr CDN
- Convert `app.js` to ES module for clean dynamic `import`
- Add CDN fallback so app still works offline (falls back to original emoji icons)

## Changes

### Phase 1: Implementation
- [x] `public/index.html` — Change script tag to `type="module"`
- [x] `public/app.js` — Dynamic import + replace `getFileIcon()` body (확장자 기준 정규화로 같은 확장자 = 같은 아이콘 보장)
- [x] `public/style.css` — Update icon styles for SVG rendering

## Verification
- Open app, expand file tree — verify diverse colorful SVG icons appear
- Toggle dark/light theme — icons should look good on both
- Check recent files list — same SVG icons
- Folder triangles (▶/▼) should be unchanged
- Disconnect network and reload — should fall back to emoji icons gracefully
