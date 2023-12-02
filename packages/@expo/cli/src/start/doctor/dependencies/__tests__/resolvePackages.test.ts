import { vol } from 'memfs';
import resolveFrom from 'resolve-from';

import {
  resolvePackageVersionAsync,
  resolveAllPackageVersionsAsync,
  hasExpoCanaryAsync,
} from '../resolvePackages';

afterEach(() => {
  vol.reset();
});

const projectRoot = '/fake/project';

describe(resolvePackageVersionAsync, () => {
  it('resolves installed package', async () => {
    vol.fromJSON(
      { [`node_modules/expo/package.json`]: JSON.stringify({ version: '1.0.0' }) },
      projectRoot
    );

    await expect(resolvePackageVersionAsync(projectRoot, 'expo')).resolves.toBe('1.0.0');
  });

  it('resolves installed package using `exports` without `package.json`', async () => {
    // Mock the Node error when not exporting `package.json` from `exports`.
    jest.mocked(resolveFrom).mockImplementationOnce(() => {
      const error: any = new Error(
        `Package subpath './package.json' is not defined by "exports" in ${projectRoot}/node_modules/expo/package.json`
      );
      error.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
      throw error;
    });

    vol.fromJSON(
      {
        [`node_modules/expo/package.json`]: JSON.stringify({
          version: '2.0.0',
          exports: {
            '.': {
              require: './index.js',
            },
          },
        }),
      },
      projectRoot
    );

    await expect(resolvePackageVersionAsync(projectRoot, 'expo')).resolves.toBe('2.0.0');
  });

  it('throws when package is not installed', async () => {
    vol.fromJSON({}, projectRoot);

    await expect(resolvePackageVersionAsync(projectRoot, 'expo')).rejects.toThrowError(
      `"expo" is added as a dependency in your project's package.json but it doesn't seem to be installed`
    );
  });
});

describe(resolveAllPackageVersionsAsync, () => {
  it('resolves installed packages', async () => {
    vol.fromJSON(
      {
        [`node_modules/expo/package.json`]: JSON.stringify({ version: '1.0.0' }),
        [`node_modules/react/package.json`]: JSON.stringify({ version: '2.0.0' }),
      },
      projectRoot
    );

    await expect(
      resolveAllPackageVersionsAsync(projectRoot, ['expo', 'react'])
    ).resolves.toMatchObject({
      expo: '1.0.0',
      react: '2.0.0',
    });
  });

  it('throws when package is not installed', async () => {
    vol.fromJSON(
      {
        [`node_modules/expo/package.json`]: JSON.stringify({ version: '1.0.0' }),
      },
      projectRoot
    );

    await expect(resolveAllPackageVersionsAsync(projectRoot, ['expo', 'react'])).rejects.toThrow(
      `"react" is added as a dependency in your project's package.json but it doesn't seem to be installed`
    );
  });
});

describe(hasExpoCanaryAsync, () => {
  it('returns false for stable version from installed package', async () => {
    vol.fromJSON(
      {
        [`node_modules/expo/package.json`]: JSON.stringify({ version: '1.0.0' }),
        // This is not a common use-case, but tests the priority of strategies
        [`package.json`]: JSON.stringify({
          version: '1.0.0',
          dependencies: {
            expo: 'canary',
          },
        }),
      },
      projectRoot
    );

    await expect(hasExpoCanaryAsync(projectRoot)).resolves.toBe(false);
  });

  it('returns true for canary version from installed package', async () => {
    vol.fromJSON(
      {
        [`node_modules/expo/package.json`]: JSON.stringify({
          version: '50.0.0-canary-20231130-c8a9bf9',
        }),
        // This is not a common use-case, but tests the priority of strategies
        [`package.json`]: JSON.stringify({
          version: '1.0.0',
          dependencies: {
            expo: '1.0.0',
          },
        }),
      },
      projectRoot
    );

    await expect(hasExpoCanaryAsync(projectRoot)).resolves.toBe(true);
  });

  it('returns false for stable version from package.json', async () => {
    vol.fromJSON(
      {
        [`package.json`]: JSON.stringify({
          version: '1.0.0',
          dependencies: {
            expo: '1.0.0',
          },
        }),
      },
      projectRoot
    );

    await expect(hasExpoCanaryAsync(projectRoot)).resolves.toBe(false);
  });

  it('returns true for canary version from package.json', async () => {
    vol.fromJSON(
      {
        [`package.json`]: JSON.stringify({
          version: '1.0.0',
          dependencies: {
            expo: 'canary',
          },
        }),
      },
      projectRoot
    );

    await expect(hasExpoCanaryAsync(projectRoot)).resolves.toBe(true);
  });
});
