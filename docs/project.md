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

### CLI (Global Install)
```bash
npm install -g .          # Global install
rwf                       # Default run (port 5999)
rwf -p 6999               # Specify port
rwf -d /path/to/docs      # Specify directory
rwf --open                # Auto-open browser
rwf -b                    # Background mode
rwf --shutdown            # Stop server
```

### Development Mode
```bash
npm start                 # Start server (port 5999)
npm test                  # Run tests
```

### CLI Options
| Option | Description | Default |
|--------|-------------|---------|
| `-d, --dir <path>` | Directory to serve | `.` (current directory) |
| `-p, --port <number>` | Port number | `5999` |
| `--ignore <file>` | Custom ignore file | `.rwfignore` |
| `--open` | Auto-open browser | off |
| `-b, --bg` | Background daemon mode | off |
| `--shutdown` | Stop existing server on same port | - |
| `-h, --help` | Help | - |
| `-v, --version` | Show version | - |

---

## Port Configuration

| Purpose | Port | Notes |
|---------|------|-------|
| Default port | **5999** | Changeable via `-p` option |

---

## Directory Structure

```
remote-web-finder/
├── server.js             → Express server main file (CLI entrypoint)
├── server.test.js        → Test file
├── package.json          → bin: rwf, remote-web-finder
├── public/               → Static files (client)
├── .rwfignore            → File exclusion rules
├── docs/                 → Documentation
│   ├── project.md        → This file (project summary)
│   ├── specs/            → Design documents
│   ├── tasks/            → Task management
│   ├── issues/           → Issue tracking
│   └── decisions.md      → Architecture decisions
├── CLAUDE.md             → Claude task management (entrypoint)
└── project-init.md       → Project initialization guide
```

---

## Current Development Stage

Check files in `docs/tasks/` for currently active work items.
