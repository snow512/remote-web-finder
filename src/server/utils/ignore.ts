import { matchPattern } from './pattern';

export function createIgnoreChecker(ignorePatterns: string[]) {
  return function isIgnored(name: string): boolean {
    let ignored = false;
    for (const pattern of ignorePatterns) {
      if (pattern.startsWith('!')) {
        if (matchPattern(name, pattern.slice(1))) ignored = false;
      } else {
        if (matchPattern(name, pattern)) ignored = true;
      }
    }
    return ignored;
  };
}
