import {
  compileModsAsync,
  evalModsAsync,
  ExportedConfig,
  IOSConfig,
  withGradleProperties,
  XML,
} from '@expo/config-plugins';
import JsonFile from '@expo/json-file';
import plist from '@expo/plist';
import fs from 'fs-extra';
import { vol } from 'memfs';
import * as path from 'path';
import xcode from 'xcode';

import rnFixture from './fixtures/react-native-project';
import { getDirFromFS } from './getDirFromFS';
import {
  withAndroidExpoPlugins,
  withIosExpoPlugins,
  withVersionedExpoSDKPlugins,
} from '../withDefaultPlugins';

const { withOrientation } = IOSConfig.Orientation;

const { readXMLAsync } = XML;
const fsReal = jest.requireActual('fs') as typeof fs;

jest.setTimeout(30 * 1000);

jest.mock('fs');
// Weird issues with Android Icon module make it hard to mock test.
jest.mock('../icons/withAndroidIcons', () => {
  return {
    withAndroidIcons(config) {
      return config;
    },
    setIconAsync() {},
  };
});
const NotificationsPlugin = require('../unversioned/expo-notifications/withAndroidNotifications');
NotificationsPlugin.withNotificationIcons = jest.fn((config) => config);

function getLargeConfig(): ExportedConfig {
  // A very extensive Expo Config.
  return {
    name: 'my cool app',
    slug: 'mycoolapp',
    description: 'my app is great because it uses expo',
    // owner?: string;
    // privacy?: 'public' | 'unlisted' | 'hidden';
    // sdkVersion?: string;
    runtimeVersion: '1.0',
    splash: {
      backgroundColor: '#ff00ff',
    },
    version: '1.0.0',
    platforms: ['android', 'ios', 'web'],
    githubUrl: 'https://github.com/expo/expo',
    orientation: 'default',
    userInterfaceStyle: 'dark',
    backgroundColor: 'orange',
    primaryColor: '#fff000',
    // icon: './icons/icon.png',
    notification: {
      icon: './icons/notification-icon.png',
      color: 'green',
      iosDisplayInForeground: true,
      androidMode: 'collapse',
      androidCollapsedTitle: '#{unread_notifications} new interactions',
    },
    androidStatusBar: {
      barStyle: 'light-content',
      backgroundColor: '#000FFF',
      hidden: false,
      translucent: true,
    },
    androidNavigationBar: {
      visible: 'sticky-immersive',
      barStyle: 'dark-content',

      backgroundColor: '#ff0000',
    },
    developmentClient: {
      silentLaunch: true,
    },
    scheme: 'my-app-redirect',
    packagerOpts: {
      extraThing: true,
    },
    updates: {
      enabled: true,
      checkAutomatically: 'ON_ERROR_RECOVERY',
      fallbackToCacheTimeout: 650,
    },
    locales: {
      en: './locales/en-US.json',
      es: { foo: 'el bar' },
    },
    facebookAppId: '1234567890',
    facebookAutoInitEnabled: true,
    facebookAutoLogAppEventsEnabled: true,
    facebookAdvertiserIDCollectionEnabled: true,
    facebookDisplayName: 'my-fb-test-app',
    facebookScheme: 'fb1234567890',
    ios: {
      bundleIdentifier: 'com.bacon.tester.expoapp',
      buildNumber: '6.5.0',
      backgroundColor: '#ff0000',
      appStoreUrl: 'https://itunes.apple.com/us/app/pillar-valley/id1336398804?ls=1&mt=8',
      config: {
        usesNonExemptEncryption: true,
        googleMapsApiKey: 'TEST_googleMapsApiKey',
        googleMobileAdsAppId: 'TEST_googleMobileAdsAppId',
        googleMobileAdsAutoInit: true,
      },
      googleServicesFile: './config/GoogleService-Info.plist',
      supportsTablet: true,
      isTabletOnly: false,
      requireFullScreen: true,
      userInterfaceStyle: 'automatic',
      infoPlist: { bar: { val: ['foo'] } },
      entitlements: { foo: 'bar' },
      associatedDomains: ['applinks:https://pillarvalley.netlify.app'],
      usesIcloudStorage: true,
      usesAppleSignIn: true,
      accessesContactNotes: true,
    },
    android: {
      package: 'com.bacon.tester.expoapp',
      versionCode: 6,
      backgroundColor: '#ff0000',
      userInterfaceStyle: 'light',
      adaptiveIcon: {
        foregroundImage: './icons/foreground.png',
        backgroundImage: './icons/background.png',
      },
      splash: {
        backgroundColor: '#ff00ff',
        dark: {
          backgroundColor: '#00ffff',
        },
      },
      blockedPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      permissions: [
        'CAMERA',
        'com.sec.android.provider.badge.permission.WRITE',
        'android.permission.RECORD_AUDIO',
      ],
      googleServicesFile: './config/google-services.json',
      config: {
        branch: {
          apiKey: 'MY_BRANCH_ANDROID_KEY',
        },
        googleMaps: {
          apiKey: 'MY_GOOGLE_MAPS_ANDROID_KEY',
        },
        googleMobileAdsAppId: 'MY_GOOGLE_MOBILE_ADS_APP_ID',
        googleMobileAdsAutoInit: true,
      },
      intentFilters: [
        {
          autoVerify: true,
          action: 'VIEW',
          data: {
            scheme: 'https',
            host: '*.expo.dev',
          },
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      allowBackup: true,
      softwareKeyboardLayoutMode: 'pan',
    },
    _internal: { projectRoot: '/app' },
    mods: null,
  };
}

function getPrebuildConfig() {
  let config = { ...getLargeConfig() };
  config = withVersionedExpoSDKPlugins(config);

  config = withIosExpoPlugins(config, {
    bundleIdentifier: 'com.bacon.todo',
  });
  config = withAndroidExpoPlugins(config, {
    package: 'com.bacon.todo',
  });
  return config;
}
describe(evalModsAsync, () => {
  it(`runs with no core mods`, async () => {
    let config: ExportedConfig = {
      name: 'app',
      slug: '',
    };
    config = await evalModsAsync(config, { projectRoot: '/' });
    expect(config.ios).toBeUndefined();
  });
});

describe('built-in plugins', () => {
  const projectRoot = '/app';
  const iconPath = path.resolve(__dirname, './fixtures/icon.png');
  const icon = fsReal.readFileSync(iconPath) as any;
  const googleServiceInfoFixture = fsReal.readFileSync(
    path.resolve(__dirname, './fixtures/GoogleService-Info.plist'),
    'utf8'
  ) as any;

  const originalWarn = console.warn;

  beforeEach(async () => {
    console.warn = jest.fn();
    // Trick XDL Info.plist reading
    Object.defineProperty(process, 'platform', {
      value: 'not-darwin',
    });
    vol.fromJSON(
      {
        // Required to link react-native-maps
        './node_modules/react-native-maps/package.json': JSON.stringify({}),
        // App files
        ...rnFixture,
        'config/GoogleService-Info.plist': googleServiceInfoFixture,
        'config/google-services.json': '{}',
        './icons/foreground.png': icon,
        './icons/background.png': icon,
        './icons/notification-icon.png': icon,
        './icons/ios-icon.png': icon,
        'locales/en-US.json': JSON.stringify({ foo: 'uhh bar', fallback: 'fallback' }, null, 2),
      },
      projectRoot
    );
  });

  afterEach(() => {
    vol.reset();
    console.warn = originalWarn;
  });

  // Ensure helpful error messages are thrown
  it(`fails to locate the project name in an invalid project`, async () => {
    const config = withOrientation({
      name: 'app',
      slug: '',
      ios: {},
    });
    await expect(compileModsAsync(config, { projectRoot: '/invalid' })).rejects.toThrow(
      'Failed to locate Info.plist files relative'
    );
  });

  it(`skips platforms`, async () => {
    const config = withOrientation({
      name: 'app',
      slug: '',
      ios: {},
    });

    // should throw if the platform isn't skipped
    await compileModsAsync(config, { projectRoot: '/invalid', platforms: ['android'] });
  });

  it('allows conflicts with info.plist overrides', async () => {
    let config: ExportedConfig = {
      name: 'app',
      slug: '',
      _internal: { projectRoot: '.' },
      ios: {
        config: {
          usesNonExemptEncryption: false,
        },
        infoPlist: {
          ITSAppUsesNonExemptEncryption: true,
        },
      },
    };

    config = withIosExpoPlugins(config, {
      bundleIdentifier: 'com.bacon.todo',
    });
    // Apply mod
    config = await compileModsAsync(config, { projectRoot: '/app' });
    // This should be false because ios.config.usesNonExemptEncryption is used in favor of ios.infoPlist.ITSAppUsesNonExemptEncryption
    expect(config.ios?.infoPlist?.ITSAppUsesNonExemptEncryption).toBe(true);
  });

  it('sends a valid modRequest', async () => {
    let config = getPrebuildConfig();

    let modRequest;
    config = withGradleProperties(config, (config) => {
      modRequest = config.modRequest;
      return config;
    });
    // Apply mod
    await compileModsAsync(config, { introspect: true, projectRoot: '/app' });

    expect(modRequest).toStrictEqual({
      ignoreExistingNativeFiles: false,
      introspect: true,
      modName: 'gradleProperties',
      platform: 'android',
      platformProjectRoot: '/app/android',
      projectName: undefined,
      projectRoot: '/app',
    });
  });
  it('compiles mods', async () => {
    let config = getPrebuildConfig();
    // Apply mod
    config = await compileModsAsync(config, { projectRoot: '/app' });

    // App config should have been modified
    expect(config.name).toBe('my cool app');
    expect(config.ios?.infoPlist).toBeDefined();
    expect(config.ios?.entitlements).toBeDefined();

    // Google Sign In
    expect(
      config.ios?.infoPlist?.CFBundleURLTypes?.find(({ CFBundleURLSchemes }) =>
        CFBundleURLSchemes.includes('com.googleusercontent.apps.1234567890123-abcdef')
      )
    ).toBeDefined();

    // Mods should all be functions
    expect(Object.values(config.mods!.ios!).every((value) => typeof value === 'function')).toBe(
      true
    );

    delete config.mods;

    // Shape
    expect(config).toMatchSnapshot();

    // Test the written files...
    const after = getDirFromFS(vol.toJSON(), projectRoot);

    expect(Object.keys(after).sort()).toEqual(
      [
        'node_modules/react-native-maps/package.json',
        'ios/.xcode.env',
        'ios/HelloWorld/AppDelegate.h',
        'ios/HelloWorld/AppDelegate.mm',
        'ios/HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json',
        'ios/HelloWorld/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
        'ios/HelloWorld/Images.xcassets/Contents.json',
        'ios/HelloWorld/Images.xcassets/SplashScreenLogo.imageset/Contents.json',
        'ios/HelloWorld/Info.plist',
        'ios/HelloWorld/SplashScreen.storyboard',
        'ios/HelloWorld/Supporting/Expo.plist',
        'ios/HelloWorld/Supporting/en.lproj/InfoPlist.strings',
        'ios/HelloWorld/Supporting/es.lproj/InfoPlist.strings',
        'ios/HelloWorld/main.m',
        'ios/HelloWorld/GoogleService-Info.plist',
        'ios/HelloWorld/noop-file.swift',
        'ios/HelloWorld/HelloWorld-Bridging-Header.h',
        'ios/HelloWorld/mycoolapp.entitlements',
        'ios/HelloWorld.xcodeproj/project.pbxproj',
        'ios/HelloWorld.xcodeproj/project.xcworkspace/contents.xcworkspacedata',
        'ios/HelloWorld.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist',
        'ios/HelloWorld.xcodeproj/xcshareddata/xcschemes/HelloWorld.xcscheme',
        'ios/HelloWorld.xcworkspace/contents.xcworkspacedata',
        'ios/HelloWorld.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist',
        'ios/Podfile',
        'ios/Podfile.properties.json',
        'ios/gitignore',
        'android/app/build.gradle',
        'android/app/debug.keystore',
        'android/app/proguard-rules.pro',
        'android/app/src/debug/AndroidManifest.xml',
        'android/app/src/main/AndroidManifest.xml',
        'android/app/src/main/java/com/bacon/todo/MainActivity.kt',
        'android/app/src/main/java/com/bacon/todo/MainApplication.kt',
        'android/app/src/main/res/drawable/rn_edit_text_material.xml',
        'android/app/src/main/res/drawable/splashscreen.xml',
        'android/app/src/main/res/values/colors.xml',
        'android/app/src/main/res/values/strings.xml',
        'android/app/src/main/res/values/styles.xml',
        'android/app/src/main/res/values-night/colors.xml',
        'android/app/google-services.json',
        'android/build.gradle',
        'android/gitignore',
        'android/gradle/wrapper/gradle-wrapper.jar',
        'android/gradle/wrapper/gradle-wrapper.properties',
        'android/gradle.properties',
        'android/gradlew',
        'android/gradlew.bat',
        'android/settings.gradle',
        'config/GoogleService-Info.plist',
        'config/google-services.json',
        'locales/en-US.json',
      ].sort()
    );

    expect(after['ios/HelloWorld/mycoolapp.entitlements']).toMatch(
      'com.apple.developer.associated-domains'
    );

    expect(after['ios/HelloWorld/Info.plist']).toMatch(/com.bacon.todo/);
    expect(after['ios/HelloWorld/Supporting/en.lproj/InfoPlist.strings']).toMatch(
      /foo = "uhh bar"/
    );
    expect(after['ios/HelloWorld/GoogleService-Info.plist']).toBe(googleServiceInfoFixture);

    expect(after['android/app/src/main/java/com/bacon/todo/MainApplication.kt']).toMatch(
      'package com.bacon.todo'
    );

    expect(after['android/app/src/main/res/values/strings.xml']).toMatch(
      '<string name="app_name">my cool app</string>'
    );

    // Ensure files are always written in the correct format
    for (const xmlPath of [
      'android/app/src/main/AndroidManifest.xml',
      'android/app/src/main/res/values/styles.xml',
      'android/app/src/main/res/values/strings.xml',
      'android/app/src/main/res/values/colors.xml',
      'ios/HelloWorld/Info.plist',
    ]) {
      const isValid = await isValidXMLAsync(path.join(projectRoot, xmlPath));
      if (!isValid) throw new Error(`Invalid XML file format at: "${xmlPath}"`);
    }

    // Ensure the infoPlist object is merged correctly
    const infoPlist = await plist.parse(
      fs.readFileSync(path.join(projectRoot, 'ios/HelloWorld/Info.plist'), 'utf8')
    );
    expect(infoPlist.bar).toStrictEqual({ val: ['foo'] });
    // Ensure the entitlements object is merged correctly
    const entitlements = await plist.parse(
      fs.readFileSync(path.join(projectRoot, 'ios/HelloWorld/mycoolapp.entitlements'), 'utf8')
    );
    expect(entitlements.foo).toStrictEqual('bar');

    // Ensure files are always written in the correct format
    for (const xmlPath of [
      'ios/HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json',
      'ios/HelloWorld/Images.xcassets/Contents.json',
      'android/app/google-services.json',
    ]) {
      const isValid = await isValidJSONAsync(path.join(projectRoot, xmlPath));
      if (!isValid) throw new Error(`Invalid JSON file format at: "${xmlPath}"`);
    }

    // Ensure the Xcode project file can be read and parsed.
    const project = xcode.project(
      path.join(projectRoot, 'ios/HelloWorld.xcodeproj/project.pbxproj')
    );
    project.parseSync();
  });

  it('introspects mods', async () => {
    let config = getPrebuildConfig();

    // Apply mod
    config = await compileModsAsync(config, { introspect: true, projectRoot: '/app' });

    // App config should have been modified
    expect(config.name).toBe('my cool app');
    expect(config.ios?.infoPlist).toBeDefined();
    expect(config.ios?.entitlements).toBeDefined();

    // Google Sign In
    expect(
      config.ios?.infoPlist?.CFBundleURLTypes?.find(({ CFBundleURLSchemes }) =>
        CFBundleURLSchemes.includes('com.googleusercontent.apps.1234567890123-abcdef')
      )
    ).toBeDefined();

    const mods = config.mods!;
    // Mods should all be functions
    expect(Object.values(mods.ios!).every((value) => typeof value === 'function')).toBe(true);
    expect(Object.values(mods.android!).every((value) => typeof value === 'function')).toBe(true);
    // Ensure these mods are removed
    expect(mods.android?.dangerous).toBeUndefined();
    expect(mods.android?.mainActivity).toBeUndefined();
    expect(mods.android?.appBuildGradle).toBeUndefined();
    expect(mods.android?.projectBuildGradle).toBeUndefined();
    expect(mods.android?.settingsGradle).toBeUndefined();
    expect(mods.ios?.dangerous).toBeUndefined();
    expect(mods.ios?.xcodeproj).toBeUndefined();

    delete config.mods;

    // Shape
    expect(config).toMatchSnapshot();

    expect(config._internal?.modResults).toBeDefined();
    expect(config._internal?.modResults.ios.infoPlist).toBeDefined();
    expect(config._internal?.modResults.ios.expoPlist).toBeDefined();
    expect(config._internal?.modResults.ios.entitlements).toBeDefined();
    expect(config._internal?.modResults.android.manifest).toBeDefined();
    expect(Array.isArray(config._internal?.modResults.android.gradleProperties)).toBe(true);
    expect(config._internal?.modResults.android.strings).toBeDefined();

    // Test the written files...
    const after = getDirFromFS(vol.toJSON(), projectRoot);

    expect(Object.keys(after)).toEqual([
      'node_modules/react-native-maps/package.json',
      'ios/.xcode.env',
      'ios/HelloWorld/AppDelegate.h',
      'ios/HelloWorld/AppDelegate.mm',
      'ios/HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json',
      'ios/HelloWorld/Images.xcassets/Contents.json',
      'ios/HelloWorld/Images.xcassets/SplashScreenLogo.imageset/Contents.json',
      'ios/HelloWorld/Info.plist',
      'ios/HelloWorld/SplashScreen.storyboard',
      'ios/HelloWorld/Supporting/Expo.plist',
      'ios/HelloWorld/main.m',
      'ios/HelloWorld/HelloWorld.entitlements',
      'ios/HelloWorld.xcodeproj/project.pbxproj',
      'ios/HelloWorld.xcodeproj/project.xcworkspace/contents.xcworkspacedata',
      'ios/HelloWorld.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist',
      'ios/HelloWorld.xcodeproj/xcshareddata/xcschemes/HelloWorld.xcscheme',
      'ios/HelloWorld.xcworkspace/contents.xcworkspacedata',
      'ios/HelloWorld.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist',
      'ios/Podfile',
      'ios/Podfile.properties.json',
      'ios/gitignore',
      'android/app/build.gradle',
      'android/app/debug.keystore',
      'android/app/proguard-rules.pro',
      'android/app/src/debug/AndroidManifest.xml',
      'android/app/src/main/AndroidManifest.xml',
      'android/app/src/main/java/com/helloworld/MainActivity.kt',
      'android/app/src/main/java/com/helloworld/MainApplication.kt',
      'android/app/src/main/res/drawable/rn_edit_text_material.xml',
      'android/app/src/main/res/drawable/splashscreen.xml',
      'android/app/src/main/res/values/colors.xml',
      'android/app/src/main/res/values/strings.xml',
      'android/app/src/main/res/values/styles.xml',
      'android/build.gradle',
      'android/gitignore',
      'android/gradle/wrapper/gradle-wrapper.jar',
      'android/gradle/wrapper/gradle-wrapper.properties',
      'android/gradle.properties',
      'android/gradlew',
      'android/gradlew.bat',
      'android/settings.gradle',
      'config/GoogleService-Info.plist',
      'config/google-services.json',
      'locales/en-US.json',
    ]);

    // unmodified
    expect(after['ios/HelloWorld/HelloWorld.entitlements']).not.toMatch(
      'com.apple.developer.associated-domains'
    );

    expect(after['ios/HelloWorld/Info.plist']).toBe(rnFixture['ios/HelloWorld/Info.plist']);

    expect(after['android/app/src/main/java/com/helloworld/MainApplication.kt']).toBe(
      rnFixture['android/app/src/main/java/com/helloworld/MainApplication.kt']
    );
    expect(after['android/app/src/main/java/com/helloworld/MainActivity.kt']).toBe(
      rnFixture['android/app/src/main/java/com/helloworld/MainActivity.kt']
    );
    expect(after['android/app/src/main/res/values/styles.xml']).toMatch(
      rnFixture['android/app/src/main/res/values/styles.xml']
    );

    // for (const [name, contents] of Object.entries(rnFixture)) {
    //   // The pbxproj seems to reformat in jest
    //   if (name.includes('pbxproj') || name.endsWith('MainApplicationTurboModuleManagerDelegate.h'))
    //     continue;
    //   expect(after[name]).toMatch(contents);
    // }
    // Ensure the Xcode project file can be read and parsed.
    const project = xcode.project(
      path.join(projectRoot, 'ios/HelloWorld.xcodeproj/project.pbxproj')
    );
    project.parseSync();
  });

  // Tests that introspection works
  it('introspects mods in a managed project', async () => {
    vol.reset();
    vol.fromJSON(
      {
        // Required to link react-native-maps
        './node_modules/react-native-maps/package.json': JSON.stringify({}),
        // App files
        'config/GoogleService-Info.plist': googleServiceInfoFixture,
        'config/google-services.json': '{}',
        'icons/foreground.png': icon,
        'icons/background.png': icon,
        'icons/notification-icon.png': icon,
        'icons/ios-icon.png': icon,
        'locales/en-US.json': JSON.stringify({ foo: 'uhh bar', fallback: 'fallback' }, null, 2),
      },
      projectRoot
    );

    let config = getPrebuildConfig();

    // Apply mod
    config = await compileModsAsync(config, { introspect: true, projectRoot: '/app' });

    // App config should have been modified
    expect(config.name).toBe('my cool app');
    expect(config.ios?.infoPlist).toBeDefined();
    expect(config.ios?.entitlements).toBeDefined();

    // Google Sign In
    expect(
      config.ios?.infoPlist?.CFBundleURLTypes?.find(({ CFBundleURLSchemes }) =>
        CFBundleURLSchemes.includes('com.googleusercontent.apps.1234567890123-abcdef')
      )
    ).toBeDefined();

    const mods = config.mods!;
    // Mods should all be functions
    expect(Object.values(mods.ios!).every((value) => typeof value === 'function')).toBe(true);
    expect(Object.values(mods.android!).every((value) => typeof value === 'function')).toBe(true);
    // Ensure these mods are removed
    expect(mods.android?.dangerous).toBeUndefined();
    expect(mods.android?.mainActivity).toBeUndefined();
    expect(mods.android?.appBuildGradle).toBeUndefined();
    expect(mods.android?.projectBuildGradle).toBeUndefined();
    expect(mods.android?.settingsGradle).toBeUndefined();
    expect(mods.ios?.dangerous).toBeUndefined();
    expect(mods.ios?.xcodeproj).toBeUndefined();

    delete config.mods;

    // Shape
    expect(config).toMatchSnapshot();

    expect(config._internal?.modResults).toBeDefined();
    expect(config._internal?.modResults.ios.infoPlist).toBeDefined();
    expect(config._internal?.modResults.ios.expoPlist).toBeDefined();
    expect(config._internal?.modResults.ios.entitlements).toBeDefined();
    expect(config._internal?.modResults.android.manifest).toBeDefined();
    expect(Array.isArray(config._internal?.modResults.android.gradleProperties)).toBe(true);
    expect(config._internal?.modResults.android.strings).toBeDefined();

    // Test the written files...
    const after = getDirFromFS(vol.toJSON(), projectRoot);

    expect(Object.keys(after)).toStrictEqual([
      'node_modules/react-native-maps/package.json',
      'config/GoogleService-Info.plist',
      'config/google-services.json',
      'locales/en-US.json',
    ]);
  });

  it('create Podfile.properties.json file for backward compatible', async () => {
    const { '/app/ios/Podfile.properties.json': _, ...volWithoutPodfileProperties } = vol.toJSON();
    vol.reset();
    vol.fromJSON(volWithoutPodfileProperties);

    let config = getPrebuildConfig();
    // change jsEngine to hermes
    config.jsEngine = 'hermes';

    config = await compileModsAsync(config, { projectRoot: '/app' });

    const result = await JsonFile.readAsync('/app/ios/Podfile.properties.json');
    expect(result).toMatchObject({ 'expo.jsEngine': 'hermes' });
  });
});

async function isValidXMLAsync(filePath: string) {
  try {
    const res = await readXMLAsync({ path: filePath });
    return !!res;
  } catch {
    return false;
  }
}

async function isValidJSONAsync(filePath: string) {
  try {
    const res = await JsonFile.readAsync(filePath);
    return !!res;
  } catch {
    return false;
  }
}
