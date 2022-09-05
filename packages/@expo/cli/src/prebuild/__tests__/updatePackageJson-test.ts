import { isModuleSymlinked } from '../../utils/isModuleSymlinked';
import { hashForDependencyMap, updatePkgDependencies } from '../updatePackageJson';

jest.mock('../../utils/isModuleSymlinked');

describe(hashForDependencyMap, () => {
  it(`dependencies in any order hash to the same value`, () => {
    expect(hashForDependencyMap({ a: '1.0.0', b: 2, c: '~3.0' })).toBe(
      hashForDependencyMap({ c: '~3.0', b: 2, a: '1.0.0' })
    );
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
      'optional-package': 'version-from-project-1',
      'optional-package-2': 'version-from-template-2',
      'optional-package-3': 'version-from-project-3',
    });
  });
});
