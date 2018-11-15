import fs from 'fs';
import path from 'path';
import request from 'request-promise-native';
import { IosPlist, Project, UrlUtils } from 'xdl';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';

import * as Directories from './Directories';
import * as HashDirectory from './HashDirectory';
import * as Log from './Log';
import * as XDL from './XDL';

const CI_USERNAME = 'exponent_ci_bot';

const TEST_SUITE_DIR = path.join(Directories.getExpoRepositoryRootDir(), 'apps', 'test-suite');

type Manifest = { [key: string]: any };

export async function getManifestAsync(
  user: string,
  experienceId: string,
  sdkVersions: string,
  plaform: string
): Promise<Manifest | null> {
  let requestOptions = {
    url: `https://exp.host/@${user}/${experienceId}/index.exp`,
    headers: {
      'Expo-SDK-Version': sdkVersions,
      'Expo-Platform': plaform,
      Accept: 'application/expo+json,application/json',
    },
  };

  try {
    let response = await request(requestOptions);
    let manifest = JSON.parse(response);
    return manifest;
  } catch (e) {
    return null;
  }
}

export async function getUrlIfRunningAsync() {
  let status = await Project.currentStatus(TEST_SUITE_DIR);
  if (status === 'running') {
    return await UrlUtils.constructManifestUrlAsync(TEST_SUITE_DIR);
  } else {
    return null;
  }
}

async function _getCachedTestSuiteAsync(options: {
  platform: string;
}): Promise<{ id: string; url: string; manifest: Manifest | null }> {
  const testSuiteHash = await HashDirectory.hashDirectoryWithVersionsAsync(TEST_SUITE_DIR);
  const experienceId = `test-suite-${testSuiteHash}`;
  const experienceUrl = `exp://exp.host/@${CI_USERNAME}/${experienceId}`;

  const manifest = await getManifestAsync(
    CI_USERNAME,
    experienceId,
    'UNVERSIONED',
    options.platform
  );
  return {
    id: experienceId,
    url: experienceUrl,
    manifest,
  };
}

async function _writeIosTestSuiteUrlAsync(url: string): Promise<void> {
  const iOSTestPath = path.join(
    Directories.getExpoRepositoryRootDir(),
    'ios',
    'ExponentIntegrationTests'
  );
  const configFilename = path.join(iOSTestPath, 'EXTestEnvironment.plist');
  if (!fs.existsSync(configFilename)) {
    await IosPlist.createBlankAsync(iOSTestPath, 'EXTestEnvironment');
  }
  await IosPlist.modifyAsync(iOSTestPath, 'EXTestEnvironment', config => {
    config.testSuiteUrl = url;
    return config;
  });
  await IosPlist.cleanBackupAsync(iOSTestPath, 'EXTestEnvironment', false);
}

export async function configureIosTestSuiteUrlAsync(options: {
  local: boolean;
  publish: boolean;
}): Promise<void> {
  let urlToUse;
  if (options.local) {
    // try pointing at a local packager
    if (Project.currentStatus(TEST_SUITE_DIR) !== 'exited') {
      urlToUse = await UrlUtils.constructManifestUrlAsync(TEST_SUITE_DIR);
    } else {
      console.log(`You specified --local, but no packager is running under ${TEST_SUITE_DIR}.`);
    }
  } else if (options.publish) {
    // publish if needed, then point at the result
    const url = await publishTestSuiteAsync({
      platform: 'ios',
    });
    if (url) {
      urlToUse = url;
    } else {
      console.log(`You specified --publish, but it failed to produce a usable test suite url.`);
    }
  } else {
    // point at published copy if available
    const { url, manifest } = await _getCachedTestSuiteAsync({
      platform: 'ios',
    });
    if (manifest) {
      urlToUse = url;
    } else {
      console.log(
        'No published test suite exists for your current working copy.\n' +
          'Run with --local to use a local instance under exponent/apps/test-suite, if available.\n' +
          'Run with --publish to publish test suite in its current state if needed.'
      );
    }
  }
  if (urlToUse) {
    await _writeIosTestSuiteUrlAsync(urlToUse);
    console.log(`Configured url ${urlToUse}.`);
  } else {
    console.log('No url configured for test suite.');
  }
}

async function _installTestSuiteDependenciesAsync(): Promise<void> {
  Log.collapsed(`Installing test-suite and its dependencies...`);
  // This will install test-suite, expo, and react-native in the workspace root
  await spawnAsync('yarn', ['install'], {
    cwd: Directories.getExpoRepositoryRootDir(),
    stdio: 'inherit',
  });
}

export async function startServerAsync(): Promise<string> {
  await _installTestSuiteDependenciesAsync();
  await Project.startAsync(TEST_SUITE_DIR);
  return await UrlUtils.constructManifestUrlAsync(TEST_SUITE_DIR);
}

export async function stopServerAsync(): Promise<void> {
  await Project.stopAsync(TEST_SUITE_DIR);
}

async function _publishTestSuiteNoCacheAsync(id: string, useUnversioned: boolean): Promise<void> {
  await _installTestSuiteDependenciesAsync();

  Log.collapsed('Modifying slug...');
  let appJsonFile = new JsonFile(path.join(TEST_SUITE_DIR, 'app.json'));
  let appJson = await appJsonFile.readAsync();
  appJson.expo.slug = id;
  await appJsonFile.writeAsync(appJson);

  await XDL.publishProjectWithExpoCliAsync(TEST_SUITE_DIR, {
    useUnversioned,
  });
}

export async function publishVersionedTestSuiteAsync(sdkVersion: string): Promise<void> {
  let appJsonFile = new JsonFile(path.join(TEST_SUITE_DIR, 'app.json'));
  let appJson = await appJsonFile.readAsync();
  appJson.expo.sdkVersion = sdkVersion;
  await appJsonFile.writeAsync(appJson);

  const id = `test-suite-sdk-${sdkVersion}`.replace(/\./g, '-');
  const url = `exp://exp.host/@${CI_USERNAME}/${id}`;
  await _publishTestSuiteNoCacheAsync(id, false);

  console.log(`Published test-suite to ${url}`);
}

export async function publishTestSuiteAsync(options: { platform?: string } = {}): Promise<string> {
  const platform = options.platform ? options.platform : 'android';
  let { id, url, manifest } = await _getCachedTestSuiteAsync({
    platform,
  });

  if (manifest) {
    Log.collapsed(`Test suite is cached! Returning URL ${url}.`);
    return url;
  }

  Log.collapsed('Test suite is not cached. Building and publishing app.');
  await _publishTestSuiteNoCacheAsync(id, true);
  Log.collapsed(`Done publishing. Returning URL ${url}.`);

  return url;
}
