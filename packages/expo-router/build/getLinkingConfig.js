"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateCache = exports.getLinkingConfig = exports.getNavigationConfig = void 0;
const native_1 = require("@react-navigation/native");
const getReactNavigationConfig_1 = require("./getReactNavigationConfig");
const linking_1 = require("./link/linking");
function getNavigationConfig(routes, metaOnly = true) {
    return (0, getReactNavigationConfig_1.getReactNavigationConfig)(routes, metaOnly);
}
exports.getNavigationConfig = getNavigationConfig;
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
        getInitialURL: linking_1.getInitialURL,
        subscribe: linking_1.addEventListener,
        getStateFromPath: getStateFromPathMemoized,
        getPathFromState(state, options) {
            return ((0, linking_1.getPathFromState)(state, {
                screens: [],
                ...this.config,
                ...options,
            }) ?? '/');
        },
        // Add all functions to ensure the types never need to fallback.
        // This is a convenience for usage in the package.
        getActionFromState: native_1.getActionFromState,
    };
}
exports.getLinkingConfig = getLinkingConfig;
exports.stateCache = new Map();
/** We can reduce work by memoizing the state by the pathname. This only works because the options (linking config) theoretically never change.  */
function getStateFromPathMemoized(path, options) {
    const cached = exports.stateCache.get(path);
    if (cached) {
        return cached;
    }
    const result = (0, linking_1.getStateFromPath)(path, options);
    exports.stateCache.set(path, result);
    return result;
}
//# sourceMappingURL=getLinkingConfig.js.map