import fs from 'fs';
import path from 'path';

import { PROGRAM_PREFIX } from '../programName';
import { canonicalizeExistingPath } from './dir';
import { CommandError } from './errors';

/**
 * Look up directories until one with a `package.json` can be found, assert if none can be found.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
 * This is the first thing a caller in the wrong directory sees, and it is the one failure that
 * needs no diagnosis: the answer is always "run this somewhere else, or make a project here". It
 * used to be a single clause with no reason, no next step and a null `suggestedCommand`, so an
 * agent that read it had nothing on the `Try:` line to act on.
 */
export function findUpProjectRootOrAssert(cwd: string): string {
  const projectRoot = findUpProjectRoot(cwd);
  if (!projectRoot) {
    const error = new CommandError(
      'NO_PROJECT',
      [
        `No project was found here, so this command has nothing to act on.`,
        `Why: neither ${cwd} nor any directory above it holds a package.json, which is what marks the root of a JavaScript project — so there is no app for this command to be about.`,
        `How: change to the directory of an existing app and run this again, or create one here with "${PROGRAM_PREFIX} new my-app".`,
      ].join('\n')
    );
    error.suggestedCommand = `${PROGRAM_PREFIX} new my-app`;
    throw error;
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
  const file = findFileInParents(root, 'package.json');
  if (!file) {
    return null;
  }
  return canonicalizeExistingPath(file);
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
