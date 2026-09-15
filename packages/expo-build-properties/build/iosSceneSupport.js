"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosSceneSupport = void 0;
const config_plugins_1 = require("expo/config-plugins");
const resolve_from_1 = __importDefault(require("resolve-from"));
const semver_1 = __importDefault(require("semver"));
const PROPERTY_NAME = 'ios.enableSceneSupport';
/** The first SDK 57 patch that ships `ExpoAppSceneDelegate` and `ExpoReactNativeFactoryProvider`. */
const MINIMUM_EXPO_VERSION = '57.0.23';
/** SDK 58 and newer adopt the scene lifecycle in the project template. */
const NATIVE_SUPPORT_SDK_MAJOR = 58;
const ORIGINAL_APP_DELEGATE = 'class AppDelegate: ExpoAppDelegate {';
const SCENE_APP_DELEGATE = 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';
const FACTORY_ASSIGNMENT = '    reactNativeFactory = factory';
const LEGACY_STARTUP = `    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
`;
/** The published SDK 57 template wraps the startup in an `os()` check. */
const LEGACY_STARTUP_WRAPPED = `#if os(iOS) || os(tvOS)
${LEGACY_STARTUP}#endif
`;
/** Startup block shapes the plugin can remove, preceded by the blank line that separates them. */
const LEGACY_STARTUP_BLOCKS = [`\n${LEGACY_STARTUP_WRAPPED}`, `\n${LEGACY_STARTUP}`];
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
const withIosSceneSupport = (config, props) => {
    const enabled = props.ios?.enableSceneSupport;
    if (enabled === undefined) {
        return config;
    }
    const expoVersion = getExpoVersion(config);
    if (expoVersion && semver_1.default.major(expoVersion) >= NATIVE_SUPPORT_SDK_MAJOR) {
        config_plugins_1.WarningAggregator.addWarningIOS(PROPERTY_NAME, `Expo SDK 58 and newer include UIKit scene lifecycle support. \`${PROPERTY_NAME}\` is no longer required and can be removed from the expo-build-properties config.`);
        return config;
    }
    if (!expoVersion || semver_1.default.lt(expoVersion, MINIMUM_EXPO_VERSION)) {
        throw new Error(`\`${PROPERTY_NAME}\` requires Expo SDK ${MINIMUM_EXPO_VERSION} or a newer SDK 57 patch (received ${JSON.stringify(expoVersion ?? 'unknown')}).`);
    }
    config = (0, config_plugins_1.withAppDelegate)(config, (config) => {
        if (config.modResults.language !== 'swift') {
            throw new Error(`\`${PROPERTY_NAME}\` requires the standard Expo SDK 57 Swift AppDelegate.`);
        }
        config.modResults.contents = updateAppDelegate(config.modResults.contents, enabled);
        return config;
    });
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const manifest = config.modResults.UIApplicationSceneManifest;
        if (enabled) {
            if (manifest !== undefined && !isOwnedManifest(manifest)) {
                throw new Error(`\`${PROPERTY_NAME}\` cannot enable scene support because UIApplicationSceneManifest is already declared by the app.`);
            }
            config.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
        }
        else if (isOwnedManifest(manifest)) {
            delete config.modResults.UIApplicationSceneManifest;
        }
        return config;
    });
};
exports.withIosSceneSupport = withIosSceneSupport;
/**
 * Resolve the installed `expo` version. `config.sdkVersion` only carries the SDK major
 * (for example `57.0.0`), so the installed package is needed for the patch-level check.
 */
function getExpoVersion(config) {
    const projectRoot = config._internal?.projectRoot;
    const expoPackageJsonPath = projectRoot && resolve_from_1.default.silent(projectRoot, 'expo/package.json');
    const installedVersion = expoPackageJsonPath && require(expoPackageJsonPath).version;
    const version = typeof installedVersion === 'string' ? installedVersion : config.sdkVersion;
    return version && semver_1.default.valid(version) ? version : undefined;
}
function isOwnedManifest(manifest) {
    return JSON.stringify(manifest) === JSON.stringify(SCENE_MANIFEST);
}
function updateAppDelegate(contents, enabled) {
    const isEnabled = contents.includes(SCENE_APP_DELEGATE);
    if (enabled === isEnabled) {
        return contents;
    }
    if (enabled) {
        const startup = LEGACY_STARTUP_BLOCKS.find((block) => contents.includes(block));
        if (!contents.includes(ORIGINAL_APP_DELEGATE) || !startup) {
            throw new Error(`\`${PROPERTY_NAME}\` requires the standard Expo SDK 57 Swift AppDelegate.`);
        }
        return contents.replace(ORIGINAL_APP_DELEGATE, SCENE_APP_DELEGATE).replace(startup, '');
    }
    return contents
        .replace(SCENE_APP_DELEGATE, ORIGINAL_APP_DELEGATE)
        .replace(`${FACTORY_ASSIGNMENT}\n\n`, `${FACTORY_ASSIGNMENT}\n\n${LEGACY_STARTUP_WRAPPED}\n`);
}
