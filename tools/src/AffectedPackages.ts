import spawnAsync from '@expo/spawn-async';
import path from 'path';

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

  // Invoke the turbo binary directly — going through pnpm can prepend warning banners
  // (which may themselves contain braces) to stdout, breaking JSON extraction.
  const turboBin = path.join(Directories.getNodeModulesDir(), '.bin', 'turbo');
  const { stdout } = await spawnAsync(turboBin, ['ls', '--affected', '--output=json'], {
    cwd: Directories.getExpoRepositoryRootDir(),
    env: { ...process.env, TURBO_SCM_BASE: options.scmBase },
  });
  const json = extractJson(stdout);
  const items: { name: string }[] = json.packages?.items ?? [];
  return { type: 'packages', packageNames: new Set(items.map((item) => item.name)) };
}

// Extracts the JSON document from process output that may be surrounded by other text
// (warnings, banners): tries each `{` as a start and accepts the one that parses to the end.
function extractJson(output: string): any {
  for (let index = output.indexOf('{'); index !== -1; index = output.indexOf('{', index + 1)) {
    try {
      return JSON.parse(output.slice(index));
    } catch {
      // Not the start of the JSON document — try the next brace.
    }
  }
  throw new Error(`No JSON document found in the output:\n${output}`);
}

// Changed repo-relative paths since the merge base with `scmBase`, including uncommitted
// and untracked files so local runs see work in progress the same way turbo does.
//
// Both git commands use `-z` (NUL-separated records). This disables `core.quotePath`, which
// otherwise wraps paths with spaces or non-ASCII bytes in literal double quotes — those quotes
// would defeat the `^`-anchored `INFRA_PATH_PATTERNS`, silently skipping tests for such a change.
// It also makes rename entries unambiguous instead of relying on a ` -> ` separator that a path
// could itself contain.
async function getChangedFilesAsync(scmBase: string): Promise<string[]> {
  const cwd = Directories.getExpoRepositoryRootDir();
  const mergeBase = (
    await spawnAsync('git', ['merge-base', scmBase, 'HEAD'], { cwd })
  ).stdout.trim();
  const committed = splitNulRecords(
    (await spawnAsync('git', ['diff', '-z', '--name-only', `${mergeBase}...HEAD`], { cwd })).stdout
  );
  // `git status --porcelain=v1 -z` emits `XY <path>` records; for a rename it's two records:
  // `XY <new>` then `<orig>`, so the current path is always the record that starts with a status
  // code. Take those, stripping the `XY ` prefix.
  const workingTree = splitNulRecords(
    (await spawnAsync('git', ['status', '--porcelain=v1', '-z'], { cwd })).stdout
  )
    .filter((record) => /^[ MADRCU?!]{2} /.test(record))
    .map((record) => record.slice(3));
  return [...new Set([...committed, ...workingTree])];
}

// Splits git's `-z` output into records. The final record is NUL-terminated too, so the trailing
// empty segment is dropped.
function splitNulRecords(output: string): string[] {
  return output.split('\0').filter(Boolean);
}
