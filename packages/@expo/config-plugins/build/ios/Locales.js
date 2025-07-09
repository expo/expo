"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLocales = getLocales;
exports.setLocalesAsync = setLocalesAsync;
exports.withLocales = void 0;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
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
function _Xcodeproj() {
  const data = require("./utils/Xcodeproj");
  _Xcodeproj = function () {
    return data;
  };
  return data;
}
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
function _locales() {
  const data = require("../utils/locales");
  _locales = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const withLocales = config => {
  return (0, _iosPlugins().withXcodeProject)(config, async config => {
    config.modResults = await setLocalesAsync(config, {
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
async function setLocalesAsync(config, {
  projectRoot,
  project
}) {
  const locales = getLocales(config);
  if (!locales) {
    return project;
  }
  // possibly validate CFBundleAllowMixedLocalizations is enabled
  const localesMap = await (0, _locales().getResolvedLocalesAsync)(projectRoot, locales, 'ios');
  const projectName = (0, _Xcodeproj().getProjectName)(projectRoot);
  const supportingDirectory = _path().default.join(projectRoot, 'ios', projectName, 'Supporting');

  // TODO: Should we delete all before running? Revisit after we land on a lock file.
  const stringName = 'InfoPlist.strings';
  for (const [lang, localizationObj] of Object.entries(localesMap)) {
    const dir = _path().default.join(supportingDirectory, `${lang}.lproj`);
    // await fs.ensureDir(dir);
    await _fs().default.promises.mkdir(dir, {
      recursive: true
    });
    const strings = _path().default.join(dir, stringName);
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
      project = (0, _Xcodeproj().addResourceFileToGroup)({
        filepath: _path().default.relative(supportingDirectory, strings),
        groupName,
        project,
        isBuildFile: true,
        verbose: true
      });
    }
  }
  return project;
}
//# sourceMappingURL=Locales.js.map