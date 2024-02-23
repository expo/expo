import { getDeepDependenciesWarningAsync } from '../../utils/explainDependencies';
import { GlobalPackageInstalledLocallyCheck } from '../GlobalPackageInstalledLocallyCheck';

jest.mock('../../utils/explainDependencies');

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
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValueOnce(null);
    const check = new GlobalPackageInstalledLocallyCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if check fails', async () => {
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValueOnce('warning');
    const check = new GlobalPackageInstalledLocallyCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with advice to remove expo-cli if check fails', async () => {
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValueOnce('warning');
    const check = new GlobalPackageInstalledLocallyCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.advice).toEqual('Remove expo-cli from your project dependencies.');
  });
});
