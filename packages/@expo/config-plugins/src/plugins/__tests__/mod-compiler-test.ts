import fs from 'fs';
import { vol } from 'memfs';

import { ExportedConfig, Mod } from '../../Plugin.types';
import { compileModsAsync } from '../mod-compiler';
import { withMod } from '../withMod';
import rnFixture from './fixtures/react-native-project';

jest.mock('fs');

describe(compileModsAsync, () => {
  const projectRoot = '/app';
  beforeEach(async () => {
    // Trick XDL Info.plist reading
    Object.defineProperty(process, 'platform', {
      value: 'not-darwin',
    });
    vol.fromJSON(rnFixture, projectRoot);
  });

  afterEach(() => {
    vol.reset();
  });

  it('skips missing providers in loose mode', async () => {
    // A basic plugin exported from an app.json
    let exportedConfig: ExportedConfig = {
      name: 'app',
      slug: '',
      mods: null,
    };

    const action: Mod<any> = jest.fn(props => {
      // Capitalize app name
      props.name = (props.name as string).toUpperCase();
      return props;
    });
    // Apply mod
    exportedConfig = withMod<any>(exportedConfig, {
      platform: 'android',
      mod: 'custom',
      action,
    });

    const config = await compileModsAsync(exportedConfig, {
      projectRoot,
      assertMissingModProviders: false,
    });

    expect(config.name).toBe('app');
    // Base mods are skipped when no mods are applied, these shouldn't be defined.
    expect(config.ios?.infoPlist).toBeUndefined();
    expect(config.ios?.entitlements).toBeUndefined();
    // Adds base mods
    expect(Object.values(config.mods.ios).every(value => typeof value === 'function')).toBe(true);

    expect(action).not.toBeCalled();
  });

  it('asserts missing providers', async () => {
    // A basic plugin exported from an app.json
    let exportedConfig: ExportedConfig = {
      name: 'app',
      slug: '',
      mods: null,
    };

    // Apply mod
    exportedConfig = withMod<any>(exportedConfig, {
      platform: 'android',
      mod: 'custom',
      action(config) {
        return config;
      },
    });

    await expect(
      compileModsAsync(exportedConfig, { projectRoot, assertMissingModProviders: true })
    ).rejects.toThrow(
      `Initial base modifier for "android.custom" is not a provider and therefore will not provide modResults to child mods`
    );
  });

  it('compiles with no mods', async () => {
    // A basic plugin exported from an app.json
    const exportedConfig: ExportedConfig = {
      name: 'app',
      slug: '',
      mods: null,
    };
    const config = await compileModsAsync(exportedConfig, { projectRoot });

    expect(config.name).toBe('app');
    // Base mods are skipped when no mods are applied, these shouldn't be defined.
    expect(config.ios?.infoPlist).toBeUndefined();
    expect(config.ios?.entitlements).toBeUndefined();
    // Adds base mods
    expect(Object.values(config.mods.ios).every(value => typeof value === 'function')).toBe(true);
  });

  it('compiles mods', async () => {
    // A basic plugin exported from an app.json
    let internalValue = '';
    const exportedConfig: ExportedConfig = {
      name: 'app',
      slug: '',
      mods: {
        ios: {
          async infoPlist(config) {
            // Store the incoming value
            internalValue = config.modResults.CFBundleDevelopmentRegion;
            // Modify the data
            config.modResults.CFBundleDevelopmentRegion =
              'CFBundleDevelopmentRegion-crazy-random-value';
            return config;
          },
        },
      },
    };

    // Apply mod plugin
    const config = await compileModsAsync(exportedConfig, { projectRoot });

    expect(internalValue).toBe('en');

    // App config should have been modified
    expect(config.name).toBe('app');
    expect(config.ios.infoPlist).toBeDefined();
    // No entitlements mod means this won't be defined
    expect(config.ios.entitlements).toBeUndefined();

    // Plugins should all be functions
    expect(Object.values(config.mods.ios).every(value => typeof value === 'function')).toBe(true);

    // Test that the actual file was rewritten.
    const data = await fs.promises.readFile('/app/ios/ReactNativeProject/Info.plist', 'utf8');
    expect(data).toMatch(/CFBundleDevelopmentRegion-crazy-random-value/);
  });

  for (const invalid of [[{}], null, 7]) {
    it(`throws on invalid mod results (${invalid})`, async () => {
      // A basic plugin exported from an app.json
      const exportedConfig: ExportedConfig = {
        name: 'app',
        slug: '',
        mods: {
          ios: {
            async infoPlist(config) {
              // Return an invalid config
              return invalid as any;
            },
          },
        },
      };

      // Apply mod plugin
      await expect(compileModsAsync(exportedConfig, { projectRoot })).rejects.toThrow(
        /Mod `mods.ios.infoPlist` evaluated to an object that is not a valid project config/
      );
    });
  }
});
