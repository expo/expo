import type { ExpoConfig } from '@expo/config-types';
import plist from '@expo/plist';
import { globSync } from 'glob';
import { vol } from 'memfs';
import path from 'path';

import type { ExportedConfig } from '../../Plugin.types';
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
    jest.mocked(globSync).mockImplementation((pattern) => {
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
    jest.mocked(globSync).mockImplementation((pattern) => {
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

describe('platform scoping', () => {
  afterEach(() => {
    vol.reset();
  });

  it('resolves the tvos project when both ios and tvos directories exist', async () => {
    const pbxproj = jest
      .requireActual<typeof import('fs')>('fs')
      .readFileSync(
        path.resolve(__dirname, './fixtures/project-files/ios/project.pbxproj'),
        'utf-8'
      );
    const entitlements = jest
      .requireActual<typeof import('fs')>('fs')
      .readFileSync(
        path.resolve(__dirname, './fixtures/project-files/ios/project.entitlements'),
        'utf-8'
      );
    vol.fromJSON({
      '/ios/HelloWorld/AppDelegate.mm': 'Fake AppDelegate.mm',
      '/ios/HelloWorld.xcodeproj/project.pbxproj': pbxproj,
      '/ios/HelloWorld/HelloWorld.entitlements': entitlements,
      '/tvos/HelloWorld/AppDelegate.mm': 'Fake AppDelegate.mm',
      '/tvos/HelloWorld.xcodeproj/project.pbxproj': pbxproj,
      '/tvos/HelloWorld/HelloWorld.entitlements': entitlements,
    });

    // Each glob must be scoped to one platform directory, so the tvos mods never see `ios/`.
    const patterns: string[] = [];
    jest.mocked(globSync).mockImplementation((pattern) => {
      patterns.push(pattern as string);
      if (pattern === 'tvos/**/*.xcodeproj') return ['/tvos/HelloWorld.xcodeproj'];
      if (pattern === 'tvos/*/AppDelegate.@(m|mm|swift)')
        return ['/tvos/HelloWorld/AppDelegate.mm'];
      throw new Error(`Unexpected glob pattern used in test: ${pattern}`);
    });

    let config: ExpoConfig = { name: 'bacon', slug: 'bacon' };
    config = withEntitlementsPlist(config, (config) => {
      config.modResults['haha'] = 'yes';
      return config;
    });
    // Plugins register Apple mods under `ios`; prebuild copies them to `tvos`.
    (config as ExportedConfig).mods!.tvos = { ...(config as ExportedConfig).mods!.ios };
    config = withIosBaseMods(config, {
      platform: 'tvos',
      saveToInternal: true,
      providers: {
        entitlements: getIosModFileProviders().entitlements,
      },
    });
    config = await evalModsAsync(config, { projectRoot: '/', platforms: ['tvos'] });

    expect(patterns.every((pattern) => pattern.startsWith('tvos/'))).toBe(true);
    expect(config.ios?.entitlements).toMatchObject({ haha: 'yes' });
    // The tvos mods must leave the iOS entitlements file untouched.
    expect(vol.readFileSync('/ios/HelloWorld/HelloWorld.entitlements', 'utf8')).toBe(entitlements);
    expect(vol.readFileSync('/tvos/HelloWorld/HelloWorld.entitlements', 'utf8')).not.toBe(
      entitlements
    );
  });

  it('does not carry iOS values into the tvos files on a combined run', async () => {
    const pbxproj = jest
      .requireActual<typeof import('fs')>('fs')
      .readFileSync(
        path.resolve(__dirname, './fixtures/project-files/ios/project.pbxproj'),
        'utf-8'
      );
    // An iOS-only key and entitlement. Neither belongs in the generated tvOS files.
    const iosInfoPlist = plist.build({
      CFBundleName: '$(PRODUCT_NAME)',
      UIApplicationSceneManifest: { UIApplicationSupportsMultipleScenes: true },
    });
    const tvosInfoPlist = plist.build({ CFBundleName: '$(PRODUCT_NAME)' });
    const iosEntitlements = plist.build({ 'aps-environment': 'development' });
    const tvosEntitlements = plist.build({});

    vol.fromJSON({
      '/ios/HelloWorld/AppDelegate.mm': 'Fake AppDelegate.mm',
      '/ios/HelloWorld.xcodeproj/project.pbxproj': pbxproj,
      '/ios/HelloWorld/Info.plist': iosInfoPlist,
      '/ios/HelloWorld/HelloWorld.entitlements': iosEntitlements,
      '/tvos/HelloWorld/AppDelegate.mm': 'Fake AppDelegate.mm',
      '/tvos/HelloWorld.xcodeproj/project.pbxproj': pbxproj,
      '/tvos/HelloWorld/Info.plist': tvosInfoPlist,
      '/tvos/HelloWorld/HelloWorld.entitlements': tvosEntitlements,
    });

    jest.mocked(globSync).mockImplementation((pattern) => {
      if (pattern === 'ios/**/*.xcodeproj') return ['/ios/HelloWorld.xcodeproj'];
      if (pattern === 'ios/*/AppDelegate.@(m|mm|swift)') return ['/ios/HelloWorld/AppDelegate.mm'];
      if (pattern === 'tvos/**/*.xcodeproj') return ['/tvos/HelloWorld.xcodeproj'];
      if (pattern === 'tvos/*/AppDelegate.@(m|mm|swift)')
        return ['/tvos/HelloWorld/AppDelegate.mm'];
      throw new Error(`Unexpected glob pattern used in test: ${pattern}`);
    });

    let config: ExpoConfig = { name: 'bacon', slug: 'bacon' };
    config = withInfoPlist(config, (config) => {
      config.modResults.CFBundleDisplayName = 'bacon';
      return config;
    });
    config = withEntitlementsPlist(config, (config) => {
      config.modResults['com.example.shared'] = true;
      return config;
    });
    // Plugins register Apple mods under `ios`; prebuild copies them to `tvos`.
    (config as ExportedConfig).mods!.tvos = { ...(config as ExportedConfig).mods!.ios };
    const providers = {
      infoPlist: getIosModFileProviders().infoPlist,
      entitlements: getIosModFileProviders().entitlements,
    };
    config = withIosBaseMods(config, { providers });
    config = withIosBaseMods(config, { platform: 'tvos', providers });
    config = await evalModsAsync(config, { projectRoot: '/', platforms: ['ios', 'tvos'] });

    const writtenTvosInfoPlist = plist.parse(
      vol.readFileSync('/tvos/HelloWorld/Info.plist', 'utf8') as string
    );
    const writtenTvosEntitlements = plist.parse(
      vol.readFileSync('/tvos/HelloWorld/HelloWorld.entitlements', 'utf8') as string
    );

    // The mods still apply to tvos...
    expect(writtenTvosInfoPlist).toMatchObject({ CFBundleDisplayName: 'bacon' });
    expect(writtenTvosEntitlements).toMatchObject({ 'com.example.shared': true });
    // ...but the iOS-only values from the preceding pass must not follow them over.
    expect(writtenTvosInfoPlist).not.toHaveProperty('UIApplicationSceneManifest');
    expect(writtenTvosEntitlements).not.toHaveProperty('aps-environment');
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

    expect(config._internal?.modResults.ios.infoPlist).toBeDefined();

    // Ensure no files were written
    expect(vol.toJSON()).toStrictEqual({});
  });
});
