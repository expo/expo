import { asMock } from '../../__tests__/asMock';
import { Log } from '../../log';
import {
  getVersionedDependenciesAsync,
  logIncorrectDependencies,
} from '../../start/doctor/dependencies/validateDependenciesVersions';
import { confirmAsync } from '../../utils/prompts';
import { checkPackagesAsync } from '../checkPackages';
import { installPackagesAsync } from '../installAsync';

jest.mock('../../log');

jest.mock('../../utils/prompts');

jest.mock('../installAsync', () => ({
  installPackagesAsync: jest.fn(),
}));

jest.mock('../../start/doctor/dependencies/validateDependenciesVersions', () => ({
  getVersionedDependenciesAsync: jest.fn(),
  logIncorrectDependencies: jest.fn(),
}));

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

describe(checkPackagesAsync, () => {
  it(`checks packages and exits when packages are invalid`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(false);
    asMock(getVersionedDependenciesAsync).mockResolvedValueOnce([
      {
        packageName: 'react-native',
        expectedVersionOrRange: '^1.0.0',
        actualVersion: '0.69.0',
      },
    ]);
    await expect(
      checkPackagesAsync('/', {
        packages: ['react-native'],
        options: { fix: false },
        // @ts-expect-error
        packageManager: {},
        packageManagerArguments: [],
      })
    ).rejects.toThrowError(/EXIT/);

    expect(logIncorrectDependencies).toBeCalledTimes(1);

    expect(Log.exit).toBeCalledWith(
      // Because of ansi
      expect.stringContaining('Found outdated dependencies'),
      1
    );
  });

  it(`checks packages and exits with zero if all are valid`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(false);
    asMock(getVersionedDependenciesAsync).mockResolvedValueOnce([]);
    await expect(
      checkPackagesAsync('/', {
        packages: ['react-native'],
        options: { fix: false },
        // @ts-expect-error
        packageManager: {},
        packageManagerArguments: [],
      })
    ).rejects.toThrowError(/EXIT/);

    expect(logIncorrectDependencies).toBeCalledTimes(0);

    expect(Log.exit).toBeCalledWith(
      // Because of ansi
      expect.stringContaining('Dependencies are up to date'),
      0
    );
  });

  it(`fixes invalid packages`, async () => {
    asMock(getVersionedDependenciesAsync).mockResolvedValueOnce([
      {
        packageName: 'react-native',
        expectedVersionOrRange: '^1.0.0',
        actualVersion: '0.69.0',
      },
      {
        packageName: 'expo',
        expectedVersionOrRange: '^1.0.0',
        actualVersion: '0.69.0',
      },
    ]);

    await checkPackagesAsync('/', {
      packages: ['react-native', 'expo'],
      options: { fix: true },
      // @ts-expect-error
      packageManager: {},
      packageManagerArguments: [],
    });

    expect(installPackagesAsync).toBeCalledWith('/', {
      packageManager: {},
      packageManagerArguments: [],
      packages: ['react-native', 'expo'],
      sdkVersion: '45.0.0',
    });
    expect(logIncorrectDependencies).toBeCalledTimes(1);
  });
});
