# Changelog

All notable changes to this project will be documented in this file.

## [0.11.0-beta] - 2026-03-15

### Added
- CLI `--stop` command for stopping background server (PID file based)
- `RWF_PORT` environment variable (takes precedence over `PORT`)
- `rwf` usage added to help text
- File move (Move) functionality
- Custom filter panels (add/delete/apply)
- Dashboard "more" expand for recent/favorites lists
- Tree open/collapse and section collapse state saved to localStorage
- Client-side utility module (`public/utils.js`) — browser + Node testable
- Client-side unit tests: 48 tests (sanitizeHtml, isDangerousHref, path utils)
- Server test expansion: 47 → 148 test cases (+101)

### Security
- Markdown HTML sanitizer hardened: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<style>`, `on*` attributes, `javascript:` hrefs all blocked
- `esc()` escapes `"` → `&quot;` (attribute breakout prevention)
- POST `/api/file` uses `wx` flag for atomic creation (TOCTOU race prevention)
- All file API endpoints check `isFile()` — directory paths return 400
- `sendFile` converted to async error callback

### Fixed
- `sanitizeHtml(undefined)` crash (broke markdown preview for certain HTML comments)
- `JSON.parse(localStorage)` try/catch added (4 locations)
- Pinch zoom division-by-zero guard
- `updateLineNumbers` only rebuilds when line count changes (performance)
- `scrollPositions` Map capped at 50 entries (memory leak)
- All server catch blocks now include `console.error`
- `PUT /api/file` auto-creates parent directories
- `rmdirSync` → `rmSync` (deprecated API)
- Port NaN fallback to 5999
- Sidebar Tree/Filters flex ratio (71:29) with proper collapse behavior
- Sidebar section header height unified

### Removed
- `airAlert` dead code
- Unused CSS selectors (`.icon svg`, `.image-preview .image-name`)
- Duplicate/redundant CSS properties (6 items)
- `collectFiles` unused `basePath` parameter

## [0.10.0] - 2026-03-11

### Added
- Show Ignored Files toggle in Settings dialog
- `.env` support for `DIR` and `BG` options
- API test coverage (47 test cases)

### Changed
- Rewrite README.md and project docs to match implementation

## [0.9.0] - 2026-03-10

### Added
- Dashboard with recent files and favorites overview
- Favorites (pin/unpin) with persistent storage
- Image preview improvements (thumbnail in sidebar)
- Code block copy button HTTP environment fallback

### Fixed
- Various UI/UX bug fixes (5 items)

## [0.8.0] - 2026-03-09

### Added
- Large file handling with warning popup and read-only mode
- Image pinch zoom (trackpad + touch)
- Sidebar UX improvements (7 items)
- Filter presets for file tree

### Changed
- Edit/Save/Cancel buttons changed to icon buttons
- Recent section always visible with empty state message

### Refactored
- Extract common CSS utilities (hover-highlight, input-base, text-truncate, icon-container)
- Extract JS utilities (API builders, DOM helpers, path functions)
- Consolidate overlay/dialog/section-header components
- Consolidate zoom functions and panel mode reset

## [0.7.0] - 2026-03-02

### Added
- Sidebar marquee scroll for long filenames
- Mobile long-press context menu
- Filter reapply on tree changes
- Slide-up animation for banners

### Fixed
- Edit draft migration on file rename
- Save banner keyboard conflicts
- File delete/move/rename state cleanup
- Popup viewport clamping
- Search bar Escape key handling

### Refactored
- Extract common UI controls factory functions

## [0.6.0] - 2026-03-01

### Added
- Material file icons (377 SVG icons via CDN with timeout fallback)
- 7 UX/feature improvements (URL sync, rename guard, image renderer)

### Fixed
- Bug hunting and hardening pass (15 items)
- Save banner disabled styling
- Rename-in-edit draft migration

## [0.5.0] - 2026-03-01

### Added
- Recent files list with clear button
- `npm run install:global` script for tarball global install

### Changed
- All documentation converted to English
- Commit message language set to English

## [0.4.0] - 2026-02-28

### Added
- `rwf` shorthand CLI command
- Emoji logo (favicon + sidebar + welcome screen)

### Changed
- Removed unused CLI options (`--open`, `--ignore`, `--shutdown`)

## [0.3.0] - 2026-02-28

### Added
- In-file search (Ctrl+F)
- Drag & drop file move
- Editor draft auto-save and restore after refresh
- Scroll position memory per file
- Dark mode support
- Focus mode (F11)
- Font zoom (Ctrl +/-/0)
- Keyboard shortcuts help dialog (`?`)

## [0.2.0] - 2026-02-28

### Added
- Inline markdown editor with toolbar (bold, italic, heading, link, list, code, quote, table, hr)
- Table creation tool (rows x columns)
- File & folder create / rename / delete
- Code block copy button
- Internal link navigation (relative path click opens file)
- `.rwfignore` file support for filtering file tree
- Background daemon mode (`--bg`)
- CLI options (`-d`, `-p`, `-b`, `-h`, `-v`)

## [0.1.0] - 2026-02-28

### Added
- Directory tree navigation with file count badges
- Markdown preview with syntax highlighting (marked + highlight.js)
- Table of Contents with scroll tracking
- Mobile responsive layout
- Express server with static file serving
- `.env` support for `PORT`
