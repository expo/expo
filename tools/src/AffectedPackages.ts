import spawnAsync from '@expo/spawn-async';

import * as Directories from './Directories';

export type AffectedPackagesOptions = {
  /** Git ref to diff against, e.g. `main` or a base commit SHA. */
  scmBase: string;
  /**
   * Regexes of repo-relative paths that affect the test infrastructure itself — when any
   * changed file matches, affected-detection is off the table and everything should run.
   */
  infraPathPatterns: RegExp[];
};

export type AffectedPackagesResult =
  | { type: 'packages'; packageNames: Set<string> }
  | { type: 'infra-changed'; changedFile: string };

/**
 * Returns the names of workspace packages affected by changes since `scmBase`, including
 * their dependents (computed by `turbo ls --affected`, which also accounts for uncommitted
 * changes). When a changed file matches `infraPathPatterns`, returns `infra-changed`
 * instead — changes to the infrastructure itself must not be able to skip tests.
 */
export async function getAffectedPackagesAsync(
  options: AffectedPackagesOptions
): Promise<AffectedPackagesResult> {
  const changedFiles = await getChangedFilesAsync(options.scmBase);
  const changedInfraFile = changedFiles.find((file) =>
    options.infraPathPatterns.some((pattern) => pattern.test(file))
  );
  if (changedInfraFile) {
    return { type: 'infra-changed', changedFile: changedInfraFile };
  }

  const { stdout } = await spawnAsync('pnpm', ['turbo', 'ls', '--affected', '--output=json'], {
    cwd: Directories.getExpoRepositoryRootDir(),
    env: { ...process.env, TURBO_SCM_BASE: options.scmBase },
  });
  // Skip anything a package manager may print before turbo's JSON output.
  const json = JSON.parse(stdout.slice(stdout.indexOf('{')));
  const items: { name: string }[] = json.packages?.items ?? [];
  return { type: 'packages', packageNames: new Set(items.map((item) => item.name)) };
}

// Changed repo-relative paths since the merge base with `scmBase`, including uncommitted
// and untracked files so local runs see work in progress the same way turbo does.
async function getChangedFilesAsync(scmBase: string): Promise<string[]> {
  const cwd = Directories.getExpoRepositoryRootDir();
  const mergeBase = (
    await spawnAsync('git', ['merge-base', scmBase, 'HEAD'], { cwd })
  ).stdout.trim();
  const committed = (
    await spawnAsync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { cwd })
  ).stdout
    .split('\n')
    .filter(Boolean);
  const workingTree = (await spawnAsync('git', ['status', '--porcelain'], { cwd })).stdout
    .split('\n')
    .filter(Boolean)
    // Lines look like `XY path` or `XY old -> new` for renames — take the current path.
    .map((line) => line.slice(3).split(' -> ').pop()!);
  return [...new Set([...committed, ...workingTree])];
}
