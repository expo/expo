import path from 'path';
import process from 'process';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';

import { Directories, HashDirectory, Log, XDL } from '../expotools';

async function action(options) {
  let expoHomePath = Directories.getExpoHomeJSDir();
  let expoHomeHash = await HashDirectory.hashDirectoryWithVersionsAsync(expoHomePath);
  let slug = `expo-home-dev-${expoHomeHash}`;

  Log.collapsed('Modifying slug...');
  let appJsonFilePath = path.join(expoHomePath, 'app.json');
  let appJsonBackupFilePath = path.join(expoHomePath, 'app.json-backup');
  await spawnAsync('cp', [appJsonFilePath, appJsonBackupFilePath]);

  let appJsonFile = new JsonFile(appJsonFilePath, {
    json5: true,
  });
  let appJson = await appJsonFile.readAsync();
  appJson.expo.slug = slug;
  delete appJson.expo.kernel;
  delete appJson.expo.isKernel;
  delete appJson.expo.ios.publishBundlePath;
  delete appJson.expo.android.publishBundlePath;

  await appJsonFile.writeAsync(appJson);

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

  await spawnAsync('rm', [appJsonFilePath]);
  await spawnAsync('mv', [appJsonBackupFilePath, appJsonFilePath]);

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

export default (program: any) => {
  program
    .command('publish-dev-expo-home')
    .description('Publishes Expo Home for development')
    .action(action);
};
