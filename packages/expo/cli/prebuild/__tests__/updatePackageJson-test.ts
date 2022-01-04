import { getPackageJson } from '@expo/config';

import { isModuleSymlinked } from '../../utils/isModuleSymlinked';
import {
  hashForDependencyMap,
  isPkgMainExpoAppEntry,
  shouldDeleteMainField,
  updatePackageJSONDependencies,
} from '../updatePackageJson';

jest.mock('@expo/config');
jest.mock('../../utils/isModuleSymlinked');

describe(hashForDependencyMap, () => {
  it(`dependencies in any order hash to the same value`, () => {
    expect(hashForDependencyMap({ a: '1.0.0', b: 2, c: '~3.0' })).toBe(
      hashForDependencyMap({ c: '~3.0', b: 2, a: '1.0.0' })
    );
  });
});

describe(shouldDeleteMainField, () => {
  it(`should delete non index field`, () => {
    expect(shouldDeleteMainField(null)).toBe(false);
    expect(shouldDeleteMainField()).toBe(false);
    expect(shouldDeleteMainField('expo/AppEntry')).toBe(true);
    // non-expo fields
    expect(shouldDeleteMainField('.src/other.js')).toBe(false);
    expect(shouldDeleteMainField('index.js')).toBe(false);
    expect(shouldDeleteMainField('index.ios.js')).toBe(false);
    expect(shouldDeleteMainField('index.ts')).toBe(false);
    expect(shouldDeleteMainField('./index')).toBe(false);
  });
});

describe(isPkgMainExpoAppEntry, () => {
  it(`matches expo app entry`, () => {
    expect(isPkgMainExpoAppEntry('./node_modules/expo/AppEntry.js')).toBe(true);
    expect(isPkgMainExpoAppEntry('./node_modules/expo/AppEntry')).toBe(true);
    expect(isPkgMainExpoAppEntry('expo/AppEntry.js')).toBe(true);
    expect(isPkgMainExpoAppEntry('expo/AppEntry')).toBe(true);
  });
  it(`doesn't match expo app entry`, () => {
    expect(isPkgMainExpoAppEntry()).toBe(false);
    expect(isPkgMainExpoAppEntry(null)).toBe(false);
    expect(isPkgMainExpoAppEntry('./expo/AppEntry')).toBe(false);
    expect(isPkgMainExpoAppEntry('./expo/AppEntry.js')).toBe(false);
  });
});

describe(updatePackageJSONDependencies, () => {
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
    (getPackageJson as any).mockImplementation(() => ({
      dependencies: {
        ...requiredPackages,
        'optional-package': 'version-from-template-1',
        'optional-package-2': 'version-from-template-2',
      },
      devDependencies: {},
    }));
    const pkg = {
      dependencies: {
        'react-native': 'version-from-project',
        'optional-package': 'version-from-project-1',
        'optional-package-3': 'version-from-project-3',
      },
      devDependencies: {},
    };
    updatePackageJSONDependencies({ projectRoot: 'fake path', tempDir: 'fake path', pkg });
    expect(pkg.dependencies).toStrictEqual({
      ...requiredPackages,
      'optional-package': 'version-from-project-1',
      'optional-package-2': 'version-from-template-2',
      'optional-package-3': 'version-from-project-3',
    });
  });
  test('with skipDependencyUpdate', () => {
    (getPackageJson as any).mockImplementation(() => ({
      dependencies: {
        ...requiredPackages,
        'react-native': 'version-from-project',
        'optional-package': 'version-from-template-1',
        'optional-package-2': 'version-from-template-2',
      },
      devDependencies: {},
    }));
    const pkg = {
      dependencies: {
        'react-native': 'version-from-project',
        'optional-package': 'version-from-project-1',
        'optional-package-3': 'version-from-project-3',
      },
      devDependencies: {},
    };
    updatePackageJSONDependencies({
      projectRoot: 'fake path',
      tempDir: 'fake path',
      pkg,
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
    (getPackageJson as any).mockImplementation(() => ({
      dependencies: {
        ...sdk44RequiredPackages,
        'optional-package': 'version-from-template-1',
        'optional-package-2': 'version-from-template-2',
      },
      devDependencies: {},
    }));
    const pkg = {
      dependencies: {
        'react-native': 'version-from-project',
        'optional-package': 'version-from-project-1',
        'optional-package-3': 'version-from-project-3',
      },
      devDependencies: {},
    };
    updatePackageJSONDependencies({ projectRoot: 'fake path', tempDir: 'fake path', pkg });
    expect(pkg.dependencies).toStrictEqual({
      ...sdk44RequiredPackages,
      'optional-package': 'version-from-project-1',
      'optional-package-2': 'version-from-template-2',
      'optional-package-3': 'version-from-project-3',
    });
  });
});
