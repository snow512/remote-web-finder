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
| Runtime | Node.js (>=16) | |
| Server | Express 4 | |
| Test | Jest + Supertest | |
| Client | Vanilla HTML/CSS/JS | `public/` directory |

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
npm start                 # Start server (port 5999)
npm test                  # Run tests
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
├── server.js             → Express server main file (CLI entrypoint)
├── server.test.js        → Test file
├── package.json          → bin: rwf, remote-web-finder
├── .rwfignore            → File exclusion rules
├── .env                  → Environment variables (optional)
├── public/               → Static files (client)
│   ├── index.html        → Main HTML
│   ├── app.js            → Client application logic
│   └── style.css         → Styles
└── docs/                 → Documentation
    ├── project.md        → This file (project summary)
    ├── specs/            → Design documents
    ├── tasks/            → Task management
    ├── issues/           → Issue tracking
    └── decisions/        → Architecture decisions (ADR)
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
