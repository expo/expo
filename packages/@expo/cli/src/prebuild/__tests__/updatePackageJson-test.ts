import chalk from 'chalk';
import { vol } from 'memfs';

import * as Log from '../../log';
import { isModuleSymlinked } from '../../utils/isModuleSymlinked';
import {
  hashForDependencyMap,
  updatePkgDependencies,
  updatePackageJSONAsync,
} from '../updatePackageJson';

jest.mock('../../utils/isModuleSymlinked');
jest.mock('../../log');

describe(hashForDependencyMap, () => {
  it(`dependencies in any order hash to the same value`, () => {
    expect(hashForDependencyMap({ a: '1.0.0', b: 2, c: '~3.0' })).toBe(
      hashForDependencyMap({ c: '~3.0', b: 2, a: '1.0.0' })
    );
  });
});

describe(updatePackageJSONAsync, () => {
  beforeAll(() => {
    (isModuleSymlinked as any).mockImplementation(() => false);
  });

  it(`has no changes`, async () => {
    vol.fromJSON({}, '/');

    expect(
      await updatePackageJSONAsync('/', {
        pkg: {
          scripts: {
            ios: 'expo run:ios',
            android: 'expo run:android',
          },
          dependencies: {
            expo: '1.0.0',
            'react-native': '0.1.0',
          },
        },
        templateDirectory: '/template',
        templatePkg: {
          dependencies: {
            expo: '1.0.0',
            'react-native': '0.1.0',
            'expo-status-bar': '1.0.0',
            'expo-splash-screen': '1.0.0',
          },
          devDependencies: {
            'no-copy': '1.0.0',
          },
        },
      })
    ).toEqual({
      changedDependencies: [],
      scriptsChanged: false,
    });

    expect(vol.toJSON()).toEqual({});
  });

  it(`injects custom scripts`, async () => {
    vol.fromJSON({}, '/');

    expect(
      await updatePackageJSONAsync('/', {
        pkg: {
          scripts: {
            ios: 'expo start --ios',
            android: 'expo start --android',
          },
          dependencies: {
            expo: '1.0.0',
            'react-native': '0.1.0',
          },
        },
        templateDirectory: '/template',
        templatePkg: {
          dependencies: {
            expo: '1.0.0',
            'react-native': '0.1.0',
            'expo-status-bar': '1.0.0',
            'expo-splash-screen': '1.0.0',
          },
          devDependencies: {
            'no-copy': '1.0.0',
          },
        },
      })
    ).toEqual({
      changedDependencies: [],
      scriptsChanged: true,
    });

    expect(JSON.parse(vol.toJSON()['/package.json'])).toEqual({
      dependencies: { expo: '1.0.0', 'react-native': '0.1.0' },
      scripts: { android: 'expo run:android', ios: 'expo run:ios' },
    });
  });

  // TODO: We should change this functionality in the future to either require a custom dependency field
  // or just not exist.
  it(`updates dependencies if the template adds custom values`, async () => {
    vol.fromJSON({}, '/');

    expect(
      await updatePackageJSONAsync('/', {
        pkg: {
          scripts: {
            ios: 'expo run:ios',
            android: 'expo run:android',
          },
          dependencies: {
            expo: '1.0.0',
            'react-native': '0.1.0',
          },
        },
        templateDirectory: '/template',
        templatePkg: {
          dependencies: {
            unexpected: '1.0.0',
            expo: '1.0.0',
            'react-native': '0.1.0',
            'expo-status-bar': '1.0.0',
            'expo-splash-screen': '1.0.0',
          },
          devDependencies: {
            'no-copy': '1.0.0',
          },
        },
      })
    ).toEqual({
      changedDependencies: ['unexpected'],
      scriptsChanged: false,
    });

    expect(JSON.parse(vol.toJSON()['/package.json'])).toEqual({
      dependencies: { unexpected: '1.0.0', expo: '1.0.0', 'react-native': '0.1.0' },
      scripts: { android: 'expo run:android', ios: 'expo run:ios' },
    });
  });
});

describe(updatePkgDependencies, () => {
  beforeAll(() => {
    (isModuleSymlinked as any).mockImplementation(() => false);
  });
  const requiredPackages = {
    react: 'version-from-template-required-1',
    'react-native': 'version-from-template-required-1',
    'react-native-unimodules': 'version-from-template-required-1',
    'expo-updates': 'version-from-template-required-1',
  };

  test('default bahaviour', () => {
    const pkg = {
      dependencies: {
        'react-native': 'version-from-project',
        'optional-package': 'version-from-project-1',
        'optional-package-3': 'version-from-project-3',
      },
      devDependencies: {},
    };
    updatePkgDependencies('fake path', {
      templatePkg: {
        dependencies: {
          ...requiredPackages,
          'optional-package': 'version-from-template-1',
          'optional-package-2': 'version-from-template-2',
        },
        devDependencies: {},
      },
      pkg,
    });
    expect(pkg.dependencies).toStrictEqual({
      ...requiredPackages,
      'react-native': 'version-from-project', // add-only package, do not overwrite
      'optional-package': 'version-from-project-1',
      'optional-package-2': 'version-from-template-2',
      'optional-package-3': 'version-from-project-3',
    });
  });
  test('with skipDependencyUpdate', () => {
    const pkg = {
      dependencies: {
        'react-native': 'version-from-project',
        'optional-package': 'version-from-project-1',
        'optional-package-3': 'version-from-project-3',
      },
      devDependencies: {},
    };
    updatePkgDependencies('fake path', {
      pkg,
      templatePkg: {
        dependencies: {
          ...requiredPackages,
          'react-native': 'version-from-project',
          'optional-package': 'version-from-template-1',
          'optional-package-2': 'version-from-template-2',
        },
        devDependencies: {},
      },
      skipDependencyUpdate: ['react-native'],
    });
    expect(pkg.dependencies).toStrictEqual({
      ...requiredPackages,
      'react-native': 'version-from-project',
      'optional-package': 'version-from-project-1',
      'optional-package-2': 'version-from-template-2',
      'optional-package-3': 'version-from-project-3',
    });
  });
  test('test expo-updates not required by default in sdk 44', () => {
    const sdk44RequiredPackages = {
      react: 'version-from-template-required-1',
      'react-native': 'version-from-template-required-1',
    };
    const pkg = {
      dependencies: {
        'react-native': 'version-from-project',
        'optional-package': 'version-from-project-1',
        'optional-package-3': 'version-from-project-3',
      },
      devDependencies: {},
    };
    updatePkgDependencies('fake path', {
      templatePkg: {
        dependencies: {
          ...sdk44RequiredPackages,
          'optional-package': 'version-from-template-1',
          'optional-package-2': 'version-from-template-2',
        },
        devDependencies: {},
      },
      pkg,
    });
    expect(pkg.dependencies).toStrictEqual({
      ...sdk44RequiredPackages,
      'react-native': 'version-from-project', // add-only package, do not overwrite
      'optional-package': 'version-from-project-1',
      'optional-package-2': 'version-from-template-2',
      'optional-package-3': 'version-from-project-3',
    });
  });
  test('does not overwrite add-only packages when defined', () => {
    const pkg = {
      dependencies: {
        expo: 'version-from-project',
        'react-native': 'version-from-project',
      },
      devDependencies: {},
    };
    updatePkgDependencies('fake path', {
      templatePkg: {
        dependencies: {
          ...requiredPackages,
          expo: 'version-from-template',
        },
        devDependencies: {},
      },
      pkg,
    });
    expect(pkg.dependencies).toStrictEqual({
      ...requiredPackages,
      'react-native': 'version-from-project', // add-only package, do not overwrite
      expo: 'version-from-project',
    });
    expect(Log.warn).toBeCalledWith(
      expect.stringContaining(
        `instead of recommended ${[
          `expo@version-from-template`,
          `react-native@version-from-template-required-1`,
        ]
          .map((dep) => chalk.bold(dep))
          .join(', ')}`
      )
    );
  });
});
