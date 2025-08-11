import { checkLibraries } from '../../utils/reactNativeDirectoryApi';
import {
  DEFAULT_PACKAGES_TO_IGNORE,
  filterPackages,
  ReactNativeDirectoryCheck,
} from '../ReactNativeDirectoryCheck';

jest.mock('../../utils/reactNativeDirectoryApi', () => ({
  checkLibraries: jest.fn().mockResolvedValue(null),
}));

describe('filterPackages', () => {
  it('returns all packages if no ignored packages are provided', () => {
    expect(filterPackages(['a', 'b', 'c'], [])).toEqual(['a', 'b', 'c']);
  });

  it('filters packages by regex', () => {
    expect(filterPackages(['a', 'b', 'c'], [/a/])).toEqual(['b', 'c']);
  });

  it('filters packages by string', () => {
    expect(filterPackages(['a', 'b', 'c'], ['a'])).toEqual(['b', 'c']);
  });

  it('filters predefined packages to ignore', () => {
    expect(
      filterPackages(
        [
          'react-native',
          'babel-runtime',
          '@expo/metro-runtime',
          '@expo-google-fonts/inter',
          '@types/lodash',
        ],
        DEFAULT_PACKAGES_TO_IGNORE
      )
    ).toEqual([]);
  });
});

const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '50.0.0',
  },
  projectRoot: '/root/project',
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('ReactNativeDirectoryCheck', () => {
  it('returns errors as expected', async () => {
    jest.mocked(checkLibraries).mockResolvedValueOnce({
      unmaintained: { unmaintained: true, newArchitecture: 'untested' },
      unsupported: { unmaintained: false, newArchitecture: 'unsupported' },
      working: { unmaintained: false, newArchitecture: 'supported' },
    });

    const check = new ReactNativeDirectoryCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          unmaintained: '*',
          unsupported: '*',
          working: '*',
        },
      },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toMatchInlineSnapshot(`
      [
        "The following issues were found when validating your dependencies against React Native Directory:",
        "  Unsupported on New Architecture: unsupported",
        "  Untested on New Architecture: unmaintained",
        "  Unmaintained: unmaintained",
      ]
    `);
  });

  it('outputs unknown libraries when other issues were found', async () => {
    jest.mocked(checkLibraries).mockResolvedValueOnce({
      working: { unmaintained: false, newArchitecture: 'supported' },
      unsupported: { unmaintained: false, newArchitecture: 'unsupported' },
    });

    const check = new ReactNativeDirectoryCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          unknown: '*', // NOTE: This library isn't in the result above
          unsupported: '*',
          working: '*',
        },
      },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toMatchInlineSnapshot(`
      [
        "The following issues were found when validating your dependencies against React Native Directory:",
        "  Unsupported on New Architecture: unsupported",
        "  No metadata available: unknown",
      ]
    `);
  });

  it('success and no errors if only unknown libraries are in the result', async () => {
    jest.mocked(checkLibraries).mockResolvedValueOnce({
      working: { unmaintained: false, newArchitecture: 'supported' },
    });

    const check = new ReactNativeDirectoryCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          unknown: '*', // NOTE: This library isn't in the result above
          working: '*',
        },
      },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toEqual([]);
  });
});
