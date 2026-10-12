import { vol } from 'memfs';
import resolveFrom from 'resolve-from';

import { getPkgVersion } from '../getPkgVersion';

const projectRoot = '/project';

afterEach(() => {
  vol.reset();
  jest.mocked(resolveFrom.silent).mockReset();
});

describe(getPkgVersion, () => {
  it('reads the package root manifest when the entry sits under a nested package.json', () => {
    vol.fromJSON(
      {
        'node_modules/react-native-worklets/package.json': JSON.stringify({
          name: 'react-native-worklets',
          version: '0.13.0',
          main: './lib/module/index',
        }),
        'node_modules/react-native-worklets/lib/module/package.json': JSON.stringify({
          type: 'module',
        }),
        'node_modules/react-native-worklets/lib/module/index.js': '',
      },
      projectRoot
    );
    jest
      .mocked(resolveFrom.silent)
      .mockReturnValueOnce('/project/node_modules/react-native-worklets/lib/module/index.js');

    expect(getPkgVersion(projectRoot, 'react-native-worklets')).toBe('0.13.0');
  });

  it('reads the manifest of a package that exports no main entry', () => {
    vol.fromJSON(
      {
        'node_modules/@babel/runtime/package.json': JSON.stringify({
          name: '@babel/runtime',
          version: '7.29.7',
          exports: { './package.json': './package.json', './helpers/*': './helpers/*.js' },
        }),
      },
      projectRoot
    );
    jest.mocked(resolveFrom.silent).mockReturnValueOnce(undefined);

    expect(getPkgVersion(projectRoot, '@babel/runtime')).toBe('7.29.7');
  });

  it('reads the manifest of a package whose exports hide its package.json', () => {
    vol.fromJSON(
      {
        'node_modules/sass/package.json': JSON.stringify({
          name: 'sass',
          version: '1.105.1',
          exports: { '.': './sass.node.js' },
        }),
        'node_modules/sass/sass.node.js': '',
      },
      projectRoot
    );
    jest.mocked(resolveFrom.silent).mockReturnValueOnce('/project/node_modules/sass/sass.node.js');

    expect(getPkgVersion(projectRoot, 'sass')).toBe('1.105.1');
  });

  it('returns null for a package that is not installed', () => {
    vol.fromJSON({ 'package.json': JSON.stringify({ name: 'app' }) }, projectRoot);

    expect(getPkgVersion(projectRoot, 'react-native-reanimated')).toBeNull();
  });

  it('returns null when the manifest has no version string', () => {
    vol.fromJSON(
      {
        'node_modules/versionless/package.json': JSON.stringify({ name: 'versionless' }),
        'node_modules/versionless/index.js': '',
      },
      projectRoot
    );
    jest
      .mocked(resolveFrom.silent)
      .mockReturnValueOnce('/project/node_modules/versionless/index.js');

    expect(getPkgVersion(projectRoot, 'versionless')).toBeNull();
  });
});
