# Task: MD Watcher — npm Package Separation
- **Created:** 2026-02-25
- **Priority:** 🟡 Medium
- **Branch:** `feature/docs-viewer`
- **Status:** 🔵 In Progress

---

## Goal

Separate the markdown viewer/editor into an independent npm package `remote-web-finder`.
Make it runnable anywhere via `npx remote-web-finder`.

---

## Phase 1: Package Structure

- [x] Rewrite `package.json` (bin, files, metadata)
- [x] Improve `server.js` CLI (shebang, --dir default to cwd, --help, --version, --open)
- [x] Create `.gitignore`
- [x] Create `.npmignore`

## Phase 2: Documentation

- [x] Write `README.md`
- [x] Create `LICENSE` (MIT)

## Phase 3: Verification & Release Preparation

- [x] Generate tarball with `npm pack` → verify contents (7 files, 21KB)
- [x] Test install in temp directory (--help, --version, server start, API check)
- [ ] Run `npm publish` after user confirmation

---

## Modified Files

| File | Action |
|------|--------|
| `package.json` | Rewrite |
| `server.js` | Shebang, CLI improvements |
| `.gitignore` | New |
| `.npmignore` | New |
| `README.md` | New |
| `LICENSE` | New |

**Frontend files (public/) unchanged**
