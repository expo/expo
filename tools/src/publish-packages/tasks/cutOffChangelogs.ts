import chalk from 'chalk';
import semver from 'semver';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';
import { selectPackagesToPublish } from './selectPackagesToPublish';

const { green, gray } = chalk;

/**
 * Returns the reason to skip cutting off the changelog, or `null` when it should be cut off.
 * Prerelease versions are skipped so their entries stay under "Unpublished" and end up
 * in the section of the stable version that follows.
 */
export function getCutOffSkipReason(
  releaseVersion: string,
  changelogExists: boolean,
  changelogVersions: string[]
): string | null {
  if (semver.prerelease(releaseVersion)) {
    return 'prerelease version';
  }
  if (!changelogExists) {
    return 'no changelog file';
  }
  // Prevents another cut-off when that version has already been cut off.
  if (changelogVersions.includes(releaseVersion)) {
    return 'version already exists';
  }
  return null;
}

/**
 * Cuts off changelogs - renames unpublished section header
 * to the new version and adds new unpublished section on top.
 */
export const cutOffChangelogs = new Task<TaskArgs>(
  {
    name: 'cutOffChangelogs',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/**/CHANGELOG.md'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n✂️  Cutting off changelogs...');

    await Promise.all(
      parcels.map(async ({ pkg, changelog, state }) => {
        if (!state.releaseVersion) {
          return;
        }

        const changelogExists = await changelog.fileExistsAsync();
        const skipReason = getCutOffSkipReason(
          state.releaseVersion,
          changelogExists,
          changelogExists ? await changelog.getVersionsAsync() : []
        );

        if (skipReason) {
          logger.log('  ', green(pkg.packageName), gray(`- skipped, ${skipReason}`));
          return;
        }

        logger.log('  ', green(pkg.packageName) + '...');
        await changelog.cutOffAsync(state.releaseVersion);
        await changelog.saveAsync();
      })
    );
  }
);
