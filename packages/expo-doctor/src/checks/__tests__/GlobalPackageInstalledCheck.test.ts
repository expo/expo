import { asMock } from '../../__tests__/asMock';
import { getDeepDependenciesWarningAsync } from '../../utils/explainDependencies';
import { GlobalPackageInstalledCheck } from '../GlobalPackageInstalledCheck';

jest.mock('../../utils/explainDependencies');

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  pkg: {},
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true if check passes', async () => {
    asMock(getDeepDependenciesWarningAsync).mockResolvedValueOnce(null);
    const check = new GlobalPackageInstalledCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if check fails', async () => {
    asMock(getDeepDependenciesWarningAsync).mockResolvedValueOnce('warning');
    const check = new GlobalPackageInstalledCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with advice to remove expo-cli if check fails', async () => {
    asMock(getDeepDependenciesWarningAsync).mockResolvedValueOnce('warning');
    const check = new GlobalPackageInstalledCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.advice).toEqual('Remove expo-cli from your project dependencies.');
  });
});
