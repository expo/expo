"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLocales = getLocales;
exports.withLocales = exports.setLocalesAsync = exports.getResolvedLocalesAsync = void 0;
function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));
  _jsonFile = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = require("path");
  _path = function () {
    return data;
  };
  return data;
}
function _Xcodeproj() {
  const data = require("./utils/Xcodeproj");
  _Xcodeproj = function () {
    return data;
  };
  return data;
}
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const withLocales = applePlatform => config => {
  return (0, _applePlugins().withXcodeProject)(applePlatform)(config, async config => {
    config.modResults = await setLocalesAsync(applePlatform)(config, {
      projectRoot: config.modRequest.projectRoot,
      project: config.modResults
    });
    return config;
  });
};
exports.withLocales = withLocales;
function getLocales(config) {
  return config.locales ?? null;
}
const setLocalesAsync = applePlatform => async (config, {
  projectRoot,
  project
}) => {
  const applePlatformDir = applePlatform;
  const locales = getLocales(config);
  if (!locales) {
    return project;
  }
  // possibly validate CFBundleAllowMixedLocalizations is enabled
  const localesMap = await getResolvedLocalesAsync(applePlatform)(projectRoot, locales);
  const projectName = (0, _Xcodeproj().getProjectName)(applePlatform)(projectRoot);
  const supportingDirectory = (0, _path().join)(projectRoot, applePlatformDir, projectName, 'Supporting');

  // TODO: Should we delete all before running? Revisit after we land on a lock file.
  const stringName = 'InfoPlist.strings';
  for (const [lang, localizationObj] of Object.entries(localesMap)) {
    const dir = (0, _path().join)(supportingDirectory, `${lang}.lproj`);
    // await fs.ensureDir(dir);
    await _fs().default.promises.mkdir(dir, {
      recursive: true
    });
    const strings = (0, _path().join)(dir, stringName);
    const buffer = [];
    for (const [plistKey, localVersion] of Object.entries(localizationObj)) {
      buffer.push(`${plistKey} = "${localVersion}";`);
    }
    // Write the file to the file system.
    await _fs().default.promises.writeFile(strings, buffer.join('\n'));
    const groupName = `${projectName}/Supporting/${lang}.lproj`;
    // deep find the correct folder
    const group = (0, _Xcodeproj().ensureGroupRecursively)(project, groupName);

    // Ensure the file doesn't already exist
    if (!group?.children.some(({
      comment
    }) => comment === stringName)) {
      // Only write the file if it doesn't already exist.
      project = (0, _Xcodeproj().addResourceFileToGroup)(applePlatform)({
        filepath: (0, _path().relative)(supportingDirectory, strings),
        groupName,
        project,
        isBuildFile: true,
        verbose: true
      });
    }
  }
  return project;
};
exports.setLocalesAsync = setLocalesAsync;
const getResolvedLocalesAsync = applePlatform => async (projectRoot, input) => {
  const locales = {};
  for (const [lang, localeJsonPath] of Object.entries(input)) {
    if (typeof localeJsonPath === 'string') {
      try {
        locales[lang] = await _jsonFile().default.readAsync((0, _path().join)(projectRoot, localeJsonPath));
      } catch {
        // Add a warning when a json file cannot be parsed.
        (0, _warnings().addWarningForPlatform)(applePlatform, `locales.${lang}`, `Failed to parse JSON of locale file for language: ${lang}`, 'https://docs.expo.dev/distribution/app-stores/#localizing-your-ios-app');
      }
    } else {
      // In the off chance that someone defined the locales json in the config, pass it directly to the object.
      // We do this to make the types more elegant.
      locales[lang] = localeJsonPath;
    }
  }
  return locales;
};
exports.getResolvedLocalesAsync = getResolvedLocalesAsync;
//# sourceMappingURL=Locales.js.map