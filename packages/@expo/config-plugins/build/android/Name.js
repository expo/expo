"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyNameSettingsGradle = exports.getName = exports.withNameSettingsGradle = exports.withName = exports.sanitizeNameForGradle = void 0;
const Resources_1 = require("./Resources");
const Strings_1 = require("./Strings");
const android_plugins_1 = require("../plugins/android-plugins");
const warnings_1 = require("../utils/warnings");
/**
 * Sanitize a name, this should be used for files and gradle names.
 * - `[/, \, :, <, >, ", ?, *, |]` are not allowed
 * https://docs.gradle.org/4.2/release-notes.html#path-separator-characters-in-names-are-deprecated
 *
 * @param name
 */
function sanitizeNameForGradle(name) {
    // Remove escape characters which are valid in XML names but not in gradle.
    name = name.replace(/[\n\r\t]/g, '');
    // Gradle disallows these:
    // The project name 'My-Special 😃 Co/ol_Project' must not contain any of the following characters: [/, \, :, <, >, ", ?, *, |]. Set the 'rootProject.name' or adjust the 'include' statement (see https://docs.gradle.org/6.2/dsl/org.gradle.api.initialization.Settings.html#org.gradle.api.initialization.Settings:include(java.lang.String[]) for more details).
    return name.replace(/(\/|\\|:|<|>|"|\?|\*|\|)/g, '');
}
exports.sanitizeNameForGradle = sanitizeNameForGradle;
exports.withName = (0, android_plugins_1.createStringsXmlPlugin)(applyNameFromConfig, 'withName');
const withNameSettingsGradle = (config) => {
    return (0, android_plugins_1.withSettingsGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = applyNameSettingsGradle(config, config.modResults.contents);
        }
        else {
            (0, warnings_1.addWarningAndroid)('name', `Cannot automatically configure settings.gradle if it's not groovy`);
        }
        return config;
    });
};
exports.withNameSettingsGradle = withNameSettingsGradle;
function getName(config) {
    return typeof config.name === 'string' ? config.name : null;
}
exports.getName = getName;
function applyNameFromConfig(config, stringsJSON) {
    const name = getName(config);
    if (name) {
        return (0, Strings_1.setStringItem)([(0, Resources_1.buildResourceItem)({ name: 'app_name', value: name })], stringsJSON);
    }
    return (0, Strings_1.removeStringItem)('app_name', stringsJSON);
}
/**
 * Regex a name change -- fragile.
 *
 * @param config
 * @param settingsGradle
 */
function applyNameSettingsGradle(config, settingsGradle) {
    const name = sanitizeNameForGradle(getName(config) ?? '');
    // Select rootProject.name = '***' and replace the contents between the quotes.
    return settingsGradle.replace(/rootProject.name\s?=\s?(["'])(?:(?=(\\?))\2.)*?\1/g, `rootProject.name = '${name.replace(/'/g, "\\'")}'`);
}
exports.applyNameSettingsGradle = applyNameSettingsGradle;
