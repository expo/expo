import type { ExpoConfig } from 'expo/config';
import type { ExportedConfig, Mod } from 'expo/config-plugins';

import withLocation from '../withLocation';

function fakeConfig(): ExpoConfig {
  return { name: 'test', slug: 'test' };
}

async function evalIosModAsync<T>(
  config: ExportedConfig,
  mod: Mod<T> | undefined,
  modResults: T
): Promise<T> {
  if (!mod) {
    throw new Error('Expected the mod to be registered');
  }
  const result = await mod({
    ...config,
    modResults,
    modRequest: {
      projectRoot: '/app',
      platformProjectRoot: '/app/ios',
      modName: 'test',
      platform: 'ios',
      introspect: true,
    },
    modRawConfig: config,
  });
  return result.modResults;
}

describe('withLocation iOS motion configuration', () => {
  it('sets expo.location.motionActivityEnabled in podfile properties when motionUsagePermission is false', async () => {
    const config: ExportedConfig = withLocation(fakeConfig(), { motionUsagePermission: false });
    const properties = await evalIosModAsync(config, config.mods?.ios?.podfileProperties, {});
    expect(properties['expo.location.motionActivityEnabled']).toBe('false');
  });

  it('removes a stale expo.location.motionActivityEnabled left by a previous prebuild without --clean when motionUsagePermission is a string', async () => {
    const config: ExportedConfig = withLocation(fakeConfig(), {
      motionUsagePermission: 'Allow motion',
    });
    const properties = await evalIosModAsync(config, config.mods?.ios?.podfileProperties, {
      'expo.location.motionActivityEnabled': 'false',
    });
    expect(properties['expo.location.motionActivityEnabled']).toBeUndefined();
  });

  it('removes a stale expo.location.motionActivityEnabled left by a previous prebuild without --clean when motionUsagePermission is not provided', async () => {
    const config: ExportedConfig = withLocation(fakeConfig(), {});
    const properties = await evalIosModAsync(config, config.mods?.ios?.podfileProperties, {
      'expo.location.motionActivityEnabled': 'false',
    });
    expect(properties['expo.location.motionActivityEnabled']).toBeUndefined();
  });

  it('sets NSMotionUsageDescription to the provided message', async () => {
    const config: ExportedConfig = withLocation(fakeConfig(), {
      motionUsagePermission: 'Allow motion',
    });
    const infoPlist = await evalIosModAsync(config, config.mods?.ios?.infoPlist, {});
    expect(infoPlist.NSMotionUsageDescription).toBe('Allow motion');
  });

  it('sets the default NSMotionUsageDescription when not provided', async () => {
    const config: ExportedConfig = withLocation(fakeConfig(), {});
    const infoPlist = await evalIosModAsync(config, config.mods?.ios?.infoPlist, {});
    expect(infoPlist.NSMotionUsageDescription).toBe(
      'Allow $(PRODUCT_NAME) to detect your current motion activity'
    );
  });

  it('deletes NSMotionUsageDescription when motionUsagePermission is false, even when supplied through ios.infoPlist', async () => {
    const config: ExportedConfig = withLocation(
      { ...fakeConfig(), ios: { infoPlist: { NSMotionUsageDescription: 'My own message' } } },
      { motionUsagePermission: false }
    );
    const infoPlist = await evalIosModAsync(config, config.mods?.ios?.infoPlist, {
      NSMotionUsageDescription: 'My own message',
    });
    expect(infoPlist.NSMotionUsageDescription).toBeUndefined();
  });
});
