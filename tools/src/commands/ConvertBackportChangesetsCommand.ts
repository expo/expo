import { Command } from '@expo/commander';
import fs from 'node:fs';
import path from 'node:path';

import { GitDirectory } from '../Git';
import logger from '../Logger';
import {
  BackportPackage,
  convertBackportChangesets,
  resolveBackportPackages,
} from '../changesets/BackportChangelog';
import {
  readAddedChangesetsAsync,
  readPackageDirsAsync,
  resolveCommitAsync,
} from './CheckBackportChangelogCommand';

export type BackportChangesetConversionOptions = {
  repo?: string;
  base?: string;
  pr?: string;
  author?: string;
};

export type BackportChangesetConversionReport = {
  ok: boolean;
  errors: string[];
};

function validateOptions(options: BackportChangesetConversionOptions): string[] {
  const errors: string[] = [];
  if (!options.repo) {
    errors.push('--repo is missing. Pass the worktree that holds the cherry-pick.');
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

/** Reads each `CHANGELOG.md` from the working tree. A symbolic link could make the write land outside the repository. */
async function readChangelogsAsync(
  repo: string,
  packages: readonly BackportPackage[]
): Promise<{ changelogs: Map<string, string>; errors: string[] }> {
  const changelogs = new Map<string, string>();
  const errors: string[] = [];
  for (const { changelog } of packages) {
    if (changelog === null) {
      continue;
    }
    const file = path.join(repo, changelog);
    const stats = await fs.promises.lstat(file).catch(() => null);
    if (!stats) {
      errors.push(
        `${changelog} does not exist, so its entries cannot be added. Add the file with an "## Unpublished" section, or add the entries by hand.`
      );
    } else if (!stats.isFile()) {
      errors.push(
        `${changelog} is not a regular file, so the conversion does not write to it. Replace it with a regular file, or add the entries by hand.`
      );
    } else {
      changelogs.set(changelog, await fs.promises.readFile(file, 'utf8'));
    }
  }
  return { changelogs, errors };
}

export async function convertBackportChangesetsAsync(
  options: BackportChangesetConversionOptions
): Promise<BackportChangesetConversionReport> {
  const { repo, base: baseRef, pr, author } = options;
  const optionErrors = validateOptions(options);
  if (optionErrors.length > 0 || !repo || !baseRef || !pr || !author) {
    return { ok: false, errors: optionErrors };
  }
  const git = new GitDirectory(repo);
  const base = await resolveCommitAsync(git, baseRef);
  if (!base) {
    return {
      ok: false,
      errors: [`--base "${baseRef}" is not a commit. Pass the cherry-pick commit.`],
    };
  }

  const [changesets, packageDirs] = await Promise.all([
    readAddedChangesetsAsync(git, base),
    readPackageDirsAsync(git, base),
  ]);
  const { packages, errors: packageErrors } = resolveBackportPackages({
    changesets,
    ...packageDirs,
  });
  if (packageErrors.length > 0) {
    return { ok: false, errors: packageErrors };
  }
  const read = await readChangelogsAsync(repo, packages);
  if (read.errors.length > 0) {
    return { ok: false, errors: read.errors };
  }

  const conversion = convertBackportChangesets({
    changesets,
    packages,
    changelogs: read.changelogs,
    prNumber: Number(pr),
    author,
  });
  if (!conversion.ok) {
    return { ok: false, errors: conversion.errors };
  }
  for (const [changelog, content] of conversion.changelogs) {
    await fs.promises.writeFile(path.join(repo, changelog), content);
  }
  return { ok: true, errors: [] };
}

async function action(options: BackportChangesetConversionOptions & { json?: string }) {
  let report: BackportChangesetConversionReport;
  try {
    report = await convertBackportChangesetsAsync(options);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    report = { ok: false, errors: [`The conversion could not run: ${reason}`] };
  }

  if (options.json) {
    await fs.promises.writeFile(options.json, JSON.stringify(report, null, 2) + '\n');
  }
  if (report.ok) {
    logger.success('Each changeset is converted into CHANGELOG.md entries.');
    return;
  }
  for (const error of report.errors) {
    logger.error(error);
  }
  process.exitCode = 1;
}

export default (program: Command) => {
  program
    .command('convert-backport-changesets')
    .description(
      `Converts the changesets that a cherry-pick onto an SDK branch adds into CHANGELOG.md entries.

  It reads the changesets and the packages as "list-backport-changesets" and "check-backport-changelog" do,
  so it edits the files that the check expects. --repo is a worktree of the repository. --base is the
  cherry-pick commit. For each package that each changeset releases, it adds the summary as one entry
  under "## Unpublished" in the CHANGELOG.md in the working tree: a minor release under "### 🎉 New features",
  and a patch release or a release of type none under "### 💡 Others". Each entry ends with the trailer for
  --pr and --author. The command does not delete the changesets or stage anything.

  When any entry cannot be added, for example because a release is major, a summary is empty, or a
  CHANGELOG.md has no "## Unpublished" section, the command writes no file, prints each problem, and exits
  with code 1. With --json <file>, also writes {"ok": boolean, "errors": string[]} to that file. If the
  file is missing, the command could not run: treat that as a failure.`
    )
    .option('--repo <dir>', 'A worktree of the repository')
    .option('--base <ref>', 'The cherry-pick commit')
    .option('--pr <number>', 'The number of the original pull request on main')
    .option('--author <login>', "The GitHub login of the original pull request's author")
    .option('--json <file>', 'Write the result as JSON to this file')
    .asyncAction(action);
};
