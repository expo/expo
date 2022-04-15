import { Log } from '../../log';
import { getVersionedDependenciesAsync } from '../../start/doctor/dependencies/validateDependenciesVersions';
import { confirmAsync } from '../../utils/prompts';
import { checkOrFixAsync } from '../installAsync';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../log');

jest.mock('../../start/doctor/dependencies/validateDependenciesVersions', () => ({
  getVersionedDependenciesAsync: jest.fn(),
  logIncorrectDependencies: jest.fn(),
}));

jest.mock('../../utils/prompts');

jest.mock('@expo/config', () => ({
  getProjectConfigDescriptionWithPaths: jest.fn(),
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

describe(checkOrFixAsync, () => {
  it(`checks packages and exits when packages are invalid`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(false);
    asMock(getVersionedDependenciesAsync).mockResolvedValueOnce(async () => [
      {
        packageName: 'react-native',
        expectedVersionOrRange: '^1.0.0',
        actualVersion: '0.69.0',
      },
    ]);
    await checkOrFixAsync('/', ['react-native'], { fix: false }, { fix: false }, []);

    expect(Log.warn).toBeCalledWith(`react-native is not installed.`);
    expect(Log.exit).toBeCalledWith(1);
  });
});
