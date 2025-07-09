"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extrapolateGroups = exports.generateDynamic = void 0;
exports.getRoutes = getRoutes;
exports.getExactRoutes = getExactRoutes;
const getRoutesCore_1 = require("./getRoutesCore");
/**
 * Given a Metro context module, return an array of nested routes.
 *
 * This is a two step process:
 *  1. Convert the RequireContext keys (file paths) into a directory tree.
 *      - This should extrapolate array syntax into multiple routes
 *      - Routes are given a specificity score
 *  2. Flatten the directory tree into routes
 *      - Routes in directories without _layout files are hoisted to the nearest _layout
 *      - The name of the route is relative to the nearest _layout
 *      - If multiple routes have the same name, the most specific route is used
 */
function getRoutes(contextModule, options = {}) {
    return (0, getRoutesCore_1.getRoutes)(contextModule, {
        getSystemRoute({ route, type, defaults, redirectConfig, rewriteConfig }) {
            if (route === '' && type === 'layout') {
                // Root layout when no layout is defined.
                return {
                    type: 'layout',
                    loadRoute: () => ({
                        default: require('./views/Navigator')
                            .DefaultNavigator,
                    }),
                    // Generate a fake file name for the directory
                    contextKey: 'expo-router/build/views/Navigator.js',
                    route: '',
                    generated: true,
                    dynamic: null,
                    children: [],
                };
            }
            else if (route === '_sitemap' && type === 'route') {
                return {
                    loadRoute() {
                        const { Sitemap, getNavOptions } = require('./views/Sitemap');
                        return { default: Sitemap, getNavOptions };
                    },
                    route: '_sitemap',
                    type: 'route',
                    contextKey: 'expo-router/build/views/Sitemap.js',
                    generated: true,
                    internal: true,
                    dynamic: null,
                    children: [],
                };
            }
            else if (route === '+not-found' && type === 'route') {
                return {
                    loadRoute() {
                        return { default: require('./views/Unmatched').Unmatched };
                    },
                    type: 'route',
                    route: '+not-found',
                    contextKey: 'expo-router/build/views/Unmatched.js',
                    generated: true,
                    internal: true,
                    dynamic: [{ name: '+not-found', deep: true, notFound: true }],
                    children: [],
                };
            }
            else if (type === 'redirect' && redirectConfig && defaults) {
                return {
                    ...defaults,
                    loadRoute() {
                        return require('./getRoutesRedirects').getRedirectModule(redirectConfig);
                    },
                };
            }
            else if (type === 'rewrite' && rewriteConfig && defaults) {
                return {
                    ...defaults,
                    loadRoute() {
                        // TODO: Replace with rewrite module
                        return require('./getRoutesRedirects').getRedirectModule(rewriteConfig);
                    },
                };
            }
            throw new Error(`Unknown system route: ${route} and type: ${type} and redirectConfig: ${redirectConfig} and rewriteConfig: ${rewriteConfig}`);
        },
        ...options,
    });
}
function getExactRoutes(contextModule, options = {}) {
    return getRoutes(contextModule, {
        ...options,
        skipGenerated: true,
    });
}
var getRoutesCore_2 = require("./getRoutesCore");
Object.defineProperty(exports, "generateDynamic", { enumerable: true, get: function () { return getRoutesCore_2.generateDynamic; } });
Object.defineProperty(exports, "extrapolateGroups", { enumerable: true, get: function () { return getRoutesCore_2.extrapolateGroups; } });
//# sourceMappingURL=getRoutes.js.map