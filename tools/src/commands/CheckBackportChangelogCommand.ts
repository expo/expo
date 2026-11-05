import { Command } from '@expo/commander';
import fs from 'node:fs';
import path from 'node:path';
import picomatch from 'picomatch';

import { GitDirectory } from '../Git';
import logger from '../Logger';
import { PACKAGE_GLOB_IGNORE, PACKAGE_JSON_GLOB, TEMPLATE_GLOB_IGNORE } from '../Packages';
import {
  BackportChangedFile,
  BackportChangeset,
  checkBackportChangelog,
} from '../changesets/BackportChangelog';
import { isChangesetPath } from '../code-review/Changesets';

export type BackportChangelogCheckOptions = {
  repo?: string;
  base?: string;
  pr?: string;
  author?: string;
};

export type BackportChangelogReport = {
  ok: boolean;
  errors: string[];
  /** The `git write-tree` of the checked index. Only set when the check passes. */
  tree?: string;
};

type Collected<T> = { value: T; errors: string[] };

const PACKAGE_ROOTS = [
  { dir: 'packages', ignore: PACKAGE_GLOB_IGNORE },
  { dir: 'templates', ignore: TEMPLATE_GLOB_IGNORE },
];

const GITLINK_MODE = '160000';

// Defense in depth only: the check assumes the agent could not write `.git/`, which the workflow
// guarantees. These options block the known ways that git config and replace refs hide changes.
const GIT_GLOBAL_OPTIONS = [
  '--no-replace-objects',
  '-c',
  'diff.ignoreSubmodules=none',
  '-c',
  'core.fsmonitor=false',
  '-c',
  'core.hooksPath=/dev/null',
];

async function gitAsync(git: GitDirectory, args: string[]): Promise<string> {
  return (await git.runAsync([...GIT_GLOBAL_OPTIONS, ...args])).stdout;
}

function splitNul(output: string): string[] {
  return output.split('\0').filter(Boolean);
}

async function readAddedChangesetsAsync(
  git: GitDirectory,
  base: string
): Promise<BackportChangeset[]> {
  const paths = splitNul(
    await gitAsync(git, [
      'diff-tree',
      '-r',
      '--name-only',
      '--diff-filter=A',
      '--no-renames',
      '-z',
      `${base}^`,
      base,
      '--',
      '.changeset',
    ])
  ).filter(isChangesetPath);
  return Promise.all(
    paths.map(async (filePath) => ({
      path: filePath,
      content: await gitAsync(git, ['show', `${base}:${filePath}`]),
    }))
  );
}

/** Maps package names to directories as they are at `base`, with the same globs as `getListOfPackagesAsync`. */
async function readPackageDirsAsync(
  git: GitDirectory,
  base: string
): Promise<{ packageDirs: Map<string, string>; duplicatePackageDirs: Map<string, string[]> }> {
  const dirsByName = new Map<string, string[]>();
  for (const root of PACKAGE_ROOTS) {
    const isPackageJson = picomatch(PACKAGE_JSON_GLOB, { ignore: root.ignore });
    const files = splitNul(
      await gitAsync(git, ['ls-tree', '-r', '--name-only', '-z', base, '--', root.dir])
    ).filter((file) => isPackageJson(path.posix.relative(root.dir, file)));

    await Promise.all(
      files.map(async (file) => {
        const packageJson: { name?: unknown } = JSON.parse(
          await gitAsync(git, ['show', `${base}:${file}`])
        );
        if (typeof packageJson.name === 'string' && packageJson.name) {
          const dirs = dirsByName.get(packageJson.name) ?? [];
          dirsByName.set(packageJson.name, [...dirs, path.posix.dirname(file)]);
        }
      })
    );
  }

  const packageDirs = new Map<string, string>();
  const duplicatePackageDirs = new Map<string, string[]>();
  for (const [name, dirs] of dirsByName) {
    if (dirs.length === 1) {
      packageDirs.set(name, dirs[0]);
    } else {
      duplicatePackageDirs.set(name, dirs);
    }
  }
  return { packageDirs, duplicatePackageDirs };
}

async function readObjectAsync(git: GitDirectory, mode: string, object: string): Promise<string> {
  // A gitlink names a commit in another repository, so there is no blob to read. The core rejects its mode.
  return mode === GITLINK_MODE ? '' : gitAsync(git, ['cat-file', 'blob', object]);
}

async function readChangedFilesAsync(
  git: GitDirectory,
  base: string,
  tree: string
): Promise<Collected<BackportChangedFile[]>> {
  const fields = (
    await gitAsync(git, [
      'diff-tree',
      '-r',
      '--raw',
      '-z',
      '--no-abbrev',
      '--no-renames',
      '--ignore-submodules=none',
      base,
      tree,
    ])
  ).split('\0');
  const changedFiles: BackportChangedFile[] = [];
  const errors: string[] = [];

  let index = 0;
  while (fields[index]) {
    const [oldMode, newMode, oldObject, newObject, status] = fields[index].slice(1).split(' ');
    const pathCount = /^[RC]/.test(status) ? 2 : 1;
    const paths = fields.slice(index + 1, index + 1 + pathCount);
    const filePath = paths[paths.length - 1];
    index += 1 + pathCount;

    switch (status) {
      case 'A':
        changedFiles.push({
          status: 'added',
          path: filePath,
          mode: newMode,
          after: await readObjectAsync(git, newMode, newObject),
        });
        break;
      case 'M':
        changedFiles.push({
          status: 'modified',
          path: filePath,
          mode: newMode,
          before: await readObjectAsync(git, oldMode, oldObject),
          after: await readObjectAsync(git, newMode, newObject),
        });
        break;
      case 'D':
        changedFiles.push({
          status: 'deleted',
          path: filePath,
          before: await readObjectAsync(git, oldMode, oldObject),
        });
        break;
      default:
        errors.push(
          `${paths.join(' -> ')} has git status ${status}. The conversion may only add, modify, or delete regular files. Restore the file and stage it again.`
        );
    }
  }
  return { value: changedFiles, errors };
}

async function checkEverythingIsStagedAsync(git: GitDirectory): Promise<string[]> {
  const unstaged = splitNul(await gitAsync(git, ['diff', '--name-only', '-z']));
  const untracked = splitNul(
    await gitAsync(git, ['ls-files', '--others', '--exclude-standard', '-z'])
  );
  const advice =
    'The check reads the staged files, because that is what will be committed. Run "git add -A", then run the check again.';
  const errors: string[] = [];
  if (unstaged.length > 0) {
    errors.push(`These files have unstaged changes: ${unstaged.join(', ')}. ${advice}`);
  }
  if (untracked.length > 0) {
    errors.push(`These files are untracked: ${untracked.join(', ')}. ${advice}`);
  }
  return errors;
}

function validateOptions(options: BackportChangelogCheckOptions): string[] {
  const errors: string[] = [];
  if (!options.repo) {
    errors.push('--repo is missing. Pass the root of the worktree that holds the conversion.');
  }
  if (!options.base) {
    errors.push('--base is missing. Pass the cherry-pick commit.');
  }
  if (!/^[1-9]\d*$/.test(options.pr ?? '')) {
    errors.push(
      `--pr "${options.pr ?? ''}" is not a pull request number. Pass the number of the original pull request, such as 51463.`
    );
  }
  if (!options.author) {
    errors.push(
      "--author is missing. Pass the GitHub login of the original pull request's author."
    );
  }
  return errors;
}

async function resolveCommitAsync(git: GitDirectory, ref: string): Promise<string | null> {
  try {
    return (await gitAsync(git, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])).trim();
  } catch {
    return null;
  }
}

async function isWorktreeRootAsync(git: GitDirectory): Promise<boolean> {
  try {
    return (await gitAsync(git, ['rev-parse', '--show-prefix'])).trim() === '';
  } catch {
    return false;
  }
}

export async function runBackportChangelogCheckAsync(
  options: BackportChangelogCheckOptions
): Promise<BackportChangelogReport> {
  const { repo, base: baseRef, pr, author } = options;
  const optionErrors = validateOptions(options);
  if (optionErrors.length > 0 || !repo || !baseRef || !pr || !author) {
    return { ok: false, errors: optionErrors };
  }
  const git = new GitDirectory(repo);
  // Some git commands below print and filter paths relative to the working directory.
  if (!(await isWorktreeRootAsync(git))) {
    return {
      ok: false,
      errors: [
        `--repo "${repo}" is not the root of a git worktree. Pass the root of the worktree that holds the conversion.`,
      ],
    };
  }
  const base = await resolveCommitAsync(git, baseRef);
  if (!base) {
    return {
      ok: false,
      errors: [`--base "${baseRef}" is not a commit. Pass the cherry-pick commit.`],
    };
  }

  const head = await resolveCommitAsync(git, 'HEAD');
  const headErrors =
    head === base
      ? []
      : [
          `HEAD is ${head}, but the cherry-pick commit is ${base}, so an extra commit exists after the cherry-pick. The staged changes do not show everything that would ship. Discard this conversion and run it again from the cherry-pick commit.`,
        ];

  let tree: string;
  try {
    tree = (await gitAsync(git, ['write-tree'])).trim();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      errors: [
        `"git write-tree" failed (${reason}), so the staged files cannot be checked. Resolve any unmerged files, stage the conversion again, and run the check again.`,
      ],
    };
  }

  const [stagingErrors, changesets, changedFiles, { packageDirs, duplicatePackageDirs }] =
    await Promise.all([
      checkEverythingIsStagedAsync(git),
      readAddedChangesetsAsync(git, base),
      readChangedFilesAsync(git, base, tree),
      readPackageDirsAsync(git, base),
    ]);
  const core = checkBackportChangelog({
    changesets,
    changedFiles: changedFiles.value,
    prNumber: Number(pr),
    author,
    packageDirs,
    duplicatePackageDirs,
  });
  const errors = [...headErrors, ...stagingErrors, ...changedFiles.errors, ...core.errors];
  return errors.length > 0 ? { ok: false, errors } : { ok: true, errors, tree };
}

async function action(options: BackportChangelogCheckOptions & { json?: string }) {
  let report: BackportChangelogReport;
  try {
    report = await runBackportChangelogCheckAsync(options);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    report = { ok: false, errors: [`The check could not run: ${reason}`] };
  }

  if (options.json) {
    await fs.promises.writeFile(options.json, JSON.stringify(report, null, 2) + '\n');
  }
  if (report.ok) {
    logger.success('Each backported changeset is converted into CHANGELOG.md entries.');
    logger.log(`Tree: ${report.tree}`);
    return;
  }
  for (const error of report.errors) {
    logger.error(error);
  }
  process.exitCode = 1;
}

export default (program: Command) => {
  program
    .command('check-backport-changelog')
    .description(
      `Checks that a cherry-pick onto an SDK branch without changesets had its changesets converted into CHANGELOG.md entries.

  --repo is the root of the worktree to check. Every git command of the check runs there, whatever
  the working directory or EXPO_ROOT_DIR is.
  --base is the cherry-pick commit, and HEAD must still be that commit. The check reads the staged files,
  and fails when the working tree has unstaged changes or untracked files.
  The changesets that --base added must be deleted. The staged changes may only touch the CHANGELOG.md
  of each package that those changesets name, and only by adding entries under "## Unpublished"
  that end with the trailer for --pr and --author.

  When the check passes, it prints the tree of the checked index ("git write-tree"). Commit exactly that tree
  with "git commit-tree <tree> -p <base>", so that nothing changed after the check can ship.
  When the check fails, it prints each problem and exits with code 1.

  With --json <file>, also writes {"ok": boolean, "errors": string[], "tree"?: string} to that file,
  whether the check passes or fails. If the file is missing, the check could not run: treat that as a failure.`
    )
    .option('--repo <dir>', 'The root of the worktree that holds the staged conversion')
    .option('--base <ref>', 'The cherry-pick commit, before the changesets were converted')
    .option('--pr <number>', 'The number of the original pull request on main')
    .option('--author <login>', "The GitHub login of the original pull request's author")
    .option('--json <file>', 'Write the result as JSON to this file')
    .asyncAction(action);
};
