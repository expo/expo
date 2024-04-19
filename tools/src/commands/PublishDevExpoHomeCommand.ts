import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import { hashElement } from 'folder-hash';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import process from 'process';
import semver from 'semver';

import * as ExpoCLI from '../ExpoCLI';
import { getNewestSDKVersionAsync } from '../ProjectVersions';
import { deepCloneObject } from '../Utils';
import { Directories, EASUpdate } from '../expotools';
import AppConfig from '../typings/AppConfig';

type ActionOptions = {
  sdkVersion?: string;
};

type ExpoCliStateObject = {
  auth?: {
    username?: string;
  };
};

const EXPO_HOME_PATH = Directories.getExpoGoDir();
const { EXPO_HOME_DEV_ACCOUNT_USERNAME, EXPO_HOME_DEV_ACCOUNT_PASSWORD } = process.env;

/**
 * Finds target SDK version for home app based on the newest SDK versions of all supported platforms.
 * If multiple different versions have been found then the highest one is used.
 */
async function findTargetSdkVersionAsync(): Promise<string> {
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
async function maybeUpdateHomeSdkVersionAsync(
  appJson: AppConfig,
  explicitSdkVersion?: string | null
): Promise<void> {
  const targetSdkVersion = explicitSdkVersion ?? (await findTargetSdkVersionAsync());

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
 * Publishes dev home app on EAS Update.
 */
async function publishAppOnDevelopmentBranchAsync({
  slug,
  message,
}: {
  slug: string;
  message: string;
}): Promise<{ createdUpdateGroupId: string }> {
  console.log(`Publishing ${chalk.green(slug)}...`);

  const result = await EASUpdate.setAuthAndPublishProjectWithEasCliAsync(EXPO_HOME_PATH, {
    userpass: {
      username: EXPO_HOME_DEV_ACCOUNT_USERNAME!,
      password: EXPO_HOME_DEV_ACCOUNT_PASSWORD!,
    },
    branch: 'development',
    message,
  });

  console.log(
    `Done publishing ${chalk.green(slug)}. Update Group ID is: ${chalk.blue(
      result.createdUpdateGroupId
    )}`
  );

  return result;
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

  const expoHomeHashNode = await hashElement(EXPO_HOME_PATH, {
    encoding: 'hex',
    folders: { exclude: ['.expo', '**/Pods', 'node_modules'] },
  });

  const appJsonFilePath = path.join(EXPO_HOME_PATH, 'app.json');
  const slug = `home`;
  const appJsonFile = new JsonFile<AppConfig>(appJsonFilePath);
  const appJson = await appJsonFile.readAsync();

  const projectId = appJson.expo.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error('No configured EAS project ID in app.json');
  }

  console.log(`Creating backup of ${chalk.magenta('app.json')} file...`);
  const appJsonBackup = deepCloneObject<AppConfig>(appJson);

  console.log('Getting expo-cli state of the current session...');
  const cliStateBackup = await getExpoCliStateAsync();

  await maybeUpdateHomeSdkVersionAsync(appJson, options.sdkVersion);

  console.log(`Modifying home's slug to ${chalk.green(slug)}...`);
  appJson.expo.slug = slug;

  // Save the modified `appJson` to the file so it'll be used as a manifest.
  await appJsonFile.writeAsync(appJson);

  const cliUsername = cliStateBackup?.auth?.username;

  if (cliUsername) {
    console.log(`Logging out from ${chalk.green(cliUsername)} account...`);
    await ExpoCLI.runExpoCliAsync('logout', [], {
      stdio: 'ignore',
    });
  }

  const createdUpdateGroupId = (
    await publishAppOnDevelopmentBranchAsync({ slug, message: expoHomeHashNode.hash })
  ).createdUpdateGroupId;

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

  const url = `exps://u.expo.dev/${projectId}/group/${createdUpdateGroupId}`;
  await updateDevHomeConfigAsync(url);

  console.log(
    chalk.yellow(
      `Finished publishing. Remember to commit changes of ${chalk.magenta(
        'apps/expo-go/app.json'
      )} and ${chalk.magenta('dev-home-config.json')}.`
    )
  );
}

export default (program: Command) => {
  program
    .command('publish-dev-home')
    .alias('pdh')
    .description(
      `Automatically logs in your eas-cli to ${chalk.magenta(
        EXPO_HOME_DEV_ACCOUNT_USERNAME!
      )} account, publishes home app for development on EAS Update and logs back to your account.`
    )
    .option(
      '-s, --sdkVersion [string]',
      'SDK version the published app should use. Defaults to the newest available SDK set in the Expo Go project.'
    )
    .asyncAction(action);
};
