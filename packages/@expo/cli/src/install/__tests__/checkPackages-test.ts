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
  let mockConsoleLog: jest.Spied<typeof console.log>;
  let mockProcessExit: jest.Spied<typeof process.exit>;

  beforeEach(() => {
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('MOCK_EXIT');
    });
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockProcessExit.mockRestore();
  });

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
    ).rejects.toThrow(/EXIT/);

    expect(logIncorrectDependencies).toHaveBeenCalledTimes(1);

    expect(Log.exit).toHaveBeenCalledWith(
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

    expect(Log.log).toHaveBeenCalledWith(
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
    ).rejects.toThrow(/EXIT/);

    expect(logIncorrectDependencies).toHaveBeenCalledTimes(0);

    expect(Log.exit).toHaveBeenCalledWith(
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

    expect(fixPackagesAsync).toHaveBeenCalledWith('/', {
      packageManager: {},
      packageManagerArguments: [],
      packages: issues,
      sdkVersion: '45.0.0',
    });
    expect(logIncorrectDependencies).toHaveBeenCalledTimes(1);
  });

  it(`outputs JSON when --json flag is used with up-to-date dependencies`, async () => {
    jest.mocked(getVersionedDependenciesAsync).mockResolvedValueOnce([]);

    await checkPackagesAsync('/', {
      packages: ['react-native'],
      options: { fix: false, json: true },
      // @ts-expect-error
      packageManager: {},
      packageManagerArguments: [],
    });

    expect(mockConsoleLog).toHaveBeenCalledWith(
      JSON.stringify({ dependencies: [], upToDate: true })
    );
  });

  it(`outputs JSON when --json flag is used with outdated dependencies`, async () => {
    const outdatedDeps = [
      {
        packageName: 'react-native',
        packageType: 'dependencies' as const,
        expectedVersionOrRange: '^1.0.0',
        actualVersion: '0.69.0',
      },
      {
        packageName: 'expo-av',
        packageType: 'devDependencies' as const,
        expectedVersionOrRange: '^2.0.0',
        actualVersion: '1.5.0',
      },
    ];

    jest.mocked(getVersionedDependenciesAsync).mockResolvedValueOnce(outdatedDeps);

    await expect(
      checkPackagesAsync('/', {
        packages: ['react-native', 'expo-av'],
        options: { fix: false, json: true },
        // @ts-expect-error
        packageManager: {},
        packageManagerArguments: [],
      })
    ).rejects.toThrow(/MOCK_EXIT/);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      JSON.stringify({ dependencies: outdatedDeps, upToDate: false }, null, 2)
    );
  });

  it(`suppresses exclude list message when --json flag is used`, async () => {
    // @ts-expect-error
    jest.mocked(getConfig).mockReturnValueOnce({
      pkg: {
        expo: {
          install: {
            exclude: ['expo-av'],
          },
        },
      },
      exp: {
        sdkVersion: '53.0.0',
        name: 'my-app',
        slug: 'my-app',
      },
    });
    jest.mocked(getVersionedDependenciesAsync).mockResolvedValueOnce([]);

    await checkPackagesAsync('/', {
      packages: ['expo-av'],
      options: { fix: false, json: true },
      // @ts-expect-error
      packageManager: {},
      packageManagerArguments: [],
    });

    expect(Log.log).not.toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(
      JSON.stringify({ dependencies: [], upToDate: true })
    );
  });

  it(`parses and validates JSON output structure with outdated dependencies`, async () => {
    const outdatedDeps = [
      {
        packageName: 'react-native',
        packageType: 'dependencies' as const,
        expectedVersionOrRange: '^0.72.0',
        actualVersion: '0.71.8',
      },
      {
        packageName: 'expo-av',
        packageType: 'devDependencies' as const,
        expectedVersionOrRange: '~13.4.0',
        actualVersion: '13.3.1',
      },
      {
        packageName: '@expo/vector-icons',
        packageType: 'dependencies' as const,
        expectedVersionOrRange: '^13.0.0',
        actualVersion: '12.0.1',
      },
    ];

    jest.mocked(getVersionedDependenciesAsync).mockResolvedValueOnce(outdatedDeps);

    await expect(
      checkPackagesAsync('/', {
        packages: ['react-native', 'expo-av', '@expo/vector-icons'],
        options: { fix: false, json: true },
        // @ts-expect-error
        packageManager: {},
        packageManagerArguments: [],
      })
    ).rejects.toThrow(/MOCK_EXIT/);

    // Get the JSON output
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    const jsonOutput = mockConsoleLog.mock.calls[0][0];

    // Parse and validate the JSON structure
    expect(() => JSON.parse(jsonOutput)).not.toThrow();
    const parsedOutput = JSON.parse(jsonOutput);

    // Validate top-level structure
    expect(parsedOutput).toHaveProperty('dependencies');
    expect(Array.isArray(parsedOutput.dependencies)).toBe(true);
    expect(parsedOutput.dependencies).toHaveLength(3);

    // Validate each dependency object structure and content
    const expectedPackageNames = ['react-native', 'expo-av', '@expo/vector-icons'];
    const expectedPackageTypes = ['dependencies', 'devDependencies', 'dependencies'];
    const expectedVersions = ['^0.72.0', '~13.4.0', '^13.0.0'];
    const actualVersions = ['0.71.8', '13.3.1', '12.0.1'];

    parsedOutput.dependencies.forEach((dep: any, index: number) => {
      // Validate all required fields are present
      expect(dep).toHaveProperty('packageName');
      expect(dep).toHaveProperty('packageType');
      expect(dep).toHaveProperty('expectedVersionOrRange');
      expect(dep).toHaveProperty('actualVersion');

      // Validate field types
      expect(typeof dep.packageName).toBe('string');
      expect(typeof dep.packageType).toBe('string');
      expect(typeof dep.expectedVersionOrRange).toBe('string');
      expect(typeof dep.actualVersion).toBe('string');

      // Validate specific values
      expect(dep.packageName).toBe(expectedPackageNames[index]);
      expect(dep.packageType).toBe(expectedPackageTypes[index]);
      expect(dep.expectedVersionOrRange).toBe(expectedVersions[index]);
      expect(dep.actualVersion).toBe(actualVersions[index]);
    });

    // Validate exit code
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
