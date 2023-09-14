import chalk from 'chalk';
import inquirer from 'inquirer';

import { loadRequestedParcels } from './loadRequestedParcels';
import Git from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green, cyan, blue, yellow } = chalk;

/**
 * Checks packages integrity and warns about violations.
 * Integrity is violated if the current version of a package:
 * - has no `gitHead` property in its package view.
 * - commit to which `gitHead` refers is not an ancestor of the current head commit.
 * - mismatches last version found in changelog.
 */
export const checkPackagesIntegrity = new Task<TaskArgs>(
  {
    name: 'checkPackagesIntegrity',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void | symbol> => {
    logger.info('\n👁  Checking packages integrity...');

    const resolver = async ({ pkg, pkgView, changelog }: Parcel): Promise<boolean> => {
      if (!pkgView) {
        // If package view is not there, then the package hasn't been released yet - no need to check integrity.
        return true;
      }

      const isAncestor = !!pkgView.gitHead && (await Git.isAncestorAsync(pkgView.gitHead));
      const lastChangelogVersion = await changelog.getLastPublishedVersionAsync();
      const isVersionMatching = !lastChangelogVersion || pkgView.version === lastChangelogVersion;
      const integral = isAncestor && isVersionMatching;

      if (!integral) {
        logger.warn(`\n⚠️  Integrity checks failed for ${green(pkg.packageName)}.`);
      }
      if (!pkgView.gitHead) {
        logger.warn(`   Cannot find ${blue('gitHead')} in package view.`);
      } else if (!isAncestor) {
        logger.warn(
          `   Local version ${cyan(pkgView.version)} has been published from different branch.`
        );
      }
      if (!isVersionMatching) {
        logger.warn(
          `   Last version in changelog ${cyan(lastChangelogVersion!)}`,
          `doesn't match local version ${cyan(pkgView.version)}.`
        );
      }
      return integral;
    };

    const results = await Promise.all(parcels.map(resolver));
    const somethingFailed = results.some((result) => !result);

    if (options.checkIntegrity) {
      if (somethingFailed) {
        logger.error('\n🚫 Integrity checks failed.');
      } else {
        logger.success('\n✅ All integrity checks passed.');
      }
      return;
    }
    if (somethingFailed && (await shouldStopOnFailedIntegrityChecksAsync())) {
      if (process.env.CI) {
        throw new Error('Some integrity checks failed – it is prohibited on the CI.');
      }
      return Task.STOP;
    }
  }
);

/**
 * Resolves to a boolean value that means whether to stop the workflow if some integrity checks have failed.
 * It immediately returns `true` if it's run on the CI.
 */
async function shouldStopOnFailedIntegrityChecksAsync(): Promise<boolean> {
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
