"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLinkingConfig = getLinkingConfig;
exports.getNavigationConfig = getNavigationConfig;
exports.stateCache = void 0;
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
function _getReactNavigationConfig() {
  const data = require("./getReactNavigationConfig");
  _getReactNavigationConfig = function () {
    return data;
  };
  return data;
}
function _linking() {
  const data = require("./link/linking");
  _linking = function () {
    return data;
  };
  return data;
}
function getNavigationConfig(routes, metaOnly = true) {
  return (0, _getReactNavigationConfig().getReactNavigationConfig)(routes, metaOnly);
}
function getLinkingConfig(routes, metaOnly = true) {
  return {
    prefixes: [],
    // @ts-expect-error
    config: getNavigationConfig(routes, metaOnly),
    // A custom getInitialURL is used on native to ensure the app always starts at
    // the root path if it's launched from something other than a deep link.
    // This helps keep the native functionality working like the web functionality.
    // For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
    // then `/index` would be used on web and `/settings` would be used on native.
    getInitialURL: _linking().getInitialURL,
    subscribe: _linking().addEventListener,
    getStateFromPath: getStateFromPathMemoized,
    getPathFromState(state, options) {
      return (0, _linking().getPathFromState)(state, {
        screens: [],
        ...this.config,
        ...options
      }) ?? '/';
    },
    // Add all functions to ensure the types never need to fallback.
    // This is a convenience for usage in the package.
    getActionFromState: _native().getActionFromState
  };
}
const stateCache = exports.stateCache = new Map();

/** We can reduce work by memoizing the state by the pathname. This only works because the options (linking config) theoretically never change.  */
function getStateFromPathMemoized(path, options) {
  const cached = stateCache.get(path);
  if (cached) {
    return cached;
  }
  const result = (0, _linking().getStateFromPath)(path, options);
  stateCache.set(path, result);
  return result;
}
//# sourceMappingURL=getLinkingConfig.js.map