import { vol } from 'memfs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { validateDependenciesVersionsAsync } from '../validateDependenciesVersions';

jest.mock('fs');

jest.mock('../bundledNativeModules', () => ({
  getBundledNativeModulesAsync: () => ({
    'expo-splash-screen': '~1.2.3',
    'expo-updates': '~2.3.4',
    firebase: '9.1.0',
  }),
}));

describe(validateDependenciesVersionsAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    vol.reset();
  });

  it('resolves to false for SDKs < 33.0.0', async () => {
    const exp = {
      sdkVersion: '32.0.0',
    };
    const pkg = {
      dependencies: { 'expo-splash-screen': '~1.2.3', 'expo-updates': '~2.3.4' },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      false
    );
  });

  it('resolves to true when the installed packages match bundled native modules', async () => {
    vol.fromJSON({
      [path.join(projectRoot, 'node_modules/expo-splash-screen/package.json')]: JSON.stringify({
        version: '1.2.3',
      }),
      [path.join(projectRoot, 'node_modules/expo-updates/package.json')]: JSON.stringify({
        version: '2.3.4',
      }),
    });
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
    vol.fromJSON({
      [path.join(projectRoot, 'node_modules/expo-splash-screen/package.json')]: JSON.stringify({
        version: '0.2.3',
      }),
      [path.join(projectRoot, 'node_modules/expo-updates/package.json')]: JSON.stringify({
        version: '1.3.4',
      }),
    });
    const exp = {
      sdkVersion: '41.0.0',
    };
    const pkg = {
      dependencies: { 'expo-splash-screen': '~0.2.3', 'expo-updates': '~1.3.4' },
    };

    await expect(validateDependenciesVersionsAsync(projectRoot, exp as any, pkg)).resolves.toBe(
      false
    );
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
    (resolveFrom as jest.MockedFunction<typeof resolveFrom>).mockImplementationOnce(() => {
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
});
