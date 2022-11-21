"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAndroidManifestPlugin = createAndroidManifestPlugin;
exports.createStringsXmlPlugin = createStringsXmlPlugin;
exports.withStringsXml = exports.withSettingsGradle = exports.withProjectBuildGradle = exports.withMainApplication = exports.withMainActivity = exports.withGradleProperties = exports.withAppBuildGradle = exports.withAndroidStyles = exports.withAndroidManifest = exports.withAndroidColorsNight = exports.withAndroidColors = void 0;
function _withMod() {
  const data = require("./withMod");
  _withMod = function () {
    return data;
  };
  return data;
}
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
function createAndroidManifestPlugin(action, name) {
  const withUnknown = config => withAndroidManifest(config, async config => {
    config.modResults = await action(config, config.modResults);
    return config;
  });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name
    });
  }
  return withUnknown;
}
function createStringsXmlPlugin(action, name) {
  const withUnknown = config => withStringsXml(config, async config => {
    config.modResults = await action(config, config.modResults);
    return config;
  });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name
    });
  }
  return withUnknown;
}

/**
 * Provides the AndroidManifest.xml for modification.
 *
 * @param config
 * @param action
 */
const withAndroidManifest = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'manifest',
    action
  });
};

/**
 * Provides the strings.xml for modification.
 *
 * @param config
 * @param action
 */
exports.withAndroidManifest = withAndroidManifest;
const withStringsXml = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'strings',
    action
  });
};

/**
 * Provides the `android/app/src/main/res/values/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
exports.withStringsXml = withStringsXml;
const withAndroidColors = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'colors',
    action
  });
};

/**
 * Provides the `android/app/src/main/res/values-night/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
exports.withAndroidColors = withAndroidColors;
const withAndroidColorsNight = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'colorsNight',
    action
  });
};

/**
 * Provides the `android/app/src/main/res/values/styles.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
exports.withAndroidColorsNight = withAndroidColorsNight;
const withAndroidStyles = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'styles',
    action
  });
};

/**
 * Provides the project MainActivity for modification.
 *
 * @param config
 * @param action
 */
exports.withAndroidStyles = withAndroidStyles;
const withMainActivity = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'mainActivity',
    action
  });
};

/**
 * Provides the project MainApplication for modification.
 *
 * @param config
 * @param action
 */
exports.withMainActivity = withMainActivity;
const withMainApplication = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'mainApplication',
    action
  });
};

/**
 * Provides the project /build.gradle for modification.
 *
 * @param config
 * @param action
 */
exports.withMainApplication = withMainApplication;
const withProjectBuildGradle = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'projectBuildGradle',
    action
  });
};

/**
 * Provides the app/build.gradle for modification.
 *
 * @param config
 * @param action
 */
exports.withProjectBuildGradle = withProjectBuildGradle;
const withAppBuildGradle = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'appBuildGradle',
    action
  });
};

/**
 * Provides the /settings.gradle for modification.
 *
 * @param config
 * @param action
 */
exports.withAppBuildGradle = withAppBuildGradle;
const withSettingsGradle = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'settingsGradle',
    action
  });
};

/**
 * Provides the /gradle.properties for modification.
 *
 * @param config
 * @param action
 */
exports.withSettingsGradle = withSettingsGradle;
const withGradleProperties = (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: 'android',
    mod: 'gradleProperties',
    action
  });
};
exports.withGradleProperties = withGradleProperties;
//# sourceMappingURL=android-plugins.js.map