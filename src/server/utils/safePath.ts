import path from 'path';

export function createSafePathChecker(resolvedDir: string) {
  return function safePath(relPath: string): string | null {
    const resolved = path.resolve(resolvedDir, relPath);
    if (resolved !== resolvedDir && !resolved.startsWith(resolvedDir + path.sep)) {
      return null;
    }
    return resolved;
  };
}
