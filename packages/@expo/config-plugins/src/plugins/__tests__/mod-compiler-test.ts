import fs from 'fs';
import { vol } from 'memfs';

import rnFixture from './fixtures/react-native-project';
import { ExportedConfig, Mod } from '../../Plugin.types';
import { compileModsAsync, sortMods } from '../mod-compiler';
import { withMod } from '../withMod';

jest.mock('fs');

describe(compileModsAsync, () => {
  const projectRoot = '/app';
  const originalWarn = console.warn;
  beforeEach(async () => {
    console.warn = jest.fn();
    // Trick XDL Info.plist reading
    Object.defineProperty(process, 'platform', {
      value: 'not-darwin',
    });
    vol.fromJSON(rnFixture, projectRoot);
  });

  afterEach(() => {
    console.warn = originalWarn;
    vol.reset();
  });

  it('skips missing providers in loose mode', async () => {
    // A basic plugin exported from an app.json
    let exportedConfig: ExportedConfig = {
      name: 'app',
      slug: '',
      mods: null,
    };

    const action: Mod<any> = jest.fn((props) => {
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
    expect(Object.values(config.mods.ios).every((value) => typeof value === 'function')).toBe(true);

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
    expect(Object.values(config.mods.ios).every((value) => typeof value === 'function')).toBe(true);
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

    expect(internalValue).toBe('$(DEVELOPMENT_LANGUAGE)');

    // App config should have been modified
    expect(config.name).toBe('app');
    expect(config.ios.infoPlist).toBeDefined();
    // No entitlements mod means this won't be defined
    expect(config.ios.entitlements).toBeUndefined();

    // Plugins should all be functions
    expect(Object.values(config.mods.ios).every((value) => typeof value === 'function')).toBe(true);

    // Test that the actual file was rewritten.
    const data = await fs.promises.readFile('/app/ios/HelloWorld/Info.plist', 'utf8');
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

describe(sortMods, () => {
  it('should sort the commands based on precedences', () => {
    const commands = [
      ['command1', { data: 'command1Data' }],
      ['command2', { data: 'command2Data' }],
      ['command3', { data: 'command3Data' }],
    ];
    const precedences = {
      command1: 2,
      command2: 1,
      command3: 3,
    };

    const sortedCommands = sortMods(commands, precedences);

    expect(sortedCommands).toEqual([
      ['command2', { data: 'command2Data' }],
      ['command1', { data: 'command1Data' }],
      ['command3', { data: 'command3Data' }],
    ]);
  });

  it('should handle commands with missing precedences', () => {
    const commands = [
      ['command1', { data: 'command1Data' }],
      ['command2', { data: 'command2Data' }],
      ['command3', { data: 'command3Data' }],
      ['command4', { data: 'command4Data' }],
      ['command5', { data: 'command5Data' }],
      ['command6', { data: 'command6Data' }],
    ];
    const precedences = {
      command1: 2,
      command3: 3,
    };

    const sortedCommands = sortMods(commands, precedences);

    expect(sortedCommands).toEqual([
      ['command2', { data: 'command2Data' }],
      ['command4', { data: 'command4Data' }],
      ['command5', { data: 'command5Data' }],
      ['command6', { data: 'command6Data' }],
      ['command1', { data: 'command1Data' }],
      ['command3', { data: 'command3Data' }],
    ]);
  });

  it('should handle empty commands array', () => {
    const commands: [string, any][] = [];
    const precedences = {
      command1: 2,
      command2: 1,
      command3: 3,
    };

    const sortedCommands = sortMods(commands, precedences);

    expect(sortedCommands).toEqual([]);
  });

  it('should deduplicate commands by keys and keep the first occurrence', () => {
    const commands = [
      ['command1', { data: 'command1Data' }],
      ['command2', { data: 'command2Data' }],
      ['command3', { data: 'command3Data' }],
      ['command3', { data: 'command4Data' }],
      ['command3', { data: 'command5Data' }],
      ['command3', { data: 'command6Data' }],
    ];
    const precedences = {
      command2: 2,
    };

    const sortedCommands = sortMods(commands, precedences);

    expect(sortedCommands).toEqual([
      ['command1', { data: 'command1Data' }],
      ['command3', { data: 'command3Data' }],
      ['command2', { data: 'command2Data' }],
    ]);
  });

  it('should sort negative precedence values at first', () => {
    const commands = [
      ['command1', { data: 'command1Data' }],
      ['command2', { data: 'command2Data' }],
      ['command3', { data: 'command3Data' }],
      ['command4', { data: 'command4Data' }],
      ['command5', { data: 'command5Data' }],
      ['command6', { data: 'command6Data' }],
    ];
    const precedences = {
      command2: 1,
      command3: 2,
      command4: -2,
      command5: -1,
    };

    const sortedCommands = sortMods(commands, precedences);

    expect(sortedCommands).toEqual([
      ['command4', { data: 'command4Data' }],
      ['command5', { data: 'command5Data' }],
      ['command1', { data: 'command1Data' }],
      ['command6', { data: 'command6Data' }],
      ['command2', { data: 'command2Data' }],
      ['command3', { data: 'command3Data' }],
    ]);
  });
});
