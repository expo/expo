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
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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