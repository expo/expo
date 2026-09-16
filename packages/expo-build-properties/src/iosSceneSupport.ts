import type { ExpoConfig } from 'expo/config';
import type { ConfigPlugin } from 'expo/config-plugins';
import { WarningAggregator, withAppDelegate, withInfoPlist } from 'expo/config-plugins';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import type { PluginConfigType } from './pluginConfig';

const PROPERTY_NAME = 'ios.enableSceneSupport';
/** The first SDK 57 patch that ships `ExpoAppSceneDelegate` and `ExpoReactNativeFactoryProvider`. */
const MINIMUM_EXPO_VERSION = '57.0.23';
/** SDK 58 and newer adopt the scene lifecycle in the project template. */
const NATIVE_SUPPORT_SDK_MAJOR = 58;

const ORIGINAL_APP_DELEGATE = 'class AppDelegate: ExpoAppDelegate {';
const SCENE_APP_DELEGATE = 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';
const FACTORY_ASSIGNMENT = '    reactNativeFactory = factory';
const LEGACY_WINDOW = `    window = UIWindow(frame: UIScreen.main.bounds)
`;
const LEGACY_START = `    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
`;
const LEGACY_STARTUP = `${LEGACY_WINDOW}${LEGACY_START}`;
/** The published SDK 57 template wraps the startup in an `os()` check. */
const LEGACY_STARTUP_WRAPPED = `#if os(iOS) || os(tvOS)
${LEGACY_STARTUP}#endif
`;
const WINDOW_STATEMENT = /^[ \t]*window = UIWindow\(frame: UIScreen\.main\.bounds\)\r?\n/m;
const START_STATEMENT = /^[ \t]*factory\.startReactNative\([^)]*\)\r?\n/m;
const EMPTY_OS_WRAPPER = /^[ \t]*#if os\(iOS\) \|\| os\(tvOS\)\r?\n[ \t]*#endif\r?\n/m;
const OS_WRAPPER = /^([ \t]*#if os\(iOS\) \|\| os\(tvOS\)\r?\n)([\s\S]*?)(^[ \t]*#endif\r?\n)/m;
const BLANK_LINES_AFTER_FACTORY = new RegExp(`(${FACTORY_ASSIGNMENT}\\r?\\n)(?:[ \\t]*\\r?\\n)+`);

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
      },
    ],
  },
};

/**
 * Adopts the UIKit scene lifecycle in SDK 57 projects when `ios.enableSceneSupport` is set.
 * SDK 58 and newer include scene support in the template, so the property is a no-op there.
 */
export const withIosSceneSupport: ConfigPlugin<PluginConfigType> = (config, props) => {
  const enabled = props.ios?.enableSceneSupport;
  if (enabled === undefined) {
    return config;
  }

  const expoVersion = getExpoVersion(config);
  if (expoVersion && semver.major(expoVersion) >= NATIVE_SUPPORT_SDK_MAJOR) {
    WarningAggregator.addWarningIOS(
      PROPERTY_NAME,
      `Expo SDK 58 and newer include UIKit scene lifecycle support. \`${PROPERTY_NAME}\` is no longer required and can be removed from the expo-build-properties config.`
    );
    return config;
  }
  if (!expoVersion || semver.lt(expoVersion, MINIMUM_EXPO_VERSION)) {
    throw new Error(
      `\`${PROPERTY_NAME}\` requires Expo SDK ${MINIMUM_EXPO_VERSION} or a newer SDK 57 patch (received ${JSON.stringify(expoVersion ?? 'unknown')}).`
    );
  }

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error(`\`${PROPERTY_NAME}\` requires the standard Expo SDK 57 Swift AppDelegate.`);
    }
    config.modResults.contents = updateAppDelegate(config.modResults.contents, enabled);
    return config;
  });

  return withInfoPlist(config, (config) => {
    const manifest = config.modResults.UIApplicationSceneManifest;
    if (enabled) {
      if (manifest !== undefined && !isOwnedManifest(manifest)) {
        throw new Error(
          `\`${PROPERTY_NAME}\` cannot enable scene support because UIApplicationSceneManifest is already declared by the app.`
        );
      }
      config.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
    } else if (isOwnedManifest(manifest)) {
      delete config.modResults.UIApplicationSceneManifest;
    }
    return config;
  });
};

/**
 * Resolve the installed `expo` version. `config.sdkVersion` only carries the SDK major
 * (for example `57.0.0`), so the installed package is needed for the patch-level check.
 */
function getExpoVersion(config: Pick<ExpoConfig, 'sdkVersion' | '_internal'>): string | undefined {
  const projectRoot = config._internal?.projectRoot;
  const expoPackageJsonPath = projectRoot && resolveFrom.silent(projectRoot, 'expo/package.json');
  const installedVersion: unknown = expoPackageJsonPath && require(expoPackageJsonPath).version;
  const version = typeof installedVersion === 'string' ? installedVersion : config.sdkVersion;
  return version && semver.valid(version) ? version : undefined;
}

function isOwnedManifest(manifest: unknown): boolean {
  return JSON.stringify(manifest) === JSON.stringify(SCENE_MANIFEST);
}

function updateAppDelegate(contents: string, enabled: boolean): string {
  const isEnabled = contents.includes(SCENE_APP_DELEGATE);
  if (enabled === isEnabled) {
    return contents;
  }

  if (enabled) {
    if (
      !contents.includes(ORIGINAL_APP_DELEGATE) ||
      !WINDOW_STATEMENT.test(contents) ||
      !START_STATEMENT.test(contents)
    ) {
      throw new Error(`\`${PROPERTY_NAME}\` requires the standard Expo SDK 57 Swift AppDelegate.`);
    }
    return contents
      .replace(ORIGINAL_APP_DELEGATE, SCENE_APP_DELEGATE)
      .replace(WINDOW_STATEMENT, '')
      .replace(START_STATEMENT, '')
      .replace(EMPTY_OS_WRAPPER, '')
      .replace(BLANK_LINES_AFTER_FACTORY, '$1\n');
  }

  const restored = contents.replace(SCENE_APP_DELEGATE, ORIGINAL_APP_DELEGATE);
  if (OS_WRAPPER.test(restored)) {
    return restored.replace(OS_WRAPPER, `$1${LEGACY_WINDOW}$2${LEGACY_START}$3`);
  }
  return restored.replace(
    `${FACTORY_ASSIGNMENT}\n\n`,
    `${FACTORY_ASSIGNMENT}\n\n${LEGACY_STARTUP_WRAPPED}\n`
  );
}
