"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExpoHomeDirectory = getExpoHomeDirectory;
exports.getUserState = getUserState;
exports.getUserStatePath = getUserStatePath;

function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));

  _jsonFile = function () {
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

function _os() {
  const data = require("os");

  _os = function () {
    return data;
  };

  return data;
}

function path() {
  const data = _interopRequireWildcard(require("path"));

  path = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The ~/.expo directory is used to store authentication sessions,
// which are shared between EAS CLI and Expo CLI.
function getExpoHomeDirectory() {
  const home = (0, _os().homedir)();

  if (process.env.__UNSAFE_EXPO_HOME_DIRECTORY) {
    return process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
  } else if ((0, _getenv().boolish)('EXPO_STAGING', false)) {
    return path().join(home, '.expo-staging');
  } else if ((0, _getenv().boolish)('EXPO_LOCAL', false)) {
    return path().join(home, '.expo-local');
  }

  return path().join(home, '.expo');
}

function getUserStatePath() {
  return path().join(getExpoHomeDirectory(), 'state.json');
}

function getUserState() {
  return new (_jsonFile().default)(getUserStatePath(), {
    jsonParseErrorDefault: {},
    // This will ensure that an error isn't thrown if the file doesn't exist.
    cantReadFileDefault: {}
  });
}
//# sourceMappingURL=getUserState.js.map