"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getResolvedLocalesAsync = getResolvedLocalesAsync;
function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));
  _jsonFile = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _warnings() {
  const data = require("./warnings");
  _warnings = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
async function getResolvedLocalesAsync(projectRoot, input, forPlatform) {
  const locales = {};
  for (const [lang, localeJsonPath] of Object.entries(input)) {
    let locale = null;
    if (typeof localeJsonPath === 'string') {
      try {
        locale = await _jsonFile().default.readAsync(_path().default.join(projectRoot, localeJsonPath));
      } catch {
        // Add a warning when a json file cannot be parsed.
        (0, _warnings().addWarningForPlatform)(forPlatform, `locales.${lang}`, `Failed to parse JSON of locale file for language: ${lang}`, 'https://docs.expo.dev/guides/localization/#translating-app-metadata');
      }
    } else {
      // In the off chance that someone defined the locales json in the config, pass it directly to the object.
      // We do this to make the types more elegant.
      locale = localeJsonPath;
    }
    if (locale) {
      const {
        android,
        ios,
        ...rest
      } = {
        android: {},
        ios: {},
        ...locale
      };
      if (forPlatform === 'ios') {
        locales[lang] = {
          ...rest,
          ...ios
        };
      } else {
        locales[lang] = {
          ...rest,
          ...android
        };
      }
    }
  }
  return locales;
}
//# sourceMappingURL=locales.js.map