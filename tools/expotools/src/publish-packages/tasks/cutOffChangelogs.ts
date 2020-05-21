import chalk from 'chalk';
import semver from 'semver';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';
import { resolveReleaseTypeAndVersion } from './resolveReleaseTypeAndVersion';

const { green, gray } = chalk;

/**
 * Cuts off changelogs - renames unpublished section header
 * to the new version and adds new unpublished section on top.
 */
export const cutOffChangelogs = new Task<TaskArgs>(
  {
    name: 'cutOffChangelogs',
    dependsOn: [resolveReleaseTypeAndVersion],
    filesToStage: ['packages/**/CHANGELOG.md'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n✂️  Cutting off changelogs...');

    await Promise.all(
      parcels.map(async ({ pkg, changelog, state }) => {
        if (!(await changelog.fileExistsAsync())) {
          logger.log('  ', green(pkg.packageName), gray(`- skipped, no changelog file.`));
          return;
        }

        if (state.releaseVersion && !semver.prerelease(state.releaseVersion)) {
          logger.log('  ', green(pkg.packageName) + '...');
          await changelog.cutOffAsync(state.releaseVersion);
        } else {
          logger.log('  ', green(pkg.packageName), gray(`- skipped, it's a prerelease version.`));
        }
      })
    );
  }
);
