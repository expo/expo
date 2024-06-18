import { ExpoConfig } from '@expo/config-types';
import { glob } from 'glob';
import { vol } from 'memfs';
import path from 'path';

import { withEntitlementsPlist, withInfoPlist } from '../ios-plugins';
import { evalModsAsync } from '../mod-compiler';
import { getIosModFileProviders, withIosBaseMods } from '../withIosBaseMods';

jest.mock('fs');
jest.mock('glob');

describe('entitlements', () => {
  afterEach(() => {
    vol.reset();
  });

  it(`evaluates in dry run mode`, async () => {
    // Ensure this test runs in a blank file system
    vol.fromJSON({});
    let config: ExpoConfig = { name: 'bacon', slug: 'bacon' };
    config = withEntitlementsPlist(config, (config) => {
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

    expect(config._internal?.modResults.ios.entitlements).toBeDefined();

    // Ensure no files were written
    expect(vol.toJSON()).toStrictEqual({});
  });

  it('uses local entitlement files by default', async () => {
    // Create a fake project that can load entitlements
    vol.fromJSON({
      '/ios/HelloWorld/AppDelegate.mm': 'Fake AppDelegate.mm',
      '/ios/HelloWorld.xcodeproj/project.pbxproj': jest
        .requireActual<typeof import('fs')>('fs')
        .readFileSync(
          path.resolve(__dirname, './fixtures/project-files/ios/project.pbxproj'),
          'utf-8'
        ),
      '/ios/HelloWorld/HelloWorld.entitlements': jest
        .requireActual<typeof import('fs')>('fs')
        .readFileSync(
          path.resolve(__dirname, './fixtures/project-files/ios/project.entitlements'),
          'utf-8'
        ),
    });

    // Mock glob response to "find" the memfs files
    jest.mocked(glob.sync).mockImplementation((pattern) => {
      if (pattern === 'ios/**/*.xcodeproj') return ['/ios/HelloWorld.xcodeproj'];
      if (pattern === 'ios/*/AppDelegate.@(m|mm|swift)') return ['/ios/HelloWorld/AppDelegate.mm'];
      throw new Error('Unexpected glob pattern used in test');
    });

    // Create simple project config and config plugin chain
    let config: ExpoConfig = { name: 'bacon', slug: 'bacon' };
    config = withEntitlementsPlist(config, (config) => {
      config.modResults['haha'] = 'yes';
      return config;
    });

    // Base mod must be added last
    config = withIosBaseMods(config, {
      saveToInternal: true,
      providers: {
        // Use the default mod provider, that's the one we need to test
        entitlements: getIosModFileProviders().entitlements,
      },
    });
    config = await evalModsAsync(config, {
      projectRoot: '/',
      platforms: ['ios'],
    });

    // Check if the generated entitlements are merged with local entitlements
    expect(config.ios?.entitlements).toMatchInlineSnapshot(`
      {
        "aps-environment": "development",
        "com.apple.developer.applesignin": [
          "Default",
        ],
        "com.apple.developer.associated-domains": [
          "applinks:acme.com",
        ],
        "com.apple.developer.icloud-container-identifiers": [
          "iCloud.$(CFBundleIdentifier)",
        ],
        "com.apple.developer.icloud-services": [
          "CloudDocuments",
        ],
        "com.apple.developer.ubiquity-container-identifiers": [
          "iCloud.$(CFBundleIdentifier)",
        ],
        "com.apple.developer.ubiquity-kvstore-identifier": "$(TeamIdentifierPrefix)$(CFBundleIdentifier)",
        "haha": "yes",
      }
    `);
  });

  it('skips local entitlements files when ignoring existing native files', async () => {
    // Create a fake project that can load entitlements
    vol.fromJSON({
      '/ios/HelloWorld/AppDelegate.mm': 'Fake AppDelegate.mm',
      '/ios/HelloWorld.xcodeproj/project.pbxproj': jest
        .requireActual<typeof import('fs')>('fs')
        .readFileSync(
          path.resolve(__dirname, './fixtures/project-files/ios/project.pbxproj'),
          'utf-8'
        ),
      '/ios/HelloWorld/HelloWorld.entitlements': jest
        .requireActual<typeof import('fs')>('fs')
        .readFileSync(
          path.resolve(__dirname, './fixtures/project-files/ios/project.entitlements'),
          'utf-8'
        ),
    });

    // Mock glob response to "find" the memfs files
    jest.mocked(glob.sync).mockImplementation((pattern) => {
      if (pattern === 'ios/**/*.xcodeproj') return ['/ios/HelloWorld.xcodeproj'];
      if (pattern === 'ios/*/AppDelegate.@(m|mm|swift)') return ['/ios/HelloWorld/AppDelegate.mm'];
      throw new Error('Unexpected glob pattern used in test');
    });

    // Create simple project config and config plugin chain
    let config: ExpoConfig = { name: 'bacon', slug: 'bacon' };
    config = withEntitlementsPlist(config, (config) => {
      config.modResults['haha'] = 'yes';
      return config;
    });

    // Base mod must be added last
    config = withIosBaseMods(config, {
      saveToInternal: true,
      providers: {
        // Use the default mod provider, that's the one we need to test
        entitlements: getIosModFileProviders().entitlements,
      },
    });
    config = await evalModsAsync(config, {
      projectRoot: '/',
      platforms: ['ios'],
      ignoreExistingNativeFiles: true,
    });

    // Check if the generated entitlements are NOT merged with local entitlements
    expect(config.ios?.entitlements).toMatchInlineSnapshot(`
      {
        "haha": "yes",
      }
    `);
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
    config = withInfoPlist(config, (config) => {
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
