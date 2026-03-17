import { state } from '../state';
import { IMAGE_EXTS } from '../constants';

export function isImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTS.some(ext => lower.endsWith(ext));
}

export function getFileIcon(name: string): string {
  if (state.materialGetIcon) {
    try {
      const dotIdx = name.lastIndexOf('.');
      const lookup = dotIdx > 0 ? 'file' + name.substring(dotIdx) : name;
      const result = state.materialGetIcon(lookup);
      if (result && result.svg) return result.svg;
    } catch { /* fallback below */ }
  }
  if (name.endsWith('.md')) return '&#128196;';
  if (name.endsWith('.json')) return '&#123;&#125;';
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return '&#9881;';
  if (isImageFile(name)) return '&#128444;';
  return '&#128220;';
}

export async function loadMaterialIcons(): Promise<void> {
  try {
    const mod = await Promise.race([
      import('https://cdn.jsdelivr.net/npm/material-file-icons@2.4.0/+esm'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    state.materialGetIcon = (mod as any).getIcon || (mod as any).default?.getIcon;
  } catch {
    console.warn('material-file-icons CDN unavailable, using fallback emoji icons');
  }
}
