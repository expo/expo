import type { ExportedConfig, ModPlatform } from '@expo/config-plugins';
import { compileModsAsync } from '@expo/config-plugins';
import { getPrebuildConfigAsync } from '@expo/prebuild-config';

import { configureProjectAsync } from '../configureProjectAsync';

jest.mock('@expo/config-plugins', () => ({
  compileModsAsync: jest.fn(async (config) => config),
}));
jest.mock('@expo/prebuild-config', () => ({
  getPrebuildConfigAsync: jest.fn(),
}));
jest.mock('../../config/configAsync', () => ({
  logConfig: jest.fn(),
}));
jest.mock('../../utils/getOrPromptApplicationId', () => ({
  getOrPromptForBundleIdentifierAsync: jest.fn(async () => 'dev.expo.test'),
  getOrPromptForPackageAsync: jest.fn(async () => 'dev.expo.test'),
}));

const iosMods = { xcodeproj: jest.fn(), infoPlist: jest.fn() };

function mockPrebuildConfig() {
  jest.mocked(getPrebuildConfigAsync).mockResolvedValue({
    exp: { name: 'test', slug: 'test', mods: { ios: { ...iosMods } } },
  } as any);
}

/** The config that `configureProjectAsync` handed to the mod compiler. */
function compiledConfig(): ExportedConfig {
  const [call] = jest.mocked(compileModsAsync).mock.calls;
  if (!call) {
    throw new Error('compileModsAsync was never called');
  }
  return call[0];
}

describe(configureProjectAsync, () => {
  beforeEach(() => {
    mockPrebuildConfig();
  });

  it(`copies the ios mods onto the tvos key when tvos is prebuilt`, async () => {
    await configureProjectAsync('/', { platforms: ['tvos' as ModPlatform] });

    const config = compiledConfig();
    expect(config.mods?.tvos).toEqual(config.mods?.ios);
    // A copy, not the same object, so the compiler can treat them independently.
    expect(config.mods?.tvos).not.toBe(config.mods?.ios);
  });

  it(`compiles only the requested platforms`, async () => {
    await configureProjectAsync('/', { platforms: ['tvos' as ModPlatform] });

    expect(compileModsAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ platforms: ['tvos'] })
    );
  });

  it(`leaves the tvos key alone when tvos is not prebuilt`, async () => {
    await configureProjectAsync('/', { platforms: ['ios'] });

    expect(compiledConfig().mods?.tvos).toBeUndefined();
  });

  it(`registers both keys when ios and tvos are prebuilt together`, async () => {
    await configureProjectAsync('/', { platforms: ['ios', 'tvos' as ModPlatform] });

    const config = compiledConfig();
    expect(Object.keys(config.mods ?? {})).toEqual(expect.arrayContaining(['ios', 'tvos']));
    expect(compileModsAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ platforms: ['ios', 'tvos'] })
    );
  });
});
