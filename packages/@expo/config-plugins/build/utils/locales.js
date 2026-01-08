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
/**
 * on iOS only, we support a special case where
 * StringsMap contains a 'Localizable.strings'?: StringsMap; entry
 * Values written into `Localizable.strings` for iOS.
 */

async function getResolvedLocalesAsync(projectRoot, input, forPlatform) {
  const locales = {};
  const localizableStringsIOS = {};
  for (const [lang, localeJsonPath] of Object.entries(input)) {
    const locale = await getLocales(projectRoot, localeJsonPath, forPlatform, lang);
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
        const {
          localizableStringsEntry,
          otherEntries
        } = extractIosLocalizableStrings({
          ios,
          lang
        });
        if (localizableStringsEntry) {
          localizableStringsIOS[lang] = localizableStringsEntry;
        }
        locales[lang] = {
          ...rest,
          ...otherEntries
        };
      } else {
        locales[lang] = {
          ...rest,
          ...android
        };
      }
    }
  }
  return {
    localesMap: locales,
    localizableStringsIOS
  };
}
async function getLocales(projectRoot, localeJsonPath, forPlatform, lang) {
  if (typeof localeJsonPath === 'string') {
    try {
      return await _jsonFile().default.readAsync(_path().default.join(projectRoot, localeJsonPath));
    } catch {
      // Add a warning when a json file cannot be parsed.
      (0, _warnings().addWarningForPlatform)(forPlatform, `locales.${lang}`, `Failed to parse JSON of locale file for language: ${lang}`, 'https://docs.expo.dev/guides/localization/#translating-app-metadata');
      return null;
    }
  }

  // In the off chance that someone defined the locales json in the config, pass it directly to the object.
  // We do this to make the types more elegant.
  return localeJsonPath;
}
function extractIosLocalizableStrings({
  ios,
  lang
}) {
  const LOCALIZABLE_STR_ENTRY = 'Localizable.strings';
  if (!(LOCALIZABLE_STR_ENTRY in ios)) {
    return {
      localizableStringsEntry: undefined,
      otherEntries: ios
    };
  }
  const {
    [LOCALIZABLE_STR_ENTRY]: localizableStringsEntry,
    ...otherEntries
  } = ios;
  if (!localizableStringsEntry) {
    return {
      localizableStringsEntry: undefined,
      otherEntries
    };
  }
  if (!isStringsMap(localizableStringsEntry)) {
    (0, _warnings().addWarningForPlatform)('ios', `locales.${lang}.ios['${LOCALIZABLE_STR_ENTRY}']`, 'Expected a JSON object mapping string keys to string values', 'https://docs.expo.dev/guides/localization/#translating-app-metadata');
    return {
      localizableStringsEntry: undefined,
      otherEntries
    };
  }
  return {
    localizableStringsEntry,
    otherEntries
  };
}
function isStringsMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(item => typeof item === 'string');
}
//# sourceMappingURL=locales.js.map