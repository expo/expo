"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withGradleProperties = exports.withSettingsGradle = exports.withAppBuildGradle = exports.withProjectBuildGradle = exports.withMainApplication = exports.withMainActivity = exports.withAndroidStyles = exports.withAndroidColorsNight = exports.withAndroidColors = exports.withStringsXml = exports.withAndroidManifest = exports.createStringsXmlPlugin = exports.createAndroidManifestPlugin = void 0;
const withMod_1 = require("./withMod");
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
function createAndroidManifestPlugin(action, name) {
    const withUnknown = (config) => (0, exports.withAndroidManifest)(config, async (config) => {
        config.modResults = await action(config, config.modResults);
        return config;
    });
    if (name) {
        Object.defineProperty(withUnknown, 'name', {
            value: name,
        });
    }
    return withUnknown;
}
exports.createAndroidManifestPlugin = createAndroidManifestPlugin;
function createStringsXmlPlugin(action, name) {
    const withUnknown = (config) => (0, exports.withStringsXml)(config, async (config) => {
        config.modResults = await action(config, config.modResults);
        return config;
    });
    if (name) {
        Object.defineProperty(withUnknown, 'name', {
            value: name,
        });
    }
    return withUnknown;
}
exports.createStringsXmlPlugin = createStringsXmlPlugin;
/**
 * Provides the AndroidManifest.xml for modification.
 *
 * @param config
 * @param action
 */
const withAndroidManifest = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'manifest',
        action,
    });
};
exports.withAndroidManifest = withAndroidManifest;
/**
 * Provides the strings.xml for modification.
 *
 * @param config
 * @param action
 */
const withStringsXml = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'strings',
        action,
    });
};
exports.withStringsXml = withStringsXml;
/**
 * Provides the `android/app/src/main/res/values/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
const withAndroidColors = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'colors',
        action,
    });
};
exports.withAndroidColors = withAndroidColors;
/**
 * Provides the `android/app/src/main/res/values-night/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
const withAndroidColorsNight = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'colorsNight',
        action,
    });
};
exports.withAndroidColorsNight = withAndroidColorsNight;
/**
 * Provides the `android/app/src/main/res/values/styles.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
const withAndroidStyles = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'styles',
        action,
    });
};
exports.withAndroidStyles = withAndroidStyles;
/**
 * Provides the project MainActivity for modification.
 *
 * @param config
 * @param action
 */
const withMainActivity = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'mainActivity',
        action,
    });
};
exports.withMainActivity = withMainActivity;
/**
 * Provides the project MainApplication for modification.
 *
 * @param config
 * @param action
 */
const withMainApplication = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'mainApplication',
        action,
    });
};
exports.withMainApplication = withMainApplication;
/**
 * Provides the project /build.gradle for modification.
 *
 * @param config
 * @param action
 */
const withProjectBuildGradle = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'projectBuildGradle',
        action,
    });
};
exports.withProjectBuildGradle = withProjectBuildGradle;
/**
 * Provides the app/build.gradle for modification.
 *
 * @param config
 * @param action
 */
const withAppBuildGradle = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'appBuildGradle',
        action,
    });
};
exports.withAppBuildGradle = withAppBuildGradle;
/**
 * Provides the /settings.gradle for modification.
 *
 * @param config
 * @param action
 */
const withSettingsGradle = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'settingsGradle',
        action,
    });
};
exports.withSettingsGradle = withSettingsGradle;
/**
 * Provides the /gradle.properties for modification.
 *
 * @param config
 * @param action
 */
const withGradleProperties = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'android',
        mod: 'gradleProperties',
        action,
    });
};
exports.withGradleProperties = withGradleProperties;
