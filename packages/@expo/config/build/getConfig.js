"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDynamicConfig = getDynamicConfig;
exports.getStaticConfig = getStaticConfig;

function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));

  _jsonFile = function () {
    return data;
  };

  return data;
}

function _fs() {
  const data = require("fs");

  _fs = function () {
    return data;
  };

  return data;
}

function _Errors() {
  const data = require("./Errors");

  _Errors = function () {
    return data;
  };

  return data;
}

function _evalConfig() {
  const data = require("./evalConfig");

  _evalConfig = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// We cannot use async config resolution right now because Next.js doesn't support async configs.
// If they don't add support for async Webpack configs then we may need to pull support for Next.js.
function readConfigFile(configFile, context) {
  // If the file doesn't exist then we should skip it and continue searching.
  if (!(0, _fs().existsSync)(configFile)) {
    return null;
  }

  try {
    return (0, _evalConfig().evalConfig)(configFile, context);
  } catch (error) {
    // @ts-ignore
    error.isConfigError = true;
    error.message = `Error reading Expo config at ${configFile}:\n\n${error.message}`;
    throw error;
  }
}

function getDynamicConfig(configPath, request) {
  const config = readConfigFile(configPath, request);

  if (config) {
    // The config must be serialized and evaluated ahead of time so the spawned process can send it over.
    return config;
  } // TODO: It seems this is only thrown if the file cannot be found (which may never happen).
  // If so we should throw a more helpful error.


  throw new (_Errors().ConfigError)(`Failed to read config at: ${configPath}`, 'INVALID_CONFIG');
}

function getStaticConfig(configPath) {
  const config = _jsonFile().default.read(configPath, {
    json5: true
  });

  if (config) {
    return config;
  }

  throw new (_Errors().ConfigError)(`Failed to read config at: ${configPath}`, 'INVALID_CONFIG');
}
//# sourceMappingURL=getConfig.js.map