"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAutoPlugins = getAutoPlugins;
exports.getLegacyExpoPlugins = getLegacyExpoPlugins;
exports.withIosExpoPlugins = exports.withAndroidExpoPlugins = void 0;
exports.withLegacyExpoPlugins = withLegacyExpoPlugins;
exports.withVersionedExpoSDKPlugins = void 0;

function _configPlugins() {
  const data = require("@expo/config-plugins");

  _configPlugins = function () {
    return data;
  };

  return data;
}

function _debug() {
  const data = _interopRequireDefault(require("debug"));

  _debug = function () {
    return data;
  };

  return data;
}

function _getAutolinkedPackages() {
  const data = require("../getAutolinkedPackages");

  _getAutolinkedPackages = function () {
    return data;
  };

  return data;
}

function _withAndroidIcons() {
  const data = require("./icons/withAndroidIcons");

  _withAndroidIcons = function () {
    return data;
  };

  return data;
}

function _withIosIcons() {
  const data = require("./icons/withIosIcons");

  _withIosIcons = function () {
    return data;
  };

  return data;
}

function _expoAdsAdmob() {
  const data = _interopRequireDefault(require("./unversioned/expo-ads-admob/expo-ads-admob"));

  _expoAdsAdmob = function () {
    return data;
  };

  return data;
}

function _expoAppleAuthentication() {
  const data = _interopRequireDefault(require("./unversioned/expo-apple-authentication"));

  _expoAppleAuthentication = function () {
    return data;
  };

  return data;
}

function _expoBranch() {
  const data = _interopRequireDefault(require("./unversioned/expo-branch/expo-branch"));

  _expoBranch = function () {
    return data;
  };

  return data;
}

function _expoContacts() {
  const data = _interopRequireDefault(require("./unversioned/expo-contacts"));

  _expoContacts = function () {
    return data;
  };

  return data;
}

function _expoDocumentPicker() {
  const data = _interopRequireDefault(require("./unversioned/expo-document-picker"));

  _expoDocumentPicker = function () {
    return data;
  };

  return data;
}

function _expoFacebook() {
  const data = _interopRequireDefault(require("./unversioned/expo-facebook/expo-facebook"));

  _expoFacebook = function () {
    return data;
  };

  return data;
}

function _expoNavigationBar() {
  const data = _interopRequireDefault(require("./unversioned/expo-navigation-bar/expo-navigation-bar"));

  _expoNavigationBar = function () {
    return data;
  };

  return data;
}

function _expoNotifications() {
  const data = _interopRequireDefault(require("./unversioned/expo-notifications/expo-notifications"));

  _expoNotifications = function () {
    return data;
  };

  return data;
}

function _expoSplashScreen() {
  const data = _interopRequireDefault(require("./unversioned/expo-splash-screen/expo-splash-screen"));

  _expoSplashScreen = function () {
    return data;
  };

  return data;
}

function _expoSystemUi() {
  const data = _interopRequireDefault(require("./unversioned/expo-system-ui/expo-system-ui"));

  _expoSystemUi = function () {
    return data;
  };

  return data;
}

function _expoUpdates() {
  const data = _interopRequireDefault(require("./unversioned/expo-updates"));

  _expoUpdates = function () {
    return data;
  };

  return data;
}

function _reactNativeMaps() {
  const data = _interopRequireDefault(require("./unversioned/react-native-maps"));

  _reactNativeMaps = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * These are the versioned first-party plugins with some of the future third-party plugins mixed in for legacy support.
 */
const debug = (0, _debug().default)('expo:prebuild-config');
/**
 * Config plugin to apply all of the custom Expo iOS config plugins we support by default.
 * TODO: In the future most of this should go into versioned packages like expo-facebook, expo-updates, etc...
 */

const withIosExpoPlugins = (config, {
  bundleIdentifier
}) => {
  // Set the bundle ID ahead of time.
  if (!config.ios) config.ios = {};
  config.ios.bundleIdentifier = bundleIdentifier;
  return (0, _configPlugins().withPlugins)(config, [[_configPlugins().IOSConfig.BundleIdentifier.withBundleIdentifier, {
    bundleIdentifier
  }], _configPlugins().IOSConfig.Swift.withSwiftBridgingHeader, _configPlugins().IOSConfig.Swift.withNoopSwiftFile, _configPlugins().IOSConfig.Google.withGoogle, _configPlugins().IOSConfig.Name.withDisplayName, _configPlugins().IOSConfig.Name.withProductName, _configPlugins().IOSConfig.Orientation.withOrientation, _configPlugins().IOSConfig.RequiresFullScreen.withRequiresFullScreen, _configPlugins().IOSConfig.Scheme.withScheme, _configPlugins().IOSConfig.UsesNonExemptEncryption.withUsesNonExemptEncryption, _configPlugins().IOSConfig.Version.withBuildNumber, _configPlugins().IOSConfig.Version.withVersion, _configPlugins().IOSConfig.Google.withGoogleServicesFile, _configPlugins().IOSConfig.BuildProperties.withJsEnginePodfileProps, // Entitlements
  _configPlugins().IOSConfig.Entitlements.withAssociatedDomains, // XcodeProject
  _configPlugins().IOSConfig.DeviceFamily.withDeviceFamily, _configPlugins().IOSConfig.Bitcode.withBitcode, _configPlugins().IOSConfig.Locales.withLocales, // Dangerous
  _withIosIcons().withIosIcons]);
};
/**
 * Config plugin to apply all of the custom Expo Android config plugins we support by default.
 * TODO: In the future most of this should go into versioned packages like expo-facebook, expo-updates, etc...
 */


exports.withIosExpoPlugins = withIosExpoPlugins;

const withAndroidExpoPlugins = (config, props) => {
  // Set the package name ahead of time.
  if (!config.android) config.android = {};
  config.android.package = props.package;
  return (0, _configPlugins().withPlugins)(config, [// gradle.properties
  _configPlugins().AndroidConfig.BuildProperties.withJsEngineGradleProps, // settings.gradle
  _configPlugins().AndroidConfig.Name.withNameSettingsGradle, // project build.gradle
  _configPlugins().AndroidConfig.GoogleServices.withClassPath, // app/build.gradle
  _configPlugins().AndroidConfig.GoogleServices.withApplyPlugin, _configPlugins().AndroidConfig.Package.withPackageGradle, _configPlugins().AndroidConfig.Version.withVersion, // AndroidManifest.xml
  _configPlugins().AndroidConfig.Package.withPackageManifest, _configPlugins().AndroidConfig.AllowBackup.withAllowBackup, _configPlugins().AndroidConfig.WindowSoftInputMode.withWindowSoftInputMode, // Note: The withAndroidIntentFilters plugin must appear before the withScheme
  // plugin or withScheme will override the output of withAndroidIntentFilters.
  _configPlugins().AndroidConfig.IntentFilters.withAndroidIntentFilters, _configPlugins().AndroidConfig.Scheme.withScheme, _configPlugins().AndroidConfig.Orientation.withOrientation, _configPlugins().AndroidConfig.Permissions.withInternalBlockedPermissions, _configPlugins().AndroidConfig.Permissions.withPermissions, // strings.xml
  _configPlugins().AndroidConfig.Name.withName, // Dangerous -- these plugins run in reverse order.
  _configPlugins().AndroidConfig.GoogleServices.withGoogleServicesFile, // Modify colors.xml and styles.xml
  _configPlugins().AndroidConfig.StatusBar.withStatusBar, _configPlugins().AndroidConfig.PrimaryColor.withPrimaryColor, _withAndroidIcons().withAndroidIcons, // If we renamed the package, we should also move it around and rename it in source files
  // Added last to ensure this plugin runs first. Out of tree solutions will mistakenly resolve the package incorrectly otherwise.
  _configPlugins().AndroidConfig.Package.withPackageRefactor]);
}; // Must keep in sync with `withVersionedExpoSDKPlugins`


exports.withAndroidExpoPlugins = withAndroidExpoPlugins;
const versionedExpoSDKPackages = ['react-native-maps', 'expo-ads-admob', 'expo-apple-authentication', 'expo-contacts', 'expo-notifications', 'expo-updates', 'expo-branch', 'expo-navigation-bar', 'expo-document-picker', 'expo-facebook', 'expo-splash-screen', 'expo-system-ui'];

const withVersionedExpoSDKPlugins = (config, {
  expoUsername
}) => {
  return (0, _configPlugins().withPlugins)(config, [_reactNativeMaps().default, _expoAdsAdmob().default, _expoAppleAuthentication().default, _expoContacts().default, _expoNotifications().default, [_expoUpdates().default, {
    expoUsername
  }], _expoBranch().default, _expoDocumentPicker().default, _expoFacebook().default, // System UI must come before splash screen as they overlap
  // and splash screen will warn about conflicting rules.
  _expoSystemUi().default, _expoSplashScreen().default, _expoNavigationBar().default]);
};

exports.withVersionedExpoSDKPlugins = withVersionedExpoSDKPlugins;

function getAutoPlugins() {
  return versionedExpoSDKPackages.concat(legacyExpoPlugins).concat(expoManagedVersionedPlugins);
}

function getLegacyExpoPlugins() {
  return legacyExpoPlugins;
} // Expo managed packages that require extra update.
// These get applied automatically to create parity with expo build in eas build.


const legacyExpoPlugins = ['expo-app-auth', 'expo-av', 'expo-background-fetch', 'expo-barcode-scanner', 'expo-brightness', 'expo-calendar', 'expo-camera', 'expo-cellular', 'expo-dev-menu', 'expo-dev-launcher', 'expo-dev-client', 'expo-image-picker', 'expo-file-system', 'expo-ads-facebook', 'expo-location', 'expo-media-library', 'expo-screen-orientation', 'expo-sensors', 'expo-task-manager', 'expo-local-authentication']; // Plugins that need to be automatically applied, but also get applied by expo-cli if the versioned plugin isn't available.
// These are split up because the user doesn't need to be prompted to setup these packages.

const expoManagedVersionedPlugins = ['expo-firebase-analytics', 'expo-firebase-core', 'expo-google-sign-in'];

const withOptionalLegacyPlugins = (config, plugins) => {
  return plugins.reduce((prev, plugin) => {
    if ((0, _getAutolinkedPackages().shouldSkipAutoPlugin)(config, plugin)) {
      debug('Skipping unlinked auto plugin:', plugin);
      return prev;
    }

    return (0, _configPlugins().withStaticPlugin)(prev, {
      // hide errors
      _isLegacyPlugin: true,
      plugin,
      // If a plugin doesn't exist, do nothing.
      fallback: config => config
    });
  }, config);
};

function withLegacyExpoPlugins(config) {
  return withOptionalLegacyPlugins(config, [...new Set(expoManagedVersionedPlugins.concat(legacyExpoPlugins))]);
}
//# sourceMappingURL=withDefaultPlugins.js.map