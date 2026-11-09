import type { HashSource } from './Fingerprint.types';

export function sortSources<T extends HashSource>(sources: T[]): T[] {
  return sources.sort(compareSource);
}

const typeOrder = {
  file: 0,
  dir: 1,
  contents: 2,
  package: 3,
};

/**
 * Comparator between two sources.
 * This is useful for sorting sources in a consistent order.
 * @returns:
 *  == 0 if a and b are equal,
 *  < 0 if a is less than b,
 *  > 0 if a is greater than b.
 */
export function compareSource(a: HashSource, b: HashSource): number {
  const typeResult = typeOrder[a.type] - typeOrder[b.type];
  if (typeResult === 0) {
    if (a.type === 'file' && b.type === 'file') {
      const aValue = a.overrideHashKey ?? a.filePath;
      const bValue = b.overrideHashKey ?? b.filePath;
      return stringCompareNoLocale(aValue, bValue);
    } else if (a.type === 'dir' && b.type === 'dir') {
      const aValue = a.overrideHashKey ?? a.filePath;
      const bValue = b.overrideHashKey ?? b.filePath;
      return stringCompareNoLocale(aValue, bValue);
    } else if (a.type === 'contents' && b.type === 'contents') {
      return stringCompareNoLocale(a.id, b.id);
    } else if (a.type === 'package' && b.type === 'package') {
      const aValue = a.overrideHashKey ?? `${a.name}@${a.version}`;
      const bValue = b.overrideHashKey ?? `${b.name}@${b.version}`;
      return stringCompareNoLocale(aValue, bValue);
    }
  }
  return typeResult;
}

/**
 * Compares strings by UTF-16 code unit so the order does not depend on the system locale.
 */
export function stringCompareNoLocale(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
