import {
  getAutolinkedPackagesAsync,
  resolvePackagesList,
  shouldSkipAutoPlugin,
} from '../getAutolinkedPackages';

jest.mock('expo/internal/unstable-autolinking-exports', () => ({
  makeCachedDependenciesLinker: jest.fn(() => ({})),
  scanExpoModuleResolutionsForPlatform: jest.fn(async () => ({ 'expo-camera': {} })),
}));

describe(getAutolinkedPackagesAsync, () => {
  it(`falls back to the expo package resolved from prebuild-config`, async () => {
    await expect(getAutolinkedPackagesAsync('/path/to/project-without-expo')).resolves.toEqual([
      'expo-camera',
    ]);
  });
});

describe(resolvePackagesList, () => {
  it(`resolves a list of plugins`, () => {
    expect(
      resolvePackagesList([
        {
          'expo-camera': {},
        },
        {
          'expo-location': {},
          'expo-camera': {},
          'react-native-camera': {},
        },
      ])
    ).toStrictEqual(['expo-camera', 'expo-location', 'react-native-camera']);
  });
});

describe(shouldSkipAutoPlugin, () => {
  it(`skips auto plugins when not autolinked`, () => {
    expect(
      shouldSkipAutoPlugin(
        {
          _internal: {
            autolinkedModules: [
              // Because the package isn't autolinked, but the array is defined, we should skip auto applying plugins.
            ],
          },
        },
        'foobar'
      )
    ).toBe(true);
    expect(
      shouldSkipAutoPlugin(
        {
          _internal: {
            autolinkedModules: [],
          },
        },
        ['foobar', null]
      )
    ).toBe(true);
  });

  it(`allows auto plugins when autolinking is not checked`, () => {
    expect(
      shouldSkipAutoPlugin(
        {
          _internal: {
            // By omitting the `autolinkedModules` we know that the config isn't checking for autolinking.
          },
        },
        'foobar'
      )
    ).toBe(false);
  });

  it(`allows plugins when they are autolinked`, () => {
    expect(
      shouldSkipAutoPlugin(
        {
          _internal: {
            autolinkedModules: ['foobar'],
          },
        },
        'foobar'
      )
    ).toBe(false);

    expect(
      shouldSkipAutoPlugin(
        {
          _internal: {
            autolinkedModules: ['other', 'foobar'],
          },
        },
        ['foobar', null]
      )
    ).toBe(false);
  });

  it(`cannot validate functions`, () => {
    expect(
      shouldSkipAutoPlugin(
        {
          _internal: {
            autolinkedModules: ['foobar'],
          },
        },
        [(c) => c, null]
      )
    ).toBe(false);
  });
});
