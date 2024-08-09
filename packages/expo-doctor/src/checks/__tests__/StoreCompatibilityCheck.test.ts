import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { StoreCompatibilityCheck } from '../StoreCompatibilityCheck';

jest.mock('fs');

const projectRoot = '/tmp/project';

const expProjectProps = {
  name: 'name',
  slug: 'slug',
};

// required by runAsync
const additionalProjectProps = {
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

/**
 * Helper to mock the results of git rev-parse and git check-ignore based on whether the file should be ignored or not.
 * Only works when checking a single file.
 */
function mockIsGitIgnoredResult(isFileIgnored: boolean) {
  jest
    .mocked(spawnAsync)
    .mockImplementationOnce(() =>
      mockSpawnPromise(
        Promise.resolve({
          status: 0,
          stdout: '',
        })
      )
    )
    .mockImplementationOnce(() => {
      if (isFileIgnored) {
        return mockSpawnPromise(Promise.resolve({ status: 0, stdout: '' }));
      }
      const error: any = new Error();
      error.status = -1; // git check-ignore errors if file is not ignored
      return mockSpawnPromise(Promise.reject(error));
    });
}

describe('runAsync', () => {
  beforeEach(() => {
    mockIsGitIgnoredResult(false);
  });
  afterEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });
  it('returns result with isSuccessful = true if SDK 50+ with default Android target API level', async () => {
    const check = new StoreCompatibilityCheck();
    const result = await check.runAsync({
      pkg: { name: 'expo', version: '1.0.0' },
      exp: { ...expProjectProps, sdkVersion: '50.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if ios/android folders but build.gradle indicates API level 34+', async () => {
    vol.fromJSON({
      [projectRoot + '/android/build.gradle']:
        `targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '34')`,
    });
    const check = new StoreCompatibilityCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      exp: { ...expProjectProps, sdkVersion: '49.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if ios/android folders but build.gradle indicates API level 34+ (direct assignment)', async () => {
    vol.fromJSON({
      [projectRoot + '/android/build.gradle']: `targetSdkVersion = '34'`,
    });
    const check = new StoreCompatibilityCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      exp: { ...expProjectProps, sdkVersion: '49.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if ios/android folders but build.gradle indicates API level <34', async () => {
    vol.fromJSON({
      [projectRoot + '/android/build.gradle']:
        `targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '33')`,
    });
    const check = new StoreCompatibilityCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      exp: { ...expProjectProps, sdkVersion: '49.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = false if expo-build-properties is set to target API level <34', async () => {
    const check = new StoreCompatibilityCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      exp: {
        ...expProjectProps,
        sdkVersion: '50.0.0',
        plugins: [['expo-build-properties', { android: { targetSdkVersion: 33 } }]],
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = true if expo-build-properties plugin added but does not include any props', async () => {
    const check = new StoreCompatibilityCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      exp: {
        ...expProjectProps,
        sdkVersion: '50.0.0',
        plugins: ['expo-build-properties'],
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if SDK <50', async () => {
    const check = new StoreCompatibilityCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      exp: {
        ...expProjectProps,
        sdkVersion: '49.0.0',
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
