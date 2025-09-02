import { getVersionedNativeModulesAsync } from '@expo/cli/src/start/doctor/dependencies/bundledNativeModules';

import { getDeepDependenciesWarningWithPackageNameAsync } from '../../utils/explainDependencies';
import { DeepNativeModuleVersionCheck } from '../DeepNativeModuleVersionCheck';

jest.mock('../../utils/explainDependencies');

jest.mock('@expo/cli/src/start/doctor/dependencies/bundledNativeModules');

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '50.0.0',
  },
  pkg: {
    resolutions: {
      metro: '0.9.0',
    },
  },
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

const mockGetRemoteVersionsForSdkAsyncResult = {
  'expo-modules-core': '~2.5.0',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('runAsync', () => {
  it('returns result with isSuccessful = true if check passes', async () => {
    jest
      .mocked(getVersionedNativeModulesAsync)
      .mockResolvedValueOnce(mockGetRemoteVersionsForSdkAsyncResult);
    jest.mocked(getDeepDependenciesWarningWithPackageNameAsync).mockResolvedValue(null);

    const check = new DeepNativeModuleVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeTruthy();
    expect(result.advice).toEqual([]);
  });

  it('returns result with isSuccessful = false if check fails', async () => {
    jest
      .mocked(getVersionedNativeModulesAsync)
      .mockResolvedValueOnce(mockGetRemoteVersionsForSdkAsyncResult);
    jest
      .mocked(getDeepDependenciesWarningWithPackageNameAsync)
      .mockResolvedValueOnce({ packageName: 'expo-modules-core', message: 'warning' });

    const check = new DeepNativeModuleVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns the default advice when there is a warning', async () => {
    jest
      .mocked(getVersionedNativeModulesAsync)
      .mockResolvedValueOnce(mockGetRemoteVersionsForSdkAsyncResult);
    jest
      .mocked(getDeepDependenciesWarningWithPackageNameAsync)
      .mockImplementation(async (pkg) =>
        pkg === 'expo-modules-core'
          ? { packageName: 'expo-modules-core', message: 'warning' }
          : null
      );

    const check = new DeepNativeModuleVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice).toEqual([
      'Update packages so the resolved version matches the recommended range.',
      'If version ranges already allow a compatible version, regenerate the lockfile and reinstall dependencies to refresh the resolution.',
    ]);
  });
});
