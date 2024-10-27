import spawnAsync from '@expo/spawn-async';
import { execSync } from 'child_process';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { PackageManagerVersionCheck } from '../PackageManagerVersionCheck';

jest.mock('child_process');

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  pkg: {},
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true if yarnpkg is installed', async () => {
    jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          status: 0,
        })
      )
    );
    const check = new PackageManagerVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if yarnpkg is not installed and npm version is in acceptable range', async () => {
    jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          status: 1,
        })
      )
    );

    jest.mocked(execSync).mockReturnValueOnce('8.19.3');
    const check = new PackageManagerVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if yarnpkg is not installed and npm version is not in acceptable range', async () => {
    jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          status: 1,
        })
      )
    );

    jest.mocked(execSync).mockReturnValueOnce('5.0.0');
    const check = new PackageManagerVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
