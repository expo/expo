"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavigationConfig = getNavigationConfig;
exports.getLinkingConfig = getLinkingConfig;
const native_1 = require("@react-navigation/native");
const expo_modules_core_1 = require("expo-modules-core");
const constants_1 = require("./constants");
const getReactNavigationConfig_1 = require("./getReactNavigationConfig");
const getRoutesRedirects_1 = require("./getRoutesRedirects");
const linking_1 = require("./link/linking");
function getNavigationConfig(routes, metaOnly, { sitemap, notFound }) {
    const config = (0, getReactNavigationConfig_1.getReactNavigationConfig)(routes, metaOnly);
    const sitemapRoute = (() => {
        const path = '_sitemap';
        if (sitemap === false || isPathInRootConfig(config, path)) {
            return {};
        }
        return generateLinkingPathInRoot(constants_1.SITEMAP_ROUTE_NAME, path, metaOnly);
    })();
    const notFoundRoute = (() => {
        const path = '*not-found';
        if (notFound === false || isPathInRootConfig(config, path)) {
            return {};
        }
        return generateLinkingPathInRoot(constants_1.NOT_FOUND_ROUTE_NAME, path, metaOnly);
    })();
    return {
        screens: {
            [constants_1.INTERNAL_SLOT_NAME]: {
                path: '',
                ...config,
            },
            ...sitemapRoute,
            ...notFoundRoute,
        },
    };
}
function getLinkingConfig(routes, context, getRouteInfo, { metaOnly = true, serverUrl, redirects, skipGenerated, sitemap, notFound, }) {
    // Returning `undefined` / `null from `getInitialURL` are valid values, so we need to track if it's been called.
    let hasCachedInitialUrl = false;
    let initialUrl;
    const nativeLinkingKey = context
        .keys()
        .find((key) => key.match(/^\.\/\+native-intent\.[tj]sx?$/));
    const nativeLinking = nativeLinkingKey
        ? context(nativeLinkingKey)
        : undefined;
    const config = getNavigationConfig(routes, metaOnly, {
        sitemap: skipGenerated ? false : sitemap,
        notFound: skipGenerated ? false : notFound,
    });
    return {
        prefixes: [],
        config,
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
                        initialUrl = (0, getRoutesRedirects_1.applyRedirects)(initialUrl, redirects);
                        if (initialUrl && typeof nativeLinking?.redirectSystemPath === 'function') {
                            initialUrl = nativeLinking.redirectSystemPath({ path: initialUrl, initial: true });
                        }
                    }
                    else if (initialUrl) {
                        initialUrl = initialUrl.then((url) => {
                            url = (0, getRoutesRedirects_1.applyRedirects)(url, redirects);
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
        subscribe: (0, linking_1.subscribe)(nativeLinking, redirects),
        getStateFromPath: (path, options) => {
            return (0, linking_1.getStateFromPath)(path, options, getRouteInfo().segments);
        },
        getPathFromState(state, options) {
            return ((0, linking_1.getPathFromState)(state, {
                ...config,
                ...options,
                screens: config.screens ?? options?.screens ?? {},
            }) ?? '/');
        },
        // Add all functions to ensure the types never need to fallback.
        // This is a convenience for usage in the package.
        getActionFromState: native_1.getActionFromState,
    };
}
function isPathInRootConfig(config, path) {
    return Object.values(config.screens).some((screenConfig) => typeof screenConfig === 'string' ? screenConfig === path : screenConfig.path === path);
}
function generateLinkingPathInRoot(name, path, metaOnly) {
    if (metaOnly) {
        return { [name]: path };
    }
    return {
        [name]: { path },
    };
}
//# sourceMappingURL=getLinkingConfig.js.map