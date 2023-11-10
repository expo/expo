"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendBaseUrl = exports.deepEqual = exports.getPathDataFromState = void 0;
const core_1 = require("@react-navigation/core");
const matchers_1 = require("../matchers");
const DEFAULT_SCREENS = {};
const getActiveRoute = (state) => {
    const route = typeof state.index === 'number'
        ? state.routes[state.index]
        : state.routes[state.routes.length - 1];
    if (route.state) {
        return getActiveRoute(route.state);
    }
    if (route && isInvalidParams(route.params)) {
        return getActiveRoute(createFakeState(route.params));
    }
    return route;
};
function createFakeState(params) {
    return {
        stale: false,
        type: 'UNKNOWN',
        key: 'UNKNOWN',
        index: 0,
        routeNames: [],
        routes: [
            {
                key: 'UNKNOWN',
                name: params.screen,
                params: params.params,
                path: params.path,
            },
        ],
    };
}
function segmentMatchesConvention(segment) {
    return (segment === 'index' ||
        (0, matchers_1.matchDynamicName)(segment) != null ||
        (0, matchers_1.matchGroupName)(segment) != null ||
        (0, matchers_1.matchDeepDynamicRouteName)(segment) != null);
}
function encodeURIComponentPreservingBrackets(str) {
    return encodeURIComponent(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
}
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
function getPathFromState(state, _options) {
    return getPathDataFromState(state, _options).path;
}
exports.default = getPathFromState;
function getPathDataFromState(state, _options = { screens: DEFAULT_SCREENS }) {
    if (state == null) {
        throw Error("Got 'undefined' for the navigation state. You must pass a valid state object.");
    }
    const { preserveGroups, preserveDynamicRoutes, ...options } = _options;
    (0, core_1.validatePathConfig)(options);
    // Expo Router disallows usage without a linking config.
    if (Object.is(options.screens, DEFAULT_SCREENS)) {
        throw Error("You must pass a 'screens' object to 'getPathFromState' to generate a path.");
    }
    return getPathFromResolvedState(JSON.parse(JSON.stringify(state)), 
    // Create a normalized configs object which will be easier to use
    createNormalizedConfigs(options.screens), { preserveGroups, preserveDynamicRoutes });
}
exports.getPathDataFromState = getPathDataFromState;
function processParamsWithUserSettings(configItem, params) {
    const stringify = configItem?.stringify;
    return Object.fromEntries(Object.entries(params).map(([key, value]) => [
        key,
        // TODO: Strip nullish values here.
        stringify?.[key]
            ? stringify[key](value)
            : // Preserve rest params
                Array.isArray(value)
                    ? value
                    : String(value),
    ]));
}
function deepEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) {
            return false;
        }
        for (const key of keysA) {
            if (!deepEqual(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
}
exports.deepEqual = deepEqual;
function walkConfigItems(route, focusedRoute, configs, { preserveDynamicRoutes, }) {
    // NOTE(EvanBacon): Fill in current route using state that was passed as params.
    if (!route.state && isInvalidParams(route.params)) {
        route.state = createFakeState(route.params);
    }
    let pattern = null;
    let focusedParams;
    const collectedParams = {};
    while (route.name in configs) {
        const configItem = configs[route.name];
        const inputPattern = configItem.pattern;
        if (inputPattern == null) {
            // This should never happen in Expo Router.
            throw new Error('Unexpected: No pattern found for route ' + route.name);
        }
        pattern = inputPattern;
        if (route.params) {
            const params = processParamsWithUserSettings(configItem, route.params);
            // TODO: Does this need to be a null check?
            if (pattern) {
                Object.assign(collectedParams, params);
            }
            if (deepEqual(focusedRoute, route)) {
                if (preserveDynamicRoutes) {
                    focusedParams = params;
                }
                else {
                    // If this is the focused route, keep the params for later use
                    // We save it here since it's been stringified already
                    focusedParams = getParamsWithConventionsCollapsed({
                        params,
                        pattern,
                        routeName: route.name,
                    });
                }
            }
        }
        if (!route.state && isInvalidParams(route.params)) {
            route.state = createFakeState(route.params);
        }
        // If there is no `screens` property or no nested state, we return pattern
        if (!configItem.screens || route.state === undefined) {
            if (configItem.initialRouteName &&
                configItem.screens &&
                configItem.initialRouteName in configItem.screens &&
                configItem.screens[configItem.initialRouteName]?.pattern) {
                const initialRouteConfig = configItem.screens[configItem.initialRouteName];
                // NOTE(EvanBacon): Big hack to support initial route changes in tab bars.
                pattern = initialRouteConfig.pattern;
                if (focusedParams) {
                    if (!preserveDynamicRoutes) {
                        // If this is the focused route, keep the params for later use
                        // We save it here since it's been stringified already
                        focusedParams = getParamsWithConventionsCollapsed({
                            params: focusedParams,
                            pattern,
                            routeName: route.name,
                        });
                    }
                }
            }
            break;
        }
        const index = route.state.index ?? route.state.routes.length - 1;
        const nextRoute = route.state.routes[index];
        const nestedScreens = configItem.screens;
        // if there is config for next route name, we go deeper
        if (nestedScreens && nextRoute.name in nestedScreens) {
            route = nextRoute;
            configs = nestedScreens;
        }
        else {
            // If not, there is no sense in going deeper in config
            break;
        }
    }
    if (pattern == null) {
        throw new Error(`No pattern found for route "${route.name}". Options are: ${Object.keys(configs).join(', ')}.`);
    }
    if (pattern && !focusedParams && focusedRoute.params) {
        if (preserveDynamicRoutes) {
            focusedParams = focusedRoute.params;
        }
        else {
            // If this is the focused route, keep the params for later use
            // We save it here since it's been stringified already
            focusedParams = getParamsWithConventionsCollapsed({
                params: focusedRoute.params,
                pattern,
                routeName: route.name,
            });
        }
        Object.assign(focusedParams, collectedParams);
    }
    return {
        pattern,
        nextRoute: route,
        focusedParams,
        params: collectedParams,
    };
}
function getPathFromResolvedState(state, configs, { preserveGroups, preserveDynamicRoutes, }) {
    let path = '';
    let current = state;
    const allParams = {};
    while (current) {
        path += '/';
        // Make mutable copies to ensure we don't leak state outside of the function.
        const route = current.routes[current.index ?? 0];
        // NOTE(EvanBacon): Fill in current route using state that was passed as params.
        // if (isInvalidParams(route.params)) {
        if (!route.state && isInvalidParams(route.params)) {
            route.state = createFakeState(route.params);
        }
        const { pattern, params, nextRoute, focusedParams } = walkConfigItems(route, getActiveRoute(current), { ...configs }, { preserveDynamicRoutes });
        Object.assign(allParams, params);
        path += getPathWithConventionsCollapsed({
            pattern,
            routePath: nextRoute.path,
            params: allParams,
            initialRouteName: configs[nextRoute.name]?.initialRouteName,
            preserveGroups,
            preserveDynamicRoutes,
        });
        if (nextRoute.state &&
            // NOTE(EvanBacon): The upstream implementation allows for sending in synthetic states (states that weren't generated by `getStateFromPath`)
            // and any invalid routes will simply be ignored.
            // Because of this, we need to check if the next route is valid before continuing, otherwise our more strict
            // implementation will throw an error.
            configs[nextRoute.state.routes?.[nextRoute.state?.index ?? 0]?.name]) {
            // Continue looping with the next state if available.
            current = nextRoute.state;
        }
        else {
            // Finished crawling state.
            // Check for query params before exiting.
            if (focusedParams) {
                for (const param in focusedParams) {
                    // TODO: This is not good. We shouldn't squat strings named "undefined".
                    if (focusedParams[param] === 'undefined') {
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete focusedParams[param];
                    }
                }
                const query = new URLSearchParams(focusedParams).toString();
                if (query) {
                    path += `?${query}`;
                }
            }
            break;
        }
    }
    return { path: appendBaseUrl(basicSanitizePath(path)), params: decodeParams(allParams) };
}
function decodeParams(params) {
    const parsed = {};
    for (const [key, value] of Object.entries(params)) {
        parsed[key] = decodeURIComponent(value);
    }
    return parsed;
}
function getPathWithConventionsCollapsed({ pattern, routePath, params, preserveGroups, preserveDynamicRoutes, initialRouteName, }) {
    const segments = pattern.split('/');
    return segments
        .map((p, i) => {
        const name = getParamName(p);
        // We don't know what to show for wildcard patterns
        // Showing the route name seems ok, though whatever we show here will be incorrect
        // Since the page doesn't actually exist
        if (p.startsWith('*')) {
            if (preserveDynamicRoutes) {
                if (name === 'not-found') {
                    return '+not-found';
                }
                return `[...${name}]`;
            }
            if (params[name]) {
                if (Array.isArray(params[name])) {
                    return params[name].join('/');
                }
                return params[name];
            }
            if (i === 0) {
                // This can occur when a wildcard matches all routes and the given path was `/`.
                return routePath;
            }
            // remove existing segments from route.path and return it
            // this is used for nested wildcard routes. Without this, the path would add
            // all nested segments to the beginning of the wildcard route.
            return routePath
                ?.split('/')
                .slice(i + 1)
                .join('/');
        }
        // If the path has a pattern for a param, put the param in the path
        if (p.startsWith(':')) {
            if (preserveDynamicRoutes) {
                return `[${name}]`;
            }
            // Optional params without value assigned in route.params should be ignored
            return params[name];
        }
        if (!preserveGroups && (0, matchers_1.matchGroupName)(p) != null) {
            // When the last part is a group it could be a shared URL
            // if the route has an initialRouteName defined, then we should
            // use that as the component path as we can assume it will be shown.
            if (segments.length - 1 === i) {
                if (initialRouteName) {
                    // Return an empty string if the init route is ambiguous.
                    if (segmentMatchesConvention(initialRouteName)) {
                        return '';
                    }
                    return encodeURIComponentPreservingBrackets(initialRouteName);
                }
            }
            return '';
        }
        // Preserve dynamic syntax for rehydration
        return encodeURIComponentPreservingBrackets(p);
    })
        .map((v) => v ?? '')
        .join('/');
}
/** Given a set of query params and a pattern with possible conventions, collapse the conventions and return the remaining params. */
function getParamsWithConventionsCollapsed({ pattern, routeName, params, }) {
    const processedParams = { ...params };
    // Remove the params present in the pattern since we'll only use the rest for query string
    const segments = pattern.split('/');
    // Dynamic Routes
    segments
        .filter((segment) => segment.startsWith(':'))
        .forEach((segment) => {
        const name = getParamName(segment);
        delete processedParams[name];
    });
    // Deep Dynamic Routes
    if (segments.some((segment) => segment.startsWith('*'))) {
        // NOTE(EvanBacon): Drop the param name matching the wildcard route name -- this is specific to Expo Router.
        const name = (0, matchers_1.matchDeepDynamicRouteName)(routeName) ?? routeName;
        delete processedParams[name];
    }
    return processedParams;
}
// Remove multiple as well as trailing slashes
function basicSanitizePath(path) {
    // Remove duplicate slashes like `foo//bar` -> `foo/bar`
    const simplifiedPath = path.replace(/\/+/g, '/');
    if (simplifiedPath.length <= 1) {
        return simplifiedPath;
    }
    // Remove trailing slash like `foo/bar/` -> `foo/bar`
    return simplifiedPath.replace(/\/$/, '');
}
// TODO: Make StackRouter not do this...
// Detect if the params came from StackRouter using `params` to pass around internal state.
function isInvalidParams(params) {
    if (!params) {
        return false;
    }
    if ('params' in params && typeof params.params === 'object' && !!params.params) {
        return true;
    }
    return ('initial' in params &&
        typeof params.initial === 'boolean' &&
        // "path" in params &&
        'screen' in params);
}
const getParamName = (pattern) => pattern.replace(/^[:*]/, '').replace(/\?$/, '');
const joinPaths = (...paths) => []
    .concat(...paths.map((p) => p.split('/')))
    .filter(Boolean)
    .join('/');
const createConfigItem = (config, parentPattern) => {
    if (typeof config === 'string') {
        // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
        const pattern = parentPattern ? joinPaths(parentPattern, config) : config;
        return { pattern };
    }
    if (config.exact && config.path === undefined) {
        throw new Error("A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`.");
    }
    // If an object is specified as the value (e.g. Foo: { ... }),
    // It can have `path` property and `screens` prop which has nested configs
    const pattern = config.exact !== true ? joinPaths(parentPattern || '', config.path || '') : config.path || '';
    const screens = config.screens ? createNormalizedConfigs(config.screens, pattern) : undefined;
    return {
        // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
        pattern: pattern?.split('/').filter(Boolean).join('/'),
        stringify: config.stringify,
        screens,
        initialRouteName: config.initialRouteName,
    };
};
const createNormalizedConfigs = (options, pattern) => Object.fromEntries(Object.entries(options).map(([name, c]) => [name, createConfigItem(c, pattern)]));
function appendBaseUrl(path, baseUrl = process.env.EXPO_BASE_URL) {
    if (process.env.NODE_ENV !== 'development') {
        if (baseUrl) {
            return `/${baseUrl.replace(/^\/+/, '').replace(/\/$/, '')}${path}`;
        }
    }
    return path;
}
exports.appendBaseUrl = appendBaseUrl;
//# sourceMappingURL=getPathFromState.js.map