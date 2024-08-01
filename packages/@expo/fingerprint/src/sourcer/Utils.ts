import fs from 'fs/promises';
import path from 'path';

import type { HashSource } from '../Fingerprint.types';

export async function getFileBasedHashSourceAsync(
  projectRoot: string,
  filePath: string,
  reason: string
): Promise<HashSource | null> {
  let result: HashSource | null = null;
  try {
    const stat = await fs.stat(path.join(projectRoot, filePath));
    result = {
      type: stat.isDirectory() ? 'dir' : 'file',
      filePath,
      reasons: [reason],
    };
  } catch {
    result = null;
  }
  return result;
}

/**
 * A version of `JSON.stringify` that keeps the keys sorted
 */
export function stringifyJsonSorted(target: any, space?: string | number | undefined): string {
  return JSON.stringify(target, (_, value) => sortJson(value), space);
}

function sortJson(json: any): any {
  if (Array.isArray(json)) {
    return json.sort((a, b) => {
      // Sort array items by their stringified value.
      // We don't need the array to be sorted in meaningful way, just to be sorted in deterministic.
      // E.g. `[{ b: '2' }, {}, { a: '3' }, null]` -> `[null, { a : '3' }, { b: '2' }, {}]`
      // This result is not a perfect solution, but it's good enough for our use case.
      const stringifiedA = stringifyJsonSorted(a);
      const stringifiedB = stringifyJsonSorted(b);
      if (stringifiedA < stringifiedB) {
        return -1;
      } else if (stringifiedA > stringifiedB) {
        return 1;
      }
      return 0;
    });
  }

  if (json != null && typeof json === 'object') {
    // Sort object items by keys
    return Object.keys(json)
      .sort()
      .reduce((acc: any, key: string) => {
        acc[key] = json[key];
        return acc;
      }, {});
  }

  // Return primitives
  return json;
}
