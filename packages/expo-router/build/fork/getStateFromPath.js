"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripBaseUrl = exports.getMatchableRouteConfigs = exports.getUrlWithReactNavigationConcessions = void 0;
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const findFocusedRoute_1 = require("./findFocusedRoute");
const validatePathConfig_1 = __importDefault(require("./validatePathConfig"));
const matchers_1 = require("../matchers");
function getUrlWithReactNavigationConcessions(path, baseUrl = process.env.EXPO_BASE_URL) {
    let parsed;
    try {
        parsed = new URL(path, 'https://phony.example');
    }
    catch {
        // Do nothing with invalid URLs.
        return {
            nonstandardPathname: '',
            inputPathnameWithoutHash: '',
        };
    }
    const pathname = parsed.pathname;
    // Make sure there is a trailing slash
    return {
        // The slashes are at the end, not the beginning
        nonstandardPathname: stripBaseUrl(pathname, baseUrl).replace(/^\/+/g, '').replace(/\/+$/g, '') + '/',
        // React Navigation doesn't support hashes, so here
        inputPathnameWithoutHash: stripBaseUrl(path, baseUrl).replace(/#.*$/, ''),
    };
}
exports.getUrlWithReactNavigationConcessions = getUrlWithReactNavigationConcessions;
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
function getStateFromPath(path, options) {
    const { initialRoutes, configs } = getMatchableRouteConfigs(options);
    return getStateFromPathWithConfigs(path, configs, initialRoutes);
}
exports.default = getStateFromPath;
function getMatchableRouteConfigs(options) {
    if (options) {
        (0, validatePathConfig_1.default)(options);
    }
    const screens = options?.screens;
    // Expo Router disallows usage without a linking config.
    if (!screens) {
        throw Error("You must pass a 'screens' object to 'getStateFromPath' to generate a path.");
    }
    // This will be mutated...
    const initialRoutes = [];
    if (options?.initialRouteName) {
        initialRoutes.push({
            initialRouteName: options.initialRouteName,
            parentScreens: [],
        });
    }
    // Create a normalized configs array which will be easier to use.
    const converted = Object.keys(screens)
        .map((key) => createNormalizedConfigs(key, screens, [], initialRoutes))
        .flat();
    const resolvedInitialPatterns = initialRoutes.map((route) => joinPaths(...route.parentScreens, route.initialRouteName));
    const convertedWithInitial = converted.map((config) => ({
        ...config,
        // TODO(EvanBacon): Probably a safer way to do this
        // Mark initial routes to give them potential priority over other routes that match.
        isInitial: resolvedInitialPatterns.includes(config.routeNames.join('/')),
    }));
    // Sort in order of resolution. This is extremely important for the algorithm to work.
    const configs = convertedWithInitial.sort(sortConfigs);
    // Assert any duplicates before we start parsing.
    assertConfigDuplicates(configs);
    return { configs, initialRoutes };
}
exports.getMatchableRouteConfigs = getMatchableRouteConfigs;
function assertConfigDuplicates(configs) {
    // Check for duplicate patterns in the config
    configs.reduce((acc, config) => {
        // NOTE(EvanBacon): Uses the regex pattern as key to detect duplicate slugs.
        const indexedKey = config.regex?.toString() ?? config.pattern;
        const alpha = acc[indexedKey];
        // NOTE(EvanBacon): Skips checking nodes that have children.
        if (alpha && !alpha.hasChildren && !config.hasChildren) {
            const a = alpha.routeNames;
            const b = config.routeNames;
            // It's not a problem if the path string omitted from a inner most screen
            // For example, it's ok if a path resolves to `A > B > C` or `A > B`
            const intersects = a.length > b.length ? b.every((it, i) => a[i] === it) : a.every((it, i) => b[i] === it);
            if (!intersects) {
                // NOTE(EvanBacon): Adds more context to the error message since we know about the
                // file-based routing.
                const last = config.pattern.split('/').pop();
                if (!last?.match(/^\*not-found$/)) {
                    const routeType = last?.startsWith(':')
                        ? 'dynamic route'
                        : last?.startsWith('*')
                            ? 'dynamic-rest route'
                            : 'route';
                    throw new Error(`The ${routeType} pattern '${config.pattern || '/'}' resolves to both '${alpha.userReadableName}' and '${config.userReadableName}'. Patterns must be unique and cannot resolve to more than one route.`);
                }
            }
        }
        return Object.assign(acc, {
            [indexedKey]: config,
        });
    }, {});
}
function sortConfigs(a, b) {
    // Sort config so that:
    // - the most exhaustive ones are always at the beginning
    // - patterns with wildcard are always at the end
    // If 2 patterns are same, move the one with less route names up
    // This is an error state, so it's only useful for consistent error messages
    if (a.pattern === b.pattern) {
        return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
    }
    // If one of the patterns starts with the other, it's more exhaustive
    // So move it up
    if (a.pattern.startsWith(b.pattern) &&
        // NOTE(EvanBacon): This is a hack to make sure that `*` is always at the end
        b.screen !== 'index') {
        return -1;
    }
    if (b.pattern.startsWith(a.pattern) && a.screen !== 'index') {
        return 1;
    }
    // NOTE(EvanBacon): Here we append `index` if the screen was `index` so the length is the same
    // as a slug or wildcard when nested more than one level deep.
    // This is so we can compare the length of the pattern, e.g. `foo/*` > `foo` vs `*` < ``.
    const aParts = a.pattern
        .split('/')
        // Strip out group names to ensure they don't affect the priority.
        .filter((part) => (0, matchers_1.matchGroupName)(part) == null);
    if (a.screen === 'index') {
        aParts.push('index');
    }
    const bParts = b.pattern.split('/').filter((part) => (0, matchers_1.matchGroupName)(part) == null);
    if (b.screen === 'index') {
        bParts.push('index');
    }
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        // if b is longer, b get higher priority
        if (aParts[i] == null) {
            return 1;
        }
        // if a is longer, a get higher priority
        if (bParts[i] == null) {
            return -1;
        }
        const aWildCard = aParts[i].startsWith('*');
        const bWildCard = bParts[i].startsWith('*');
        // if both are wildcard we compare next component
        if (aWildCard && bWildCard) {
            const aNotFound = aParts[i].match(/^[*]not-found$/);
            const bNotFound = bParts[i].match(/^[*]not-found$/);
            if (aNotFound && bNotFound) {
                continue;
            }
            else if (aNotFound) {
                return 1;
            }
            else if (bNotFound) {
                return -1;
            }
            continue;
        }
        // if only a is wild card, b get higher priority
        if (aWildCard) {
            return 1;
        }
        // if only b is wild card, a get higher priority
        if (bWildCard) {
            return -1;
        }
        const aSlug = aParts[i].startsWith(':');
        const bSlug = bParts[i].startsWith(':');
        // if both are wildcard we compare next component
        if (aSlug && bSlug) {
            const aNotFound = aParts[i].match(/^[*]not-found$/);
            const bNotFound = bParts[i].match(/^[*]not-found$/);
            if (aNotFound && bNotFound) {
                continue;
            }
            else if (aNotFound) {
                return 1;
            }
            else if (bNotFound) {
                return -1;
            }
            continue;
        }
        // if only a is wild card, b get higher priority
        if (aSlug) {
            return 1;
        }
        // if only b is wild card, a get higher priority
        if (bSlug) {
            return -1;
        }
    }
    // Sort initial routes with a higher priority than routes which will push more screens
    // this ensures shared routes go to the shortest path.
    if (a.isInitial && !b.isInitial) {
        return -1;
    }
    if (!a.isInitial && b.isInitial) {
        return 1;
    }
    return bParts.length - aParts.length;
}
function getStateFromEmptyPathWithConfigs(path, configs, initialRoutes) {
    // We need to add special handling of empty path so navigation to empty path also works
    // When handling empty path, we should only look at the root level config
    // NOTE(EvanBacon): We only care about matching leaf nodes.
    const leafNodes = configs
        .filter((config) => !config.hasChildren)
        .map((value) => {
        return {
            ...value,
            // Collapse all levels of group segments before testing.
            // This enables `app/(one)/(two)/index.js` to be matched.
            path: (0, matchers_1.stripGroupSegmentsFromPath)(value.path),
        };
    });
    const match = leafNodes.find((config) => 
    // NOTE(EvanBacon): Test leaf node index routes that either don't have a regex or match an empty string.
    config.path === '' && (!config.regex || config.regex.test(''))) ??
        leafNodes.find((config) => 
        // NOTE(EvanBacon): Test leaf node dynamic routes that match an empty string.
        config.path.startsWith(':') && config.regex.test('')) ??
        // NOTE(EvanBacon): Test leaf node deep dynamic routes that match a slash.
        // This should be done last to enable dynamic routes having a higher priority.
        leafNodes.find((config) => config.path.startsWith('*') && config.regex.test('/'));
    if (!match) {
        return undefined;
    }
    const routes = match.routeNames.map((name) => {
        if (!match._route) {
            return { name };
        }
        return {
            name,
            _route: match._route,
        };
    });
    return createNestedStateObject(path, routes, configs, initialRoutes);
}
function getStateFromPathWithConfigs(path, configs, initialRoutes) {
    const formattedPaths = getUrlWithReactNavigationConcessions(path);
    if (formattedPaths.nonstandardPathname === '/') {
        return getStateFromEmptyPathWithConfigs(formattedPaths.inputPathnameWithoutHash, configs, initialRoutes);
    }
    // We match the whole path against the regex instead of segments
    // This makes sure matches such as wildcard will catch any unmatched routes, even if nested
    const routes = matchAgainstConfigs(formattedPaths.nonstandardPathname, configs);
    if (routes == null) {
        return undefined;
    }
    // This will always be empty if full path matched
    return createNestedStateObject(formattedPaths.inputPathnameWithoutHash, routes, configs, initialRoutes);
}
const joinPaths = (...paths) => []
    .concat(...paths.map((p) => p.split('/')))
    .filter(Boolean)
    .join('/');
function matchAgainstConfigs(remaining, configs) {
    let routes;
    let remainingPath = remaining;
    // Go through all configs, and see if the next path segment matches our regex
    for (const config of configs) {
        if (!config.regex) {
            continue;
        }
        const match = remainingPath.match(config.regex);
        // If our regex matches, we need to extract params from the path
        if (!match) {
            continue;
        }
        // TODO: Add support for wildcard routes
        const matchedParams = config.pattern
            ?.split('/')
            .filter((p) => p.match(/^[:*]/))
            .reduce((acc, p, i) => {
            if (p.match(/^\*/)) {
                return {
                    ...acc,
                    [p]: match[(i + 1) * 2], //?.replace(/\//, ""),
                };
            }
            return Object.assign(acc, {
                // The param segments appear every second item starting from 2 in the regex match result.
                // This will only work if we ensure groups aren't included in the match.
                [p]: match[(i + 1) * 2]?.replace(/\//, ''),
            });
        }, {});
        const routeFromName = (name) => {
            const config = configs.find((c) => c.screen === name);
            if (!config?.path) {
                return { name };
            }
            const segments = config.path.split('/');
            const params = {};
            segments
                .filter((p) => p.match(/^[:*]/))
                .forEach((p) => {
                let value = matchedParams[p];
                if (value) {
                    if (p.match(/^\*/)) {
                        // Convert to an array before providing as a route.
                        value = value?.split('/').filter(Boolean);
                    }
                    const key = p.replace(/^[:*]/, '').replace(/\?$/, '');
                    params[key] = config.parse?.[key] ? config.parse[key](value) : value;
                }
            });
            if (params && Object.keys(params).length) {
                return { name, params };
            }
            return { name };
        };
        routes = config.routeNames.map((name) => {
            if (!config._route) {
                return { ...routeFromName(name) };
            }
            return {
                ...routeFromName(name),
                _route: config._route,
            };
        });
        // TODO(EvanBacon): Maybe we should warn / assert if multiple slugs use the same param name.
        const combinedParams = routes.reduce((acc, r) => Object.assign(acc, r.params), {});
        const hasCombinedParams = Object.keys(combinedParams).length > 0;
        // Combine all params so a route `[foo]/[bar]/other.js` has access to `{ foo, bar }`
        routes = routes.map((r) => {
            if (hasCombinedParams) {
                r.params = combinedParams;
            }
            return r;
        });
        remainingPath = remainingPath.replace(match[1], '');
        break;
    }
    return routes;
}
function equalHeritage(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i].localeCompare(b[i]) !== 0) {
            return false;
        }
    }
    return true;
}
const createNormalizedConfigs = (screen, routeConfig, routeNames = [], initials = [], parentScreens = [], parentPattern) => {
    const configs = [];
    routeNames.push(screen);
    parentScreens.push(screen);
    const config = routeConfig[screen];
    if (typeof config === 'string') {
        // TODO: This should never happen with the addition of `_route`
        // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
        const pattern = parentPattern ? joinPaths(parentPattern, config) : config;
        configs.push(createConfigItem(screen, routeNames, pattern, config, false));
    }
    else if (typeof config === 'object') {
        let pattern;
        const { _route } = config;
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
            configs.push(createConfigItem(screen, routeNames, pattern, config.path, config.screens ? !!Object.keys(config.screens)?.length : false, config.parse, _route));
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
function formatRegexPattern(it) {
    // Allow spaces in file path names.
    it = it.replace(' ', '%20');
    if (it.startsWith(':')) {
        // TODO: Remove unused match group
        return `(([^/]+\\/)${it.endsWith('?') ? '?' : ''})`;
    }
    else if (it.startsWith('*')) {
        return `((.*\\/)${it.endsWith('?') ? '?' : ''})`;
    }
    // Strip groups from the matcher
    if ((0, matchers_1.matchGroupName)(it) != null) {
        // Groups are optional segments
        // this enables us to match `/bar` and `/(foo)/bar` for the same route
        // NOTE(EvanBacon): Ignore this match in the regex to avoid capturing the group
        return `(?:${(0, escape_string_regexp_1.default)(it)}\\/)?`;
    }
    return (0, escape_string_regexp_1.default)(it) + `\\/`;
}
const createConfigItem = (screen, routeNames, pattern, path, hasChildren, parse, _route) => {
    // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
    pattern = pattern.split('/').filter(Boolean).join('/');
    const regex = pattern
        ? new RegExp(`^(${pattern.split('/').map(formatRegexPattern).join('')})$`)
        : undefined;
    return {
        screen,
        regex,
        pattern,
        path,
        // The routeNames array is mutated, so copy it to keep the current state
        routeNames: [...routeNames],
        parse,
        userReadableName: [...routeNames.slice(0, -1), path || screen].join('/'),
        hasChildren: !!hasChildren,
        _route,
    };
};
const findParseConfigForRoute = (routeName, routeConfigs) => {
    for (const config of routeConfigs) {
        if (routeName === config.routeNames[config.routeNames.length - 1]) {
            return config.parse;
        }
    }
    return undefined;
};
// Try to find an initial route connected with the one passed
const findInitialRoute = (routeName, parentScreens, initialRoutes) => {
    for (const config of initialRoutes) {
        if (equalHeritage(parentScreens, config.parentScreens)) {
            // If the parents are the same but the route name doesn't match the initial route
            // then we return the initial route.
            return routeName !== config.initialRouteName ? config.initialRouteName : undefined;
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
                routes: [{ name: initialRoute }, route],
            };
        }
        return {
            routes: [route],
        };
    }
    if (initialRoute) {
        return {
            index: 1,
            routes: [{ name: initialRoute }, { ...route, state: { routes: [] } }],
        };
    }
    return {
        routes: [{ ...route, state: { routes: [] } }],
    };
};
const createNestedStateObject = (path, routes, routeConfigs, initialRoutes) => {
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
    // Remove groups from the path while preserving a trailing slash.
    route.path = (0, matchers_1.stripGroupSegmentsFromPath)(path);
    const params = parseQueryParams(route.path, findParseConfigForRoute(route.name, routeConfigs));
    if (params) {
        const resolvedParams = { ...route.params, ...params };
        if (Object.keys(resolvedParams).length > 0) {
            route.params = resolvedParams;
        }
        else {
            delete route.params;
        }
    }
    return state;
};
const parseQueryParams = (path, parseConfig) => {
    const query = path.split('?')[1];
    const searchParams = new URLSearchParams(query);
    const params = Object.fromEntries(
    // @ts-ignore: [Symbol.iterator] is indeed, available on every platform.
    searchParams);
    if (parseConfig) {
        Object.keys(params).forEach((name) => {
            if (Object.hasOwnProperty.call(parseConfig, name) && typeof params[name] === 'string') {
                params[name] = parseConfig[name](params[name]);
            }
        });
    }
    return Object.keys(params).length ? params : undefined;
};
const baseUrlCache = new Map();
function getBaseUrlRegex(baseUrl) {
    if (baseUrlCache.has(baseUrl)) {
        return baseUrlCache.get(baseUrl);
    }
    const regex = new RegExp(`^\\/?${(0, escape_string_regexp_1.default)(baseUrl)}`, 'g');
    baseUrlCache.set(baseUrl, regex);
    return regex;
}
function stripBaseUrl(path, baseUrl = process.env.EXPO_BASE_URL) {
    if (process.env.NODE_ENV !== 'development') {
        if (baseUrl) {
            const reg = getBaseUrlRegex(baseUrl);
            return path.replace(/^\/+/g, '/').replace(reg, '');
        }
    }
    return path;
}
exports.stripBaseUrl = stripBaseUrl;
//# sourceMappingURL=getStateFromPath.js.map