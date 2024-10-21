import { vol } from 'memfs';
import path from 'path';
import resolveFrom from 'resolve-from';

import * as Log from '../../../../log';
import {
  isDependencyVersionIncorrect,
  logIncorrectDependencies,
  validateDependenciesVersionsAsync,
} from '../validateDependenciesVersions';

jest.mock(`../../../../log`);
jest.mock('../bundledNativeModules', () => ({
  getVersionedNativeModulesAsync: () => ({
    'expo-splash-screen': '~1.2.3',
    'expo-updates': '~2.3.4',
    firebase: '9.1.0',
  }),
}));
jest.mock('../getVersionedPackages', () => ({
  getCombinedKnownVersionsAsync: jest.fn(() => ({
    'expo-splash-screen': '~1.2.3',
    'expo-updates': '~2.3.4',
    firebase: '9.1.0',
    expo: '49.0.7',
  })),
}));

describe(logIncorrectDependencies, () => {
  it(`logs incorrect dependencies`, () => {
    jest.mocked(Log.warn).mockImplementation(console.log);

    logIncorrectDependencies([
      {
        actualVersion: '1.0.0',
        packageName: 'react-native',
        expectedVersionOrRange: '~2.0.0',
        packageType: 'dependencies',
      },
    ]);

    expect(Log.warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('The following packages should be updated for best compatibility')
    );
    expect(Log.warn).toHaveBeenNthCalledWith(2, expect.stringContaining('expected version'));
  });
});

describe(validateDependenciesVersionsAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    vol.reset();
    delete process.env.EXPO_OFFLINE;
  });

  it('resolves to true when the installed packages match bundled native modules', async () => {
    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({
          version: '41.0.0',
        }),
        'node_modules/expo-splash-screen/package.json': JSON.stringify({
          version: '1.2.3',
        }),
        'node_modules/expo-updates/package.json': JSON.stringify({
          version: '2.3.4',
        }),
      },
      projectRoot
    );
    const exp = {
      sdkVersion: '41.0.0',
    };
    const pkg = {
      dependencies: { 'expo-splash-screen': '~1.2.3', 'expo-updates': '~2.3.4' },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      true
    );
  });

  it('resolves to true when installed expo version is greater than "known" good version', async () => {
    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({
          version: '49.0.8',
        }),
      },
      projectRoot
    );
    const exp = {
      sdkVersion: '49.0.0',
    };
    const pkg = {
      dependencies: { expo: '^49.0.0' },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      true
    );
  });

  it('resolves to false when installed expo version is less than known good version', async () => {
    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({
          version: '49.0.6',
        }),
      },
      projectRoot
    );
    const exp = {
      sdkVersion: '49.0.0',
    };
    const pkg = {
      dependencies: { expo: '^49.0.0' },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      false
    );
  });

  it('resolves to false when the installed packages do not match bundled native modules', async () => {
    jest.mocked(Log.warn).mockReset();
    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({
          version: '41.0.0',
        }),
        'node_modules/expo-splash-screen/package.json': JSON.stringify({
          version: '0.2.3',
        }),
        'node_modules/expo-updates/package.json': JSON.stringify({
          version: '1.3.4',
        }),
      },
      projectRoot
    );
    const exp = {
      sdkVersion: '41.0.0',
    };
    const pkg = {
      dependencies: { 'expo-splash-screen': '~0.2.3', 'expo-updates': '~1.3.4' },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      false
    );
    expect(Log.warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('The following packages should be updated for best compatibility')
    );
    expect(Log.warn).toHaveBeenNthCalledWith(2, expect.stringContaining('expo-splash-screen'));
    expect(Log.warn).toHaveBeenNthCalledWith(3, expect.stringContaining('expo-updates'));
  });

  it('skips packages do not match bundled native modules but are in package.json expo.install.exclude', async () => {
    jest.mocked(Log.warn).mockReset();
    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({
          version: '41.0.0',
        }),
        'node_modules/expo-splash-screen/package.json': JSON.stringify({
          version: '0.2.3',
        }),
        'node_modules/expo-updates/package.json': JSON.stringify({
          version: '1.3.4',
        }),
      },
      projectRoot
    );
    const exp = {
      sdkVersion: '41.0.0',
    };
    const pkg = {
      dependencies: { 'expo-splash-screen': '~0.2.3', 'expo-updates': '~1.3.4' },
      expo: { install: { exclude: ['expo-splash-screen'] } },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      false
    );
    expect(Log.warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('The following packages should be updated for best compatibility')
    );
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('expo-updates'));
    expect(Log.warn).not.toHaveBeenCalledWith(expect.stringContaining('expo-splash-screen'));
  });

  it('supports npm package args for excluded packages', async () => {
    jest.mocked(Log.warn).mockReset();
    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({
          version: '41.0.0',
        }),
        'node_modules/expo-splash-screen/package.json': JSON.stringify({
          version: '0.2.3',
        }),
        'node_modules/expo-updates/package.json': JSON.stringify({
          version: '1.3.4',
        }),
        'node_modules/firebase/package.json': JSON.stringify({
          version: '10.0.0',
        }),
      },
      projectRoot
    );
    const exp = {
      sdkVersion: '41.0.0',
    };
    const pkg = {
      dependencies: {
        'expo-splash-screen': '~0.2.3',
        'expo-updates': '~1.3.4',
        firebase: '~10.0.0',
      },
      // "Don't validate this for me for me as long as you plan to recommend @~0.2.3 - I don't want that version"
      expo: { install: { exclude: ['expo-splash-screen@~1.2.3', 'firebase@9.1.0'] } },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      false
    );
    expect(Log.warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('The following packages should be updated for best compatibility')
    );
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('expo-updates'));
    expect(Log.warn).not.toHaveBeenCalledWith(expect.stringContaining('expo-splash-screen'));
    expect(Log.warn).not.toHaveBeenCalledWith(expect.stringContaining('firebase'));
  });

  it('resolves to true when installed package uses "exports"', async () => {
    const packageJsonPath = path.join(projectRoot, 'node_modules/firebase/package.json');

    vol.fromJSON({
      [packageJsonPath]: JSON.stringify({
        version: '9.1.0',
        exports: {
          './analytics': {
            node: {
              require: './analytics/dist/index.cjs.js',
              import: './analytics/dist/index.mjs',
            },
            default: './analytics/dist/index.esm.js',
          },
        },
      }),
    });

    // Manually trigger the Node import error for "exports".
    // This isn't triggered by memfs, or our mock, that's why we need to do it manually.
    // see: https://github.com/expo/expo-cli/pull/3878
    jest.mocked(resolveFrom).mockImplementationOnce(() => {
      const message = `Package subpath './package.json' is not defined by "exports" in ${packageJsonPath}`;
      const error: any = new Error(message);
      error.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
      throw error;
    });

    const exp = {
      sdkVersion: '43.0.0',
    };
    const pkg = {
      dependencies: { firebase: '~9.1.0' },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      true
    );
  });

  it('skips validating dependencies when running in offline mode', async () => {
    jest.resetModules();

    process.env.EXPO_OFFLINE = '1';

    const { validateDependenciesVersionsAsync } = require('../validateDependenciesVersions');
    const exp = { sdkVersion: '46.0.0' };
    const pkg = {
      dependencies: { expo: '^46.0.0' },
    };

    await expect(
      validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)
    ).resolves.toBeNull();
  });
});

describe(isDependencyVersionIncorrect, () => {
  const testCases = [
    ['3.9.0-rc.1', '~3.9.0-rc.1', false, 'prerelease with tilde range'],
    ['3.9.0-rc.1', '~3.9.1', true, 'different prerelease with tilde range'],
    ['3.9.0-rc.1', '^3.9.0-rc.1', false, 'prerelease with caret range'],
    ['3.9.0-rc.1', '3.9.0-rc.1', false, 'exact prerelease match'],
    ['3.9.0', '^3.9.0', false, 'regular version with caret range'],
    ['3.9.0', '~3.9.1', true, 'different regular version with tilde range'],
    ['3.9.0', '~3.9.0', false, 'same regular version with tilde range'],
    ['3.9.0', '>=3.9.0', false, 'same version with greater than or equal range'],
    ['3.9.0', '>=4.0.0', true, 'version less than minimum'],
    ['3.9.3', '>=3.9.0 <4.0.0', false, 'version within range'],
    ['3.8.3', '>=3.9.0 <4.0.0', true, 'version outside range'],
    ['4.0.0', '>=3.9.0 <=4.0.0', false, 'version equal to maximum'],
    ['3.9.0-rc.1', '>=4.0.0-rc.1', true, 'prerelease less than minimum'],
  ];

  testCases.forEach(([actual, expected, result, description]) => {
    it(`returns ${result} evaluating ${actual} against ${expected} - ${description}`, () => {
      expect(
        isDependencyVersionIncorrect(
          'react-native-reanimated',
          actual as string,
          expected as string
        )
      ).toBe(result);
    });
  });
});
