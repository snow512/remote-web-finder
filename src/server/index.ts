#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { createApp } from './app';

function loadPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'));
}

const pkg = loadPackageJson();
const args = process.argv.slice(2);

function getArg(names: string | string[], fallback?: string): string | undefined {
  const list = Array.isArray(names) ? names : [names];
  for (const name of list) {
    const idx = args.indexOf(name);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  }
  return fallback;
}

function hasFlag(names: string | string[]): boolean {
  const list = Array.isArray(names) ? names : [names];
  return list.some(n => args.includes(n));
}

// --help
if (hasFlag('--help') || hasFlag('-h')) {
  console.log(`
${pkg.name} v${pkg.version} — ${pkg.description}

Usage:
  rwf [options]
  remote-web-finder [options]
  npx remote-web-finder [options]

Options:
  -d, --dir <path>    Directory to serve (default: . | env: DIR)
  -p, --port <number> Port number (default: 5999 | env: PORT)
  -b, --bg            Run in background (daemon mode | env: BG=true)
  --stop              Stop the background server
  -h, --help          Show this help
  -v, --version       Show version

Environment variables (.env):
  RWF_PORT  Port number (takes precedence over PORT)
  PORT      Port number (default: 5999)
  DIR       Directory to serve (default: .)
  BG        Run in background when "true"

Ignore files:
  Place a .rwfignore file in the served directory to customize
  which files are hidden. Falls back to the built-in default.
`);
  process.exit(0);
}

// --version
if (hasFlag('--version') || hasFlag('-v')) {
  console.log(pkg.version);
  process.exit(0);
}

// PID file path
const PID_FILE = path.join(__dirname, '..', '.rwf.pid');

// --stop
if (hasFlag('--stop')) {
  if (!fs.existsSync(PID_FILE)) {
    console.log('No running server found (PID file missing)');
    process.exit(0);
  }
  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
  try {
    process.kill(pid, 0);
    process.kill(pid, 'SIGTERM');
    fs.unlinkSync(PID_FILE);
    console.log(`Server stopped (PID: ${pid})`);
  } catch (err: any) {
    fs.unlinkSync(PID_FILE);
    if (err.code === 'ESRCH') {
      console.log(`Server was not running (stale PID: ${pid}), cleaned up`);
    } else {
      console.error(`Failed to stop server (PID: ${pid}):`, err.message);
    }
  }
  process.exit(0);
}

// Load .env file if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
}

const PORT = parseInt(getArg(['-p', '--port'], process.env.RWF_PORT || process.env.PORT || '5999')!, 10) || 5999;
const DIR_ARG = getArg(['-d', '--dir'], process.env.DIR || '.')!;
const isBg = hasFlag(['-b', '--bg']) || process.env.BG === 'true';

// --bg: re-spawn as detached background process
if (isBg && !process.env.__RWF_BG) {
  const { spawn } = require('child_process');
  const filteredArgs = args.filter(a => a !== '--bg' && a !== '-b');
  const child = spawn(process.execPath, [__filename, ...filteredArgs], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, __RWF_BG: '1' },
  });
  child.unref();
  const dir = path.resolve(DIR_ARG);
  console.log(`Remote Web Finder started in background (PID: ${child.pid})`);
  console.log(`  http://localhost:${PORT}  →  ${dir}`);
  console.log(`  Stop: node server.js --stop`);
  process.exit(0);
}

const DOCS_DIR = path.resolve(DIR_ARG);

if (!fs.existsSync(DOCS_DIR)) {
  console.error(`Error: directory not found: ${DOCS_DIR}`);
  process.exit(1);
}

function loadIgnorePatterns(): string[] {
  const candidates = [
    path.join(DOCS_DIR, '.rwfignore'),
    path.join(__dirname, '..', '.rwfignore'),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
      const patterns: string[] = [];
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

// Write PID file immediately for background mode
if (process.env.__RWF_BG) {
  fs.writeFileSync(PID_FILE, String(process.pid));
}

const ignorePatterns = loadIgnorePatterns();
const app = createApp(DOCS_DIR, ignorePatterns);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Remote Web Finder running at http://localhost:${PORT}`);
  console.log(`Serving docs from: ${DOCS_DIR}`);
});

function cleanup() {
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch { /* ignore */ }
}
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('SIGINT', () => { cleanup(); process.exit(0); });
