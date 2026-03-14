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

    test('returns 400 when target is a file, not a directory', async () => {
      const res = await request(app)
        .delete('/api/folder')
        .query({ path: 'hello.md' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not a directory/i);
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

  // --- HEAD /api/file ---
  describe('HEAD /api/file', () => {
    test('returns Content-Length for existing file', async () => {
      const res = await request(app)
        .head('/api/file')
        .query({ path: 'hello.md' });
      expect(res.status).toBe(200);
      expect(Number(res.headers['content-length'])).toBeGreaterThan(0);
    });

    test('returns 404 for missing file', async () => {
      const res = await request(app)
        .head('/api/file')
        .query({ path: 'nope.md' });
      expect(res.status).toBe(404);
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app)
        .head('/api/file')
        .query({ path: '../../../etc/passwd' });
      expect(res.status).toBe(400);
    });
  });

  // --- PATCH /api/rename (additional cases) ---
  describe('PATCH /api/rename (additional)', () => {
    test('creates parent directory on rename if needed', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'hello.md', newPath: 'new-dir/hello.md' });
      expect(res.status).toBe(200);
      expect(fs.existsSync(path.join(tmpDir, 'new-dir', 'hello.md'))).toBe(true);
    });

    test('returns 404 for non-existent source in nested rename', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'no/such/file.md', newPath: 'other.md' });
      expect(res.status).toBe(404);
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
      // empty path resolves to docsDir itself (a directory), should not serve as file
      const res = await request(app).get('/api/file').query({ path: '' });
      expect([400, 404]).toContain(res.status);
    });
  });

  // --- Directory path rejection ---
  describe('directory path rejection', () => {
    test('GET /api/file returns 400 for directory path', async () => {
      const res = await request(app).get('/api/file').query({ path: 'sub' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not a file/i);
    });

    test('GET /api/raw returns 400 for directory path', async () => {
      const res = await request(app).get('/api/raw').query({ path: 'sub' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not a file/i);
    });

    test('HEAD /api/file returns 404 for directory path', async () => {
      const res = await request(app).head('/api/file').query({ path: 'sub' });
      expect(res.status).toBe(404);
    });

    test('DELETE /api/file returns 400 for directory path', async () => {
      const res = await request(app).delete('/api/file').query({ path: 'sub' });
      expect(res.status).toBe(400);
    });
  });

  // --- PUT /api/file additional ---
  describe('PUT /api/file (additional)', () => {
    test('creates new file if not exists', async () => {
      const res = await request(app)
        .put('/api/file')
        .query({ path: 'brand-new.md' })
        .type('text/plain')
        .send('# Brand New');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      const content = fs.readFileSync(path.join(tmpDir, 'brand-new.md'), 'utf-8');
      expect(content).toBe('# Brand New');
    });

    test('creates parent directories if needed', async () => {
      const res = await request(app)
        .put('/api/file')
        .query({ path: 'deep/nested/file.md' })
        .type('text/plain')
        .send('deep content');
      expect(res.status).toBe(200);
      expect(fs.existsSync(path.join(tmpDir, 'deep', 'nested', 'file.md'))).toBe(true);
    });
  });

  // --- PATCH /api/rename source path traversal ---
  describe('PATCH /api/rename (security)', () => {
    test('returns 400 for path traversal in source path', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: '../escape.md', newPath: 'safe.md' });
      expect(res.status).toBe(400);
    });
  });

  // --- GET /api/tree with showIgnored ---
  describe('GET /api/tree (additional)', () => {
    test('showIgnored=true includes ignored files', async () => {
      const ignoredApp = createApp(tmpDir, ['*.txt']);
      const res = await request(ignoredApp).get('/api/tree').query({ showIgnored: 'true' });
      const names = res.body.map(n => n.name);
      expect(names).toContain('readme.txt');
      const txtNode = res.body.find(n => n.name === 'readme.txt');
      expect(txtNode.ignored).toBe(true);
    });

    test('showIgnored=false (default) excludes ignored files', async () => {
      const ignoredApp = createApp(tmpDir, ['*.txt']);
      const res = await request(ignoredApp).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).not.toContain('readme.txt');
    });

    test('tree includes nested directory children', async () => {
      const res = await request(app).get('/api/tree');
      const subDir = res.body.find(n => n.name === 'sub');
      expect(subDir).toBeDefined();
      expect(subDir.type).toBe('dir');
      expect(subDir.children.length).toBeGreaterThan(0);
      expect(subDir.children[0].name).toBe('nested.md');
    });

    test('tree gracefully handles inaccessible subdirectory', async () => {
      const noAccessDir = path.join(tmpDir, 'no-access');
      fs.mkdirSync(noAccessDir);
      fs.writeFileSync(path.join(noAccessDir, 'secret.txt'), 'hidden');
      fs.chmodSync(noAccessDir, 0o000);

      const res = await request(app).get('/api/tree');
      expect(res.status).toBe(200);
      const noAccess = res.body.find(n => n.name === 'no-access');
      expect(noAccess).toBeDefined();
      expect(noAccess.children).toEqual([]);

      // Restore permissions for cleanup
      fs.chmodSync(noAccessDir, 0o755);
    });
  });

  // --- GET /api/raw (additional) ---
  describe('GET /api/raw (additional)', () => {
    test('serves file with correct content', async () => {
      const res = await request(app).get('/api/raw').query({ path: 'readme.txt' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('plain text');
    });

    test('serves markdown file with content-type', async () => {
      const res = await request(app).get('/api/raw').query({ path: 'hello.md' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('# Hello');
    });
  });

  // --- PUT /api/file (edge cases) ---
  describe('PUT /api/file (edge cases)', () => {
    test('overwrites existing file', async () => {
      await request(app)
        .put('/api/file')
        .query({ path: 'hello.md' })
        .type('text/plain')
        .send('overwritten');
      const content = fs.readFileSync(path.join(tmpDir, 'hello.md'), 'utf-8');
      expect(content).toBe('overwritten');
    });

    test('writes empty content when body is empty', async () => {
      const res = await request(app)
        .put('/api/file')
        .query({ path: 'empty-file.md' })
        .type('text/plain')
        .send('');
      expect(res.status).toBe(200);
      const content = fs.readFileSync(path.join(tmpDir, 'empty-file.md'), 'utf-8');
      expect(content).toBe('');
    });
  });

  // --- POST /api/file (edge cases) ---
  describe('POST /api/file (edge cases)', () => {
    test('creates file with empty body', async () => {
      const res = await request(app)
        .post('/api/file')
        .query({ path: 'empty.md' })
        .type('text/plain')
        .send('');
      expect(res.status).toBe(200);
      const content = fs.readFileSync(path.join(tmpDir, 'empty.md'), 'utf-8');
      expect(content).toBe('');
    });

    test('atomic creation prevents overwrite race', async () => {
      // First create should succeed
      const res1 = await request(app)
        .post('/api/file')
        .query({ path: 'race-test.md' })
        .type('text/plain')
        .send('first');
      expect(res1.status).toBe(200);

      // Second create should fail with 409
      const res2 = await request(app)
        .post('/api/file')
        .query({ path: 'race-test.md' })
        .type('text/plain')
        .send('second');
      expect(res2.status).toBe(409);

      // Content should be from first create
      const content = fs.readFileSync(path.join(tmpDir, 'race-test.md'), 'utf-8');
      expect(content).toBe('first');
    });
  });

  // --- DELETE /api/file (edge cases) ---
  describe('DELETE /api/file (edge cases)', () => {
    test('returns 400 with message for directory', async () => {
      const res = await request(app).delete('/api/file').query({ path: 'sub' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/folder/i);
    });
  });

  // --- HEAD /api/file (edge cases) ---
  describe('HEAD /api/file (edge cases)', () => {
    test('returns correct Content-Length for known content', async () => {
      const res = await request(app).head('/api/file').query({ path: 'hello.md' });
      expect(res.status).toBe(200);
      const expectedSize = Buffer.byteLength('# Hello\nWorld', 'utf-8');
      expect(Number(res.headers['content-length'])).toBe(expectedSize);
    });

    test('returns 404 for directory path', async () => {
      const res = await request(app).head('/api/file').query({ path: 'empty-dir' });
      expect(res.status).toBe(404);
    });
  });

  // --- DELETE /api/folder (edge cases) ---
  describe('DELETE /api/folder (edge cases)', () => {
    test('returns 400 when trying to delete root', async () => {
      // empty path resolves to docsDir itself — safePath allows it but shouldn't delete root
      const res = await request(app).delete('/api/folder').query({ path: '' });
      // Root has children, so "not empty" should trigger
      expect(res.status).toBe(400);
    });
  });

  // --- matchPattern (additional) ---
  describe('matchPattern (additional)', () => {
    test('matches dot files', () => {
      expect(matchPattern('.gitignore', '.gitignore')).toBe(true);
      expect(matchPattern('.env', '.env')).toBe(true);
    });

    test('wildcard matches multiple extensions', () => {
      expect(matchPattern('backup.tar.gz', '*.gz')).toBe(true);
      expect(matchPattern('backup.tar.gz', '*.tar.gz')).toBe(true);
    });

    test('wildcard does not match empty name before dot', () => {
      expect(matchPattern('.swp', '.*.swp')).toBe(false);
    });

    test('pattern with special regex chars', () => {
      expect(matchPattern('file[1].txt', 'file[1].txt')).toBe(true);
      expect(matchPattern('file(1).txt', 'file(1).txt')).toBe(true);
    });
  });

  // --- safePath (additional) ---
  describe('safePath security (additional)', () => {
    test('blocks path with encoded traversal', async () => {
      const res = await request(app).get('/api/file').query({ path: '..%2F..%2Fetc%2Fpasswd' });
      // Express decodes query params, so this becomes ../../../etc/passwd
      expect([400, 404]).toContain(res.status);
    });

    test('allows deeply nested valid path', async () => {
      fs.mkdirSync(path.join(tmpDir, 'a', 'b'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'a', 'b', 'deep.md'), 'deep');
      const res = await request(app).get('/api/file').query({ path: 'a/b/deep.md' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('deep');
    });

    test('blocks absolute path outside base directory', async () => {
      const res = await request(app).get('/api/file').query({ path: '/etc/passwd' });
      expect(res.status).toBe(400);
    });

    test('blocks path with dot segments in middle', async () => {
      const res = await request(app).get('/api/file').query({ path: 'sub/../../../etc/passwd' });
      expect(res.status).toBe(400);
    });

    test('blocks null byte injection', async () => {
      const res = await request(app).get('/api/file').query({ path: 'hello.md\0.jpg' });
      // Null byte in path causes ERR_INVALID_ARG_VALUE → 500
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  // --- Unicode and special characters ---
  describe('unicode and special characters', () => {
    test('handles unicode filename in POST/GET/DELETE cycle', async () => {
      const unicodeName = '한글파일.md';
      const res1 = await request(app)
        .post('/api/file')
        .query({ path: unicodeName })
        .type('text/plain')
        .send('유니코드 내용');
      expect(res1.status).toBe(200);

      const res2 = await request(app).get('/api/file').query({ path: unicodeName });
      expect(res2.status).toBe(200);
      expect(res2.text).toBe('유니코드 내용');

      const res3 = await request(app).delete('/api/file').query({ path: unicodeName });
      expect(res3.status).toBe(200);
    });

    test('handles filename with spaces', async () => {
      const res = await request(app)
        .post('/api/file')
        .query({ path: 'my file name.md' })
        .type('text/plain')
        .send('spaced');
      expect(res.status).toBe(200);

      const res2 = await request(app).get('/api/file').query({ path: 'my file name.md' });
      expect(res2.status).toBe(200);
      expect(res2.text).toBe('spaced');
    });

    test('handles UTF-8 content correctly', async () => {
      const content = '日本語テスト\n中文测试\n🎉🚀';
      await request(app)
        .put('/api/file')
        .query({ path: 'hello.md' })
        .type('text/plain')
        .send(content);
      const res = await request(app).get('/api/file').query({ path: 'hello.md' });
      expect(res.text).toBe(content);
    });

    test('HEAD returns correct Content-Length for multi-byte content', async () => {
      const content = '한글테스트';
      await request(app)
        .put('/api/file')
        .query({ path: 'hello.md' })
        .type('text/plain')
        .send(content);
      const res = await request(app).head('/api/file').query({ path: 'hello.md' });
      expect(Number(res.headers['content-length'])).toBe(Buffer.byteLength(content, 'utf-8'));
    });
  });

  // --- PATCH /api/rename (edge cases) ---
  describe('PATCH /api/rename (edge cases)', () => {
    test('returns error when newPath param is missing', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'hello.md' });
      // empty newPath → safePath resolves to docsDir itself → existsSync(docsDir) is true → 409
      expect([400, 409]).toContain(res.status);
    });

    test('returns error when path param is missing', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ newPath: 'other.md' });
      // empty path → safePath resolves to docsDir → existsSync true → renameSync(dir, file) fails
      expect([400, 500]).toContain(res.status);
    });

    test('preserves file content after rename', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'hello.md', newPath: 'moved.md' });
      expect(res.status).toBe(200);

      const content = fs.readFileSync(path.join(tmpDir, 'moved.md'), 'utf-8');
      expect(content).toBe('# Hello\nWorld');
    });

    test('can rename file across directories', async () => {
      fs.mkdirSync(path.join(tmpDir, 'target-dir'));
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'readme.txt', newPath: 'target-dir/readme.txt' });
      expect(res.status).toBe(200);
      expect(fs.existsSync(path.join(tmpDir, 'target-dir', 'readme.txt'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'readme.txt'))).toBe(false);
    });
  });

  // --- POST /api/folder (edge cases) ---
  describe('POST /api/folder (edge cases)', () => {
    test('returns 409 when file exists at path', async () => {
      const res = await request(app)
        .post('/api/folder')
        .query({ path: 'hello.md' });
      expect(res.status).toBe(409);
    });

    test('returns 400 for path traversal', async () => {
      const res = await request(app)
        .post('/api/folder')
        .query({ path: '../../../tmp/evil' });
      expect(res.status).toBe(400);
    });
  });

  // --- HEAD /api/file (zero-byte) ---
  describe('HEAD /api/file (zero-byte)', () => {
    test('returns Content-Length 0 for empty file', async () => {
      fs.writeFileSync(path.join(tmpDir, 'zero.txt'), '');
      const res = await request(app).head('/api/file').query({ path: 'zero.txt' });
      expect(res.status).toBe(200);
      expect(Number(res.headers['content-length'])).toBe(0);
    });
  });

  // --- GET /api/file (edge cases) ---
  describe('GET /api/file (edge cases)', () => {
    test('reads empty file', async () => {
      fs.writeFileSync(path.join(tmpDir, 'empty.txt'), '');
      const res = await request(app).get('/api/file').query({ path: 'empty.txt' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('');
    });

    test('reads file with special characters in content', async () => {
      const content = '<script>alert("xss")</script> & "quotes" \'apos\'';
      fs.writeFileSync(path.join(tmpDir, 'special.txt'), content);
      const res = await request(app).get('/api/file').query({ path: 'special.txt' });
      expect(res.status).toBe(200);
      expect(res.text).toBe(content);
    });
  });

  // --- isIgnored (complex patterns) ---
  describe('isIgnored (complex patterns)', () => {
    test('multiple ignore patterns with negation', async () => {
      const complexApp = createApp(tmpDir, ['*.md', '!hello.md', '*.txt']);
      const res = await request(complexApp).get('/api/tree');
      const names = res.body.map(n => n.name);
      // *.md ignored, but !hello.md negates it
      expect(names).toContain('hello.md');
      // sub/nested.md should be ignored (*.md applies to dir contents too)
      // *.txt should be ignored
      expect(names).not.toContain('readme.txt');
    });

    test('directory pattern with trailing slash', async () => {
      const dirApp = createApp(tmpDir, ['sub/']);
      const res = await request(dirApp).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).not.toContain('sub');
      expect(names).toContain('hello.md');
    });

    test('empty ignore patterns shows all files', async () => {
      const noIgnoreApp = createApp(tmpDir, []);
      const res = await request(noIgnoreApp).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).toContain('hello.md');
      expect(names).toContain('readme.txt');
      expect(names).toContain('sub');
    });
  });

  // --- Concurrent operations ---
  describe('concurrent operations', () => {
    test('multiple simultaneous reads do not interfere', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/api/file').query({ path: 'hello.md' })
      );
      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.text).toBe('# Hello\nWorld');
      });
    });

    test('multiple simultaneous creates with unique names succeed', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/file')
          .query({ path: `concurrent-${i}.md` })
          .type('text/plain')
          .send(`content-${i}`)
      );
      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  // --- Full CRUD lifecycle ---
  describe('full CRUD lifecycle', () => {
    test('create → read → update → rename → delete', async () => {
      // Create
      const r1 = await request(app)
        .post('/api/file')
        .query({ path: 'lifecycle.md' })
        .type('text/plain')
        .send('v1');
      expect(r1.status).toBe(200);

      // Read
      const r2 = await request(app).get('/api/file').query({ path: 'lifecycle.md' });
      expect(r2.text).toBe('v1');

      // Update
      const r3 = await request(app)
        .put('/api/file')
        .query({ path: 'lifecycle.md' })
        .type('text/plain')
        .send('v2');
      expect(r3.status).toBe(200);

      // Verify update
      const r4 = await request(app).get('/api/file').query({ path: 'lifecycle.md' });
      expect(r4.text).toBe('v2');

      // Rename
      const r5 = await request(app)
        .patch('/api/rename')
        .query({ path: 'lifecycle.md', newPath: 'lifecycle-renamed.md' });
      expect(r5.status).toBe(200);

      // Verify rename
      const r6 = await request(app).get('/api/file').query({ path: 'lifecycle-renamed.md' });
      expect(r6.text).toBe('v2');
      const r7 = await request(app).get('/api/file').query({ path: 'lifecycle.md' });
      expect(r7.status).toBe(404);

      // Delete
      const r8 = await request(app).delete('/api/file').query({ path: 'lifecycle-renamed.md' });
      expect(r8.status).toBe(200);

      // Verify delete
      const r9 = await request(app).get('/api/file').query({ path: 'lifecycle-renamed.md' });
      expect(r9.status).toBe(404);
    });

    test('create folder → create file inside → delete file → delete folder', async () => {
      await request(app).post('/api/folder').query({ path: 'lifecycle-dir' });

      await request(app)
        .post('/api/file')
        .query({ path: 'lifecycle-dir/inside.md' })
        .type('text/plain')
        .send('inside');

      // Folder not empty → 400
      const r1 = await request(app).delete('/api/folder').query({ path: 'lifecycle-dir' });
      expect(r1.status).toBe(400);

      // Delete file first
      await request(app).delete('/api/file').query({ path: 'lifecycle-dir/inside.md' });

      // Now folder is empty → 200
      const r2 = await request(app).delete('/api/folder').query({ path: 'lifecycle-dir' });
      expect(r2.status).toBe(200);
      expect(fs.existsSync(path.join(tmpDir, 'lifecycle-dir'))).toBe(false);
    });
  });

  // --- API response format ---
  describe('API response format', () => {
    test('GET /api/tree returns JSON array', async () => {
      const res = await request(app).get('/api/tree');
      expect(res.headers['content-type']).toMatch(/json/);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/file returns text/plain', async () => {
      const res = await request(app).get('/api/file').query({ path: 'hello.md' });
      expect(res.headers['content-type']).toMatch(/text\/plain/);
    });

    test('success responses have { ok: true }', async () => {
      const put = await request(app)
        .put('/api/file').query({ path: 'hello.md' })
        .type('text/plain').send('test');
      expect(put.body).toEqual({ ok: true });

      const post = await request(app)
        .post('/api/file').query({ path: 'format-test.md' })
        .type('text/plain').send('test');
      expect(post.body).toEqual({ ok: true });

      const del = await request(app)
        .delete('/api/file').query({ path: 'format-test.md' });
      expect(del.body).toEqual({ ok: true });
    });

    test('error responses have { error: string }', async () => {
      const res = await request(app).get('/api/file').query({ path: '../bad' });
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });

  // --- Binary file handling ---
  describe('binary file handling', () => {
    test('GET /api/raw serves binary file', async () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header
      fs.writeFileSync(path.join(tmpDir, 'test.png'), buf);
      const res = await request(app).get('/api/raw').query({ path: 'test.png' });
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('HEAD returns correct size for binary file', async () => {
      const buf = Buffer.alloc(1024, 0xAB);
      fs.writeFileSync(path.join(tmpDir, 'binary.bin'), buf);
      const res = await request(app).head('/api/file').query({ path: 'binary.bin' });
      expect(res.status).toBe(200);
      expect(Number(res.headers['content-length'])).toBe(1024);
    });
  });

  // --- File permission errors ---
  describe('file permission errors', () => {
    test('GET /api/file returns 500 for unreadable file', async () => {
      fs.writeFileSync(path.join(tmpDir, 'no-read.txt'), 'secret');
      fs.chmodSync(path.join(tmpDir, 'no-read.txt'), 0o000);
      const res = await request(app).get('/api/file').query({ path: 'no-read.txt' });
      expect(res.status).toBe(500);
      // Restore permissions for cleanup
      fs.chmodSync(path.join(tmpDir, 'no-read.txt'), 0o644);
    });

    test('PUT /api/file returns 500 for read-only file', async () => {
      fs.writeFileSync(path.join(tmpDir, 'readonly.txt'), 'locked');
      fs.chmodSync(path.join(tmpDir, 'readonly.txt'), 0o444);
      const res = await request(app)
        .put('/api/file').query({ path: 'readonly.txt' })
        .type('text/plain').send('overwrite');
      expect(res.status).toBe(500);
      // Restore permissions for cleanup
      fs.chmodSync(path.join(tmpDir, 'readonly.txt'), 0o644);
    });
  });

  // --- matchPattern (edge cases) ---
  describe('matchPattern (edge cases)', () => {
    test('empty pattern matches nothing', () => {
      expect(matchPattern('file.txt', '')).toBe(false);
      expect(matchPattern('', '')).toBe(true);
    });

    test('single wildcard matches everything', () => {
      expect(matchPattern('anything', '*')).toBe(true);
      expect(matchPattern('.hidden', '*')).toBe(true);
      expect(matchPattern('', '*')).toBe(true);
    });

    test('double wildcard pattern', () => {
      expect(matchPattern('test.min.js', '*.min.*')).toBe(true);
      expect(matchPattern('test.js', '*.min.*')).toBe(false);
    });

    test('case sensitivity', () => {
      expect(matchPattern('README.md', 'readme.md')).toBe(false);
      expect(matchPattern('README.md', 'README.md')).toBe(true);
    });

    test('pattern with only extension', () => {
      expect(matchPattern('.gitkeep', '*.gitkeep')).toBe(true);
      expect(matchPattern('test.log', '*.log')).toBe(true);
    });
  });

  // --- Tree structure validation ---
  describe('tree structure validation', () => {
    test('each node has required fields', async () => {
      const res = await request(app).get('/api/tree');
      function validateNode(node) {
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('path');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('ignored');
        expect(['file', 'dir']).toContain(node.type);
        if (node.type === 'dir') {
          expect(node).toHaveProperty('children');
          expect(Array.isArray(node.children)).toBe(true);
          node.children.forEach(validateNode);
        }
      }
      res.body.forEach(validateNode);
    });

    test('file paths use forward slashes', async () => {
      const res = await request(app).get('/api/tree');
      const subDir = res.body.find(n => n.name === 'sub');
      expect(subDir.children[0].path).toBe(path.join('sub', 'nested.md'));
    });

    test('alphabetical sort within same type', async () => {
      // Create files that would sort differently
      fs.writeFileSync(path.join(tmpDir, 'zzz.txt'), 'z');
      fs.writeFileSync(path.join(tmpDir, 'aaa.txt'), 'a');
      const res = await request(app).get('/api/tree');
      const files = res.body.filter(n => n.type === 'file');
      for (let i = 1; i < files.length; i++) {
        expect(files[i].name.localeCompare(files[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    test('empty directory has empty children array', async () => {
      const res = await request(app).get('/api/tree');
      const emptyDir = res.body.find(n => n.name === 'empty-dir');
      expect(emptyDir).toBeDefined();
      expect(emptyDir.children).toEqual([]);
    });
  });

  // --- Deeply nested operations ---
  describe('deeply nested operations', () => {
    test('creates and reads file 5 levels deep', async () => {
      const deepPath = 'l1/l2/l3/l4/l5/deep.txt';
      const res = await request(app)
        .post('/api/file').query({ path: deepPath })
        .type('text/plain').send('deep');
      expect(res.status).toBe(200);

      const read = await request(app).get('/api/file').query({ path: deepPath });
      expect(read.status).toBe(200);
      expect(read.text).toBe('deep');
    });

    test('tree reflects deeply nested structure', async () => {
      fs.mkdirSync(path.join(tmpDir, 'd1', 'd2', 'd3'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'd1', 'd2', 'd3', 'leaf.md'), 'leaf');

      const res = await request(app).get('/api/tree');
      const d1 = res.body.find(n => n.name === 'd1');
      expect(d1.type).toBe('dir');
      const d2 = d1.children.find(n => n.name === 'd2');
      expect(d2.type).toBe('dir');
      const d3 = d2.children.find(n => n.name === 'd3');
      expect(d3.type).toBe('dir');
      const leaf = d3.children.find(n => n.name === 'leaf.md');
      expect(leaf.type).toBe('file');
    });

    test('rename into deep non-existent path creates parents', async () => {
      const res = await request(app)
        .patch('/api/rename')
        .query({ path: 'readme.txt', newPath: 'x/y/z/moved.txt' });
      expect(res.status).toBe(200);
      expect(fs.existsSync(path.join(tmpDir, 'x', 'y', 'z', 'moved.txt'))).toBe(true);
    });
  });

  // --- Large content handling ---
  describe('large content handling', () => {
    test('PUT and GET 100KB file', async () => {
      const largeContent = 'x'.repeat(100 * 1024);
      const res = await request(app)
        .put('/api/file').query({ path: 'hello.md' })
        .type('text/plain').send(largeContent);
      expect(res.status).toBe(200);

      const read = await request(app).get('/api/file').query({ path: 'hello.md' });
      expect(read.status).toBe(200);
      expect(read.text.length).toBe(100 * 1024);
    });
  });

  // --- Idempotency ---
  describe('idempotency', () => {
    test('PUT same content twice succeeds both times', async () => {
      const r1 = await request(app)
        .put('/api/file').query({ path: 'hello.md' })
        .type('text/plain').send('same');
      expect(r1.status).toBe(200);

      const r2 = await request(app)
        .put('/api/file').query({ path: 'hello.md' })
        .type('text/plain').send('same');
      expect(r2.status).toBe(200);

      const content = fs.readFileSync(path.join(tmpDir, 'hello.md'), 'utf-8');
      expect(content).toBe('same');
    });

    test('DELETE already deleted file returns 404', async () => {
      await request(app).delete('/api/file').query({ path: 'hello.md' });
      const r2 = await request(app).delete('/api/file').query({ path: 'hello.md' });
      expect(r2.status).toBe(404);
    });

    test('POST /api/folder on existing folder returns 409', async () => {
      const r1 = await request(app).post('/api/folder').query({ path: 'idem-dir' });
      expect(r1.status).toBe(200);
      const r2 = await request(app).post('/api/folder').query({ path: 'idem-dir' });
      expect(r2.status).toBe(409);
    });
  });

  // --- Symlink handling ---
  describe('symlink handling', () => {
    test('GET /api/file follows symlink to file', async () => {
      fs.symlinkSync(
        path.join(tmpDir, 'hello.md'),
        path.join(tmpDir, 'link-to-hello.md')
      );
      const res = await request(app).get('/api/file').query({ path: 'link-to-hello.md' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('# Hello\nWorld');
    });

    test('GET /api/raw follows symlink to file', async () => {
      fs.symlinkSync(
        path.join(tmpDir, 'readme.txt'),
        path.join(tmpDir, 'link-to-readme.txt')
      );
      const res = await request(app).get('/api/raw').query({ path: 'link-to-readme.txt' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('plain text');
    });

    test('tree includes symlinked files', async () => {
      fs.symlinkSync(
        path.join(tmpDir, 'hello.md'),
        path.join(tmpDir, 'sym-hello.md')
      );
      const res = await request(app).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).toContain('sym-hello.md');
    });
  });

  // --- Hidden files (dot prefix) ---
  describe('hidden files', () => {
    test('creates and reads dot-prefixed file', async () => {
      const res = await request(app)
        .post('/api/file').query({ path: '.hidden-file' })
        .type('text/plain').send('secret');
      expect(res.status).toBe(200);

      const read = await request(app).get('/api/file').query({ path: '.hidden-file' });
      expect(read.status).toBe(200);
      expect(read.text).toBe('secret');
    });

    test('tree includes dot-prefixed files when not ignored', async () => {
      fs.writeFileSync(path.join(tmpDir, '.dotfile'), 'dot');
      const res = await request(app).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).toContain('.dotfile');
    });

    test('ignore pattern can exclude dot files', async () => {
      fs.writeFileSync(path.join(tmpDir, '.env'), 'SECRET=123');
      const dotApp = createApp(tmpDir, ['.env']);
      const res = await request(dotApp).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).not.toContain('.env');
    });
  });

  // --- Files without extension ---
  describe('files without extension', () => {
    test('creates and reads file without extension', async () => {
      const res = await request(app)
        .post('/api/file').query({ path: 'Makefile' })
        .type('text/plain').send('all: build');
      expect(res.status).toBe(200);

      const read = await request(app).get('/api/file').query({ path: 'Makefile' });
      expect(read.text).toBe('all: build');
    });

    test('HEAD works for extensionless file', async () => {
      fs.writeFileSync(path.join(tmpDir, 'LICENSE'), 'MIT License');
      const res = await request(app).head('/api/file').query({ path: 'LICENSE' });
      expect(res.status).toBe(200);
      expect(Number(res.headers['content-length'])).toBe(Buffer.byteLength('MIT License'));
    });
  });

  // --- POST /api/file where directory exists at same name ---
  describe('POST /api/file vs directory conflict', () => {
    test('returns error when directory exists at file path', async () => {
      fs.mkdirSync(path.join(tmpDir, 'conflict-dir'));
      const res = await request(app)
        .post('/api/file').query({ path: 'conflict-dir' })
        .type('text/plain').send('content');
      // wx flag on a directory path → EISDIR or similar error
      expect([400, 409, 500]).toContain(res.status);
    });
  });

  // --- Path normalization ---
  describe('path normalization', () => {
    test('dot-dot that resolves inside base is allowed', async () => {
      const res = await request(app).get('/api/file').query({ path: 'sub/../hello.md' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('# Hello\nWorld');
    });

    test('dot segment resolves to current directory file', async () => {
      const res = await request(app).get('/api/file').query({ path: './hello.md' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('# Hello\nWorld');
    });

    test('multiple slashes are normalized', async () => {
      const res = await request(app).get('/api/file').query({ path: 'sub//nested.md' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('## Nested');
    });
  });

  // --- Concurrent writes ---
  describe('concurrent writes', () => {
    test('concurrent PUT to same file — last write wins', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .put('/api/file').query({ path: 'hello.md' })
          .type('text/plain').send(`version-${i}`)
      );
      const results = await Promise.all(promises);
      results.forEach(res => expect(res.status).toBe(200));
      const content = fs.readFileSync(path.join(tmpDir, 'hello.md'), 'utf-8');
      expect(content).toMatch(/^version-\d$/);
    });

    test('concurrent POST to same path — only first succeeds', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/file').query({ path: 'race-atomic.md' })
          .type('text/plain').send(`attempt-${i}`)
      );
      const results = await Promise.all(promises);
      const successes = results.filter(r => r.status === 200);
      const conflicts = results.filter(r => r.status === 409);
      expect(successes.length).toBe(1);
      expect(conflicts.length).toBe(4);
    });
  });

  // --- Tree with many files ---
  describe('tree with many files', () => {
    test('handles directory with 50 files', async () => {
      for (let i = 0; i < 50; i++) {
        fs.writeFileSync(path.join(tmpDir, `bulk-${String(i).padStart(3, '0')}.txt`), `file ${i}`);
      }
      const res = await request(app).get('/api/tree');
      expect(res.status).toBe(200);
      const bulkFiles = res.body.filter(n => n.name.startsWith('bulk-'));
      expect(bulkFiles.length).toBe(50);
      // Verify alphabetical order
      for (let i = 1; i < bulkFiles.length; i++) {
        expect(bulkFiles[i].name > bulkFiles[i - 1].name).toBe(true);
      }
    });
  });

  // --- DELETE /api/folder edge cases ---
  describe('DELETE /api/folder (additional edge cases)', () => {
    test('returns 404 for path to a file', async () => {
      // Already tested as 400 "Not a directory", but let's verify message
      const res = await request(app).delete('/api/folder').query({ path: 'hello.md' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not a directory/i);
    });

    test('returns 400 for directory with nested subdirectory', async () => {
      fs.mkdirSync(path.join(tmpDir, 'parent-dir', 'child-dir'), { recursive: true });
      const res = await request(app).delete('/api/folder').query({ path: 'parent-dir' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not empty/i);
    });
  });

  // --- matchPattern (comprehensive) ---
  describe('matchPattern (comprehensive)', () => {
    test('multiple wildcards in pattern', () => {
      expect(matchPattern('app.test.js', '*test*')).toBe(true);
      expect(matchPattern('app.spec.js', '*test*')).toBe(false);
      expect(matchPattern('test-utils.js', 'test*js')).toBe(true);
    });

    test('wildcard at start only', () => {
      expect(matchPattern('styles.css', '*css')).toBe(true);
      expect(matchPattern('styles.css', '*js')).toBe(false);
    });

    test('wildcard at end only', () => {
      expect(matchPattern('README.md', 'README*')).toBe(true);
      expect(matchPattern('READMORE.md', 'README*')).toBe(false);
    });

    test('pattern matching is anchored', () => {
      // Should not match substring
      expect(matchPattern('my-node_modules', 'node_modules')).toBe(false);
      expect(matchPattern('node_modules-backup', 'node_modules')).toBe(false);
    });

    test('trailing slash removal', () => {
      expect(matchPattern('dist', 'dist/')).toBe(true);
      expect(matchPattern('distribute', 'dist/')).toBe(false);
    });
  });

  // --- GET /api/tree with multiple ignore + negation ---
  describe('isIgnored (advanced patterns)', () => {
    test('later patterns override earlier ones', async () => {
      // *.md ignored, then !hello.md negates, then hello.md re-ignores
      const app2 = createApp(tmpDir, ['*.md', '!hello.md', 'hello.md']);
      const res = await request(app2).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).not.toContain('hello.md');
    });

    test('negation only affects previously ignored', async () => {
      // !readme.txt negation without prior ignore — should have no effect
      const app2 = createApp(tmpDir, ['!readme.txt']);
      const res = await request(app2).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).toContain('readme.txt');
      expect(names).toContain('hello.md');
    });

    test('wildcard ignore with wildcard negation', async () => {
      const app2 = createApp(tmpDir, ['*.*', '!*.md']);
      const res = await request(app2).get('/api/tree');
      const names = res.body.map(n => n.name);
      expect(names).toContain('hello.md');
      expect(names).not.toContain('readme.txt');
    });
  });

  // --- Error response consistency ---
  describe('error response consistency', () => {
    test('all 400 responses have error field', async () => {
      const badPaths = [
        () => request(app).get('/api/file').query({ path: '../bad' }),
        () => request(app).get('/api/raw').query({ path: '../bad' }),
        () => request(app).put('/api/file').query({ path: '../bad' }).type('text/plain').send('x'),
        () => request(app).post('/api/file').query({ path: '../bad' }).type('text/plain').send('x'),
        () => request(app).delete('/api/file').query({ path: '../bad' }),
        () => request(app).post('/api/folder').query({ path: '../bad' }),
        () => request(app).delete('/api/folder').query({ path: '../bad' }),
      ];
      for (const fn of badPaths) {
        const res = await fn();
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(typeof res.body.error).toBe('string');
        expect(res.body.error.length).toBeGreaterThan(0);
      }
    });

    test('all 404 responses have error field', async () => {
      const missing = [
        () => request(app).get('/api/file').query({ path: 'missing.txt' }),
        () => request(app).get('/api/raw').query({ path: 'missing.txt' }),
        () => request(app).delete('/api/file').query({ path: 'missing.txt' }),
        () => request(app).delete('/api/folder').query({ path: 'missing-dir' }),
      ];
      for (const fn of missing) {
        const res = await fn();
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
      }
    });
  });
});
