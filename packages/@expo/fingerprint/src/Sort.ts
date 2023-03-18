import type { HashSource } from './Fingerprint.types';

export function sortSources<T extends HashSource>(sources: T[]): T[] {
  const typeOrder = {
    file: 0,
    dir: 1,
    contents: 2,
  };
  return sources.sort((a, b) => {
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
  });
}
