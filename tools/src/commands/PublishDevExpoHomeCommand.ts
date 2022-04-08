import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import process from 'process';
import semver from 'semver';

import * as ExpoCLI from '../ExpoCLI';
import { getNewestSDKVersionAsync } from '../ProjectVersions';
import { deepCloneObject } from '../Utils';
import { Directories, HashDirectory, XDL } from '../expotools';
import AppConfig from '../typings/AppConfig';

type ActionOptions = {
  dry: boolean;
};

type ExpoCliStateObject = {
  auth?: {
    username?: string;
  };
};

const EXPO_HOME_PATH = Directories.getExpoHomeJSDir();
const { EXPO_HOME_DEV_ACCOUNT_USERNAME, EXPO_HOME_DEV_ACCOUNT_PASSWORD } = process.env;

/**
 * Finds target SDK version for home app based on the newest SDK versions of all supported platforms.
 * If multiple different versions have been found then the highest one is used.
 */
export async function findTargetSdkVersionAsync(): Promise<string> {
  const iosSdkVersion = await getNewestSDKVersionAsync('ios');
  const androidSdkVersion = await getNewestSDKVersionAsync('android');

  if (!iosSdkVersion || !androidSdkVersion) {
    throw new Error('Unable to find target SDK version.');
  }

  const sdkVersions: string[] = [iosSdkVersion, androidSdkVersion];
  return sdkVersions.sort(semver.rcompare)[0];
}

/**
 * Sets `sdkVersion` and `version` fields in app configuration if needed.
 */
export async function maybeUpdateHomeSdkVersionAsync(appJson: AppConfig): Promise<void> {
  const targetSdkVersion = await findTargetSdkVersionAsync();

  if (appJson.expo.sdkVersion !== targetSdkVersion) {
    console.log(`Updating home's sdkVersion to ${chalk.cyan(targetSdkVersion)}...`);

    // When publishing the sdkVersion needs to be set to the target sdkVersion. The Expo client will
    // load it as UNVERSIONED, but the server uses this field to know which clients to serve the
    // bundle to.
    appJson.expo.version = targetSdkVersion;
    appJson.expo.sdkVersion = targetSdkVersion;
  }
}

/**
 * Returns path to production's expo-cli state file.
 */
function getExpoCliStatePath(): string {
  return path.join(os.homedir(), '.expo/state.json');
}

/**
 * Reads expo-cli state file which contains, among other things, session credentials to the account that you're logged in.
 */
async function getExpoCliStateAsync(): Promise<ExpoCliStateObject> {
  return JsonFile.readAsync<ExpoCliStateObject>(getExpoCliStatePath());
}

/**
 * Sets expo-cli state file which contains, among other things, session credentials to the account that you're logged in.
 */
async function setExpoCliStateAsync(newState: object): Promise<void> {
  await JsonFile.writeAsync<ExpoCliStateObject>(getExpoCliStatePath(), newState);
}

/**
 * Deletes kernel fields that needs to be removed from published manifest.
 */
export function deleteKernelFields(appJson: AppConfig): void {
  console.log(`Deleting kernel-related fields...`);

  // @tsapeta: Using `delete` keyword here would change the order of keys in app.json.
  appJson.expo.kernel = undefined;
  appJson.expo.isKernel = undefined;
  appJson.expo.ios.publishBundlePath = undefined;
  appJson.expo.android.publishBundlePath = undefined;
}

/**
 * Restores kernel fields that have been removed in previous steps - we don't want them to be present in published manifest.
 */
export function restoreKernelFields(appJson: AppConfig, appJsonBackup: AppConfig): void {
  console.log('Restoring kernel-related fields...');

  appJson.expo.kernel = appJsonBackup.expo.kernel;
  appJson.expo.isKernel = appJsonBackup.expo.isKernel;
  appJson.expo.ios.publishBundlePath = appJsonBackup.expo.ios.publishBundlePath;
  appJson.expo.android.publishBundlePath = appJsonBackup.expo.android.publishBundlePath;
}

/**
 * Publishes dev home app.
 */
async function publishAppAsync(slug: string, url: string): Promise<void> {
  console.log(`Publishing ${chalk.green(slug)}...`);

  await XDL.publishProjectWithExpoCliAsync(EXPO_HOME_PATH, {
    userpass: {
      username: EXPO_HOME_DEV_ACCOUNT_USERNAME!,
      password: EXPO_HOME_DEV_ACCOUNT_PASSWORD!,
    },
  });

  console.log(`Done publishing ${chalk.green(slug)}. New home's app url is: ${chalk.blue(url)}`);
}

/**
 * Updates `dev-home-config.json` file with the new app url. It's then used by the client to load published home app.
 */
async function updateDevHomeConfigAsync(url: string): Promise<void> {
  const devHomeConfigFilename = 'dev-home-config.json';
  const devHomeConfigPath = path.join(
    Directories.getExpoRepositoryRootDir(),
    devHomeConfigFilename
  );
  const devManifestsFile = new JsonFile(devHomeConfigPath);

  console.log(`Updating dev home config at ${chalk.magenta(devHomeConfigFilename)}...`);
  await devManifestsFile.writeAsync({ url });
}

/**
 * Main action that runs once the command is invoked.
 */
async function action(options: ActionOptions): Promise<void> {
  if (!EXPO_HOME_DEV_ACCOUNT_USERNAME) {
    throw new Error('EXPO_HOME_DEV_ACCOUNT_USERNAME must be set in your environment.');
  }
  if (!EXPO_HOME_DEV_ACCOUNT_PASSWORD) {
    throw new Error('EXPO_HOME_DEV_ACCOUNT_PASSWORD must be set in your environment.');
  }

  const expoHomeHash = await HashDirectory.hashDirectoryWithVersionsAsync(EXPO_HOME_PATH);
  const appJsonFilePath = path.join(EXPO_HOME_PATH, 'app.json');
  const slug = `expo-home-dev-${expoHomeHash}`;
  const url = `exp://exp.host/@${EXPO_HOME_DEV_ACCOUNT_USERNAME!}/${slug}`;
  const appJsonFile = new JsonFile<AppConfig>(appJsonFilePath);
  const appJson = await appJsonFile.readAsync();

  console.log(`Creating backup of ${chalk.magenta('app.json')} file...`);
  const appJsonBackup = deepCloneObject<AppConfig>(appJson);

  console.log('Getting expo-cli state of the current session...');
  const cliStateBackup = await getExpoCliStateAsync();

  await maybeUpdateHomeSdkVersionAsync(appJson);

  console.log(`Modifying home's slug to ${chalk.green(slug)}...`);
  appJson.expo.slug = slug;

  deleteKernelFields(appJson);

  // Save the modified `appJson` to the file so it'll be used as a manifest.
  await appJsonFile.writeAsync(appJson);

  const cliUsername = cliStateBackup?.auth?.username;

  if (cliUsername) {
    console.log(`Logging out from ${chalk.green(cliUsername)} account...`);
    await ExpoCLI.runExpoCliAsync('logout', [], {
      stdio: 'ignore',
    });
  }

  if (!options.dry) {
    await publishAppAsync(slug, url);
  } else {
    console.log(`Skipped publishing because of ${chalk.gray('--dry')} flag.`);
  }

  restoreKernelFields(appJson, appJsonBackup);

  console.log(`Restoring home's slug to ${chalk.green(appJsonBackup.expo.slug)}...`);
  appJson.expo.slug = appJsonBackup.expo.slug;

  if (cliUsername) {
    console.log(`Restoring ${chalk.green(cliUsername)} session in expo-cli...`);
    await setExpoCliStateAsync(cliStateBackup);
  } else {
    console.log(`Logging out from ${chalk.green(EXPO_HOME_DEV_ACCOUNT_USERNAME)} account...`);
    await fs.remove(getExpoCliStatePath());
  }

  console.log(`Updating ${chalk.magenta('app.json')} file...`);
  await appJsonFile.writeAsync(appJson);

  await updateDevHomeConfigAsync(url);

  console.log(
    chalk.yellow(
      `Finished publishing. Remember to commit changes of ${chalk.magenta(
        'home/app.json'
      )} and ${chalk.magenta('dev-home-config.json')}.`
    )
  );
}

export default (program: Command) => {
  program
    .command('publish-dev-home')
    .alias('pdh')
    .description(
      `Automatically logs in your expo-cli to ${chalk.magenta(
        EXPO_HOME_DEV_ACCOUNT_USERNAME!
      )} account, publishes home app for development and logs back to your account.`
    )
    .option(
      '-d, --dry',
      'Whether to skip `expo publish` command. Despite this, some files might be changed after running this script.',
      false
    )
    .asyncAction(action);
};
