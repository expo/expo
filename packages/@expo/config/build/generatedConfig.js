"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendShallowGeneratedConfig = appendShallowGeneratedConfig;
exports.getGeneratedConfigPath = getGeneratedConfigPath;
exports.withInternalGeneratedConfig = withInternalGeneratedConfig;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
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
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = require('debug')('expo:config:generated');
function withInternalGeneratedConfig(projectRoot, config) {
  const safeLoadGeneratedConfig = generatedPath => {
    if (!generatedPath) {
      return null;
    }
    try {
      const rawGenerated = _fs().default.readFileSync(generatedPath, 'utf8');
      return JSON.parse(rawGenerated);
    } catch {
      return null;
    }
  };
  const generatedConfigs = [safeLoadGeneratedConfig(_path().default.join(projectRoot, '.expo', 'generated', `app.config.json`)), safeLoadGeneratedConfig((0, _getenv().string)('__EXPO_GENERATED_CONFIG_PATH', ''))].filter(Boolean);
  if (!generatedConfigs.length) {
    return config;
  }
  for (const generated of generatedConfigs) {
    const generatedOrigin = generated['expo.extra.router.generatedOrigin'];
    if (typeof generatedOrigin === 'string') {
      config.extra ??= {};
      config.extra.router ??= {};
      config.extra.router.generatedOrigin = generatedOrigin;
    }
  }
  return config;
}
function getGeneratedConfigPath(projectRoot) {
  if ((0, _getenv().boolish)('CI', false)) {
    return _path().default.join(projectRoot, '.expo', 'generated', `app.config.json`);
  }
  return (0, _getenv().string)('__EXPO_GENERATED_CONFIG_PATH', '') || null;
}
function appendShallowGeneratedConfig(appendedValues, {
  projectRoot
}) {
  const generatedConfigPath = getGeneratedConfigPath(projectRoot);
  if (!generatedConfigPath) {
    debug('No generated config path available.');
    return false;
  }
  let generatedConfig = {};
  try {
    const rawGeneratedConfig = _fs().default.readFileSync(generatedConfigPath, 'utf8');
    generatedConfig = JSON.parse(rawGeneratedConfig);
  } catch {}
  const updatedGeneratedConfig = {
    ...generatedConfig,
    ...appendedValues
  };
  try {
    _fs().default.mkdirSync(_path().default.dirname(generatedConfigPath), {
      recursive: true
    });
    _fs().default.writeFileSync(generatedConfigPath, JSON.stringify(updatedGeneratedConfig), 'utf8');
    return true;
  } catch (error) {
    debug('Failed to write generated config.', generatedConfigPath, error);
  }
  return false;
}
//# sourceMappingURL=generatedConfig.js.map