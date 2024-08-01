import { getDeepDependenciesWarningAsync } from '../../utils/explainDependencies';
import { getRemoteVersionsForSdkAsync } from '../../utils/getRemoteVersionsForSdkAsync';
import { SupportPackageVersionCheck } from '../SupportPackageVersionCheck';

jest.mock('../../utils/explainDependencies');

jest.mock('../../utils/getRemoteVersionsForSdkAsync');

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
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
  'expo-modules-autolinking': '1.0.0',
  '@expo/config-plugins': '1.0.0',
  '@expo/prebuild-config': '1.0.0',
  '@expo/metro-config': '1.0.0',
  metro: '1.0.0',
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true if check passes', async () => {
    jest
      .mocked(getRemoteVersionsForSdkAsync)
      .mockResolvedValueOnce(mockGetRemoteVersionsForSdkAsyncResult);
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValue(null);
    const check = new SupportPackageVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if check fails', async () => {
    jest
      .mocked(getRemoteVersionsForSdkAsync)
      .mockResolvedValueOnce(mockGetRemoteVersionsForSdkAsyncResult);
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValueOnce('warning');
    const check = new SupportPackageVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('customizes advice if there is a warning and one of the modules is in package.json resolutions', async () => {
    jest
      .mocked(getRemoteVersionsForSdkAsync)
      .mockResolvedValueOnce(mockGetRemoteVersionsForSdkAsyncResult);
    jest.mocked(getDeepDependenciesWarningAsync).mockImplementation(async (pkg, projectRoot) => {
      if (pkg.name === 'metro') {
        return 'warning';
      }
      return null;
    });
    const check = new SupportPackageVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.advice).toContain('remove resolutions from package.json');
  });

  it('warns about selected related metro packages that are not explicitly referenced in remote versions', async () => {
    jest
      .mocked(getRemoteVersionsForSdkAsync)
      .mockResolvedValueOnce(mockGetRemoteVersionsForSdkAsyncResult);
    jest.mocked(getDeepDependenciesWarningAsync).mockImplementation(async (pkg, projectRoot) => {
      if (pkg.name === 'metro-config') {
        return 'warning';
      }
      return null;
    });
    const check = new SupportPackageVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice).toEqual(
      'Upgrade dependencies that are using the invalid package versions.'
    );
  });

  it('warns if package.json resolutions are not pinned to a valid version', async () => {
    jest
      .mocked(getRemoteVersionsForSdkAsync)
      .mockResolvedValueOnce(mockGetRemoteVersionsForSdkAsyncResult);
    jest.mocked(getDeepDependenciesWarningAsync).mockImplementation(async (pkg, projectRoot) => {
      if (pkg.name === 'metro') {
        return 'warning';
      }
      return null;
    });
    const check = new SupportPackageVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      pkg: {
        ...additionalProjectProps.pkg,
        resolutions: {
          metro: '999.999.999',
        },
      },
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice).toContain(
      'Upgrade dependencies that are using the invalid package versions and remove resolutions'
    );
  });
});
