// @ref llp/0007-deploy-and-headless.rfc.md §new — "create-expo, git init".
// Git is a convenience here, never a requirement: a machine without git, or a project created
// inside an existing repository, must still end up with a working app.

import fs from 'fs';
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
 *
 * @param createdProjectDirectory whether *this command* created the project directory. It is what
 * makes `--no-git` safe: see {@link removeCreateExpoRepositoryAsync}.
 */
export async function resolveGitStateAsync(
  projectRoot: string,
  { git, createdProjectDirectory }: { git: boolean; createdProjectDirectory: boolean }
): Promise<GitState> {
  if (!git) {
    return await removeCreateExpoRepositoryAsync(projectRoot, createdProjectDirectory);
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

/**
 * Undo the `git init` `create-expo` does on its own, for a caller who passed `--no-git`.
 *
 * @ref llp/0010-agent-conventions.rfc.md §Upstream asks — `create-expo` has **no flag to skip it**
 * [observed — `create-expo@latest --help`, 2026-08-28], so a wrapper that means "no repository"
 * has to remove one. Until that ask lands this is the only way the flag can be true, and the
 * alternative — reporting `gitInitialized: false` beside a `.git` holding an "Initial commit", which
 * is what this did before [F110, observed live 2026-08-28] — is a false statement in a documented
 * `--json` field.
 *
 * **The guard is "did this command create the directory", not "is there a repository".** `new` into
 * a directory that already existed can mean a repository that already existed, with somebody's
 * history in it, and no scaffolding flag may delete that. A directory this command did not create
 * keeps whatever it had, and the state reports it truthfully instead.
 *
 * Only `.git` is removed. A removal that fails is reported as the repository it left behind, for
 * the same reason: the report has to describe the directory, not the intention.
 */
async function removeCreateExpoRepositoryAsync(
  projectRoot: string,
  createdProjectDirectory: boolean
): Promise<GitState> {
  const repository = path.join(projectRoot, '.git');
  if (!directoryExistsSync(repository)) {
    return { initialized: false, detail: 'skipped (--no-git)' };
  }
  if (!createdProjectDirectory) {
    return {
      initialized: true,
      detail:
        'left alone (--no-git does not remove a repository that was here before this command)',
    };
  }
  try {
    await fs.promises.rm(repository, { recursive: true, force: true });
  } catch (error) {
    return {
      initialized: true,
      detail: `--no-git could not be honored: create-expo initialized a repository and it could not be removed (${(error as Error).message})`,
    };
  }
  return {
    initialized: false,
    detail: 'skipped (--no-git); create-expo initializes git itself, so its repository was removed',
  };
}
