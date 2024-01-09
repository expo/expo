"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPatchPlugin = createPatchPlugin;
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
    return data;
  };
  return data;
}
function _glob() {
  const data = require("glob");
  _glob = function () {
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
function _withMod() {
  const data = require("./withMod");
  _withMod = function () {
    return data;
  };
  return data;
}
function _withRunOnce() {
  const data = require("./withRunOnce");
  _withRunOnce = function () {
    return data;
  };
  return data;
}
function _gitPatch() {
  const data = require("../utils/gitPatch");
  _gitPatch = function () {
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
const EXPO_DEBUG = (0, _getenv().boolish)('EXPO_DEBUG', false);
const withPatchMod = (config, platform) => {
  return (0, _withMod().withMod)(config, {
    platform,
    mod: 'patch',
    action: async config => {
      var _config$_internal$tem, _config$_internal;
      const props = createPropsFromConfig(config);
      const projectRoot = config.modRequest.projectRoot;
      const templateChecksum = (_config$_internal$tem = (_config$_internal = config._internal) === null || _config$_internal === void 0 ? void 0 : _config$_internal.templateChecksum) !== null && _config$_internal$tem !== void 0 ? _config$_internal$tem : '';
      const patchFilePath = await determinePatchFilePathAsync(projectRoot, platform, templateChecksum, props);
      if (patchFilePath != null) {
        const changedLines = await (0, _gitPatch().getPatchChangedLinesAsync)(patchFilePath);
        if (changedLines > props.changedLinesLimit) {
          (0, _warnings().addWarningForPlatform)(platform, 'withPatchPlugin', `The patch file "${patchFilePath}" has ${changedLines} changed lines, which exceeds the limit of ${props.changedLinesLimit}.`);
        }
        await (0, _gitPatch().applyPatchAsync)(projectRoot, patchFilePath);
      }
      return config;
    }
  });
};
function createPatchPlugin(platform) {
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const pluginName = `with${platformName}PatchPlugin`;
  const withUnknown = config => {
    return (0, _withRunOnce().withRunOnce)(config, {
      plugin: config => withPatchMod(config, platform),
      name: pluginName
    });
  };
  Object.defineProperty(withUnknown, 'name', {
    value: pluginName
  });
  return withUnknown;
}
async function determinePatchFilePathAsync(projectRoot, platform, templateChecksum, props) {
  const patchRoot = _path().default.join(projectRoot, props.patchRoot);
  let patchFilePath = _path().default.join(patchRoot, `${platform}+${templateChecksum}.patch`);
  const patchFiles = await getPatchFilesAsync(patchRoot, platform, props);
  let patchExists = patchFiles.includes(_path().default.basename(patchFilePath));
  if (patchFiles.length > 0 && !patchExists) {
    const firstPatchFilePath = _path().default.join(patchRoot, patchFiles[0]);
    (0, _warnings().addWarningForPlatform)(platform, 'withPatchPlugin', `Having patch files in ${patchRoot} but none matching "${patchFilePath}", using "${firstPatchFilePath}" instead.`);
    patchFilePath = firstPatchFilePath;
    patchExists = true;
  } else if (patchFiles.length > 1) {
    (0, _warnings().addWarningForPlatform)(platform, 'withPatchPlugin', `Having multiple patch files in ${patchRoot} is not supported. Only matched patch file "${patchFilePath}" will be applied.`);
  }
  if (EXPO_DEBUG) {
    console.log(patchExists ? `[withPatchPlugin] Applying patch from ${patchFilePath}` : `[WithPatchPlugin] No patch found: ${patchFilePath}`);
  }
  if (!patchExists) {
    return null;
  }
  return patchFilePath;
}
async function getPatchFilesAsync(patchRoot, platform, props) {
  return await new Promise((resolve, reject) => {
    (0, _glob().glob)(`${platform}*.patch`, {
      cwd: patchRoot
    }, (error, matches) => {
      if (error) {
        reject(error);
      } else {
        resolve(matches);
      }
    });
  });
}
function createPropsFromConfig(config) {
  var _config$plugins$find$, _config$plugins, _config$plugins$find, _patchPluginConfig$pa, _patchPluginConfig$ch;
  const patchPluginConfig = (_config$plugins$find$ = (_config$plugins = config.plugins) === null || _config$plugins === void 0 ? void 0 : (_config$plugins$find = _config$plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'withPatchPlugin')) === null || _config$plugins$find === void 0 ? void 0 : _config$plugins$find[1]) !== null && _config$plugins$find$ !== void 0 ? _config$plugins$find$ : {};
  return {
    patchRoot: (_patchPluginConfig$pa = patchPluginConfig.patchRoot) !== null && _patchPluginConfig$pa !== void 0 ? _patchPluginConfig$pa : 'cng-patches',
    changedLinesLimit: (_patchPluginConfig$ch = patchPluginConfig.changedLinesLimit) !== null && _patchPluginConfig$ch !== void 0 ? _patchPluginConfig$ch : 300
  };
}
//# sourceMappingURL=withPatchPlugin.js.map