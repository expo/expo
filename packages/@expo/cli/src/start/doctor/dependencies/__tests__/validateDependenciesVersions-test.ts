import type { PackageJSONConfig } from '@expo/config';
import { vol } from 'memfs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { asMock } from '../../../../__tests__/asMock';
import * as Log from '../../../../log';
import {
  findUnbundledNativeModulesAsync,
  isNativeModuleAsync,
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
  getCombinedKnownVersionsAsync: () => ({
    'expo-splash-screen': '~1.2.3',
    'expo-updates': '~2.3.4',
    firebase: '9.1.0',
  }),
}));

describe(logIncorrectDependencies, () => {
  it(`logs incorrect dependencies`, () => {
    asMock(Log.warn).mockImplementation(console.log);

    logIncorrectDependencies([
      {
        actualVersion: '1.0.0',
        packageName: 'react-native',
        expectedVersionOrRange: '~2.0.0',
      },
    ]);

    expect(Log.warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('Some dependencies are incompatible')
    );
    expect(Log.warn).toHaveBeenNthCalledWith(2, expect.stringContaining('expected version'));
    expect(Log.warn).toHaveBeenNthCalledWith(3, expect.stringContaining('npx expo install --fix'));
  });
});

describe(validateDependenciesVersionsAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    vol.reset();
  });

  it('resolves to true when the installed packages match bundled native modules', async () => {
    vol.fromJSON(
      {
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

  it('resolves to false when the installed packages do not match bundled native modules', async () => {
    asMock(Log.warn).mockReset();
    vol.fromJSON(
      {
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
      expect.stringContaining('Some dependencies are incompatible with the installed')
    );
    expect(Log.warn).toHaveBeenNthCalledWith(2, expect.stringContaining('expo-splash-screen'));
    expect(Log.warn).toHaveBeenNthCalledWith(3, expect.stringContaining('expo-updates'));
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
    asMock(resolveFrom).mockImplementationOnce(() => {
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
    const { APISettings } = require('../../../../api/settings');
    const originalIsOffline = APISettings.isOffline;
    APISettings.isOffline = true;

    const { validateDependenciesVersionsAsync } = require('../validateDependenciesVersions');
    const exp = { sdkVersion: '46.0.0' };
    const pkg = {
      dependencies: { expo: '^46.0.0' },
    };

    await expect(
      validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)
    ).resolves.toBeNull();
    APISettings.isOffline = originalIsOffline;
  });
});

describe(findUnbundledNativeModulesAsync, () => {
  const projectRoot = '/test-project';

  beforeAll(() => {
    jest.doMock('node:fs', jest.requireActual('memfs').fs);
  });

  beforeEach(() => {
    vol.reset();
  });

  afterAll(() => {
    jest.dontMock('node:fs');
  });

  it('should return native modules not in bundledNativeModules.json', async () => {
    const packageJSON: PackageJSONConfig = {
      dependencies: {
        'expo-updates': '*',
        'test-native-module': '*',
      },
      devDependencies: {
        'test-dev-native-module': '*',
      },
    };
    vol.fromJSON(
      {
        'node_modules/test-native-module/package.json': '{}',
        'node_modules/test-native-module/Hello.podspec': 'require "json"',
        'node_modules/test-dev-native-module/package.json': '{}',
        'node_modules/test-dev-native-module/Hello.podspec': 'require "json"',
        'node_modules/expo-updates/package.json': '{}',
        'node_modules/expo-updates/ios/EXUpdates.podspec': 'require "json"',
      },
      projectRoot
    );
    await expect(findUnbundledNativeModulesAsync('/test-project', packageJSON)).resolves.toEqual([
      'test-native-module',
      'test-dev-native-module',
    ]);
  });

  it('should not return third-party js only packages', async () => {
    const packageJSON: PackageJSONConfig = {
      dependencies: {
        'expo-updates': '*',
        'test-js-package': '*',
      },
    };
    vol.fromJSON(
      {
        'node_modules/test-js-package/package.json': '{}',
        'node_modules/test-js-package/index.js': 'console.log("hello");',
        'node_modules/expo-updates/package.json': '{}',
        'node_modules/expo-updates/ios/EXUpdates.podspec': 'require "json"',
      },
      projectRoot
    );
    await expect(findUnbundledNativeModulesAsync('/test-project', packageJSON)).resolves.toEqual(
      []
    );
  });
});

describe(isNativeModuleAsync, () => {
  const packageRoot = '/test-project/node_modules/test-package';

  beforeAll(() => {
    jest.doMock('node:fs', jest.requireActual('memfs').fs);
  });

  beforeEach(() => {
    vol.reset();
  });

  afterAll(() => {
    jest.dontMock('node:fs');
  });

  it('should return true for package with build.gradle', async () => {
    vol.fromJSON(
      {
        'android/build.gradle': 'import java.nio.file.Paths',
      },
      packageRoot
    );
    await expect(isNativeModuleAsync(packageRoot)).resolves.toBe(true);
  });

  it('should return true for package with both build.gradle and podspec', async () => {
    vol.fromJSON(
      {
        'android/build.gradle': 'import java.nio.file.Paths',
        'Hello.podspec': 'require "json"',
      },
      packageRoot
    );
    await expect(isNativeModuleAsync(packageRoot)).resolves.toBe(true);
  });

  it('should return false for package with only json and js files', async () => {
    vol.fromJSON(
      {
        'app.json': '{}',
        'App.js': 'console.log("hello")',
      },
      packageRoot
    );
    await expect(isNativeModuleAsync(packageRoot)).resolves.toBe(false);
  });
});
