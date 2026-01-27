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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStateFromPath = getStateFromPath;
const native_1 = require("@react-navigation/native");
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const findFocusedRoute_1 = require("./findFocusedRoute");
const expo = __importStar(require("./getStateFromPath-forks"));
const constants_1 = require("../constants");
/**
 * Utility to parse a path string to initial state object accepted by the container.
 * This is useful for deep linking when we need to handle the incoming URL.
 *
 * @example
 * ```js
 * getStateFromPath(
 *   '/chat/jane/42',
 *   {
 *     screens: {
 *       Chat: {
 *         path: 'chat/:author/:id',
 *         parse: { id: Number }
 *       }
 *     }
 *   }
 * )
 * ```
 * @param path Path string to parse and convert, e.g. /foo/bar?count=42.
 * @param options Extra options to fine-tune how to parse the path.
 */
function getStateFromPath(path, options, 
// START FORK
segments = []
// END FORK
) {
    const { initialRoutes, configs, configWithRegexes } = getConfigResources(options, 
    // START FORK
    segments
    // END FORK
    );
    const screens = options?.screens;
    // START FORK
    const expoPath = expo.getUrlWithReactNavigationConcessions(path);
    // END FORK
    // START FORK
    let remaining = expo.cleanPath(expoPath.nonstandardPathname);
    // let remaining = path
    //   .replace(/\/+/g, '/') // Replace multiple slash (//) with single ones
    //   .replace(/^\//, '') // Remove extra leading slash
    //   .replace(/\?.*$/, ''); // Remove query params which we will handle later
    // // Make sure there is a trailing slash
    // remaining = remaining.endsWith('/') ? remaining : `${remaining}/`;
    // END FORK
    const prefix = options?.path?.replace(/^\//, ''); // Remove extra leading slash
    if (prefix) {
        // Make sure there is a trailing slash
        const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
        // If the path doesn't start with the prefix, it's not a match
        if (!remaining.startsWith(normalizedPrefix)) {
            return undefined;
        }
        // Remove the prefix from the path
        remaining = remaining.replace(normalizedPrefix, '');
    }
    if (screens === undefined) {
        // When no config is specified, use the path segments as route names
        const routes = remaining
            .split('/')
            .filter(Boolean)
            .map((segment) => {
            const name = decodeURIComponent(segment);
            return { name };
        });
        if (routes.length) {
            return createNestedStateObject(expoPath, routes, initialRoutes, [], expoPath.hash);
        }
        return undefined;
    }
    if (remaining === '/') {
        // We need to add special handling of empty path so navigation to empty path also works
        // When handling empty path, we should only look at the root level config
        // START FORK
        const match = expo.matchForEmptyPath(configWithRegexes);
        // const match = configs.find(
        //   (config) =>
        //     config.path === '' &&
        //     config.routeNames.every(
        //       // Make sure that none of the parent configs have a non-empty path defined
        //       (name) => !configs.find((c) => c.screen === name)?.path
        //     )
        // );
        // END FORK
        if (match) {
            return createNestedStateObject(expoPath, match.routeNames.map((name) => ({ name })), initialRoutes, configs, expoPath.hash);
        }
        return undefined;
    }
    let result;
    let current;
    // We match the whole path against the regex instead of segments
    // This makes sure matches such as wildcard will catch any unmatched routes, even if nested
    const { routes, remainingPath } = matchAgainstConfigs(remaining, configWithRegexes);
    if (routes !== undefined) {
        // This will always be empty if full path matched
        current = createNestedStateObject(expoPath, routes, initialRoutes, configs, expoPath.hash);
        remaining = remainingPath;
        result = current;
    }
    if (current == null || result == null) {
        return undefined;
    }
    return result;
}
/**
 * Reference to the last used config resources. This is used to avoid recomputing the config resources when the options are the same.
 */
let cachedConfigResources = [
    undefined,
    prepareConfigResources(),
];
function getConfigResources(options, 
// START FORK
previousSegments
// END FORK
) {
    // START FORK - We need to disable this caching as our configs can change based upon the current state
    // if (cachedConfigResources[0] !== options) {
    cachedConfigResources = [options, prepareConfigResources(options, previousSegments)];
    // }
    // END FORK FORK
    return cachedConfigResources[1];
}
function prepareConfigResources(options, previousSegments) {
    if (options) {
        (0, native_1.validatePathConfig)(options);
    }
    const initialRoutes = getInitialRoutes(options);
    const configs = getNormalizedConfigs(initialRoutes, options?.screens, previousSegments);
    checkForDuplicatedConfigs(configs);
    const configWithRegexes = getConfigsWithRegexes(configs);
    return {
        initialRoutes,
        configs,
        configWithRegexes,
    };
}
function getInitialRoutes(options) {
    const initialRoutes = [];
    if (options?.initialRouteName) {
        initialRoutes.push({
            initialRouteName: options.initialRouteName,
            parentScreens: [],
        });
    }
    return initialRoutes;
}
function getNormalizedConfigs(initialRoutes, screens = {}, 
// START FORK
previousSegments
// END FORK
) {
    // Create a normalized configs array which will be easier to use
    return []
        .concat(...Object.keys(screens).map((key) => createNormalizedConfigs(key, screens, [], initialRoutes, [])))
        .map(expo.appendIsInitial(initialRoutes))
        .sort(expo.getRouteConfigSorter(previousSegments));
    // .sort((a, b) => {
    //   // Sort config so that:
    //   // - the most exhaustive ones are always at the beginning
    //   // - patterns with wildcard are always at the end
    //   // If 2 patterns are same, move the one with less route names up
    //   // This is an error state, so it's only useful for consistent error messages
    //   if (a.pattern === b.pattern) {
    //     return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
    //   }
    //   // If one of the patterns starts with the other, it's more exhaustive
    //   // So move it up
    //   if (a.pattern.startsWith(b.pattern)) {
    //     return -1;
    //   }
    //   if (b.pattern.startsWith(a.pattern)) {
    //     return 1;
    //   }
    //   const aParts = a.pattern.split('/');
    //   const bParts = b.pattern.split('/');
    //   for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    //     // if b is longer, b get higher priority
    //     if (aParts[i] == null) {
    //       return 1;
    //     }
    //     // if a is longer, a get higher priority
    //     if (bParts[i] == null) {
    //       return -1;
    //     }
    //     const aWildCard = aParts[i] === '*' || aParts[i].startsWith(':');
    //     const bWildCard = bParts[i] === '*' || bParts[i].startsWith(':');
    //     // if both are wildcard we compare next component
    //     if (aWildCard && bWildCard) {
    //       continue;
    //     }
    //     // if only a is wild card, b get higher priority
    //     if (aWildCard) {
    //       return 1;
    //     }
    //     // if only b is wild card, a get higher priority
    //     if (bWildCard) {
    //       return -1;
    //     }
    //   }
    //   return bParts.length - aParts.length;
    // });
}
function checkForDuplicatedConfigs(configs) {
    // Check for duplicate patterns in the config
    configs.reduce((acc, config) => {
        if (acc[config.pattern]) {
            const a = acc[config.pattern].routeNames;
            const b = config.routeNames;
            // It's not a problem if the path string omitted from a inner most screen
            // For example, it's ok if a path resolves to `A > B > C` or `A > B`
            const intersects = a.length > b.length ? b.every((it, i) => a[i] === it) : a.every((it, i) => b[i] === it);
            if (!intersects) {
                throw new Error(`Found conflicting screens with the same pattern. The pattern '${config.pattern}' resolves to both '${a.join(' > ')}' and '${b.join(' > ')}'. Patterns must be unique and cannot resolve to more than one screen.`);
            }
        }
        return Object.assign(acc, {
            [config.pattern]: config,
        });
    }, {});
}
function getConfigsWithRegexes(configs) {
    return configs.map((c) => ({
        ...c,
        // Add `$` to the regex to make sure it matches till end of the path and not just beginning
        // START FORK
        // regex: c.regex ? new RegExp(c.regex.source + '$') : undefined,
        regex: expo.configRegExp(c),
        // END FORK
    }));
}
const joinPaths = (...paths) => []
    .concat(...paths.map((p) => p.split('/')))
    .filter(Boolean)
    .join('/');
const matchAgainstConfigs = (remaining, configs) => {
    let routes;
    let remainingPath = remaining;
    // START FORK
    const allParams = Object.create(null);
    // END FORK
    // Go through all configs, and see if the next path segment matches our regex
    for (const config of configs) {
        if (!config.regex) {
            continue;
        }
        const match = remainingPath.match(config.regex);
        // If our regex matches, we need to extract params from the path
        if (match) {
            const matchResult = config.pattern?.split('/').reduce((acc, p, index) => {
                if (!expo.isDynamicPart(p)) {
                    return acc;
                }
                acc.pos += 1;
                // START FORK
                const decodedParamSegment = expo.safelyDecodeURIComponent(
                // const decodedParamSegment = decodeURIComponent(
                // The param segments appear every second item starting from 2 in the regex match result
                match[(acc.pos + 1) * 2]
                    // Remove trailing slash
                    .replace(/\/$/, ''));
                // END FORK
                Object.assign(acc.matchedParams, {
                    [p]: Object.assign(acc.matchedParams[p] || {}, {
                        [index]: decodedParamSegment,
                    }),
                });
                return acc;
            }, { pos: -1, matchedParams: {} });
            const matchedParams = matchResult.matchedParams || {};
            routes = config.routeNames.map((name) => {
                const routeConfig = configs.find((c) => {
                    // Check matching name AND pattern in case same screen is used at different levels in config
                    return c.screen === name && config.pattern.startsWith(c.pattern);
                });
                // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
                const normalizedPath = routeConfig?.path.split('/').filter(Boolean).join('/');
                // Get the number of segments in the initial pattern
                const numInitialSegments = routeConfig?.pattern
                    // Extract the prefix from the pattern by removing the ending path pattern (e.g pattern=`a/b/c/d` and normalizedPath=`c/d` becomes `a/b`)
                    .replace(new RegExp(`${(0, escape_string_regexp_1.default)(normalizedPath)}$`), '')
                    ?.split('/').length;
                const params = normalizedPath
                    ?.split('/')
                    .reduce((acc, p, index) => {
                    if (!expo.isDynamicPart(p)) {
                        return acc;
                    }
                    // Get the real index of the path parameter in the matched path
                    // by offsetting by the number of segments in the initial pattern
                    const offset = numInitialSegments ? numInitialSegments - 1 : 0;
                    // START FORK
                    // const value = matchedParams[p]?.[index + offset];
                    const value = expo.getParamValue(p, matchedParams[p]?.[index + offset]);
                    // END FORK
                    if (value) {
                        // START FORK
                        // const key = p.replace(/^:/, '').replace(/\?$/, '');
                        const key = expo.replacePart(p);
                        // END FORK
                        acc[key] = routeConfig?.parse?.[key] ? routeConfig.parse[key](value) : value;
                    }
                    return acc;
                }, {});
                if (params && Object.keys(params).length) {
                    Object.assign(allParams, params);
                    return { name, params };
                }
                return { name };
            });
            remainingPath = remainingPath.replace(match[1], '');
            break;
        }
    }
    // START FORK
    expo.populateParams(routes, allParams);
    // END FORK
    return { routes, remainingPath };
};
const createNormalizedConfigs = (screen, routeConfig, routeNames = [], initials, parentScreens, parentPattern) => {
    const configs = [];
    routeNames.push(screen);
    parentScreens.push(screen);
    // @ts-expect-error: TODO(@kitten): This is entirely untyped. The index access just flags this, but we're not typing the config properly here
    const config = routeConfig[screen];
    if (typeof config === 'string') {
        // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
        const pattern = parentPattern ? joinPaths(parentPattern, config) : config;
        configs.push(createConfigItem(screen, routeNames, pattern, config));
    }
    else if (typeof config === 'object') {
        let pattern;
        // if an object is specified as the value (e.g. Foo: { ... }),
        // it can have `path` property and
        // it could have `screens` prop which has nested configs
        if (typeof config.path === 'string') {
            if (config.exact && config.path === undefined) {
                throw new Error("A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`.");
            }
            pattern =
                config.exact !== true
                    ? joinPaths(parentPattern || '', config.path || '')
                    : config.path || '';
            if (screen !== constants_1.INTERNAL_SLOT_NAME) {
                configs.push(createConfigItem(screen, routeNames, pattern, config.path, config.parse, config));
            }
        }
        if (config.screens) {
            // property `initialRouteName` without `screens` has no purpose
            if (config.initialRouteName) {
                initials.push({
                    initialRouteName: config.initialRouteName,
                    parentScreens,
                });
            }
            Object.keys(config.screens).forEach((nestedConfig) => {
                const result = createNormalizedConfigs(nestedConfig, config.screens, routeNames, initials, [...parentScreens], pattern ?? parentPattern);
                configs.push(...result);
            });
        }
    }
    routeNames.pop();
    return configs;
};
const createConfigItem = (screen, routeNames, pattern, path, parse = undefined, config = {}) => {
    // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
    pattern = pattern.split('/').filter(Boolean).join('/');
    // START FORK
    const regex = pattern ? expo.routePatternToRegex(pattern) : undefined;
    // const regex = pattern
    //   ? new RegExp(
    //       `^(${pattern
    //         .split('/')
    //         .map((it) => {
    //           if (it.startsWith(':')) {
    //             return `(([^/]+\\/)${it.endsWith('?') ? '?' : ''})`;
    //           }
    //           return `${it === '*' ? '.*' : escape(it)}\\/`;
    //         })
    //         .join('')})`
    //     )
    //   : undefined;
    // END FORK
    return {
        screen,
        regex,
        pattern,
        path,
        // The routeNames array is mutated, so copy it to keep the current state
        routeNames: [...routeNames],
        parse,
        // START FORK
        ...expo.createConfig(screen, pattern, routeNames, config),
        // END FORK
    };
};
const findParseConfigForRoute = (routeName, flatConfig) => {
    for (const config of flatConfig) {
        if (routeName === config.routeNames[config.routeNames.length - 1]) {
            return config.parse;
        }
    }
    return undefined;
};
// Try to find an initial route connected with the one passed
const findInitialRoute = (routeName, parentScreens, initialRoutes) => {
    for (const config of initialRoutes) {
        if (parentScreens.length === config.parentScreens.length) {
            let sameParents = true;
            for (let i = 0; i < parentScreens.length; i++) {
                if (parentScreens[i].localeCompare(config.parentScreens[i]) !== 0) {
                    sameParents = false;
                    break;
                }
            }
            if (sameParents) {
                return routeName !== config.initialRouteName ? config.initialRouteName : undefined;
            }
        }
    }
    return undefined;
};
// returns state object with values depending on whether
// it is the end of state and if there is initialRoute for this level
const createStateObject = (initialRoute, route, isEmpty) => {
    if (isEmpty) {
        if (initialRoute) {
            return {
                index: 1,
                routes: [{ name: initialRoute, params: route.params }, route],
            };
        }
        else {
            return {
                routes: [route],
            };
        }
    }
    else {
        if (initialRoute) {
            return {
                index: 1,
                routes: [
                    { name: initialRoute, params: route.params },
                    { ...route, state: { routes: [] } },
                ],
            };
        }
        else {
            return {
                routes: [{ ...route, state: { routes: [] } }],
            };
        }
    }
};
const createNestedStateObject = ({ path, ...expoURL }, routes, initialRoutes, flatConfig, hash) => {
    let route = routes.shift();
    const parentScreens = [];
    let initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);
    parentScreens.push(route.name);
    const state = createStateObject(initialRoute, route, routes.length === 0);
    if (routes.length > 0) {
        let nestedState = state;
        while ((route = routes.shift())) {
            initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);
            const nestedStateIndex = nestedState.index || nestedState.routes.length - 1;
            nestedState.routes[nestedStateIndex].state = createStateObject(initialRoute, route, routes.length === 0);
            if (routes.length > 0) {
                nestedState = nestedState.routes[nestedStateIndex].state;
            }
            parentScreens.push(route.name);
        }
    }
    route = (0, findFocusedRoute_1.findFocusedRoute)(state);
    // START FORK
    route.path = expoURL.pathWithoutGroups;
    // route.path = path;
    // END FORK
    // START FORK
    // const params = parseQueryParams(
    const params = expo.parseQueryParams(path, route, flatConfig ? findParseConfigForRoute(route.name, flatConfig) : undefined, hash);
    // END FORK
    // START FORK
    // expo.handleUrlParams(route, params, hash);
    if (params) {
        route.params = { ...route.params, ...params };
    }
    // END FORK
    return state;
};
// START FORK
// const parseQueryParams = (path: string, parseConfig?: Record<string, (value: string) => any>) => {
//   const query = path.split('?')[1];
//   const params = queryString.parse(query);
//   if (parseConfig) {
//     Object.keys(params).forEach((name) => {
//       if (Object.hasOwnProperty.call(parseConfig, name) && typeof params[name] === 'string') {
//         params[name] = parseConfig[name](params[name] as string);
//       }
//     });
//   }
//   return Object.keys(params).length ? params : undefined;
// };
// END FORK
//# sourceMappingURL=getStateFromPath.js.map