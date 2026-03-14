const { getFileName, getDirPath, getDirName, countFiles, countDirs, collectFiles, sanitizeHtml, isDangerousHref } = require('./public/utils');

// === getFileName ===
describe('getFileName', () => {
  test('extracts filename from path', () => {
    expect(getFileName('docs/readme.md')).toBe('readme.md');
    expect(getFileName('a/b/c/deep.txt')).toBe('deep.txt');
  });

  test('returns filename when no directory', () => {
    expect(getFileName('hello.md')).toBe('hello.md');
  });

  test('returns empty for empty/falsy input', () => {
    expect(getFileName('')).toBe('');
    expect(getFileName(null)).toBe('');
    expect(getFileName(undefined)).toBe('');
  });

  test('handles trailing slash', () => {
    expect(getFileName('docs/')).toBe('');
  });
});

// === getDirPath ===
describe('getDirPath', () => {
  test('extracts directory path', () => {
    expect(getDirPath('docs/readme.md')).toBe('docs/');
    expect(getDirPath('a/b/c/file.txt')).toBe('a/b/c/');
  });

  test('returns empty for filename only', () => {
    expect(getDirPath('hello.md')).toBe('');
  });

  test('returns empty for empty/falsy input', () => {
    expect(getDirPath('')).toBe('');
    expect(getDirPath(null)).toBe('');
    expect(getDirPath(undefined)).toBe('');
  });
});

// === getDirName ===
describe('getDirName', () => {
  test('extracts directory name without trailing slash', () => {
    expect(getDirName('docs/readme.md')).toBe('docs');
    expect(getDirName('a/b/c/file.txt')).toBe('a/b/c');
  });

  test('returns empty for filename only', () => {
    expect(getDirName('hello.md')).toBe('');
  });

  test('returns empty for empty/falsy input', () => {
    expect(getDirName('')).toBe('');
    expect(getDirName(null)).toBe('');
    expect(getDirName(undefined)).toBe('');
  });
});

// === countFiles ===
describe('countFiles', () => {
  test('counts flat files', () => {
    const items = [
      { name: 'a.md', type: 'file' },
      { name: 'b.md', type: 'file' },
    ];
    expect(countFiles(items)).toBe(2);
  });

  test('counts files in nested directories', () => {
    const items = [
      { name: 'a.md', type: 'file' },
      { name: 'sub', type: 'dir', children: [
        { name: 'b.md', type: 'file' },
        { name: 'deep', type: 'dir', children: [
          { name: 'c.md', type: 'file' },
        ]},
      ]},
    ];
    expect(countFiles(items)).toBe(3);
  });

  test('returns 0 for empty array', () => {
    expect(countFiles([])).toBe(0);
  });

  test('returns 0 for directories only', () => {
    const items = [
      { name: 'sub', type: 'dir', children: [] },
    ];
    expect(countFiles(items)).toBe(0);
  });
});

// === countDirs ===
describe('countDirs', () => {
  test('counts directories recursively', () => {
    const items = [
      { name: 'a.md', type: 'file' },
      { name: 'sub', type: 'dir', children: [
        { name: 'deep', type: 'dir', children: [] },
      ]},
    ];
    expect(countDirs(items)).toBe(2);
  });

  test('returns 0 for files only', () => {
    const items = [
      { name: 'a.md', type: 'file' },
    ];
    expect(countDirs(items)).toBe(0);
  });

  test('returns 0 for empty array', () => {
    expect(countDirs([])).toBe(0);
  });
});

// === collectFiles ===
describe('collectFiles', () => {
  test('flattens nested files', () => {
    const items = [
      { name: 'a.md', type: 'file', path: 'a.md' },
      { name: 'sub', type: 'dir', children: [
        { name: 'b.md', type: 'file', path: 'sub/b.md' },
      ]},
    ];
    const result = collectFiles(items);
    expect(result.length).toBe(2);
    expect(result.map(f => f.name)).toEqual(['a.md', 'b.md']);
  });

  test('returns empty array for no files', () => {
    const items = [
      { name: 'sub', type: 'dir', children: [] },
    ];
    expect(collectFiles(items)).toEqual([]);
  });

  test('handles deeply nested structure', () => {
    const items = [
      { name: 'l1', type: 'dir', children: [
        { name: 'l2', type: 'dir', children: [
          { name: 'l3', type: 'dir', children: [
            { name: 'deep.md', type: 'file', path: 'l1/l2/l3/deep.md' },
          ]},
        ]},
      ]},
    ];
    const result = collectFiles(items);
    expect(result.length).toBe(1);
    expect(result[0].path).toBe('l1/l2/l3/deep.md');
  });

  test('skips directories without children', () => {
    const items = [
      { name: 'broken', type: 'dir' }, // no children property
      { name: 'a.md', type: 'file', path: 'a.md' },
    ];
    const result = collectFiles(items);
    expect(result.length).toBe(1);
  });
});

// === sanitizeHtml ===
describe('sanitizeHtml', () => {
  // --- The bug that triggered this test file ---
  test('handles undefined/null/empty input', () => {
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  test('passes safe HTML through', () => {
    expect(sanitizeHtml('<p>hello</p>')).toBe('<p>hello</p>');
    expect(sanitizeHtml('<a href="https://example.com">link</a>'))
      .toBe('<a href="https://example.com">link</a>');
  });

  // --- <script> ---
  test('strips <script> tags', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('');
    expect(sanitizeHtml('<SCRIPT>alert(1)</SCRIPT>')).toBe('');
    expect(sanitizeHtml('<script src="evil.js"></script>')).toBe('');
  });

  test('strips <script> with attributes', () => {
    expect(sanitizeHtml('<script type="text/javascript">code</script>')).toBe('');
  });

  test('strips <script> with surrounding content', () => {
    expect(sanitizeHtml('before<script>evil</script>after')).toBe('beforeafter');
  });

  // --- <iframe> ---
  test('strips <iframe> tags', () => {
    expect(sanitizeHtml('<iframe src="evil"></iframe>')).toBe('');
    expect(sanitizeHtml('<iframe src="evil"/>')).toBe('');
  });

  // --- <object>, <embed>, <form>, <style> ---
  test('strips <object> tags', () => {
    expect(sanitizeHtml('<object data="evil"></object>')).toBe('');
  });

  test('strips <embed> tags', () => {
    expect(sanitizeHtml('<embed src="evil">')).toBe('');
  });

  test('strips <form> tags', () => {
    expect(sanitizeHtml('<form action="evil"><input></form>')).toBe('');
  });

  test('strips <style> tags', () => {
    expect(sanitizeHtml('<style>body{display:none}</style>')).toBe('');
  });

  // --- Event handler attributes ---
  test('strips onerror attribute', () => {
    const result = sanitizeHtml('<img src=x onerror="alert(1)">');
    expect(result).not.toMatch(/onerror/i);
    expect(result).toMatch(/<img/);
  });

  test('strips onload attribute', () => {
    const result = sanitizeHtml('<img src=x onload="alert(1)">');
    expect(result).not.toMatch(/onload/i);
  });

  test('strips onclick attribute', () => {
    const result = sanitizeHtml('<div onclick="evil()">text</div>');
    expect(result).not.toMatch(/onclick/i);
    expect(result).toContain('text');
  });

  test('strips onmouseover with single quotes', () => {
    const result = sanitizeHtml("<div onmouseover='evil()'>text</div>");
    expect(result).not.toMatch(/onmouseover/i);
  });

  test('strips onmouseover without quotes', () => {
    const result = sanitizeHtml('<div onmouseover=evil()>text</div>');
    expect(result).not.toMatch(/onmouseover/i);
  });

  // --- javascript: href ---
  test('strips javascript: href', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toMatch(/javascript:/i);
    expect(result).toContain('click');
  });

  test('strips javascript: href with spaces', () => {
    const result = sanitizeHtml('<a href=" javascript:alert(1)">click</a>');
    expect(result).not.toMatch(/javascript:/i);
  });

  test('strips javascript: href case insensitive', () => {
    const result = sanitizeHtml('<a href="JavaScript:alert(1)">click</a>');
    expect(result).not.toMatch(/javascript:/i);
  });

  // --- Combined attacks ---
  test('strips multiple dangerous elements in one string', () => {
    const input = '<script>evil</script><p>safe</p><iframe src="x"></iframe><img onerror="x" src="ok">';
    const result = sanitizeHtml(input);
    expect(result).not.toMatch(/<script/i);
    expect(result).not.toMatch(/<iframe/i);
    expect(result).not.toMatch(/onerror/i);
    expect(result).toContain('<p>safe</p>');
    expect(result).toMatch(/<img/);
  });

  // --- Nested / tricky patterns ---
  test('handles multiline script tags', () => {
    const input = '<script>\nalert(1)\n</script>';
    expect(sanitizeHtml(input)).toBe('');
  });

  test('preserves safe attributes', () => {
    const input = '<div class="safe" id="test" data-value="123">content</div>';
    expect(sanitizeHtml(input)).toBe(input);
  });
});

// === isDangerousHref ===
describe('isDangerousHref', () => {
  test('detects javascript: protocol', () => {
    expect(isDangerousHref('javascript:alert(1)')).toBe(true);
    expect(isDangerousHref('JavaScript:void(0)')).toBe(true);
    expect(isDangerousHref('  javascript:evil')).toBe(true);
  });

  test('detects vbscript: protocol', () => {
    expect(isDangerousHref('vbscript:MsgBox')).toBe(true);
    expect(isDangerousHref('VBScript:evil')).toBe(true);
  });

  test('detects data: protocol (non-image)', () => {
    expect(isDangerousHref('data:text/html,<script>evil</script>')).toBe(true);
  });

  test('allows data:image/ protocol', () => {
    expect(isDangerousHref('data:image/png;base64,abc')).toBe(false);
    expect(isDangerousHref('data:image/jpeg;base64,abc')).toBe(false);
  });

  test('allows safe protocols', () => {
    expect(isDangerousHref('https://example.com')).toBe(false);
    expect(isDangerousHref('http://example.com')).toBe(false);
    expect(isDangerousHref('/relative/path')).toBe(false);
    expect(isDangerousHref('./local.html')).toBe(false);
    expect(isDangerousHref('#anchor')).toBe(false);
    expect(isDangerousHref('mailto:user@example.com')).toBe(false);
  });

  test('handles empty/falsy input', () => {
    expect(isDangerousHref('')).toBe(false);
  });
});
