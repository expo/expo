// @ref llp/0007-deploy-and-headless.rfc.md §Headless project creation — "create-expo, git init".
// Git is a convenience here, never a requirement: a machine without git, or a project created
// inside an existing repository, must still end up with a working app.

import path from 'path';

import { directoryExistsSync } from '../utils/dir';
import { spawnCaptureAsync } from '../utils/spawnCapture';

export interface GitState {
  /** The new project is its own git repository. */
  initialized: boolean;
  /** Why it is, or why it is not, in the words the summary prints. */
  detail: string;
}

/**
 * Give the new project a git repository, unless it already has one or should not have one.
 *
 * `create-expo` runs `git init` itself, so the normal path is to find the repository already there
 * and report it. The rest of the branches exist for the cases where it did not: an older
 * `create-expo`, a project created inside another repository (a nested repository is almost never
 * what was meant), and a machine with no git at all.
 */
export async function resolveGitStateAsync(
  projectRoot: string,
  { git }: { git: boolean }
): Promise<GitState> {
  if (!git) {
    return { initialized: false, detail: 'skipped (--no-git)' };
  }

  if (directoryExistsSync(path.join(projectRoot, '.git'))) {
    return { initialized: true, detail: 'initialized by create-expo' };
  }

  const inside = await spawnCaptureAsync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd: projectRoot,
  });
  if (inside.spawnError) {
    return { initialized: false, detail: 'skipped (git is not available)' };
  }
  // The command answers with a word, and exits 128 outside a repository. Both have to agree
  // before a repository is assumed, or a broken git would silently skip the init.
  if (inside.exitCode === 0 && inside.stdout.trim() === 'true') {
    return { initialized: false, detail: 'skipped (inside an existing git repository)' };
  }

  const init = await spawnCaptureAsync('git', ['init'], { cwd: projectRoot });
  if (init.exitCode !== 0) {
    return { initialized: false, detail: 'skipped (git init failed)' };
  }
  return { initialized: true, detail: 'initialized' };
}
