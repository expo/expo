import fs from 'fs';
import path from 'path';

import { CommandError } from '../utils/errors';

/** Look up directories until one with a `package.json` can be found, assert if none can be found. */
export function findUpProjectRootOrAssert(cwd: string): string {
  const projectRoot = findUpProjectRoot(cwd);
  if (!projectRoot) {
    throw new CommandError(`Project root directory not found (working directory: ${cwd})`);
  }
  return path.dirname(projectRoot);
}

function findUpProjectRoot(root: string): string | null {
  return findFileInParents(root, 'package.json');
}

/**
 * Find a file in the (closest) parent directories.
 * This will recursively look for the file, until the root directory is reached.
 */
export function findFileInParents(root: string, fileName: string): string | null {
  for (let dir = root; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const file = path.resolve(dir, fileName);
    if (fs.existsSync(file)) {
      return file;
    }
  }
  return null;
}
