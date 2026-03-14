/* === Shared utility functions (browser + Node testable) === */

function getFileName(p) { return p ? p.split('/').pop() : ''; }
function getDirPath(p) { return p && p.includes('/') ? p.substring(0, p.lastIndexOf('/') + 1) : ''; }
function getDirName(p) { return p && p.includes('/') ? p.substring(0, p.lastIndexOf('/')) : ''; }

function countFiles(items) {
  let count = 0;
  items.forEach(item => {
    if (item.type === 'file') count++;
    else if (item.type === 'dir' && item.children) count += countFiles(item.children);
  });
  return count;
}

function countDirs(items) {
  let count = 0;
  items.forEach(item => {
    if (item.type === 'dir') {
      count++;
      if (item.children) count += countDirs(item.children);
    }
  });
  return count;
}

function collectFiles(items) {
  const result = [];
  for (const item of items) {
    if (item.type === 'file') {
      result.push(item);
    } else if (item.type === 'dir' && item.children) {
      result.push(...collectFiles(item.children));
    }
  }
  return result;
}

/**
 * Sanitize raw HTML from markdown rendering.
 * Strips dangerous tags (<script>, <iframe>, etc.), event handler attributes, and javascript: hrefs.
 */
function sanitizeHtml(text) {
  if (!text) return '';
  return text
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, '')
    .replace(/<(iframe|object|embed|form|style)[\s>][\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|form|style)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="');
}

/**
 * Check if href uses a dangerous protocol.
 */
function isDangerousHref(href) {
  return /^\s*(javascript|vbscript|data(?!:image\/))/i.test(href);
}

// Export for Node.js (tests), no-op in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getFileName, getDirPath, getDirName, countFiles, countDirs, collectFiles, sanitizeHtml, isDangerousHref };
}
