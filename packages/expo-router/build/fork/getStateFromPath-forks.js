"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateParams = populateParams;
exports.safelyDecodeURIComponent = safelyDecodeURIComponent;
exports.getUrlWithReactNavigationConcessions = getUrlWithReactNavigationConcessions;
exports.createConfig = createConfig;
exports.assertScreens = assertScreens;
exports.configRegExp = configRegExp;
exports.isDynamicPart = isDynamicPart;
exports.replacePart = replacePart;
exports.getParamValue = getParamValue;
exports.handleUrlParams = handleUrlParams;
exports.spreadParamsAcrossAllStates = spreadParamsAcrossAllStates;
exports.stripBaseUrl = stripBaseUrl;
exports.matchForEmptyPath = matchForEmptyPath;
exports.appendIsInitial = appendIsInitial;
exports.getRouteConfigSorter = getRouteConfigSorter;
exports.parseQueryParams = parseQueryParams;
exports.cleanPath = cleanPath;
exports.routePatternToRegex = routePatternToRegex;
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const matchers_1 = require("../matchers");
/**
 * In Expo Router, the params are available at all levels of the routing config
 * @param routes
 * @returns
 */
function populateParams(routes, params) {
    if (!routes || !params || Object.keys(params).length === 0)
        return;
    for (const route of routes) {
        Object.assign(route, { params });
    }
    return routes;
}
function safelyDecodeURIComponent(str) {
    try {
        return decodeURIComponent(str);
    }
    catch {
        return str;
    }
}
function getUrlWithReactNavigationConcessions(path, baseUrl = process.env.EXPO_BASE_URL) {
    let parsed;
    try {
        parsed = new URL(path, 'https://phony.example');
    }
    catch {
        // Do nothing with invalid URLs.
        return {
            path,
            cleanUrl: '',
            nonstandardPathname: '',
            url: new URL('https://phony.example'),
        };
    }
    const pathname = parsed.pathname;
    const withoutBaseUrl = stripBaseUrl(pathname, baseUrl);
    const pathWithoutGroups = (0, matchers_1.stripGroupSegmentsFromPath)(stripBaseUrl(path, baseUrl));
    // Make sure there is a trailing slash
    return {
        // The slashes are at the end, not the beginning
        path,
        nonstandardPathname: withoutBaseUrl.replace(/^\/+/g, '').replace(/\/+$/g, '') + '/',
        url: parsed,
        pathWithoutGroups,
    };
}
function createConfig(screen, pattern, routeNames, config = {}) {
    const parts = [];
    let isDynamic = false;
    const isIndex = screen === 'index' || screen.endsWith('/index');
    let staticPartCount = 0;
    for (const part of pattern.split('/')) {
        if (part) {
            // If any part is dynamic, then the route is dynamic
            const isDynamicPart = part.startsWith(':') || part.startsWith('*') || part.includes('*not-found');
            isDynamic ||= isDynamicPart;
            if (!(0, matchers_1.matchGroupName)(part)) {
                parts.push(part);
                if (!isDynamicPart) {
                    staticPartCount++;
                }
            }
        }
    }
    const hasChildren = config.screens ? !!Object.keys(config.screens)?.length : false;
    const type = hasChildren ? 'layout' : isDynamic ? 'dynamic' : 'static';
    if (isIndex) {
        parts.push('index');
        staticPartCount++;
    }
    return {
        type,
        isIndex,
        hasChildren,
        parts,
        staticPartCount,
        userReadableName: [...routeNames.slice(0, -1), config.path || screen].join('/'),
        // Don't include the __root route name
        expandedRouteNames: routeNames.slice(1).flatMap((name) => {
            return name.split('/');
        }),
    };
}
function assertScreens(options) {
    if (!options?.screens) {
        throw Error("You must pass a 'screens' object to 'getStateFromPath' to generate a path.");
    }
}
function configRegExp(config) {
    return config.pattern
        ? new RegExp(`^(${config.pattern.split('/').map(formatRegexPattern).join('')})$`)
        : undefined;
}
function isDynamicPart(p) {
    return p.length > 1 && (p.startsWith(':') || p.startsWith('*'));
}
function replacePart(p) {
    return p.replace(/^[:*]/, '').replace(/\?$/, '');
}
function getParamValue(p, value) {
    if (p.startsWith('*')) {
        const values = value.split('/').filter((v) => v !== '');
        return values.length === 0 && p.endsWith('?') ? undefined : values;
    }
    else {
        return value;
    }
}
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
function handleUrlParams(route, params) {
    if (params) {
        route.params = Object.assign(Object.create(null), route.params);
        for (const [name, value] of Object.entries(params)) {
            if (route.params?.[name]) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`Route '/${route.name}' with param '${name}' was specified both in the path and as a param, removing from path`);
                }
            }
            if (!route.params?.[name]) {
                route.params[name] = value;
                continue;
            }
        }
        if (Object.keys(route.params).length === 0) {
            delete route.params;
        }
    }
}
function spreadParamsAcrossAllStates(state, params) {
    while (state) {
        const route = state.routes[0];
        route.params = Object.assign({}, route.params, params);
    }
}
function stripBaseUrl(path, baseUrl = process.env.EXPO_BASE_URL) {
    if (process.env.NODE_ENV !== 'development') {
        if (baseUrl) {
            return path.replace(/^\/+/g, '/').replace(new RegExp(`^\\/?${(0, escape_string_regexp_1.default)(baseUrl)}`, 'g'), '');
        }
    }
    return path;
}
function matchForEmptyPath(configs) {
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
    return match;
}
function appendIsInitial(initialRoutes) {
    const resolvedInitialPatterns = initialRoutes.map((route) => joinPaths(...route.parentScreens, route.initialRouteName));
    return function (config) {
        // TODO(EvanBacon): Probably a safer way to do this
        // Mark initial routes to give them potential priority over other routes that match.
        config.isInitial = resolvedInitialPatterns.includes(config.routeNames.join('/'));
        return config;
    };
}
const joinPaths = (...paths) => []
    .concat(...paths.map((p) => p.split('/')))
    .filter(Boolean)
    .join('/');
function getRouteConfigSorter(previousSegments = []) {
    return function sortConfigs(a, b) {
        // Sort config so that:
        // - the most exhaustive ones are always at the beginning
        // - patterns with wildcard are always at the end
        // If 2 patterns are same, move the one with less route names up
        // This is an error state, so it's only useful for consistent error messages
        if (a.pattern === b.pattern) {
            return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
        }
        /*
         * If one of the patterns starts with the other, it is earlier in the config sorting.
         * However, configs are a mix of route configs and layout configs
         * e.g There will be a config for `/(group)`, but maybe there isn't a `/(group)/index.tsx`
         *
         * This is because you can navigate to a directory and its navigator will determine the route
         * These routes should be later in the config sorting, as their patterns are very open
         * and will prevent routes from being matched
         *
         * Therefore before we compare segment parts, we force these layout configs later in the sorting
         *
         * NOTE(marklawlor): Is this a feature we want? I'm unsure if this is a gimmick or a feature.
         */
        if (a.pattern.startsWith(b.pattern) && !b.isIndex) {
            return -1;
        }
        if (b.pattern.startsWith(a.pattern) && !a.isIndex) {
            return 1;
        }
        /*
         * Static routes should always be higher than dynamic and layout routes.
         */
        if (a.type === 'static' && b.type !== 'static') {
            return -1;
        }
        else if (a.type !== 'static' && b.type === 'static') {
            return 1;
        }
        /*
         * If the routes have any static segments, the one the most static segments should be higher
         */
        if (a.staticPartCount !== b.staticPartCount) {
            return b.staticPartCount - a.staticPartCount;
        }
        /*
         * If both are static/dynamic or a layout file, then we check group similarity
         */
        const similarToPreviousA = previousSegments.filter((value, index) => {
            return value === a.expandedRouteNames[index] && value.startsWith('(') && value.endsWith(')');
        });
        const similarToPreviousB = previousSegments.filter((value, index) => {
            return value === b.expandedRouteNames[index] && value.startsWith('(') && value.endsWith(')');
        });
        if ((similarToPreviousA.length > 0 || similarToPreviousB.length > 0) &&
            similarToPreviousA.length !== similarToPreviousB.length) {
            // One matches more than the other, so pick the one that matches more
            return similarToPreviousB.length - similarToPreviousA.length;
        }
        /*
         * If there is not difference in similarity, then each non-group segment is compared against each other
         */
        for (let i = 0; i < Math.max(a.parts.length, b.parts.length); i++) {
            // if b is longer, b get higher priority
            if (a.parts[i] == null) {
                return 1;
            }
            // if a is longer, a get higher priority
            if (b.parts[i] == null) {
                return -1;
            }
            const aWildCard = a.parts[i].startsWith('*');
            const bWildCard = b.parts[i].startsWith('*');
            // if both are wildcard we compare next component
            if (aWildCard && bWildCard) {
                const aNotFound = a.parts[i].match(/^[*]not-found$/);
                const bNotFound = b.parts[i].match(/^[*]not-found$/);
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
            const aSlug = a.parts[i].startsWith(':');
            const bSlug = b.parts[i].startsWith(':');
            // if both are wildcard we compare next component
            if (aSlug && bSlug) {
                const aNotFound = a.parts[i].match(/^[*]not-found$/);
                const bNotFound = b.parts[i].match(/^[*]not-found$/);
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
        /*
         * Both configs are identical in specificity and segments count/type
         * Try and sort by initial instead.
         *
         * TODO: We don't differentiate between the default initialRoute and group specific default routes
         *
         * const unstable_settings = {
         *   "group": {
         *     initialRouteName: "article"
         *  }
         * }
         *
         * "article" will be ranked higher because its an initialRoute for a group - even if not your not currently in
         * that group. The current work around is to ways provide initialRouteName for all groups
         */
        if (a.isInitial && !b.isInitial) {
            return -1;
        }
        else if (!a.isInitial && b.isInitial) {
            return 1;
        }
        return b.parts.length - a.parts.length;
    };
}
function parseQueryParams(path, route, parseConfig, hash) {
    const searchParams = new URL(path, 'https://phony.example').searchParams;
    const params = Object.create(null);
    if (hash) {
        params['#'] = hash.slice(1);
    }
    for (const name of searchParams.keys()) {
        if (route.params?.[name]) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`Route '/${route.name}' with param '${name}' was specified both in the path and as a param, removing from path`);
            }
        }
        else {
            const values = parseConfig?.hasOwnProperty(name)
                ? searchParams.getAll(name).map((value) => parseConfig[name](value))
                : searchParams.getAll(name);
            // searchParams.getAll returns an array.
            // if we only have a single value, and its not an array param, we need to extract the value
            params[name] = values.length === 1 ? values[0] : values;
        }
    }
    return Object.keys(params).length ? params : undefined;
}
function cleanPath(path) {
    path = path
        // let remaining = path
        // END FORK
        .replace(/\/+/g, '/') // Replace multiple slash (//) with single ones
        .replace(/^\//, '') // Remove extra leading slash
        .replace(/\?.*$/, ''); // Remove query params which we will handle later
    // Make sure there is a trailing slash
    return path.endsWith('/') ? path : `${path}/`;
}
function routePatternToRegex(pattern) {
    return new RegExp(`^(${pattern
        .split('/')
        .map((it) => {
        if (it.startsWith('(') && it.endsWith(')')) {
            return `${it}?`;
        }
        else if (it.startsWith(':')) {
            return `(([^/]+\\/)${it.endsWith('?') ? '?' : ''})`;
        }
        return `${it === '*' ? '.*' : (0, escape_string_regexp_1.default)(it)}\\/`;
    })
        .join('')})`);
}
//# sourceMappingURL=getStateFromPath-forks.js.map