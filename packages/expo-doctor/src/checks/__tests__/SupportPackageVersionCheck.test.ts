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
  pkg: {},
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true if check passes', async () => {
    jest.mocked(getRemoteVersionsForSdkAsync).mockResolvedValueOnce({
      'expo-modules-autolinking': '1.0.0',
      '@expo/config-plugins': '1.0.0',
      '@expo/prebuild-config': '1.0.0',
      '@expo/metro-config': '1.0.0',
    });
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValueOnce(null);
    const check = new SupportPackageVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if check fails', async () => {
    jest.mocked(getRemoteVersionsForSdkAsync).mockResolvedValueOnce({
      'expo-modules-autolinking': '1.0.0',
      '@expo/config-plugins': '1.0.0',
      '@expo/prebuild-config': '1.0.0',
      '@expo/metro-config': '1.0.0',
    });
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValueOnce('warning');
    const check = new SupportPackageVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
