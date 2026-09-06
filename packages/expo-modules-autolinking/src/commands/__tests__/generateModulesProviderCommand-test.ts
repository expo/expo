import type { ModuleDescriptorIos } from '../../types';
import { warnAboutUnresolvedPackages } from '../generateModulesProviderCommand';

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

describe(warnAboutUnresolvedPackages, () => {
  it('stays quiet when every expected package is present in the resolution', () => {
    expect(() =>
      warnAboutUnresolvedPackages(
        ['expo-haptics', 'expo-dev-menu'],
        [
          descriptor({ modules: [{ name: null, class: 'HapticsModule' }] }),
          descriptor({ packageName: 'expo-dev-menu', reactDelegateHandlers: ['DevMenuHandler'] }),
        ]
      )
    ).not.toThrow();
  });

  it('stays quiet about a package that resolves with nothing to link', () => {
    // Every package whose pods support the target is passed here, so the ones carrying no modules
    // at all are expected members of the list rather than a sign of stale state.
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    warnAboutUnresolvedPackages(['expo-haptics'], [descriptor({})]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns without throwing when an expected package is missing from the resolution', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    expect(() => warnAboutUnresolvedPackages(['expo-haptics'], [])).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('expo-haptics'));
  });

  it('ignores resolved packages that were not expected', () => {
    expect(() => warnAboutUnresolvedPackages([], [descriptor({})])).not.toThrow();
  });
});
