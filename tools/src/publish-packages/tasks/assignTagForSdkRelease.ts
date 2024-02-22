import chalk from 'chalk';

import { loadRequestedParcels } from './loadRequestedParcels';
import Git from '../../Git';
import logger from '../../Logger';
import * as Npm from '../../Npm';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green, yellow } = chalk;

/**
 * Assigns the SDK tag to packages when run on the release branch.
 */
export const assignTagForSdkRelease = new Task<TaskArgs>(
  {
    name: 'assignTagForSdkRelease',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const sdkTag = await findSdkTag();

    // Skip the task when not on the SDK branch.
    if (!sdkTag) {
      if (options.assignSdkTag) {
        logger.warn('SDK tag can be assigned only from the release branch.');
      }
      return;
    }

    await runWithSpinner(
      `Assigning ${yellow.bold(sdkTag)} tag to packages`,
      async (step) => {
        for (const { pkg, pkgView } of parcels) {
          if (isPackageViewMatchingTag(pkgView, sdkTag)) {
            // Current version of the package is already tagged.
            continue;
          }
          step.start(`Assigning ${yellow.bold(sdkTag)} tag to ${green(pkg.packageName)}`);

          if (!options.dry) {
            await Npm.addTagAsync(pkg.packageName, pkg.packageVersion, sdkTag);
          }
        }
      },
      `Successfully assigned ${yellow.bold(sdkTag)} tag`
    );
  }
);

/**
 * Returns a boolean value whether the package view matches the given tag.
 */
function isPackageViewMatchingTag(pkgView: Npm.PackageViewType, tag: string): boolean {
  const tags = pkgView?.['dist-tags'] ?? {};
  return tags[tag] === pkgView?.version;
}

/**
 * Returns the SDK tag (e.g. `sdk-50`) when run on the release branch or `null` otherwise.
 */
async function findSdkTag(): Promise<string | null> {
  const branchName = await Git.getCurrentBranchNameAsync();

  if (/^sdk-\d+$/.test(branchName)) {
    return branchName;
  }
  return null;
}
