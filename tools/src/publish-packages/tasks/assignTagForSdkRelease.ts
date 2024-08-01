import chalk from 'chalk';
import inquirer from 'inquirer';
import semver from 'semver';

import { loadRequestedParcels } from './loadRequestedParcels';
import Git from '../../Git';
import logger from '../../Logger';
import * as Npm from '../../Npm';
import { sdkVersionNumberAsync } from '../../ProjectVersions';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green, yellow, cyan } = chalk;

/**
 * Assigns the SDK tag to packages when run on the release branch.
 */
export const assignTagForSdkRelease = new Task<TaskArgs>(
  {
    name: 'assignTagForSdkRelease',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const sdkTag = await getSdkTag();
    const shouldAssignSdkTag =
      options.assignSdkTag || (await isReleaseBranch()) || (await askToAssignSdkTag(sdkTag));

    if (!shouldAssignSdkTag || options.canary) {
      return;
    }

    await runWithSpinner(
      `Assigning ${yellow(sdkTag)} tag to packages`,
      async (step) => {
        for (const { pkg, pkgView } of parcels) {
          const currentTagVersion = pkgView?.['dist-tags']?.[sdkTag];
          const pkgName = pkg.packageName;
          const pkgVersion = pkg.packageVersion;

          // Skip if the currently tagged version is greater or equal to the current one.
          if (currentTagVersion && semver.lte(pkgVersion, currentTagVersion)) {
            logger.debug(
              `≫ Skipped ${green(pkgName)} - the tag is already greater or equal (${cyan(
                currentTagVersion
              )})`
            );
            continue;
          }

          step.start(
            `Assigning ${yellow.bold(sdkTag)} tag to ${green(pkgName)}@${cyan(pkgVersion)}\n`
          );

          if (!options.dry) {
            await Npm.addTagAsync(pkgName, pkgVersion, sdkTag);
          }
        }
      },
      `Successfully assigned ${yellow(sdkTag)} tag`
    );
  }
);

/**
 * Returns the SDK tag (e.g. `sdk-50`) appropriate for the current version of the `expo` package.
 */
async function getSdkTag(): Promise<string> {
  const sdkVersion = await sdkVersionNumberAsync();
  return `sdk-${sdkVersion}`;
}

/**
 * Returns a boolean whether the current branch is a release branch.
 */
async function isReleaseBranch(): Promise<boolean> {
  return !!Git.getSDKVersionFromBranchNameAsync();
}

/**
 * Asks whether to assign the SDK tag to the current packages versions.
 */
async function askToAssignSdkTag(sdkTag: string): Promise<boolean> {
  if (process.env.CI) {
    return false;
  }
  const { assignSdkTag } = await inquirer.prompt<{ assignSdkTag: boolean }>([
    {
      type: 'confirm',
      name: 'assignSdkTag',
      prefix: '❔',
      message: `Do you want to assign ${yellow(sdkTag)} tag to the current versions?`,
      default: true,
    },
  ]);
  return assignSdkTag;
}
