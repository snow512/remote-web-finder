#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');

// --- Pattern matching (exported for testing) ---
function matchPattern(name, pattern) {
  // Remove trailing slash (directory hint — we match by name regardless)
  const pat = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
  if (!pat.includes('*')) return name === pat;
  // Simple glob: convert * to regex
  const regex = new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return regex.test(name);
}

// --- App factory (exported for testing) ---
function createApp(docsDir, ignorePatterns) {
  const resolvedDir = path.resolve(docsDir);

  function isIgnored(name) {
    let ignored = false;
    for (const pattern of ignorePatterns) {
      if (pattern.startsWith('!')) {
        if (matchPattern(name, pattern.slice(1))) ignored = false;
      } else {
        if (matchPattern(name, pattern)) ignored = true;
      }
    }
    return ignored;
  }

  function buildTree(dirPath, relBase) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(e => !isIgnored(e.name))
      .sort((a, b) => {
        // directories first, then alphabetical
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    return entries.map(entry => {
      const rel = path.join(relBase, entry.name);
      if (entry.isDirectory()) {
        return { name: entry.name, path: rel, type: 'dir', children: buildTree(path.join(dirPath, entry.name), rel) };
      }
      return { name: entry.name, path: rel, type: 'file' };
    });
  }

  function safePath(relPath) {
    const resolved = path.resolve(resolvedDir, relPath);
    // Ensure resolved path is exactly docsDir or inside it (prevent /docs vs /docs2 bypass)
    if (resolved !== resolvedDir && !resolved.startsWith(resolvedDir + path.sep)) return null;
    return resolved;
  }

  const app = express();
  app.use(express.text({ type: '*/*', limit: '5mb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  // --- API ---
  app.get('/api/tree', (_req, res) => {
    try {
      res.json(buildTree(resolvedDir, ''));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/file', (req, res) => {
    const filePath = safePath(req.query.path || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    try {
      res.type('text/plain').send(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/raw', (req, res) => {
    const filePath = safePath(req.query.path || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    try {
      res.sendFile(filePath);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/file', (req, res) => {
    const filePath = safePath(req.query.path || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    try {
      fs.writeFileSync(filePath, req.body, 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/file', (req, res) => {
    const filePath = safePath(req.query.path || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    if (fs.existsSync(filePath)) return res.status(409).json({ error: 'File already exists' });
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, req.body || '', 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/file', (req, res) => {
    const oldPath = safePath(req.query.path || '');
    const newPath = safePath(req.query.newPath || '');
    if (!oldPath || !newPath) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'Source not found' });
    if (fs.existsSync(newPath)) return res.status(409).json({ error: 'Destination already exists' });
    try {
      const dir = path.dirname(newPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.renameSync(oldPath, newPath);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/file', (req, res) => {
    const filePath = safePath(req.query.path || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    try {
      fs.unlinkSync(filePath);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Folder API ---
  app.post('/api/folder', (req, res) => {
    const folderPath = safePath(req.query.path || '');
    if (!folderPath) return res.status(400).json({ error: 'Invalid path' });
    if (fs.existsSync(folderPath)) return res.status(409).json({ error: 'Already exists' });
    try {
      fs.mkdirSync(folderPath, { recursive: true });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/folder', (req, res) => {
    const folderPath = safePath(req.query.path || '');
    if (!folderPath) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(folderPath)) return res.status(404).json({ error: 'Not found' });
    try {
      const stat = fs.statSync(folderPath);
      if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });
      const entries = fs.readdirSync(folderPath);
      if (entries.length > 0) return res.status(400).json({ error: 'Folder is not empty' });
      fs.rmdirSync(folderPath);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}

module.exports = { createApp, matchPattern };

// --- CLI entry point ---
if (require.main === module) {
  const args = process.argv.slice(2);
  function getArg(names, fallback) {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      const idx = args.indexOf(name);
      if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    }
    return fallback;
  }
  function hasFlag(names) {
    const list = Array.isArray(names) ? names : [names];
    return list.some(n => args.includes(n));
  }

  // --help
  if (hasFlag('--help') || hasFlag('-h')) {
    const pkg = require('./package.json');
    console.log(`
${pkg.name} v${pkg.version} — ${pkg.description}

Usage:
  remote-web-finder [options]
  npx remote-web-finder [options]

Options:
  -d, --dir <path>    Directory to serve (default: .)
  -p, --port <number> Port number (default: 5999)
  -b, --bg            Run in background (daemon mode)
  -h, --help          Show this help
  -v, --version       Show version

Ignore files:
  Place a .rwfignore file in the served directory to customize
  which files are hidden. Falls back to the built-in default.
`);
    process.exit(0);
  }

  // --version
  if (hasFlag('--version') || hasFlag('-v')) {
    const pkg = require('./package.json');
    console.log(pkg.version);
    process.exit(0);
  }

  const PORT = parseInt(getArg(['-p', '--port'], '5999'), 10);

  // --bg: re-spawn as detached background process
  if (hasFlag(['-b', '--bg']) && !process.env.__RWF_BG) {
    const { spawn } = require('child_process');
    const filteredArgs = args.filter(a => a !== '--bg' && a !== '-b');
    const child = spawn(process.execPath, [__filename, ...filteredArgs], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, __RWF_BG: '1' },
    });
    child.unref();
    const dir = path.resolve(getArg(['-d', '--dir'], '.'));
    console.log(`Remote Web Finder started in background (PID: ${child.pid})`);
    console.log(`  http://localhost:${PORT}  →  ${dir}`);
    console.log(`  Stop: kill ${child.pid}`);
    process.exit(0);
  }

  const DOCS_DIR = path.resolve(getArg(['-d', '--dir'], '.'));

  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Error: directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  // --- ignore file loading (CoC: .rwfignore in DOCS_DIR > built-in default) ---
  function loadIgnorePatterns() {
    const candidates = [
      path.join(DOCS_DIR, '.rwfignore'),
      path.join(__dirname, '.rwfignore'),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
        const patterns = [];
        for (const raw of lines) {
          const line = raw.trim();
          if (!line || line.startsWith('#')) continue;
          patterns.push(line);
        }
        console.log(`Ignore file: ${filePath} (${patterns.filter(p => !p.startsWith('!')).length} rules)`);
        return patterns;
      }
    }
    return [];
  }

  const ignorePatterns = loadIgnorePatterns();
  const app = createApp(DOCS_DIR, ignorePatterns);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Remote Web Finder running at http://localhost:${PORT}`);
    console.log(`Serving docs from: ${DOCS_DIR}`);
  });
}
