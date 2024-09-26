"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkingConfig = exports.getNavigationConfig = void 0;
const native_1 = require("@react-navigation/native");
const expo_modules_core_1 = require("expo-modules-core");
const getReactNavigationConfig_1 = require("./getReactNavigationConfig");
const linking_1 = require("./link/linking");
function getNavigationConfig(routes, metaOnly = true) {
    return (0, getReactNavigationConfig_1.getReactNavigationConfig)(routes, metaOnly);
}
exports.getNavigationConfig = getNavigationConfig;
function getLinkingConfig(store, routes, context, { metaOnly = true, serverUrl } = {}) {
    // Returning `undefined` / `null from `getInitialURL` are valid values, so we need to track if it's been called.
    let hasCachedInitialUrl = false;
    let initialUrl;
    const nativeLinkingKey = context
        .keys()
        .find((key) => key.match(/^\.\/\+native-intent\.[tj]sx?$/));
    const nativeLinking = nativeLinkingKey
        ? context(nativeLinkingKey)
        : undefined;
    return {
        prefixes: [],
        config: getNavigationConfig(routes, metaOnly),
        // A custom getInitialURL is used on native to ensure the app always starts at
        // the root path if it's launched from something other than a deep link.
        // This helps keep the native functionality working like the web functionality.
        // For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
        // then `/index` would be used on web and `/settings` would be used on native.
        getInitialURL() {
            // Expo Router calls `getInitialURL` twice, which may confuse the user if they provide a custom `getInitialURL`.
            // Therefor we memoize the result.
            if (!hasCachedInitialUrl) {
                if (expo_modules_core_1.Platform.OS === 'web') {
                    initialUrl = serverUrl ?? (0, linking_1.getInitialURL)();
                }
                else {
                    initialUrl = serverUrl ?? (0, linking_1.getInitialURL)();
                    if (typeof initialUrl === 'string') {
                        if (typeof nativeLinking?.redirectSystemPath === 'function') {
                            initialUrl = nativeLinking.redirectSystemPath({ path: initialUrl, initial: true });
                        }
                    }
                    else if (initialUrl) {
                        initialUrl = initialUrl.then((url) => {
                            if (url && typeof nativeLinking?.redirectSystemPath === 'function') {
                                return nativeLinking.redirectSystemPath({ path: url, initial: true });
                            }
                            return url;
                        });
                    }
                }
                hasCachedInitialUrl = true;
            }
            return initialUrl;
        },
        subscribe: (0, linking_1.addEventListener)(nativeLinking),
        getStateFromPath: linking_1.getStateFromPath.bind(store),
        getPathFromState(state, options) {
            return ((0, linking_1.getPathFromState)(state, {
                screens: {},
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
//# sourceMappingURL=getLinkingConfig.js.map