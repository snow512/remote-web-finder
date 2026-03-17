import { TreeItem } from './types';

export function getFileName(p: string): string {
  return p ? p.split('/').pop() || '' : '';
}

export function getDirPath(p: string): string {
  return p && p.includes('/') ? p.substring(0, p.lastIndexOf('/') + 1) : '';
}

export function getDirName(p: string): string {
  return p && p.includes('/') ? p.substring(0, p.lastIndexOf('/')) : '';
}

export function countFiles(items: TreeItem[]): number {
  let count = 0;
  items.forEach(item => {
    if (item.type === 'file') count++;
    else if (item.type === 'dir' && item.children) count += countFiles(item.children);
  });
  return count;
}

export function countDirs(items: TreeItem[]): number {
  let count = 0;
  items.forEach(item => {
    if (item.type === 'dir') {
      count++;
      if (item.children) count += countDirs(item.children);
    }
  });
  return count;
}

export function collectFiles(items: TreeItem[]): TreeItem[] {
  const result: TreeItem[] = [];
  for (const item of items) {
    if (item.type === 'file') {
      result.push(item);
    } else if (item.type === 'dir' && item.children) {
      result.push(...collectFiles(item.children));
    }
  }
  return result;
}

export function sanitizeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, '')
    .replace(/<(iframe|object|embed|form|style)[\s>][\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|form|style)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="');
}

export function isDangerousHref(href: string): boolean {
  return /^\s*(javascript|vbscript|data(?!:image\/))/i.test(href);
}
