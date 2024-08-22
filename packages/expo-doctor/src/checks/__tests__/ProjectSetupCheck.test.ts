import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { ProjectSetupCheck } from '../ProjectSetupCheck';

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
  // ignoring native files for local modules check
  it('returns result with isSuccessful = true if no local expo modules are present', async () => {
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if local module with ios folder and ios folder is not gitignored', async () => {
    mockIsGitIgnoredResult(false);
    vol.fromJSON({
      [projectRoot + '/modules/HelloModule/ios/HelloModule.podspec']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if local module with android folder and android folder is not gitignored', async () => {
    mockIsGitIgnoredResult(false);
    vol.fromJSON({
      [projectRoot + '/modules/HelloModule/android/build.gradle']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if local module with ios folder and ios folder is gitignored', async () => {
    mockIsGitIgnoredResult(true);
    vol.fromJSON({
      [projectRoot + '/modules/HelloModule/ios/HelloModule.podspec']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = false if local module with android folder and android folder is gitignored', async () => {
    mockIsGitIgnoredResult(true);
    vol.fromJSON({
      [projectRoot + '/modules/HelloModule/android/build.gradle']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  // multiple lock files
  it('returns result with isSuccessful = true if just one lock file', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if more than one lockfile (yarn + npm)', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
      [projectRoot + '/package-lock.json']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = false if more than one lockfile (yarn + pnpm)', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
      [projectRoot + '/pnpm-lock.yaml']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
