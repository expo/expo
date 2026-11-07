import { Command } from '@expo/commander';
import fs from 'node:fs';

import { GitDirectory } from '../Git';
import logger from '../Logger';
import { majorReleaseErrors, resolveBackportPackages } from '../changesets/BackportChangelog';
import {
  readAddedChangesetsAsync,
  readPackageDirsAsync,
  resolveCommitAsync,
} from './CheckBackportChangelogCommand';

export type BackportChangesetListOptions = {
  repo?: string;
  base?: string;
};

export type BackportChangesetList = {
  ok: boolean;
  errors: string[];
  /** The changesets that the base commit adds. */
  changesets: string[];
  /** Each package that those changesets name, except a name with a control character, which is an error instead. `changelog` is null when the branch has no single package with that name. */
  packages: { name: string; changelog: string | null }[];
};

export async function listBackportChangesetsAsync(
  options: BackportChangesetListOptions
): Promise<BackportChangesetList> {
  const { repo, base: baseRef } = options;
  if (!repo || !baseRef) {
    const errors = [
      ...(repo ? [] : ['--repo is missing. Pass a worktree of the repository.']),
      ...(baseRef ? [] : ['--base is missing. Pass the cherry-pick commit.']),
    ];
    return { ok: false, errors, changesets: [], packages: [] };
  }
  const git = new GitDirectory(repo);
  const base = await resolveCommitAsync(git, baseRef);
  if (!base) {
    return {
      ok: false,
      errors: [`--base "${baseRef}" is not a commit. Pass the cherry-pick commit.`],
      changesets: [],
      packages: [],
    };
  }

  const [changesets, packageDirs] = await Promise.all([
    readAddedChangesetsAsync(git, base),
    readPackageDirsAsync(git, base),
  ]);
  const resolved = resolveBackportPackages({ changesets, ...packageDirs });
  const errors = [...resolved.errors, ...majorReleaseErrors(changesets)];
  return {
    ok: errors.length === 0,
    errors,
    changesets: changesets.map((changeset) => changeset.path),
    packages: resolved.packages.map(({ name, changelog }) => ({ name, changelog })),
  };
}

async function action(options: BackportChangesetListOptions & { json?: string }) {
  const list = await listBackportChangesetsAsync(options);
  if (options.json) {
    await fs.promises.writeFile(options.json, JSON.stringify(list, null, 2) + '\n');
  }
  for (const changeset of list.changesets) {
    logger.log(`Changeset: ${changeset}`);
  }
  for (const { name, changelog } of list.packages) {
    logger.log(`Package: ${name} -> ${changelog ?? '(not found)'}`);
  }
  for (const error of list.errors) {
    logger.error(error);
  }
  if (!list.ok) {
    process.exitCode = 1;
  }
}

export default (program: Command) => {
  program
    .command('list-backport-changesets')
    .description(
      `Lists the changesets that a cherry-pick onto an SDK branch adds, and the CHANGELOG.md of each package that they name.

  It reads the changesets and the packages as "check-backport-changelog" does, so a conversion that edits
  the listed files is a conversion that the check can accept.
  --repo is a worktree of the repository. --base is the cherry-pick commit. Only commits are read, not the
  working tree or the index.

  With --json <file>, also writes {"ok": boolean, "errors": string[], "changesets": string[],
  "packages": {"name": string, "changelog": string | null}[]} to that file. When a changeset cannot be
  parsed, makes a major release, which SDK branches do not allow, or names a package that is missing or
  not unique, "ok" is false and the command exits with code 1. If the file is missing, the command
  could not run: treat that as a failure.`
    )
    .option('--repo <dir>', 'A worktree of the repository')
    .option('--base <ref>', 'The cherry-pick commit')
    .option('--json <file>', 'Write the result as JSON to this file')
    .asyncAction(action);
};
