"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyNameSettingsGradle = applyNameSettingsGradle;
exports.getName = getName;
exports.sanitizeNameForGradle = sanitizeNameForGradle;
exports.withNameSettingsGradle = exports.withName = void 0;
function _Resources() {
  const data = require("./Resources");
  _Resources = function () {
    return data;
  };
  return data;
}
function _Strings() {
  const data = require("./Strings");
  _Strings = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
function _warnings() {
  const data = require("../utils/warnings");
  _warnings = function () {
    return data;
  };
  return data;
}
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
const withName = (0, _androidPlugins().createStringsXmlPlugin)(applyNameFromConfig, 'withName');
exports.withName = withName;
const withNameSettingsGradle = config => {
  return (0, _androidPlugins().withSettingsGradle)(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = applyNameSettingsGradle(config, config.modResults.contents);
    } else {
      (0, _warnings().addWarningAndroid)('name', `Cannot automatically configure settings.gradle if it's not groovy`);
    }
    return config;
  });
};
exports.withNameSettingsGradle = withNameSettingsGradle;
function getName(config) {
  return typeof config.name === 'string' ? config.name : null;
}
function applyNameFromConfig(config, stringsJSON) {
  const name = getName(config);
  if (name) {
    return (0, _Strings().setStringItem)([(0, _Resources().buildResourceItem)({
      name: 'app_name',
      value: name
    })], stringsJSON);
  }
  return (0, _Strings().removeStringItem)('app_name', stringsJSON);
}

/**
 * Regex a name change -- fragile.
 *
 * @param config
 * @param settingsGradle
 */
function applyNameSettingsGradle(config, settingsGradle) {
  var _getName;
  const name = sanitizeNameForGradle((_getName = getName(config)) !== null && _getName !== void 0 ? _getName : '');

  // Select rootProject.name = '***' and replace the contents between the quotes.
  return settingsGradle.replace(/rootProject.name\s?=\s?(["'])(?:(?=(\\?))\2.)*?\1/g, `rootProject.name = '${name.replace(/'/g, "\\'")}'`);
}
//# sourceMappingURL=Name.js.map