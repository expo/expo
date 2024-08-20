import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { AppConfigFieldsNotSyncedToNativeProjectsCheck } from '../AppConfigFieldsNotSyncedToNativeProjectsCheck';

jest.mock('fs');

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
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
  afterEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });

  it('returns result with isSuccessful = true if no ios/android folders and no config plugins', async () => {
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if ios/android folders but no config plugins', async () => {
    vol.fromJSON({
      [projectRoot + '/ios/something.pbxproj']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false with ios/ android folders and config plugins present, not in gitignore', async () => {
    mockIsGitIgnoredResult(false);

    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        plugins: ['expo-something'],
      },
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = true with ios/ android folders and config plugins present, in gitignore', async () => {
    mockIsGitIgnoredResult(true);
    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        plugins: ['expo-something'],
      },
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('mentions app.config.ts in issue when dynamic config is used', async () => {
    mockIsGitIgnoredResult(false);
    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        plugins: ['expo-something'],
        ios: {},
        android: {},
      },
      dynamicConfigPath: '/tmp/project/app.config.ts',
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues[0]).toContain('app.config.ts');
    expect(result.issues[0]).toContain('ios');
    expect(result.issues[0]).toContain('android');
    expect(result.issues[0]).toContain('plugins');
  });

  it('reports multiple unsynced fields correctly', async () => {
    mockIsGitIgnoredResult(false);
    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        ios: {},
        android: {},
        splash: {},
        icon: 'path/to/icon.png',
      },
      staticConfigPath: '/tmp/project/app.json',
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues[0]).toContain('app.json');
    expect(result.issues[0]).toContain('ios');
    expect(result.issues[0]).toContain('android');
    expect(result.issues[0]).toContain('splash');
    expect(result.issues[0]).toContain('icon');
  });
});
