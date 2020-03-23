import spawnAsync from '@expo/spawn-async';
import path from 'path';

import * as Directories from './Directories';
import * as Log from './Log';
import * as XDL from './XDL';

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

  // This value will be used in `/apps/test-suite/app.config.ts`
  process.env.EXPO_TEST_SUITE_SLUG = id;

  await XDL.publishProjectWithExpoCliAsync(TEST_SUITE_DIR);
}

export async function publishVersionedTestSuiteAsync(sdkVersion: string): Promise<void> {
  // This value will be used in `/apps/test-suite/app.config.ts`
  process.env.EXPO_TEST_SUITE_SDK_VERSION = sdkVersion;

  const id = `test-suite-sdk-${sdkVersion}`.replace(/\./g, '-');
  const url = `exp://exp.host/@${CI_USERNAME}/${id}`;
  await _publishTestSuiteNoCacheAsync(id);

  console.log(`Published test-suite to ${url}`);
}
