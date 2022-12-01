import { getConfig } from '@expo/config';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import semver from 'semver';

import { getVersionsAsync } from '../api/getVersions';
import * as Log from '../log';
import {
  hasRequiredAndroidFilesAsync,
  hasRequiredIOSFilesAsync,
} from '../prebuild/clearNativeFolder';
import { getRemoteVersionsForSdkAsync } from '../start/doctor/dependencies/getVersionedPackages';
import { env } from '../utils/env';
import { CommandError } from '../utils/errors';
import { maybeBailOnGitStatusAsync } from '../utils/git';
import { attemptModification } from '../utils/modifyConfigAsync';
import { installAsync } from './installAsync';

const debug = require('debug')('expo:upgrade') as typeof console.log;

function formatSdkVersion(sdkVersionString: string) {
  return semver.valid(semver.coerce(sdkVersionString) || '');
}

export async function upgradeAsync(
  projectRoot: string,
  { version: versionArgument }: { version?: string }
) {
  // Perform this early
  const versionToInstall = versionArgument ? formatSdkVersion(versionArgument) : 'latest';

  if (!versionToInstall && versionArgument) {
    throw new CommandError(`Invalid version: ${versionArgument}`);
  }

  let projectConfig = getConfig(projectRoot);

  const initialExpoVersion = projectConfig.exp.sdkVersion!;

  if (versionArgument && semver.lt(versionArgument, initialExpoVersion)) {
    throw new CommandError(
      `Downgrading is not supported. (current: ${initialExpoVersion}, requested: ${versionArgument})`
    );
  }

  debug(`Current Expo version: ${initialExpoVersion}`);

  // Drop manual Expo SDK version from the config.
  // Users have no reason to ever define this manually with versioned Expo CLI.
  if (projectConfig.rootConfig.expo.sdkVersion) {
    await attemptModification(
      projectRoot,
      {
        sdkVersion: undefined,
      },
      { sdkVersion: undefined }
    );
  }

  // Run this after all sanity checks.
  if (await maybeBailOnGitStatusAsync()) {
    return null;
  }

  // Do this first to ensure we have the latest versions locally
  await getVersionsAsync({ skipCache: true });

  const packageManager = PackageManager.createForProject(projectRoot, {
    log: Log.log,
    silent: false,
  });

  Log.log(`Installing: expo@${versionToInstall}`);

  // Update Expo to the latest version.
  await packageManager.installAsync([
    // TODO: custom version
    `expo@${versionToInstall}`,
  ]);

  Log.log(`Fixing known dependencies: npx expo install --fix`);

  // Align dependencies with new Expo SDK version.
  await installAsync([], {
    projectRoot,
    fix: true,
    silent: false,
  });

  // Read config again to get the new SDK version and package.json.
  projectConfig = getConfig(projectRoot);

  const nextExpoVersion = projectConfig.exp.sdkVersion!;

  const pkgsToInstall = [];
  const pkgsToRemove = [];
  if (projectConfig.pkg.dependencies?.['@react-native-community/async-storage']) {
    //@react-native-async-storage/async-storage
    pkgsToInstall.push('@react-native-async-storage/async-storage');
    pkgsToRemove.push('@react-native-community/async-storage');
  }

  if (projectConfig.pkg.dependencies?.['expo-auth-session']) {
    pkgsToInstall.push('expo-random');
  }

  if (pkgsToRemove.length) {
    Log.log(`Removing packages: ${pkgsToRemove.join(', ')}`);
    await packageManager.removeAsync(...pkgsToRemove);
  }

  if (pkgsToInstall.length) {
    Log.log(`Adding packages: ${pkgsToInstall.join(', ')}`);
    await installAsync(pkgsToInstall, {
      projectRoot,
      silent: false,
    });
  }

  Log.log(chalk.greenBright`Project has been upgraded to Expo SDK ${nextExpoVersion}`);

  const nextVersion = await getRemoteVersionsForSdkAsync({ sdkVersion: nextExpoVersion });
  const initialVersion = await getRemoteVersionsForSdkAsync({ sdkVersion: initialExpoVersion });

  if (nextVersion?.releaseNoteUrl) {
    Log.log(
      `Please refer to the release notes for information on any further required steps to update and information about breaking changes:`
    );
    Log.log(chalk.bold(nextVersion.releaseNoteUrl));
  } else {
    if (env.EXPO_BETA) {
      Log.log(
        chalk.gray`Release notes are not available for beta releases. Please refer to the CHANGELOG: https://github.com/expo/expo/blob/master/CHANGELOG.md.`
      );
    } else {
      Log.log(
        chalk.gray`Unable to find release notes for ${nextExpoVersion}, please try to find them on https://blog.expo.dev to learn more about other potentially important upgrade steps and breaking changes.`
      );
    }
  }

  if (
    (await hasRequiredAndroidFilesAsync(projectRoot)) ||
    (await hasRequiredIOSFilesAsync(projectRoot))
  ) {
    const upgradeHelperUrl = `https://react-native-community.github.io/upgrade-helper/?from=${initialVersion['react-native']}&to=${nextVersion['react-nativex']}`;

    Log.log(
      chalk`Native projects detected. Either upgrade automatically with {bold npx expo prebuild --clean} or manually by following the guide at: ${upgradeHelperUrl}.`
    );
  }
}
