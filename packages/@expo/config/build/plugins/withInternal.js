"use strict";

exports.__esModule = true;
exports.withInternal = exports.EXPO_DEBUG = void 0;
const EXPO_DEBUG = exports.EXPO_DEBUG = ['true', '1'].includes((process.env.EXPO_DEBUG ?? '').toLowerCase());

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