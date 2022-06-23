import { ExpoConfig } from '@expo/config-types';
import { vol } from 'memfs';

import { withEntitlementsPlist, withInfoPlist } from '../ios-plugins';
import { evalModsAsync } from '../mod-compiler';
import { withIosBaseMods } from '../withIosBaseMods';

jest.mock('fs');

describe('entitlements', () => {
  afterEach(() => {
    vol.reset();
  });

  it(`evaluates in dry run mode`, async () => {
    // Ensure this test runs in a blank file system
    vol.fromJSON({});
    let config: ExpoConfig = { name: 'bacon', slug: 'bacon' };
    config = withEntitlementsPlist(config, config => {
      config.modResults['haha'] = 'bet';
      return config;
    });

    // base mods must be added last
    config = withIosBaseMods(config, {
      saveToInternal: true,
      providers: {
        entitlements: {
          getFilePath() {
            return '';
          },
          async read() {
            return {};
          },
          async write() {},
        },
      },
    });
    config = await evalModsAsync(config, { projectRoot: '/', platforms: ['ios'] });

    expect(config.ios?.entitlements).toStrictEqual({
      haha: 'bet',
    });
    // @ts-ignore: mods are untyped
    expect(config.mods.ios.entitlements).toBeDefined();

    expect(config._internal.modResults.ios.entitlements).toBeDefined();

    // Ensure no files were written
    expect(vol.toJSON()).toStrictEqual({});
  });
});

describe('infoPlist', () => {
  afterEach(() => {
    vol.reset();
  });

  it(`evaluates in dry run mode`, async () => {
    // Ensure this test runs in a blank file system
    vol.fromJSON({});
    let config: ExpoConfig = { name: 'bacon', slug: 'bacon' };
    config = withInfoPlist(config, config => {
      config.modResults['haha'] = 'bet';
      return config;
    });

    // base mods must be added last
    config = withIosBaseMods(config, {
      saveToInternal: true,
      providers: {
        infoPlist: {
          getFilePath() {
            return '';
          },
          async read() {
            return {};
          },
          async write() {},
        },
      },
    });
    config = await evalModsAsync(config, { projectRoot: '/', platforms: ['ios'] });

    expect(config.ios?.infoPlist).toStrictEqual({
      haha: 'bet',
    });
    // @ts-ignore: mods are untyped
    expect(config.mods.ios.infoPlist).toBeDefined();

    expect(config._internal.modResults.ios.infoPlist).toBeDefined();

    // Ensure no files were written
    expect(vol.toJSON()).toStrictEqual({});
  });
});
