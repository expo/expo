import path from 'path';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';

import * as Directories from './Directories';
import * as Log from './Log';
import * as XDL from './XDL';
import AppConfig from './typings/AppConfig';

const CI_USERNAME = 'exponent_ci_bot';

const TEST_SUITE_DIR = path.join(Directories.getExpoRepositoryRootDir(), 'apps', 'test-suite');

async function _installTestSuiteDependenciesAsync(): Promise<void> {
  Log.collapsed(`Installing test-suite and its dependencies...`);
  // This will install test-suite, expo, and react-native in the workspace root
  await spawnAsync('yarn', ['install'], {
    cwd: Directories.getExpoRepositoryRootDir(),
    stdio: 'inherit',
  });
}

async function _publishTestSuiteNoCacheAsync(id: string): Promise<void> {
  await _installTestSuiteDependenciesAsync();

  Log.collapsed('Modifying slug...');
  let appJsonFile = new JsonFile(path.join(TEST_SUITE_DIR, 'app.json'));
  let appJson = ((await appJsonFile.readAsync()) as unknown) as AppConfig;
  appJson.expo.slug = id;
  await appJsonFile.writeAsync(appJson as any);

  await XDL.publishProjectWithExpoCliAsync(TEST_SUITE_DIR);
}

export async function publishVersionedTestSuiteAsync(sdkVersion: string): Promise<void> {
  let appJsonFile = new JsonFile(path.join(TEST_SUITE_DIR, 'app.json'));
  const appJson = ((await appJsonFile.readAsync()) as unknown) as AppConfig;
  appJson.expo.sdkVersion = sdkVersion;
  await appJsonFile.writeAsync(appJson as any);

  const id = `test-suite-sdk-${sdkVersion}`.replace(/\./g, '-');
  const url = `exp://exp.host/@${CI_USERNAME}/${id}`;
  await _publishTestSuiteNoCacheAsync(id);

  console.log(`Published test-suite to ${url}`);
}
