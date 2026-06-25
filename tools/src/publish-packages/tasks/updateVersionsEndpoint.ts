import inquirer from 'inquirer';
import { styleText } from 'node:util';
import semver from 'semver';

import { publishPackages } from './publishPackages';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import * as Versions from '../../Versions';
import { CommandOptions, Parcel, TaskArgs } from '../types';

/**
 * Updates the versions endpoint with the published expo package version.
 * This runs after packages are published and prompts to update the `expoVersion`
 * key for a target SDK version.
 */
export const updateVersionsEndpoint = new Task<TaskArgs>(
  {
    name: 'updateVersionsEndpoint',
    dependsOn: [publishPackages],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const expoParcel = parcels.find((parcel) => parcel.pkg.packageName === 'expo');

    if (!expoParcel || !expoParcel.state.published) {
      return;
    }

    const publishedVersion = expoParcel.state.releaseVersion;
    if (!publishedVersion) {
      logger.warn(
        '\n📡 Skipping versions endpoint update - could not determine published version.'
      );
      return;
    }

    const expoVersionValue = `~${publishedVersion}`;
    const versions = await Versions.getVersionsAsync();
    const sdkVersions = Versions.getSortedSdkVersionKeys(versions);
    const recentSdks = sdkVersions.slice(0, 3);

    logger.info(`\n📡 Expo package published: ${styleText('green', publishedVersion)}`);

    const ENTER_SDK = 'Enter SDK version';
    const SKIP = 'Skip';

    const sdkChoices = [...recentSdks, new inquirer.Separator(), ENTER_SDK, SKIP];

    const { selectedSdk } = await inquirer.prompt<{ selectedSdk: string }>([
      {
        type: 'list',
        name: 'selectedSdk',
        message: `Update versions endpoint with expoVersion ${styleText('green', expoVersionValue)}?`,
        choices: sdkChoices,
        default: recentSdks[0],
      },
    ]);

    if (selectedSdk === SKIP) {
      logger.info(styleText('yellow', '  Skipping versions endpoint update.'));
      return;
    }

    let targetSdkVersion = selectedSdk;

    if (selectedSdk === ENTER_SDK) {
      const { customSdk } = await inquirer.prompt<{ customSdk: string }>([
        {
          type: 'input',
          name: 'customSdk',
          message: 'Enter SDK version:',
          validate: (input) => {
            const normalized = Versions.normalizeSdkVersion(input.trim());
            if (!semver.valid(normalized)) {
              return 'Please enter a valid SDK version (e.g., 54 or 54.0.0)';
            }
            return true;
          },
        },
      ]);
      targetSdkVersion = Versions.normalizeSdkVersion(customSdk.trim());
    }

    logger.info(
      `\n📡 Updating versions endpoint for SDK ${styleText('cyan', targetSdkVersion)} with expoVersion ${styleText('green', expoVersionValue)}...`
    );

    if (options.dry) {
      logger.info(styleText('yellow', '  Dry run - skipping version update.'));
      return;
    }

    try {
      await Versions.modifySdkVersionsAsync(targetSdkVersion, (sdkVersions) => ({
        ...sdkVersions,
        expoVersion: expoVersionValue,
      }));
      logger.success(
        `\n📡 Successfully updated versions endpoint: SDK ${styleText('cyan', targetSdkVersion)} → expoVersion: ${styleText('green', expoVersionValue)}`
      );
    } catch (error) {
      logger.error(`\n📡 Failed to update versions endpoint: ${error.message}`);
    }
  }
);
