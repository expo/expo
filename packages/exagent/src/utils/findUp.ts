import fs from 'fs';
import path from 'path';

import { CommandError } from './errors';

/** Look up directories until one with a `package.json` can be found, assert if none can be found. */
export function findUpProjectRootOrAssert(cwd: string): string {
  const projectRoot = findUpProjectRoot(cwd);
  if (!projectRoot) {
    throw new CommandError(
      'NO_PROJECT',
      `Project root directory not found (working directory: ${cwd})`
    );
  }
  return path.dirname(projectRoot);
}

/**
 * The project root of a directory, or that directory itself when it is inside no project.
 *
 * The generic `expo` passthrough uses this instead of the asserting variant: `expo login` and
 * `expo whoami` need no project, and the `expo` commands that do need one report a missing project
 * themselves, in their own words.
 */
export function findUpProjectRootOrCwd(cwd: string): string {
  const projectRoot = findUpProjectRoot(cwd);
  return projectRoot ? path.dirname(projectRoot) : cwd;
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
