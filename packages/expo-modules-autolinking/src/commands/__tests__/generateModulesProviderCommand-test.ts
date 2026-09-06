import type { ModuleDescriptorIos } from '../../types';
import { verifyPackagesHaveSomethingToLink } from '../generateModulesProviderCommand';

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

describe(verifyPackagesHaveSomethingToLink, () => {
  it('passes when every expected package has something to link', () => {
    expect(() =>
      verifyPackagesHaveSomethingToLink(
        ['expo-haptics', 'expo-dev-menu'],
        [
          descriptor({ modules: [{ name: null, class: 'HapticsModule' }] }),
          descriptor({ packageName: 'expo-dev-menu', reactDelegateHandlers: ['DevMenuHandler'] }),
        ]
      )
    ).not.toThrow();
  });

  it('throws when an expected package resolves with nothing to link', () => {
    // Membership in the expected list means the package had something to link at pod install
    // (that is the Ruby gate for `--packages`), so resolving to nothing now is always stale state:
    // a failed module scan or a config change. Building anyway would silently drop the modules.
    expect(() => verifyPackagesHaveSomethingToLink(['expo-haptics'], [descriptor({})])).toThrow(
      /expo-haptics.+pod install/s
    );
  });

  it('warns without throwing when an expected package is missing from the resolution', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    expect(() => verifyPackagesHaveSomethingToLink(['expo-haptics'], [])).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('expo-haptics'));
  });

  it('ignores resolved packages that were not expected', () => {
    expect(() => verifyPackagesHaveSomethingToLink([], [descriptor({})])).not.toThrow();
  });
});
