import { getConfig } from '@expo/config';

import { Log } from '../../log';
import {
  getVersionedDependenciesAsync,
  logIncorrectDependencies,
} from '../../start/doctor/dependencies/validateDependenciesVersions';
import { confirmAsync } from '../../utils/prompts';
import { checkPackagesAsync } from '../checkPackages';
import { fixPackagesAsync } from '../fixPackages';

jest.mock('../../log');

jest.mock('../../utils/prompts');

jest.mock('../fixPackages', () => ({
  fixPackagesAsync: jest.fn(),
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
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    jest.mocked(getVersionedDependenciesAsync).mockResolvedValueOnce([
      {
        packageName: 'react-native',
        packageType: 'dependencies',
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

  it(`notifies when dependencies are on exclude list`, async () => {
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    // @ts-expect-error
    jest.mocked(getConfig).mockReturnValueOnce({
      pkg: {
        expo: {
          install: {
            exclude: ['expo-av', 'expo-blur'],
          },
        },
      },
      exp: {
        sdkVersion: '45.0.0',
        name: 'my-app',
        slug: 'my-app',
      },
    });
    jest.mocked(getVersionedDependenciesAsync).mockResolvedValueOnce([
      {
        packageName: 'expo-av',
        packageType: 'dependencies',
        expectedVersionOrRange: '^2.0.0',
        actualVersion: '1.0.0',
      },
    ]);
    await checkPackagesAsync('/', {
      packages: ['expo-av'],
      options: { fix: true },
      // @ts-expect-error
      packageManager: {},
      packageManagerArguments: [],
    });

    expect(Log.log).toBeCalledWith(
      expect.stringContaining('Skipped fixing dependencies: expo-av and expo-blur')
    );
  });

  it(`checks packages and exits with zero if all are valid`, async () => {
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    jest.mocked(getVersionedDependenciesAsync).mockResolvedValueOnce([]);
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
    const issues: Awaited<ReturnType<typeof getVersionedDependenciesAsync>> = [
      {
        packageName: 'react-native',
        packageType: 'dependencies',
        expectedVersionOrRange: '^1.0.0',
        actualVersion: '0.69.0',
      },
      {
        packageName: 'expo',
        packageType: 'dependencies',
        expectedVersionOrRange: '^1.0.0',
        actualVersion: '0.69.0',
      },
    ];

    jest.mocked(getVersionedDependenciesAsync).mockResolvedValueOnce(issues);

    await checkPackagesAsync('/', {
      packages: ['react-native', 'expo'],
      options: { fix: true },
      // @ts-expect-error
      packageManager: {},
      packageManagerArguments: [],
    });

    expect(fixPackagesAsync).toBeCalledWith('/', {
      packageManager: {},
      packageManagerArguments: [],
      packages: issues,
      sdkVersion: '45.0.0',
    });
    expect(logIncorrectDependencies).toBeCalledTimes(1);
  });
});
