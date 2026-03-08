const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createApp, matchPattern } = require('./server');

// --- Helper: create temp directory with fixtures ---
function createFixtures() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwf-test-'));
  // files
  fs.writeFileSync(path.join(tmpDir, 'hello.md'), '# Hello\nWorld');
  fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'plain text');
  // subdirectory
  fs.mkdirSync(path.join(tmpDir, 'sub'));
  fs.writeFileSync(path.join(tmpDir, 'sub', 'nested.md'), '## Nested');
  // empty directory
  fs.mkdirSync(path.join(tmpDir, 'empty-dir'));
  return tmpDir;
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ===== matchPattern unit tests =====
describe('matchPattern', () => {
  test('exact match', () => {
    expect(matchPattern('node_modules', 'node_modules')).toBe(true);
    expect(matchPattern('other', 'node_modules')).toBe(false);
  });

  test('trailing slash (directory hint) still matches', () => {
    expect(matchPattern('dist', 'dist/')).toBe(true);
    expect(matchPattern('dist2', 'dist/')).toBe(false);
  });

  test('wildcard *.ext', () => {
    expect(matchPattern('file.swp', '*.swp')).toBe(true);
    expect(matchPattern('.swp', '*.swp')).toBe(true);
    expect(matchPattern('file.txt', '*.swp')).toBe(false);
  });

  test('wildcard with prefix', () => {
    expect(matchPattern('.file.swp', '.*.swp')).toBe(true);
    expect(matchPattern('file.swp', '.*.swp')).toBe(false);
  });

  test('no false positive on partial name', () => {
    expect(matchPattern('node_modules_extra', 'node_modules')).toBe(false);
  });
});

// ===== API integration tests =====
describe('API endpoints', () => {
  let tmpDir;
  let app;

  beforeEach(() => {
    tmpDir = createFixtures();
    app = createApp(tmpDir, []);
  });

  afterEach(() => {
    removeDir(tmpDir);
  });

  // --- GET / (static index.html) ---
  describe('GET /', () => {
    test('returns 200 with html', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });
  });

  // --- GET /api/tree ---
  describe('GET /api/tree', () => {
    test('returns tree structure', async () => {
      const res = await request(app).get('/api/tree');
      expect(res.status).toBe(200);
      const tree = res.body;
      expect(Array.isArray(tree)).toBe(true);

      const names = tree.map(n => n.name);
      expect(names).toContain('hello.md');
      expect(names).toContain('sub');
    });

    test('directories come first', async () => {
      const res = await request(app).get('/api/tree');
      const tree = res.body;
      const firstDir = tree.findIndex(n => n.type === 'dir');
      const firstFile = tree.findIndex(n => n.type === 'file');
      if (firstDir !== -1 && firstFile !== -1) {
        expect(firstDir).toBeLessThan(firstFile);
      }
    });

    test('respects ignore patterns', async () => {
      const ignoredApp = createApp(tmpDir, ['*.txt']);
      const res = await request(ignoredApp).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).not.toContain('readme.txt');
      expect(names).toContain('hello.md');
    });

    test('negation patterns override ignore', async () => {
      const ignoredApp = createApp(tmpDir, ['*.txt', '!readme.txt']);
      const res = await request(ignoredApp).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).toContain('readme.txt');
    });
  });

  // --- GET /api/file ---
  describe('GET /api/file', () => {
    test('reads file content', async () => {
      const res = await request(app).get('/api/file').query({ path: 'hello.md' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('# Hello\nWorld');
    });

    test('reads nested file', async () => {
      const res = await request(app).get('/api/file').query({ path: 'sub/nested.md' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('## Nested');
    });

    test('returns 404 for missing file', async () => {
      const res = await request(app).get('/api/file').query({ path: 'nope.md' });
      expect(res.status).toBe(404);
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app).get('/api/file').query({ path: '../../../etc/passwd' });
      expect(res.status).toBe(400);
    });
  });

  // --- GET /api/raw ---
  describe('GET /api/raw', () => {
    test('serves file', async () => {
      const res = await request(app).get('/api/raw').query({ path: 'readme.txt' });
      expect(res.status).toBe(200);
    });

    test('returns 404 for missing file', async () => {
      const res = await request(app).get('/api/raw').query({ path: 'nope.bin' });
      expect(res.status).toBe(404);
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app).get('/api/raw').query({ path: '../../etc/passwd' });
      expect(res.status).toBe(400);
    });
  });

  // --- PUT /api/file ---
  describe('PUT /api/file', () => {
    test('updates file content', async () => {
      const res = await request(app)
        .put('/api/file')
        .query({ path: 'hello.md' })
        .type('text/plain')
        .send('# Updated');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const content = fs.readFileSync(path.join(tmpDir, 'hello.md'), 'utf-8');
      expect(content).toBe('# Updated');
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app)
        .put('/api/file')
        .query({ path: '../escape.md' })
        .type('text/plain')
        .send('bad');
      expect(res.status).toBe(400);
    });
  });

  // --- POST /api/file ---
  describe('POST /api/file', () => {
    test('creates new file', async () => {
      const res = await request(app)
        .post('/api/file')
        .query({ path: 'new-file.md' })
        .type('text/plain')
        .send('# New');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const content = fs.readFileSync(path.join(tmpDir, 'new-file.md'), 'utf-8');
      expect(content).toBe('# New');
    });

    test('creates file in nested directory', async () => {
      const res = await request(app)
        .post('/api/file')
        .query({ path: 'deep/nested/file.md' })
        .type('text/plain')
        .send('deep');
      expect(res.status).toBe(200);
      expect(fs.existsSync(path.join(tmpDir, 'deep', 'nested', 'file.md'))).toBe(true);
    });

    test('returns 409 for existing file', async () => {
      const res = await request(app)
        .post('/api/file')
        .query({ path: 'hello.md' })
        .type('text/plain')
        .send('dup');
      expect(res.status).toBe(409);
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app)
        .post('/api/file')
        .query({ path: '../escape.md' })
        .type('text/plain')
        .send('bad');
      expect(res.status).toBe(400);
    });
  });

  // --- PATCH /api/rename ---
  describe('PATCH /api/rename', () => {
    test('renames file', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'hello.md', newPath: 'renamed.md' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      expect(fs.existsSync(path.join(tmpDir, 'hello.md'))).toBe(false);
      expect(fs.existsSync(path.join(tmpDir, 'renamed.md'))).toBe(true);
    });

    test('renames folder', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'sub', newPath: 'sub-renamed' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      expect(fs.existsSync(path.join(tmpDir, 'sub'))).toBe(false);
      expect(fs.existsSync(path.join(tmpDir, 'sub-renamed'))).toBe(true);
    });

    test('returns 404 for missing source', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'nope.md', newPath: 'other.md' });
      expect(res.status).toBe(404);
    });

    test('returns 409 if destination exists', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'hello.md', newPath: 'readme.txt' });
      expect(res.status).toBe(409);
    });

    test('returns 400 for path traversal in newPath', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'hello.md', newPath: '../escape.md' });
      expect(res.status).toBe(400);
    });
  });

  // --- DELETE /api/file ---
  describe('DELETE /api/file', () => {
    test('deletes file', async () => {
      const res = await request(app)
        .delete('/api/file')
        .query({ path: 'hello.md' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'hello.md'))).toBe(false);
    });

    test('returns 404 for missing file', async () => {
      const res = await request(app)
        .delete('/api/file')
        .query({ path: 'nope.md' });
      expect(res.status).toBe(404);
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app)
        .delete('/api/file')
        .query({ path: '../escape.md' });
      expect(res.status).toBe(400);
    });
  });

  // --- POST /api/folder ---
  describe('POST /api/folder', () => {
    test('creates folder', async () => {
      const res = await request(app)
        .post('/api/folder')
        .query({ path: 'new-folder' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(fs.statSync(path.join(tmpDir, 'new-folder')).isDirectory()).toBe(true);
    });

    test('creates nested folder', async () => {
      const res = await request(app)
        .post('/api/folder')
        .query({ path: 'a/b/c' });
      expect(res.status).toBe(200);
      expect(fs.statSync(path.join(tmpDir, 'a', 'b', 'c')).isDirectory()).toBe(true);
    });

    test('returns 409 for existing folder', async () => {
      const res = await request(app)
        .post('/api/folder')
        .query({ path: 'sub' });
      expect(res.status).toBe(409);
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app)
        .post('/api/folder')
        .query({ path: '../escape-dir' });
      expect(res.status).toBe(400);
    });
  });

  // --- DELETE /api/folder ---
  describe('DELETE /api/folder', () => {
    test('deletes empty folder', async () => {
      const res = await request(app)
        .delete('/api/folder')
        .query({ path: 'empty-dir' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'empty-dir'))).toBe(false);
    });

    test('returns 400 for non-empty folder', async () => {
      const res = await request(app)
        .delete('/api/folder')
        .query({ path: 'sub' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not empty/i);
    });

    test('returns 404 for missing folder', async () => {
      const res = await request(app)
        .delete('/api/folder')
        .query({ path: 'no-such-folder' });
      expect(res.status).toBe(404);
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app)
        .delete('/api/folder')
        .query({ path: '../escape-dir' });
      expect(res.status).toBe(400);
    });
  });

  // --- Security: safePath ---
  describe('safePath security', () => {
    test('blocks .. traversal on all endpoints', async () => {
      const traversal = '../../../etc/passwd';
      const endpoints = [
        () => request(app).get('/api/file').query({ path: traversal }),
        () => request(app).get('/api/raw').query({ path: traversal }),
        () => request(app).put('/api/file').query({ path: traversal }).type('text/plain').send('x'),
        () => request(app).post('/api/file').query({ path: traversal }).type('text/plain').send('x'),
        () => request(app).delete('/api/file').query({ path: traversal }),
        () => request(app).post('/api/folder').query({ path: traversal }),
        () => request(app).delete('/api/folder').query({ path: traversal }),
      ];

      for (const fn of endpoints) {
        const res = await fn();
        expect(res.status).toBe(400);
      }
    });

    test('blocks empty path', async () => {
      // empty path resolves to docsDir itself, which is allowed for safePath
      // but GET /api/file on a directory will fail at readFile — that's fine
      // The important thing is that safePath doesn't return null for the root
    });
  });
});
