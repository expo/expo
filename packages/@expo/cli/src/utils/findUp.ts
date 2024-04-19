import path from 'path';
import resolveFrom from 'resolve-from';

import { CommandError } from '../utils/errors';

/** Look up directories until one with a `package.json` can be found, assert if none can be found. */
export function findUpProjectRootOrAssert(cwd: string): string {
  const projectRoot = findUpProjectRoot(cwd);
  if (!projectRoot) {
    throw new CommandError(`Project root directory not found (working directory: ${cwd})`);
  }
  return projectRoot;
}

function findUpProjectRoot(cwd: string): string | null {
  if (['.', path.sep].includes(cwd)) return null;

  const found = resolveFrom.silent(cwd, './package.json');
  if (found) {
    return path.dirname(found);
  }
  return findUpProjectRoot(path.dirname(cwd));
}

/**
 * Find a file in the (closest) parent directories.
 * This will recursively look for the file, until the root directory is reached.
 */
export function findFileInParents(cwd: string, fileName: string): string | null {
  if (['.', path.sep].includes(cwd)) return null;

  const found = resolveFrom.silent(cwd, `./${fileName}`);
  if (found) return found;

  return findFileInParents(path.dirname(cwd), fileName);
}
