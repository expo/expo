"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLegacyExpoPlugins = exports.getLegacyExpoPlugins = exports.getAutoPlugins = exports.withVersionedExpoSDKPlugins = exports.withAndroidExpoPlugins = exports.withIosExpoPlugins = void 0;
/**
 * These are the versioned first-party plugins with some of the future third-party plugins mixed in for legacy support.
 */
const config_plugins_1 = require("@expo/config-plugins");
const debug_1 = __importDefault(require("debug"));
const withAndroidIcons_1 = require("./icons/withAndroidIcons");
const withIosIcons_1 = require("./icons/withIosIcons");
const expo_ads_admob_1 = __importDefault(require("./unversioned/expo-ads-admob/expo-ads-admob"));
const expo_apple_authentication_1 = __importDefault(require("./unversioned/expo-apple-authentication"));
const expo_contacts_1 = __importDefault(require("./unversioned/expo-contacts"));
const expo_document_picker_1 = __importDefault(require("./unversioned/expo-document-picker"));
const expo_navigation_bar_1 = __importDefault(require("./unversioned/expo-navigation-bar/expo-navigation-bar"));
const expo_notifications_1 = __importDefault(require("./unversioned/expo-notifications/expo-notifications"));
const expo_splash_screen_1 = __importDefault(require("./unversioned/expo-splash-screen/expo-splash-screen"));
const expo_system_ui_1 = __importDefault(require("./unversioned/expo-system-ui/expo-system-ui"));
const expo_updates_1 = __importDefault(require("./unversioned/expo-updates"));
const react_native_maps_1 = __importDefault(require("./unversioned/react-native-maps"));
const getAutolinkedPackages_1 = require("../getAutolinkedPackages");
const debug = (0, debug_1.default)('expo:prebuild-config');
/**
 * Config plugin to apply all of the custom Expo iOS config plugins we support by default.
 * TODO: In the future most of this should go into versioned packages like expo-updates, etc...
 */
const withIosExpoPlugins = (config, { bundleIdentifier }) => {
    // Set the bundle ID ahead of time.
    if (!config.ios)
        config.ios = {};
    config.ios.bundleIdentifier = bundleIdentifier;
    return (0, config_plugins_1.withPlugins)(config, [
        [config_plugins_1.IOSConfig.BundleIdentifier.withBundleIdentifier, { bundleIdentifier }],
        config_plugins_1.IOSConfig.Swift.withSwiftBridgingHeader,
        config_plugins_1.IOSConfig.Swift.withNoopSwiftFile,
        config_plugins_1.IOSConfig.Google.withGoogle,
        config_plugins_1.IOSConfig.Name.withDisplayName,
        config_plugins_1.IOSConfig.Name.withProductName,
        config_plugins_1.IOSConfig.Orientation.withOrientation,
        config_plugins_1.IOSConfig.RequiresFullScreen.withRequiresFullScreen,
        config_plugins_1.IOSConfig.Scheme.withScheme,
        config_plugins_1.IOSConfig.UsesNonExemptEncryption.withUsesNonExemptEncryption,
        config_plugins_1.IOSConfig.Version.withBuildNumber,
        config_plugins_1.IOSConfig.Version.withVersion,
        config_plugins_1.IOSConfig.Google.withGoogleServicesFile,
        config_plugins_1.IOSConfig.BuildProperties.withJsEnginePodfileProps,
        // Entitlements
        config_plugins_1.IOSConfig.Entitlements.withAssociatedDomains,
        // XcodeProject
        config_plugins_1.IOSConfig.DeviceFamily.withDeviceFamily,
        config_plugins_1.IOSConfig.Bitcode.withBitcode,
        config_plugins_1.IOSConfig.Locales.withLocales,
        // Dangerous
        withIosIcons_1.withIosIcons,
    ]);
};
exports.withIosExpoPlugins = withIosExpoPlugins;
/**
 * Config plugin to apply all of the custom Expo Android config plugins we support by default.
 * TODO: In the future most of this should go into versioned packages like expo-updates, etc...
 */
const withAndroidExpoPlugins = (config, props) => {
    // Set the package name ahead of time.
    if (!config.android)
        config.android = {};
    config.android.package = props.package;
    return (0, config_plugins_1.withPlugins)(config, [
        // gradle.properties
        config_plugins_1.AndroidConfig.BuildProperties.withJsEngineGradleProps,
        // settings.gradle
        config_plugins_1.AndroidConfig.Name.withNameSettingsGradle,
        // project build.gradle
        config_plugins_1.AndroidConfig.GoogleServices.withClassPath,
        // app/build.gradle
        config_plugins_1.AndroidConfig.GoogleServices.withApplyPlugin,
        config_plugins_1.AndroidConfig.Package.withPackageGradle,
        config_plugins_1.AndroidConfig.Version.withVersion,
        // AndroidManifest.xml
        config_plugins_1.AndroidConfig.AllowBackup.withAllowBackup,
        config_plugins_1.AndroidConfig.WindowSoftInputMode.withWindowSoftInputMode,
        // Note: The withAndroidIntentFilters plugin must appear before the withScheme
        // plugin or withScheme will override the output of withAndroidIntentFilters.
        config_plugins_1.AndroidConfig.IntentFilters.withAndroidIntentFilters,
        config_plugins_1.AndroidConfig.Scheme.withScheme,
        config_plugins_1.AndroidConfig.Orientation.withOrientation,
        config_plugins_1.AndroidConfig.Permissions.withInternalBlockedPermissions,
        config_plugins_1.AndroidConfig.Permissions.withPermissions,
        // strings.xml
        config_plugins_1.AndroidConfig.Name.withName,
        // Dangerous -- these plugins run in reverse order.
        config_plugins_1.AndroidConfig.GoogleServices.withGoogleServicesFile,
        // Modify colors.xml and styles.xml
        config_plugins_1.AndroidConfig.StatusBar.withStatusBar,
        config_plugins_1.AndroidConfig.PrimaryColor.withPrimaryColor,
        withAndroidIcons_1.withAndroidIcons,
        // If we renamed the package, we should also move it around and rename it in source files
        // Added last to ensure this plugin runs first. Out of tree solutions will mistakenly resolve the package incorrectly otherwise.
        config_plugins_1.AndroidConfig.Package.withPackageRefactor,
    ]);
};
exports.withAndroidExpoPlugins = withAndroidExpoPlugins;
// Must keep in sync with `withVersionedExpoSDKPlugins`
const versionedExpoSDKPackages = [
    'react-native-maps',
    'expo-ads-admob',
    'expo-apple-authentication',
    'expo-contacts',
    'expo-notifications',
    'expo-updates',
    'expo-navigation-bar',
    'expo-document-picker',
    'expo-splash-screen',
    'expo-system-ui',
];
const withVersionedExpoSDKPlugins = (config) => {
    return (0, config_plugins_1.withPlugins)(config, [
        react_native_maps_1.default,
        expo_ads_admob_1.default,
        expo_apple_authentication_1.default,
        expo_contacts_1.default,
        expo_notifications_1.default,
        expo_updates_1.default,
        expo_document_picker_1.default,
        // System UI must come before splash screen as they overlap
        // and splash screen will warn about conflicting rules.
        expo_system_ui_1.default,
        expo_splash_screen_1.default,
        expo_navigation_bar_1.default,
    ]);
};
exports.withVersionedExpoSDKPlugins = withVersionedExpoSDKPlugins;
function getAutoPlugins() {
    return versionedExpoSDKPackages.concat(legacyExpoPlugins).concat(expoManagedVersionedPlugins);
}
exports.getAutoPlugins = getAutoPlugins;
function getLegacyExpoPlugins() {
    return legacyExpoPlugins;
}
exports.getLegacyExpoPlugins = getLegacyExpoPlugins;
// Expo managed packages that require extra update.
// These get applied automatically to create parity with expo build in eas build.
const legacyExpoPlugins = [
    'expo-app-auth',
    'expo-av',
    'expo-background-fetch',
    'expo-barcode-scanner',
    'expo-brightness',
    'expo-calendar',
    'expo-camera',
    'expo-cellular',
    'expo-dev-menu',
    'expo-dev-launcher',
    'expo-dev-client',
    'expo-image-picker',
    'expo-file-system',
    'expo-location',
    'expo-media-library',
    'expo-screen-orientation',
    'expo-sensors',
    'expo-task-manager',
    'expo-local-authentication',
];
// Plugins that need to be automatically applied, but also get applied by expo-cli if the versioned plugin isn't available.
// These are split up because the user doesn't need to be prompted to setup these packages.
const expoManagedVersionedPlugins = [
    'expo-firebase-analytics',
    'expo-firebase-core',
    'expo-google-sign-in',
];
const withOptionalLegacyPlugins = (config, plugins) => {
    return plugins.reduce((prev, plugin) => {
        if ((0, getAutolinkedPackages_1.shouldSkipAutoPlugin)(config, plugin)) {
            debug('Skipping unlinked auto plugin:', plugin);
            return prev;
        }
        return (0, config_plugins_1.withStaticPlugin)(prev, {
            // hide errors
            _isLegacyPlugin: true,
            plugin,
            // If a plugin doesn't exist, do nothing.
            fallback: (config) => config,
        });
    }, config);
};
function withLegacyExpoPlugins(config) {
    return withOptionalLegacyPlugins(config, [
        ...new Set(expoManagedVersionedPlugins.concat(legacyExpoPlugins)),
    ]);
}
exports.withLegacyExpoPlugins = withLegacyExpoPlugins;
