import chalk from 'chalk';
import inquirer from 'inquirer';
import pick from 'lodash/pick';
import npmPacklist from 'npm-packlist';
import semver from 'semver';

import { BACKUPABLE_OPTIONS_FIELDS, RELEASE_TYPES_ASC_ORDER } from './constants';
import { BackupableOptions, CommandOptions, PackageGitLogs, Parcel, ReleaseType } from './types';
import * as Changelogs from '../Changelogs';
import * as Formatter from '../Formatter';
import { GitDirectory, GitFileStatus } from '../Git';
import logger from '../Logger';

const { green, cyan, magenta, gray, red } = chalk;

/**
 * Returns options that are capable of being backed up.
 * We will need just a few options to determine whether the backup is valid
 * and we can't pass them all because `options` is in fact commander's `Command` instance.
 */
export function pickBackupableOptions(options: CommandOptions): BackupableOptions {
  return pick(options, BACKUPABLE_OPTIONS_FIELDS);
}

/**
 * Whether tasks backup can be used to retry previous command invocation.
 */
export async function shouldUseBackupAsync(options: CommandOptions): Promise<boolean> {
  if (process.env.CI || options.canary) {
    return false;
  }
  if (options.retry) {
    return true;
  }
  const { restore } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'restore',
      prefix: '❔',
      message: cyan('Found valid backup file. Would you like to use it?'),
    },
  ]);
  logger.log();
  return restore;
}

/**
 * Prints gathered crucial informations about the package.
 */
export function printPackageParcel(parcel: Parcel): void {
  const { pkg, pkgView, state, logs, changelogChanges, dependencies, dependents } = parcel;
  const { releaseType, releaseVersion } = state;
  const gitHead = pkgView?.gitHead;

  logger.log(
    '\n📦',
    `${green.bold(pkg.packageName)},`,
    `current version ${cyan.bold(pkg.packageVersion)},`,
    pkgView ? `published from ${Formatter.formatCommitHash(gitHead)}` : 'not published yet'
  );

  if (dependents.size) {
    logger.log(
      '  ',
      magenta('Dependency of:'),
      [...dependents].map((dependent) => green(dependent.pkg.packageName)).join(', ')
    );
  }

  if (!pkgView) {
    logger.log(
      '  ',
      magenta(`Version ${cyan.bold(pkg.packageVersion)} hasn't been published yet.`)
    );
  } else if (!logs) {
    logger.warn("   We couldn't determine new commits for this package.");

    if (gitHead) {
      // There are no logs and `gitHead` is there, so probably it's unreachable.
      logger.warn('   Git head of its current version is not reachable from this branch.');
    } else {
      logger.warn("   It doesn't seem to be published by this script yet.");
    }
  }

  if (dependencies.size) {
    logger.log('  ', magenta('Package depends on:'));

    dependencies.forEach((dependency) => {
      const fromVersion = dependency.pkg.packageVersion;
      const toVersion = dependency.state.releaseVersion;

      logger.log(
        '    ',
        green(dependency.pkg.packageName),
        gray(`(upgrades from ${cyan(fromVersion)}${toVersion ? ` to ${cyan(toVersion)}` : ''})`)
      );
    });
  }
  if (logs && logs.commits.length > 0) {
    logger.log('  ', magenta('New commits:'));

    [...logs.commits].reverse().forEach((commitLog) => {
      logger.log('    ', Formatter.formatCommitLog(commitLog));
    });
  }
  if (logs && logs.files.length > 0) {
    logger.log('  ', magenta('File changes:'), gray('(build folder not displayed)'));

    logs.files.forEach((fileLog) => {
      if (fileLog.relativePath.startsWith('build/')) {
        return;
      }
      logger.log('    ', Formatter.formatFileLog(fileLog));
    });
  }

  const unpublishedChanges = changelogChanges?.versions[Changelogs.UNPUBLISHED_VERSION_NAME] ?? {};

  for (const changeType in unpublishedChanges) {
    const changes = unpublishedChanges[changeType];

    if (changes.length > 0) {
      logger.log('  ', magenta(`${Formatter.stripNonAsciiChars(changeType).trim()}:`));

      for (const change of unpublishedChanges[changeType]) {
        logger.log('    ', Formatter.formatChangelogEntry(change.message));
      }
    }
  }

  if (pkgView && releaseType && releaseVersion) {
    logger.log(
      '  ',
      magenta(`Suggested ${cyan.bold(releaseType)} upgrade to ${cyan.bold(releaseVersion)}`)
    );
  }
}

/**
 * Gets lists of commits and files changed under given directory and since commit with given checksum.
 * Returned files list is filtered out from files ignored by npm when it creates package's tarball.
 * Can return `null` if given commit is not an ancestor of head commit.
 */
export async function getPackageGitLogsAsync(
  gitDir: GitDirectory,
  fromCommit?: string
): Promise<PackageGitLogs> {
  if (!fromCommit || !(await gitDir.isAncestorAsync(fromCommit))) {
    return null;
  }

  const commits = await gitDir.logAsync({
    fromCommit,
    toCommit: 'HEAD',
  });

  const gitFiles = await gitDir.logFilesAsync({
    fromCommit,
    toCommit: commits[0]?.hash,
  });

  // Get an array of relative paths to files that will be shipped with the package.
  const packlist = await npmPacklist({ path: gitDir.path });

  // Filter git files to contain only deleted or "packlisted" files.
  const files = gitFiles.filter(
    (file) => file.status === GitFileStatus.D || packlist.includes(file.relativePath)
  );

  return {
    commits,
    files,
  };
}

export function getMinReleaseType(changelogChanges: any): ReleaseType {
  const unpublishedChanges = changelogChanges?.versions[Changelogs.UNPUBLISHED_VERSION_NAME];
  const hasBreakingChanges = unpublishedChanges?.[Changelogs.ChangeType.BREAKING_CHANGES]?.length;
  const hasNewFeatures = unpublishedChanges?.[Changelogs.ChangeType.NEW_FEATURES]?.length;

  // For breaking changes and new features we follow semver.
  if (hasBreakingChanges) {
    return ReleaseType.MAJOR;
  }
  if (hasNewFeatures) {
    return ReleaseType.MINOR;
  }
  return ReleaseType.PATCH;
}

/**
 * Returns suggested version based on given current version, already published versions and suggested release type.
 */
export function resolveSuggestedVersion(
  versionToBump: string,
  otherVersions: string[],
  releaseType: ReleaseType,
  prereleaseIdentifier?: string | null
): string {
  const targetPrereleaseIdentifier = prereleaseIdentifier ?? getPrereleaseIdentifier(versionToBump);

  // Higher version might have already been published from another place,
  // so get the highest published version that satisfies release type.
  const highestSatisfyingVersion = otherVersions
    .filter((version) => {
      return (
        semver.gt(version, versionToBump) &&
        semver.diff(version, versionToBump) === releaseType &&
        getPrereleaseIdentifier(version) === targetPrereleaseIdentifier
      );
    })
    .sort(semver.rcompare)[0];

  return semver.inc(
    highestSatisfyingVersion ?? versionToBump,
    releaseType,
    targetPrereleaseIdentifier ?? undefined
  ) as string;
}

export function resolveReleaseTypeAndVersion(parcel: Parcel, options: CommandOptions) {
  const prerelease = options.prerelease === true ? 'rc' : options.prerelease || undefined;
  const { pkg, pkgView, state } = parcel;

  // Find the highest release type among parcel's dependencies.
  const accumulatedTypes = recursivelyAccumulateReleaseTypes(parcel);
  const highestReleaseType = [...accumulatedTypes].reduce(
    highestReleaseTypeReducer,
    ReleaseType.PATCH
  );
  const allVersions = pkgView?.versions ?? [];

  if (prerelease) {
    // Make it a prerelease version if `--prerelease` was passed and assign to the state.
    state.releaseType = ('pre' + highestReleaseType) as ReleaseType;
  } else if (getPrereleaseIdentifier(pkg.packageVersion)) {
    // If the current version is a prerelease, just increment its number.
    state.releaseType = ReleaseType.PRERELEASE;
  } else {
    // Set the release type depending on changes made in the package.
    state.releaseType = highestReleaseType;
  }

  // If the version to bump is not published yet, then we do want to use it instead,
  // no matter which release type is suggested.
  if (allVersions.includes(pkg.packageVersion)) {
    // Calculate version that we should bump to.
    state.releaseVersion = resolveSuggestedVersion(
      pkg.packageVersion,
      allVersions,
      state.releaseType,
      prerelease
    );
  } else {
    state.releaseVersion = pkg.packageVersion;
  }
  return state.releaseVersion;
}

/**
 * Accumulates all `minReleaseType` in given parcel and all its dependencies.
 */
export function recursivelyAccumulateReleaseTypes(
  parcel: Parcel,
  set: Set<ReleaseType> = new Set()
) {
  if (parcel.minReleaseType) {
    set.add(parcel.minReleaseType);
  }
  for (const dependency of parcel.dependencies) {
    recursivelyAccumulateReleaseTypes(dependency, set);
  }
  return set;
}

export function isParcelUnpublished(parcel: Parcel): boolean {
  const { logs, changelogChanges, dependencies } = parcel;
  const hasChangedFiles = !logs || logs.files.length > 0;
  const hasChangelogChanges = changelogChanges ? changelogChanges.totalCount > 0 : false;

  return hasChangedFiles || hasChangelogChanges || dependencies.size > 0;
}

/**
 * Used as a reducer to find the highest release type.
 */
export function highestReleaseTypeReducer(a: ReleaseType, b: ReleaseType): ReleaseType {
  const ai = RELEASE_TYPES_ASC_ORDER.indexOf(a);
  const bi = RELEASE_TYPES_ASC_ORDER.indexOf(b);
  return bi > ai ? b : a;
}

/**
 * Returns prerelease identifier of given version or `null` if given version is not a prerelease version.
 * `semver.prerelease` returns an array of prerelease parts (`1.0.0-beta.0` results in `['beta', 0]`),
 * however we just need the identifier.
 */
export function getPrereleaseIdentifier(version: string): string | null {
  const prerelease = semver.prerelease(version);
  return Array.isArray(prerelease) && typeof prerelease[0] === 'string' ? prerelease[0] : null;
}

/**
 * Returns a list of suggested versions to publish.
 */
export function getSuggestedVersions(
  version: string,
  otherVersions: string[],
  prerelease?: string | null
): string[] {
  const [currentPrereleaseId] = semver.prerelease(version) ?? [];

  // The current version is a prerelease version
  if (typeof currentPrereleaseId === 'string') {
    const prereleaseIds = ['alpha', 'beta', 'rc'];

    if (!prereleaseIds.includes(currentPrereleaseId)) {
      prereleaseIds.unshift(currentPrereleaseId);
    }
    return prereleaseIds
      .slice(prereleaseIds.indexOf(currentPrereleaseId))
      .map((identifier) => {
        return resolveSuggestedVersion(version, otherVersions, ReleaseType.PRERELEASE, identifier);
      })
      .concat(version.replace(/\-.*$/, ''));
  }
  return [ReleaseType.MAJOR, ReleaseType.MINOR, ReleaseType.PATCH].map((type) => {
    return resolveSuggestedVersion(version, otherVersions, type, prerelease);
  });
}

/**
 * Returns a function that validates the version for given parcel.
 */
export function validateVersion(parcel: Parcel) {
  return (input: string) => {
    if (input) {
      if (!semver.valid(input)) {
        return red(`${cyan.bold(input)} is not a valid semver version.`);
      }
      if (parcel.pkgView && parcel.pkgView.versions.includes(input)) {
        return red(`${cyan.bold(input)} has already been published.`);
      }
    }
    return true;
  };
}
