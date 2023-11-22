import { getDeepDependenciesWarningAsync } from '../../utils/explainDependencies';
import { IllegalPackageCheck } from '../IllegalPackageCheck';

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
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValueOnce(null);
    const check = new IllegalPackageCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if check fails', async () => {
    jest.mocked(getDeepDependenciesWarningAsync).mockResolvedValueOnce('warning');
    const check = new IllegalPackageCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
