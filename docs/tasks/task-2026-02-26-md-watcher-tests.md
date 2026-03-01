# MD Watcher Test Code

**Priority:** 🟡 Medium
**Status:** Completed
**Branch:** `feature/docs-viewer`
**Created:** 2026-02-26

---

## Goal
Write tests for md-watcher's server.js. Verify API endpoints, utility functions (pattern matching, tree building, path security).

## Phase 1: Refactor + Write Tests

- [x] Refactor server.js: extract `createApp()` factory, add `module.exports`, guard CLI logic with `require.main === module`
- [x] Create server.test.js (Jest + Supertest)
- [x] Add jest + supertest devDeps and test script to package.json
- [x] Confirm `npm test` passes — **40 tests passed (0.52s)**

### Test Coverage
1. **Utility function unit tests**: matchPattern() — exact match, wildcard, directory slash
2. **API integration tests**: GET /api/tree, GET /api/file, GET /api/raw, PUT /api/file, POST /api/file, PATCH /api/file, DELETE /api/file, POST /api/folder, DELETE /api/folder
3. **Security tests**: ../ traversal blocked (safePath)
