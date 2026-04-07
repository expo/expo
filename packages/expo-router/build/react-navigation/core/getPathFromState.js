"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathFromState = getPathFromState;
const queryString = __importStar(require("query-string"));
const getPatternParts_1 = require("./getPatternParts");
const validatePathConfig_1 = require("./validatePathConfig");
const getActiveRoute = (state) => {
    const route = typeof state.index === 'number'
        ? state.routes[state.index]
        : state.routes[state.routes.length - 1];
    if (route.state) {
        return getActiveRoute(route.state);
    }
    return route;
};
const cachedNormalizedConfigs = new WeakMap();
const getNormalizedConfigs = (options) => {
    if (!options?.screens)
        return {};
    const cached = cachedNormalizedConfigs.get(options?.screens);
    if (cached)
        return cached;
    const normalizedConfigs = createNormalizedConfigs(options.screens);
    cachedNormalizedConfigs.set(options.screens, normalizedConfigs);
    return normalizedConfigs;
};
/**
 * Utility to serialize a navigation state object to a path string.
 *
 * @example
 * ```js
 * getPathFromState(
 *   {
 *     routes: [
 *       {
 *         name: 'Chat',
 *         params: { author: 'Jane', id: 42 },
 *       },
 *     ],
 *   },
 *   {
 *     screens: {
 *       Chat: {
 *         path: 'chat/:author/:id',
 *         stringify: { author: author => author.toLowerCase() }
 *       }
 *     }
 *   }
 * )
 * ```
 *
 * @param state Navigation state to serialize.
 * @param options Extra options to fine-tune how to serialize the path.
 * @returns Path representing the state, e.g. /foo/bar?count=42.
 */
function getPathFromState(state, options) {
    if (state == null) {
        throw Error(`Got '${String(state)}' for the navigation state. You must pass a valid state object.`);
    }
    if (options) {
        (0, validatePathConfig_1.validatePathConfig)(options);
    }
    const configs = getNormalizedConfigs(options);
    let path = '/';
    let current = state;
    const allParams = {};
    while (current) {
        let index = typeof current.index === 'number' ? current.index : 0;
        let route = current.routes[index];
        let parts;
        let focusedParams;
        let currentOptions = configs;
        const focusedRoute = getActiveRoute(state);
        // Keep all the route names that appeared during going deeper in config in case the pattern is resolved to undefined
        const nestedRouteNames = [];
        let hasNext = true;
        while (route.name in currentOptions && hasNext) {
            parts = currentOptions[route.name].parts;
            nestedRouteNames.push(route.name);
            if (route.params) {
                const options = currentOptions[route.name];
                const currentParams = Object.fromEntries(Object.entries(route.params)
                    .map(([key, value]) => {
                    if (value === undefined) {
                        if (options) {
                            const optional = options.parts?.find((part) => part.param === key)?.optional;
                            if (optional) {
                                return null;
                            }
                        }
                        else {
                            return null;
                        }
                    }
                    const stringify = options?.stringify?.[key] ?? String;
                    return [key, stringify(value)];
                })
                    .filter((entry) => entry != null));
                if (parts?.length) {
                    Object.assign(allParams, currentParams);
                }
                if (focusedRoute === route) {
                    // If this is the focused route, keep the params for later use
                    // We save it here since it's been stringified already
                    focusedParams = { ...currentParams };
                    parts
                        // eslint-disable-next-line no-loop-func
                        ?.forEach(({ param }) => {
                        if (param) {
                            // Remove the params present in the pattern since we'll only use the rest for query string
                            if (focusedParams) {
                                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                                delete focusedParams[param];
                            }
                        }
                    });
                }
            }
            // If there is no `screens` property or no nested state, we return pattern
            if (!currentOptions[route.name].screens || route.state === undefined) {
                hasNext = false;
            }
            else {
                index =
                    typeof route.state.index === 'number' ? route.state.index : route.state.routes.length - 1;
                const nextRoute = route.state.routes[index];
                const nestedConfig = currentOptions[route.name].screens;
                // if there is config for next route name, we go deeper
                if (nestedConfig && nextRoute.name in nestedConfig) {
                    route = nextRoute;
                    currentOptions = nestedConfig;
                }
                else {
                    // If not, there is no sense in going deeper in config
                    hasNext = false;
                }
            }
        }
        if (currentOptions[route.name] !== undefined) {
            path += parts
                ?.map(({ segment, param, optional }) => {
                // We don't know what to show for wildcard patterns
                // Showing the route name seems ok, though whatever we show here will be incorrect
                // Since the page doesn't actually exist
                if (segment === '*') {
                    return route.name;
                }
                // If the path has a pattern for a param, put the param in the path
                if (param) {
                    const value = allParams[param];
                    if (value === undefined && optional) {
                        // Optional params without value assigned in route.params should be ignored
                        return '';
                    }
                    // Valid characters according to
                    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.3 (see pchar definition)
                    return Array.from(String(value))
                        .map((char) => /[^A-Za-z0-9\-._~!$&'()*+,;=:@]/g.test(char) ? encodeURIComponent(char) : char)
                        .join('');
                }
                return encodeURIComponent(segment);
            })
                .join('/');
        }
        else {
            path += encodeURIComponent(route.name);
        }
        if (!focusedParams && focusedRoute.params) {
            focusedParams = Object.fromEntries(Object.entries(focusedRoute.params).map(([key, value]) => [key, String(value)]));
        }
        if (route.state) {
            path += '/';
        }
        else if (focusedParams) {
            for (const param in focusedParams) {
                if (focusedParams[param] === 'undefined') {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete focusedParams[param];
                }
            }
            const query = queryString.stringify(focusedParams, { sort: false });
            if (query) {
                path += `?${query}`;
            }
        }
        current = route.state;
    }
    // Include the root path if specified
    if (options?.path) {
        path = `${options.path}/${path}`;
    }
    // Remove multiple as well as trailing slashes
    path = path.replace(/\/+/g, '/');
    path = path.length > 1 ? path.replace(/\/$/, '') : path;
    // If path doesn't start with a slash, add it
    // This makes sure that history.pushState will update the path correctly instead of appending
    if (!path.startsWith('/')) {
        path = `/${path}`;
    }
    return path;
}
const createConfigItem = (config, parentParts) => {
    if (typeof config === 'string') {
        // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
        const parts = (0, getPatternParts_1.getPatternParts)(config);
        if (parentParts) {
            return { parts: [...parentParts, ...parts] };
        }
        return { parts };
    }
    if (config.exact && config.path === undefined) {
        throw new Error("A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`.");
    }
    // If an object is specified as the value (e.g. Foo: { ... }),
    // It can have `path` property and `screens` prop which has nested configs
    const parts = config.exact !== true
        ? [...(parentParts || []), ...(config.path ? (0, getPatternParts_1.getPatternParts)(config.path) : [])]
        : config.path
            ? (0, getPatternParts_1.getPatternParts)(config.path)
            : undefined;
    const screens = config.screens ? createNormalizedConfigs(config.screens, parts) : undefined;
    return {
        parts,
        stringify: config.stringify,
        screens,
    };
};
const createNormalizedConfigs = (options, parts) => Object.fromEntries(Object.entries(options).map(([name, c]) => {
    const result = createConfigItem(c, parts);
    return [name, result];
}));
//# sourceMappingURL=getPathFromState.js.map