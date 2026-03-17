/**
 * Match a filename against a glob-like pattern.
 * Supports simple * wildcards and negation (handled externally).
 */
export function matchPattern(name: string, pattern: string): boolean {
  const pat = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
  if (!pat.includes('*')) return name === pat;
  const regex = new RegExp(
    '^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
  );
  return regex.test(name);
}
