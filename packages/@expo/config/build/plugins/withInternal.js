"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withInternal = exports.EXPO_DEBUG = void 0;
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
    return data;
  };
  return data;
}
const EXPO_DEBUG = exports.EXPO_DEBUG = (0, _getenv().boolish)('EXPO_DEBUG', false);

/**
 * Adds the _internal object.
 *
 * @param config
 * @param projectRoot
 */
const withInternal = (config, internals) => {
  if (!config._internal) {
    config._internal = {};
  }
  config._internal = {
    isDebug: EXPO_DEBUG,
    ...config._internal,
    ...internals
  };
  return config;
};
exports.withInternal = withInternal;
//# sourceMappingURL=withInternal.js.map