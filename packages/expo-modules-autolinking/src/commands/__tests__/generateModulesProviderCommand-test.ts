import { vol } from 'memfs';

import type { ModuleDescriptorIos, SearchResults } from '../../types';
import { findPackagesMissingScannedModules } from '../generateModulesProviderCommand';

function descriptor(partial: Partial<ModuleDescriptorIos>): ModuleDescriptorIos {
  return {
    packageName: 'expo-haptics',
    pods: [],
    flags: undefined,
    modules: [],
    swiftModuleNames: [],
    appDelegateSubscribers: [],
    reactDelegateHandlers: [],
    debugOnly: false,
    ...partial,
  };
}

function searchResultsFor(
  packages: Record<string, { declaresAppleModules?: boolean }>
): SearchResults {
  return Object.fromEntries(
    Object.entries(packages).map(([packageName, { declaresAppleModules = false }]) => [
      packageName,
      {
        path: `/app/node_modules/${packageName}`,
        version: '1.0.0',
        config: { declaresAppleModules: () => declaresAppleModules },
      },
    ])
  ) as unknown as SearchResults;
}

const annotatedSource = '@ExpoModule("ExpoHaptics")\npublic class HapticsModule: Module {}\n';

afterEach(() => {
  vol.reset();
});

describe(findPackagesMissingScannedModules, () => {
  it('returns nothing when every expected package is present in the resolution', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    expect(
      findPackagesMissingScannedModules(
        ['expo-haptics', 'expo-dev-menu'],
        [
          descriptor({ modules: [{ name: null, class: 'HapticsModule' }] }),
          descriptor({
            packageName: 'expo-dev-menu',
            reactDelegateHandlers: ['DevMenuHandler'],
          }),
        ],
        true,
        searchResultsFor({ 'expo-haptics': {}, 'expo-dev-menu': {} })
      )
    ).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('accepts a package that resolves with nothing to link after a successful scan', () => {
    // Every package whose pods support the target is passed here, so the ones carrying no modules
    // at all are expected members of the list rather than a sign of stale state.
    vol.fromJSON({ '/app/node_modules/expo-haptics/ios/HapticsModule.swift': annotatedSource });
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    expect(
      findPackagesMissingScannedModules(
        ['expo-haptics'],
        [descriptor({})],
        true,
        searchResultsFor({ 'expo-haptics': {} })
      )
    ).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns an annotated package left empty by a failed scan', () => {
    vol.fromJSON({ '/app/node_modules/expo-haptics/ios/HapticsModule.swift': annotatedSource });
    expect(
      findPackagesMissingScannedModules(
        ['expo-haptics'],
        [descriptor({})],
        false,
        searchResultsFor({ 'expo-haptics': {} })
      )
    ).toEqual(['expo-haptics']);
  });

  it('ignores a package without annotated classes after a failed scan', () => {
    vol.fromJSON({
      '/app/node_modules/expo-modules-core/ios/ModuleHolder.swift': '/// See `@ExpoModule`.\n',
    });
    expect(
      findPackagesMissingScannedModules(
        ['expo-modules-core'],
        [descriptor({ packageName: 'expo-modules-core' })],
        false,
        searchResultsFor({ 'expo-modules-core': {} })
      )
    ).toEqual([]);
  });

  it('ignores a package that declares its modules after a failed scan', () => {
    // A declared list, even an empty one, opts the package out of scanning, so the failed scan
    // took nothing from it.
    vol.fromJSON({ '/app/node_modules/expo-haptics/ios/HapticsModule.swift': annotatedSource });
    expect(
      findPackagesMissingScannedModules(
        ['expo-haptics'],
        [descriptor({})],
        false,
        searchResultsFor({ 'expo-haptics': { declaresAppleModules: true } })
      )
    ).toEqual([]);
  });

  it('warns when an expected package is missing from the resolution', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    expect(
      findPackagesMissingScannedModules(['expo-haptics'], [], true, searchResultsFor({}))
    ).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^warning: .*expo-haptics/));
  });

  it('ignores resolved packages that were not expected', () => {
    expect(
      findPackagesMissingScannedModules([], [descriptor({})], false, searchResultsFor({}))
    ).toEqual([]);
  });
});
