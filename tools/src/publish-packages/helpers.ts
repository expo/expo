import chalk from 'chalk';
import inquirer from 'inquirer';
import pick from 'lodash/pick';

import { UNPUBLISHED_VERSION_NAME } from '../Changelogs';
import * as Formatter from '../Formatter';
import logger from '../Logger';
import { BACKUPABLE_OPTIONS_FIELDS } from './constants';
import { BackupableOptions, CommandOptions, Parcel } from './types';

const { green, cyan, magenta, gray } = chalk;

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
 * Prints gathered crucial informations about the package.
 */
export function printPackageParcel(parcel: Parcel): void {
  const { pkg, pkgView, state, dependencies } = parcel;
  const { logs, changelogChanges, releaseType, releaseVersion } = state;
  const gitHead = pkgView?.gitHead;

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

    if (gitHead) {
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

  const unpublishedChanges = changelogChanges?.versions[UNPUBLISHED_VERSION_NAME] ?? {};

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
