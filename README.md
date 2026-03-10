# Remote Web Finder

Local markdown document viewer and editor with live preview.

Browse, read, and edit your markdown files through a clean web UI — no build step, no config required.

## Install & Usage

```bash
# Run directly (no install needed)
npx remote-web-finder

# Or install globally
npm i -g remote-web-finder
rwf
```

## CLI Options

```
-d, --dir <path>    Directory to serve (default: . | env: DIR)
-p, --port <number> Port number (default: 5999 | env: PORT)
-b, --bg            Run in background (daemon mode | env: BG=true)
-h, --help          Show this help
-v, --version       Show version
```

### Examples

```bash
# Serve current directory on default port (5999)
npx remote-web-finder

# Serve a specific folder on port 3000
npx remote-web-finder -d ./docs -p 3000

# Run in background
npx remote-web-finder -d ./docs -b
```

## Environment Variables

Create a `.env` file in the project root to set defaults:

```env
PORT=5999
DIR=.
BG=true
```

CLI options take precedence over `.env` values.

## Ignore File

Remote Web Finder uses `.rwfignore` to filter the file tree. Lookup order:

1. `.rwfignore` in the served directory (`--dir`)
2. `.rwfignore` in the package directory (built-in default)

Syntax is gitignore-style:

```gitignore
# Comment
node_modules
*.log
.git
build/
!important.log    # negate — re-include
```

You can also toggle ignored file visibility from **Settings > Show Ignored Files** in the web UI.

## Features

- Directory tree navigation with file count badges
- Markdown preview with syntax highlighting
- Inline editor with markdown toolbar
- Table of Contents with scroll tracking
- Code block copy button
- Internal link navigation (relative path click → file open)
- Table creation tool (rows × columns)
- File & folder create / rename / delete
- Drag & drop file move
- Editor draft auto-save (restore after refresh)
- Scroll position memory per file
- Recent files & favorites
- Filter presets for file tree
- Show/hide ignored files toggle
- Focus mode (F11)
- Font zoom (Ctrl +/-/0)
- Dark mode support
- Mobile responsive
- Keyboard shortcuts (press `?` to see all)

## API

All endpoints operate on the directory specified by `--dir`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tree` | File tree (JSON). `?showIgnored=true` to include ignored files |
| GET | `/api/file?path=` | Read file content (UTF-8) |
| HEAD | `/api/file?path=` | File metadata (Content-Length) |
| GET | `/api/raw?path=` | Raw file download |
| PUT | `/api/file?path=` | Update file content |
| POST | `/api/file?path=` | Create new file |
| DELETE | `/api/file?path=` | Delete file |
| POST | `/api/folder?path=` | Create folder |
| DELETE | `/api/folder?path=` | Delete empty folder |
| PATCH | `/api/rename?path=&newPath=` | Rename / move file or folder |

## Tech Stack

- **Runtime:** Node.js (>=16)
- **Server:** Express 4
- **Client:** Vanilla HTML/CSS/JS (no build step)
- **Test:** Jest + Supertest

## License

MIT
