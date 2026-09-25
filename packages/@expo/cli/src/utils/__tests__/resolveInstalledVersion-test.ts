import { vol } from 'memfs';
import resolveFrom from 'resolve-from';

import { resolveInstalledVersion } from '../resolveInstalledVersion';

afterEach(() => {
  vol.reset();
});

const projectRoot = '/fake/project';

describe(resolveInstalledVersion, () => {
  it('returns the version from an installed package', () => {
    vol.fromJSON(
      { 'node_modules/expo/package.json': JSON.stringify({ version: '1.0.0' }) },
      projectRoot
    );

    expect(resolveInstalledVersion(projectRoot, 'expo')).toBe('1.0.0');
  });

  it('falls back to the path in the ERR_PACKAGE_PATH_NOT_EXPORTED error message', () => {
    // Mock the Node error thrown when a package's `exports` map doesn't expose `./package.json`.
    jest.mocked(resolveFrom).mockImplementationOnce(() => {
      const error: any = new Error(
        `Package subpath './package.json' is not defined by "exports" in ${projectRoot}/node_modules/expo/package.json`
      );
      error.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
      throw error;
    });

    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({
          version: '2.0.0',
          exports: { '.': { require: './index.js' } },
        }),
      },
      projectRoot
    );

    expect(resolveInstalledVersion(projectRoot, 'expo')).toBe('2.0.0');
  });

  it('returns null when the package is not installed', () => {
    vol.fromJSON({}, projectRoot);

    expect(resolveInstalledVersion(projectRoot, 'expo')).toBeNull();
  });

  it('returns null when the package.json is malformed', () => {
    vol.fromJSON({ 'node_modules/expo/package.json': '{ not json' }, projectRoot);

    expect(resolveInstalledVersion(projectRoot, 'expo')).toBeNull();
  });

  it('returns null when the package.json has no version field', () => {
    vol.fromJSON(
      { 'node_modules/expo/package.json': JSON.stringify({ name: 'expo' }) },
      projectRoot
    );

    expect(resolveInstalledVersion(projectRoot, 'expo')).toBeNull();
  });
});
