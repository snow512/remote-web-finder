# Remote Web Finder

Local markdown document viewer and editor with live preview.

Browse, read, and edit your markdown files through a clean web UI — no build step, no config required.

## Install & Usage

```bash
# Run directly (no install needed)
npx remote-web-finder

# Or install globally
npm i -g remote-web-finder
remote-web-finder
```

### Options

```
--dir <path>    Directory to serve (default: current directory)
--port <number> Port number (default: 5999)
--ignore <file> Custom ignore file (default: .rwfignore)
--open          Open browser automatically
--bg            Run in background (daemon mode)
--shutdown      Stop existing remote-web-finder on the same port
--help          Show help
--version       Show version
```

### Examples

```bash
# Serve current directory
npx remote-web-finder

# Serve a specific docs folder on port 3000
npx remote-web-finder --dir ./docs --port 3000

# Open browser automatically
npx remote-web-finder --dir ./docs --open

# Use custom ignore file
npx remote-web-finder --ignore ./my-ignore

# Run in background
npx remote-web-finder --dir ./docs --bg

# Stop existing process
remote-web-finder --shutdown
```

## Ignore File

Remote Web Finder uses `.rwfignore` to filter the file tree. Lookup order:

1. `--ignore <file>` (CLI option)
2. `.rwfignore` in the served directory (`--dir`)
3. Built-in default (ships with the package)

Syntax is gitignore-style:

```gitignore
# Comment
node_modules
*.log
.git
build/
!important.log    # negate — re-include
```

## Features

- Directory tree navigation with file count badges
- Markdown preview with syntax highlighting
- Inline editor with markdown toolbar
- Table of Contents with scroll tracking
- Code block copy button
- Internal link navigation (relative path click → file open)
- Table creation tool (rows × columns)
- File & folder create / rename / delete
- Editor draft auto-save (restore after refresh)
- Scroll position memory per file
- Focus mode (F11)
- Font zoom (Ctrl +/-/0)
- Dark mode support
- Mobile responsive
- Keyboard shortcuts (press `?` to see all)

## Built With

This project was built with AI assistance (Claude by Anthropic).

## License

MIT
