import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import process from 'process';
import JsonFile from '@expo/json-file';
import { Command } from '@expo/commander';

import AppConfig from '../typings/AppConfig';
import { getNewestSDKVersionAsync, getHomeSDKVersionAsync } from '../ProjectVersions';
import { Directories, HashDirectory, Log, XDL } from '../expotools';

async function maybeUpdateHomeSdkVersionAsync(appJsonPath: string): Promise<void> {
  const homeSdkVersion = await getHomeSDKVersionAsync();
  const iosSdkVersion = await getNewestSDKVersionAsync('ios');
  const androidSdkVersion = await getNewestSDKVersionAsync('android');

  // If both platforms already contain versioned code for the new SDK, we can safely bump SDK version of home as well.
  if (iosSdkVersion && iosSdkVersion === androidSdkVersion && homeSdkVersion !== iosSdkVersion) {
    const appJsonContents = await fs.readFile(appJsonPath, 'utf8');

    console.log(`Updating home's sdkVersion to ${chalk.cyan(iosSdkVersion)} ...`);

    await fs.outputFile(
      appJsonPath,
      appJsonContents.replace(/"(sdkVersion|version)": "[^"]*"/g, `"$1": "${iosSdkVersion}"`),
    );
  }
}

async function action(): Promise<void> {
  const expoHomePath = Directories.getExpoHomeJSDir();
  const expoHomeHash = await HashDirectory.hashDirectoryWithVersionsAsync(expoHomePath);
  const slug = `expo-home-dev-${expoHomeHash}`;

  Log.collapsed('Modifying slug...');
  const appJsonFilePath = path.join(expoHomePath, 'app.json');
  const appJsonBackupFilePath = path.join(expoHomePath, 'app.json-backup');

  await maybeUpdateHomeSdkVersionAsync(appJsonFilePath);

  await fs.copy(appJsonFilePath, appJsonBackupFilePath);

  const appJsonFile = new JsonFile(appJsonFilePath, {
    json5: true,
  });

  const appJson = await appJsonFile.readAsync() as unknown as AppConfig;

  appJson.expo.slug = slug;
  delete appJson.expo.kernel;
  delete appJson.expo.isKernel;
  delete appJson.expo.ios.publishBundlePath;
  delete appJson.expo.android.publishBundlePath;

  await appJsonFile.writeAsync(appJson as any);

  let username = process.env.EXPO_HOME_DEV_ACCOUNT_USERNAME;
  if (!username) {
    throw new Error('EXPO_HOME_DEV_ACCOUNT_USERNAME must be set in your environment.');
  }
  let password = process.env.EXPO_HOME_DEV_ACCOUNT_PASSWORD;
  if (!password) {
    throw new Error('EXPO_HOME_DEV_ACCOUNT_PASSWORD must be set in your environment.');
  }

  Log.collapsed('Publishing...');
  await XDL.publishProjectWithExpoCliAsync(expoHomePath, {
    useUnversioned: false,
    userpass: {
      username,
      password,
    },
  });

  await fs.remove(appJsonFilePath);
  await fs.move(appJsonBackupFilePath, appJsonFilePath);

  let url = `exp://expo.io/@${username}/${slug}`;
  Log.collapsed(`Done publishing. Returning URL: ${url}`);

  let devManifestsFile = new JsonFile(
    path.join(Directories.getExpoRepositoryRootDir(), 'dev-home-config.json')
  );
  await devManifestsFile.writeAsync({
    url,
  });
  Log.collapsed('Finished publishing.\nRemember to commit changes to `dev-home-config.json`.');
}

export default (program: Command) => {
  program
    .command('publish-dev-expo-home')
    .alias('publish-dev-home')
    .description('Publishes Expo Home for development.')
    .asyncAction(action);
};
