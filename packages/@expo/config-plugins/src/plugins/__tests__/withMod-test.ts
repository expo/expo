import { ExportedConfig, Mod } from '../../Plugin.types';
import { evalModsAsync } from '../mod-compiler';
import { withBaseMod, withMod } from '../withMod';

describe(withMod, () => {
  it('compiles mods', async () => {
    // A basic plugin exported from an app.json
    const exportedConfig: ExportedConfig = { name: 'app', slug: '', mods: null };

    const action: Mod<any> = jest.fn(props => {
      // Capitalize app name
      props.name = (props.name as string).toUpperCase();
      return props;
    });
    // Apply mod
    let config = withBaseMod<any>(exportedConfig, {
      platform: 'android',
      mod: 'custom',
      isProvider: true,
      action,
    });

    // Compile plugins generically
    config = await evalModsAsync(config, { projectRoot: '/' });

    // Plugins should all be functions
    expect(Object.values(config.mods.android).every(value => typeof value === 'function')).toBe(
      true
    );

    delete config.mods;

    // App config should have been modified
    expect(config).toStrictEqual({
      name: 'APP',
      slug: '',
    });

    expect(action).toBeCalledWith(config);
  });
  it('asserts multiple providers added', async () => {
    // Apply a provider mod.
    const config = withBaseMod<any>(
      { name: 'app', slug: '', mods: null },
      {
        platform: 'android',
        mod: 'custom',
        isProvider: true,
        action(props) {
          // Capitalize app name
          props.name = (props.name as string).toUpperCase();
          return props;
        },
      }
    );

    expect(() =>
      withBaseMod<any>(config, {
        platform: 'android',
        mod: 'custom',
        isProvider: true,
        action(props) {
          // Capitalize app name
          props.name = (props.name as string).toUpperCase();
          return props;
        },
      })
    ).toThrow(
      'Cannot set provider mod for "android.custom" because another is already being used.'
    );
  });
  it('throws when attempting to add a mod as the parent of a provider', async () => {
    // Apply a provider mod.
    const config = withBaseMod<any>(
      { name: 'app', slug: '' },
      {
        platform: 'android',
        mod: 'custom',
        isProvider: true,
        action(props) {
          // Capitalize app name
          props.name = (props.name as string).toUpperCase();
          return props;
        },
      }
    );

    expect(() =>
      withMod<any>(config, {
        platform: 'android',
        mod: 'custom',
        action(props) {
          // Capitalize app name
          props.name = (props.name as string).toUpperCase();
          return props;
        },
      })
    ).toThrow(
      'Cannot add mod to "android.custom" because the provider has already been added. Provider must be the last mod added.'
    );
  });
});
