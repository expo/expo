import assert from 'assert';
import path from 'path';

import type { HashSource, HashSourceDir, HashSourceFile } from './Fingerprint.types';

const debug = require('debug')('expo:fingerprint:Dedup');

/**
 * Strip duplicated sources, mainly for duplicated file or dir
 */
export function dedupSources(sources: HashSource[], projectRoot: string): HashSource[] {
  const newSources: HashSource[] = [];
  for (const source of sources) {
    const [duplicatedItemIndex, shouldSwapSource] = findDuplicatedSourceIndex(
      newSources,
      source,
      projectRoot
    );
    if (duplicatedItemIndex >= 0) {
      const duplicatedItem = newSources[duplicatedItemIndex];
      debug(`Skipping duplicated source: ${JSON.stringify(source)}`);
      if (shouldSwapSource) {
        newSources[duplicatedItemIndex] = {
          ...source,
          reasons: [...source.reasons, ...duplicatedItem.reasons],
        };
      } else {
        duplicatedItem.reasons = [...duplicatedItem.reasons, ...source.reasons];
      }
    } else {
      newSources.push(source);
    }
  }

  return newSources;
}

/**
 * When two sources are duplicated, merge `src`'s reasons into `dst`
 */
export function mergeSourceWithReasons(dst: HashSource, src: HashSource): HashSource {
  return dst;
}

/**
 * Find the duplicated `source` in `newSources`
 * @return tuple of [duplicatedItemIndexInNewSources, shouldSwapSource]
 */
function findDuplicatedSourceIndex(
  newSources: HashSource[],
  source: HashSource,
  projectRoot: string
): [number, boolean] {
  let shouldSwapSource = false;
  if (source.type === 'contents') {
    return [
      newSources.findIndex((item) => item.type === source.type && item.id === source.id) ?? null,
      shouldSwapSource,
    ];
  }

  for (const [index, existingSource] of newSources.entries()) {
    if (existingSource.type === 'contents') {
      continue;
    }
    if (isDescendant(source, existingSource, projectRoot)) {
      return [index, shouldSwapSource];
    }
    // If the new source is ancestor of existing source, replace swap the existing source with the new source
    if (isDescendant(existingSource, source, projectRoot)) {
      shouldSwapSource = true;
      return [index, shouldSwapSource];
    }
  }
  return [-1, shouldSwapSource];
}

function isDescendant(
  from: HashSourceDir | HashSourceFile,
  to: HashSourceDir | HashSourceFile,
  projectRoot: string
): boolean {
  if (from === to) {
    return true;
  }

  const fromPath = path.join(projectRoot, from.filePath);
  const toPath = path.join(projectRoot, to.filePath);
  const result = path.relative(fromPath, toPath).match(/^[./\\/]*$/) != null;
  if (result) {
    assert(
      !(to.type === 'file' && from.type === 'dir'),
      `Unexpected case which a dir is a descendant of a file - from[${fromPath}] to[${toPath}]`
    );
  }
  return result;
}
