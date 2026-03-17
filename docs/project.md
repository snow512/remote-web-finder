# Project Summary

This file manages the project's summary information.
See individual documents in `docs/specs/` for detailed specifications.

---

## Project Overview

- **Name:** Remote Web Finder (rwf)
- **Description:** Local markdown document viewer and editor with live preview
- **Type:** Node.js CLI tool + web server
- **Repository:** https://github.com/snow512/remote-web-finder

---

## Tech Stack

| Area | Choice | Notes |
|------|--------|-------|
| Language | TypeScript (strict) | Server + Client |
| Runtime | Node.js (>=16) | |
| Server | Express 4 | `src/server/` → tsc → `dist/server/` |
| Client | Vanilla TS + Vite | `src/client/` → Vite → `dist/public/` |
| Test | Jest + Supertest | |
| Shared | TypeScript modules | `src/shared/` (types, utils) |

---

## How to Run

### CLI
```bash
# Run directly
npx remote-web-finder

# Global install
npm i -g remote-web-finder
rwf
```

### Development
```bash
npm run build             # Build server (tsc) + client (Vite)
npm run build:server      # Build server only
npm run build:client      # Build client only
npm run dev               # Run built server
npm start                 # Build + run
npm test                  # Run tests (196 tests)
npm run typecheck         # Type-check server + client
```

### CLI Options

| Option | Description | Default | Env |
|--------|-------------|---------|-----|
| `-d, --dir <path>` | Directory to serve | `.` | `DIR` |
| `-p, --port <number>` | Port number | `5999` | `PORT` |
| `-b, --bg` | Background daemon mode | off | `BG=true` |
| `-h, --help` | Show help | - | - |
| `-v, --version` | Show version | - | - |

Priority: CLI option > `.env` > default value

### Environment Variables (.env)

```env
PORT=5999
DIR=.
BG=true
```

---

## Port Configuration

| Purpose | Port | Notes |
|---------|------|-------|
| Default port | **5999** | Configurable via `-p` option or `PORT` env |

---

## Directory Structure

```
remote-web-finder/
├── src/                     → TypeScript source
│   ├── server/              → Express server
│   │   ├── index.ts         → CLI entrypoint
│   │   ├── app.ts           → Express app factory
│   │   ├── routes/          → API route handlers (tree, file, folder, rename, version)
│   │   └── utils/           → Server utilities (pattern, ignore, safePath)
│   ├── client/              → Client application (Vite)
│   │   ├── main.ts          → Client entrypoint + boot
│   │   ├── index.html       → HTML template
│   │   ├── style.css        → Styles
│   │   ├── state.ts         → Global state
│   │   ├── api.ts           → API client
│   │   ├── constants.ts     → Constants + localStorage keys
│   │   ├── components/      → UI components
│   │   │   ├── tree/        → File tree (render, navigation, filter, helpers)
│   │   │   ├── editor/      → Editor (editor, toolbar, draft, line-numbers)
│   │   │   ├── sidebar/     → Sidebar (recent, favorites, sections, resize, custom-filters)
│   │   │   ├── preview.ts   → Markdown preview + TOC
│   │   │   ├── dialog.ts    → Dialogs (confirm, prompt, error)
│   │   │   ├── search.ts    → In-content search
│   │   │   ├── context-menu.ts → Right-click menus + file ops
│   │   │   ├── settings.ts  → Settings dialog
│   │   │   └── ...          → toast, theme, icons, breadcrumb, zoom, focus-mode, status-bar
│   │   └── utils/           → Client utilities (dom)
│   └── shared/              → Shared between server + client
│       ├── types.ts         → TreeItem type
│       └── utils.ts         → Shared utility functions
├── dist/                    → Compiled output (gitignored)
├── server.js                → Legacy wrapper (delegates to dist/)
├── server.test.js           → Server API tests
├── utils.test.js            → Utility function tests
├── tsconfig.json            → Server TypeScript config
├── tsconfig.client.json     → Client TypeScript config
├── vite.config.ts           → Vite build config
├── package.json             → bin: rwf, remote-web-finder
├── .rwfignore               → File exclusion rules
└── docs/                    → Documentation
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tree` | File tree JSON. `?showIgnored=true` to include ignored files |
| GET | `/api/file?path=` | Read file content |
| HEAD | `/api/file?path=` | File metadata |
| GET | `/api/raw?path=` | Raw file download |
| PUT | `/api/file?path=` | Update file |
| POST | `/api/file?path=` | Create file |
| DELETE | `/api/file?path=` | Delete file |
| POST | `/api/folder?path=` | Create folder |
| DELETE | `/api/folder?path=` | Delete empty folder |
| PATCH | `/api/rename?path=&newPath=` | Rename / move |

---

## Current Development Stage

Check files in `docs/tasks/` for currently active work items.
