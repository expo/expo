import chalk from 'chalk';
import { pick } from 'lodash';
import semver from 'semver';
import inquirer from 'inquirer';

import * as Changelogs from '../Changelogs';
import * as Formatter from '../Formatter';
import Git, { GitFileLog, GitDirectory } from '../Git';
import logger from '../Logger';
import { PackageViewType } from '../Npm';
import { Package } from '../Packages';
import { BACKUPABLE_OPTIONS_FIELDS, NATIVE_DIRECTORIES } from './constants';
import { BackupableOptions, CommandOptions, Parcel, ReleaseType, PackageGitLogs } from './types';

const { green, yellow, cyan, magenta, blue, red, gray } = chalk;
const RELEASE_TYPES_ASC_ORDER = [ReleaseType.PATCH, ReleaseType.MINOR, ReleaseType.MAJOR];

/**
 * Returns options that are capable of being backed up.
 * We will need just a few options to determine whether the backup is valid
 * and we can't pass them all because `options` is in fact commander's `Command` instance.
 */
export function pickBackupableOptions(options: CommandOptions): BackupableOptions {
  return pick(options, BACKUPABLE_OPTIONS_FIELDS);
}

/**
 * Checks whether the command is run on master branch or package side-branch.
 * Otherwise, it prompts to confirm that you know what you're doing.
 * On CI it returns `true` only if run on `master` branch.
 */
export async function checkBranchNameAsync(branchName: string) {
  if (process.env.CI) {
    // CI is allowed to publish only from master.
    return branchName === 'master';
  }

  // Publishes can be run on `master` or package's side-branches like `expo-package/1.x.x`
  if (branchName === 'master' || /^[\w\-@]+\/\d+\.(x\.x|\d+\.x)$/.test(branchName)) {
    return true;
  }

  logger.warn(
    `⚠️  It's recommended to publish from ${blue('master')} branch, while you're at ${blue(
      branchName
    )}`
  );

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      prefix: yellow('⚠️ '),
      message: yellow(`Do you want to proceed?`),
      default: true,
    },
  ]);
  logger.log();
  return confirmed;
}

/**
 * Resolves to a boolean value that means whether to stop the workflow if some integrity checks have failed.
 * It immediately returns `true` if it's run on the CI.
 */
export async function shouldStopOnFailedIntegrityChecksAsync(): Promise<boolean> {
  if (process.env.CI) {
    return true;
  }
  const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
    {
      type: 'confirm',
      name: 'proceed',
      prefix: '❔',
      message: yellow('Some integrity checks have failed. Do you want to proceed either way?'),
      default: true,
    },
  ]);
  return !proceed;
}

/**
 * Whether tasks backup can be used to retry previous command invocation.
 */
export async function shouldUseBackupAsync(options: CommandOptions): Promise<boolean> {
  if (process.env.CI) {
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
 * Prompts the user to confirm whether the package should be published.
 * It immediately returns `true` if it's run on the CI.
 */
export async function selectPackageToPublishAsync(parcel: Parcel): Promise<boolean> {
  if (process.env.CI) {
    return true;
  }
  const packageName = parcel.pkg.packageName;
  const version = parcel.state.releaseVersion;
  const { selected } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'selected',
      prefix: '❔',
      message: `Do you want to publish ${green.bold(packageName)} as ${cyan.bold(version!)}?`,
      default: true,
    },
  ]);
  if (!selected) {
    const { version } = await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        prefix: '❔',
        message: `Do you want to use different version? ${gray('(leave empty to skip)')}`,
        validate(input: string) {
          if (input) {
            if (!semver.valid(input)) {
              return red(`${cyan.bold(input)} is not a valid semver version.`);
            }
            if (parcel.pkgView && parcel.pkgView.versions.includes(input)) {
              return red(`${cyan.bold(input)} has already been published.`);
            }
          }
          return true;
        },
      },
    ]);
    if (version) {
      parcel.state.releaseVersion = version;
      return true;
    }
  }
  return selected;
}

/**
 * Returns minimum release type for given parcel (doesn't take dependencies into account).
 */
export function getMinReleaseType(parcel: Parcel): ReleaseType {
  const { logs, changelogChanges } = parcel.state;

  const unpublishedChanges = changelogChanges?.versions.unpublished;
  const hasBreakingChanges = unpublishedChanges?.[Changelogs.ChangeType.BREAKING_CHANGES]?.length;
  const hasNativeChanges = logs && fileLogsContainNativeChanges(logs.files);

  const releaseType = hasBreakingChanges
    ? ReleaseType.MAJOR
    : hasNativeChanges
    ? ReleaseType.MINOR
    : ReleaseType.PATCH;

  return releaseType;
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
    targetPrereleaseIdentifier
  ) as string;
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
 * Accumulates all `minReleaseType` in given parcel and all its dependencies.
 */
export function recursivelyAccumulateReleaseTypes(
  parcel: Parcel,
  set: Set<ReleaseType> = new Set()
) {
  if (parcel.state.minReleaseType) {
    set.add(parcel.state.minReleaseType);
  }
  for (const dependency of parcel.dependencies) {
    recursivelyAccumulateReleaseTypes(dependency, set);
  }
  return set;
}

/**
 * Determines whether git file logs contain any changes in directories with native code.
 */
export function fileLogsContainNativeChanges(fileLogs: GitFileLog[]): boolean {
  return fileLogs.some((fileLog) => {
    return NATIVE_DIRECTORIES.some((dir) => fileLog.relativePath.startsWith(`${dir}/`));
  });
}

/**
 * Wraps `Package` object into a parcels - convenient wrapper providing more package-related helpers.
 */
export async function createParcelAsync(pkg: Package): Promise<Parcel> {
  const pkgView = await pkg.getPackageViewAsync();
  const changelog = Changelogs.loadFrom(pkg.changelogPath);
  const gitDir = new Git.Directory(pkg.path);

  return {
    pkg,
    pkgView,
    changelog,
    gitDir,
    dependents: [],
    dependencies: [],
    state: {},
  };
}

/**
 * Recursively resolves dependencies for every chosen package.
 */
export async function recursivelyResolveDependenciesAsync(
  allPackagesObject: { [key: string]: Package },
  parcelsObject: { [key: string]: Parcel },
  parcels: Parcel[]
): Promise<void> {
  const newParcels: Parcel[] = [];

  for (const parcel of parcels) {
    const dependencies = parcel.pkg.getDependencies().filter((dependency) => {
      return (
        dependency.versionRange !== '*' &&
        allPackagesObject[dependency.name] &&
        !parcelsObject[dependency.name]
      );
    });

    await Promise.all(
      dependencies.map(async ({ name }) => {
        const dependencyPkg = allPackagesObject[name];
        let dependencyParcel = parcelsObject[name];

        // If a parcel for this dependency doesn't exist yet, let's create it.
        if (!dependencyParcel) {
          dependencyParcel = await createParcelAsync(dependencyPkg);
          parcelsObject[name] = dependencyParcel;
          newParcels.push(dependencyParcel);
        }

        dependencyParcel.dependents.push(parcel);
        parcel.dependencies.push(dependencyParcel);
      })
    );
  }

  if (newParcels.length > 0) {
    await recursivelyResolveDependenciesAsync(allPackagesObject, parcelsObject, newParcels);
    parcels.push(...newParcels);
  }
}

/**
 * Prints gathered crucial informations about the package.
 */
export function printPackageParcel(parcel: Parcel): void {
  const { pkg, pkgView, state, dependencies } = parcel;
  const { logs, changelogChanges, releaseType, releaseVersion } = state;
  const gitHead = pkg.packageJson.gitHead;

  logger.log(
    '\n📦',
    `${green.bold(pkg.packageName)},`,
    `current version ${cyan.bold(pkg.packageVersion)},`,
    pkgView ? `published from ${Formatter.formatCommitHash(gitHead)}` : 'not published yet'
  );

  if (!pkgView) {
    logger.log(
      '  ',
      magenta(`Version ${cyan.bold(pkg.packageVersion)} hasn't been published yet.`)
    );
  } else if (!logs) {
    logger.warn("   We couldn't determine new commits for this package.");

    if (pkg.packageJson.gitHead) {
      // There are no logs and `gitHead` is there, so probably it's unreachable.
      logger.warn('   Git head of its current version is not reachable from this branch.');
    } else {
      logger.warn("   It doesn't seem to be published by this script yet.");
    }
  }

  if (dependencies.length) {
    logger.log('  ', magenta('Package depends on:'));

    dependencies.forEach((dependency) => {
      logger.log(
        '    ',
        green(dependency.pkg.packageName),
        gray(`(requires ${cyan(dependency.state.releaseType!)} upgrade)`)
      );
    });
  }
  if (logs && logs.commits.length > 0) {
    logger.log('  ', magenta('New commits:'));

    logs.commits.forEach((commitLog) => {
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

  const unpublishedChanges =
    changelogChanges?.versions.unpublished ?? changelogChanges?.versions.master ?? {};

  for (const changeType in unpublishedChanges) {
    const changes = unpublishedChanges[changeType];

    if (changes.length > 0) {
      logger.log('  ', magenta(`${Formatter.stripNonAsciiChars(changeType).trim()}:`));

      for (const change of unpublishedChanges[changeType]) {
        logger.log('    ', Formatter.formatChangelogEntry(change));
      }
    }
  }

  if (releaseType && releaseVersion) {
    logger.log(
      '  ',
      magenta(`Suggested ${cyan.bold(releaseType)} upgrade to ${cyan.bold(releaseVersion)}`)
    );
  }
}

/**
 * If commit message was provided as an option then it's returned.
 * Otherwise it is auto-generated based on provided package names.
 */
export function commitMessageForOptions(options: CommandOptions): string {
  if (options.commitMessage) {
    return options.commitMessage;
  }
  if (0 < options.packageNames.length && options.packageNames.length < 4) {
    return `Publish ${options.packageNames.join(', ')}`;
  }
  return 'Publish packages';
}

/**
 * Returns boolean value determining if someone from given users list is not a maintainer of the package.
 */
export function doesSomeoneHaveNoAccessToPackage(
  users: string[],
  pkgView?: PackageViewType | null
): boolean {
  if (!pkgView) {
    return true;
  }
  // Maintainers array has items of shape: "username <user@domain.com>" so we strip everything after whitespace.
  const maintainers = pkgView.maintainers.map((maintainer) =>
    maintainer.replace(/^(.+)\s.*$/, '$1')
  );
  return users.every((user) => maintainers.includes(user));
}

/**
 * Gets lists of commits and files changed under given directory and since commit with given checksum.
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
    toCommit: 'head',
  });

  const files = await gitDir.logFilesAsync({
    fromCommit: commits[commits.length - 1]?.hash,
    toCommit: commits[0]?.hash,
  });

  return {
    commits,
    files,
  };
}
