import type { HashSource } from './Fingerprint.types';

export function sortSources<T extends HashSource>(sources: T[]): T[] {
  return sources.sort(compareSource);
}

const typeOrder = {
  file: 0,
  dir: 1,
  contents: 2,
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
      return a.filePath.localeCompare(b.filePath);
    } else if (a.type === 'dir' && b.type === 'dir') {
      return a.filePath.localeCompare(b.filePath);
    } else if (a.type === 'contents' && b.type === 'contents') {
      return a.id.localeCompare(b.id);
    }
  }
  return typeResult;
}
