"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerManifest = getServerManifest;
const routing_1 = require("expo-router/internal/routing");
const utils_1 = require("expo-router/internal/utils");
const getNamedParametrizedRoute_1 = require("./getNamedParametrizedRoute");
function isNotFoundRoute(route) {
    return route.dynamic != null && (route.dynamic[route.dynamic.length - 1]?.notFound ?? false);
}
function uniqueBy(arr, key) {
    const seen = new Set();
    return arr.filter((item) => {
        const id = key(item);
        if (seen.has(id)) {
            return false;
        }
        seen.add(id);
        return true;
    });
}
// Given a nested route tree, return a flattened array of all routes that can be matched.
function getServerManifest(route, options) {
    function getFlatNodes(route, parentRoute = '') {
        // Use a recreated route instead of contextKey because we duplicate nodes to support array syntax.
        const absoluteRoute = [parentRoute, route.route].filter(Boolean).join('/');
        if (route.children.length) {
            return route.children.map((child) => getFlatNodes(child, absoluteRoute)).flat();
        }
        // API Routes are handled differently to HTML routes because they have no nested behavior.
        // An HTML route can be different based on parent segments due to layout routes, therefore multiple
        // copies should be rendered. However, an API route is always the same regardless of parent segments.
        let key;
        if (route.type.includes('api')) {
            key = getNormalizedContextKey(route.contextKey);
        }
        else {
            key = getNormalizedContextKey(absoluteRoute);
        }
        return [
            {
                normalizedContextKey: key,
                absoluteRoutePath: '/' + absoluteRoute,
                route,
            },
        ];
    }
    // Remove duplicates from the runtime manifest which expands array syntax.
    const flat = route
        ? getFlatNodes(route)
            .sort(({ route: a }, { route: b }) => (0, routing_1.sortRoutes)(b, a))
            .reverse()
        : [];
    const apiRoutes = uniqueBy(flat.filter(({ route }) => route.type === 'api'), ({ normalizedContextKey }) => normalizedContextKey);
    const otherRoutes = uniqueBy(flat.filter(({ route }) => route.type === 'route' ||
        (route.type === 'rewrite' && (route.methods === undefined || route.methods.includes('GET')))), ({ normalizedContextKey }) => normalizedContextKey);
    const redirects = uniqueBy(flat.filter(({ route }) => route.type === 'redirect'), ({ normalizedContextKey }) => normalizedContextKey)
        .map((redirect) => {
        // TODO(@hassankhan): ENG-16577
        // For external redirects, use `destinationContextKey` as the destination URL
        if ((0, utils_1.shouldLinkExternally)(redirect.route.destinationContextKey)) {
            redirect.absoluteRoutePath = redirect.route.destinationContextKey;
        }
        else {
            redirect.absoluteRoutePath =
                flat.find(({ route }) => route.contextKey === redirect.route.destinationContextKey)
                    ?.normalizedContextKey ?? '/';
        }
        return redirect;
    })
        .reverse();
    const rewrites = uniqueBy(flat.filter(({ route }) => route.type === 'rewrite'), ({ normalizedContextKey }) => normalizedContextKey)
        .map((rewrite) => {
        rewrite.absoluteRoutePath =
            flat.find(({ route }) => route.contextKey === rewrite.route.destinationContextKey)
                ?.normalizedContextKey ?? '/';
        return rewrite;
    })
        .reverse();
    const standardRoutes = otherRoutes.filter(({ route }) => !isNotFoundRoute(route));
    const notFoundRoutes = otherRoutes.filter(({ route }) => isNotFoundRoute(route));
    const manifest = {
        apiRoutes: getMatchableManifestForPaths(apiRoutes),
        htmlRoutes: getMatchableManifestForPaths(standardRoutes),
        notFoundRoutes: getMatchableManifestForPaths(notFoundRoutes),
        redirects: getMatchableManifestForPaths(redirects),
        rewrites: getMatchableManifestForPaths(rewrites),
    };
    if (route?.middleware) {
        manifest.middleware = {
            file: route.middleware.contextKey,
        };
    }
    if (options?.headers) {
        manifest.headers = options.headers;
    }
    return manifest;
}
function getMatchableManifestForPaths(paths) {
    return paths.map(({ normalizedContextKey, absoluteRoutePath, route }) => {
        const matcher = getNamedRouteRegex(normalizedContextKey, absoluteRoutePath, route.contextKey);
        if (route.generated) {
            matcher.generated = true;
        }
        if (route.permanent) {
            matcher.permanent = true;
        }
        if (route.methods) {
            matcher.methods = route.methods;
        }
        return matcher;
    });
}
function getNamedRouteRegex(normalizedRoute, page, file) {
    const result = (0, getNamedParametrizedRoute_1.getNamedParametrizedRoute)(normalizedRoute);
    return {
        file,
        page,
        namedRegex: `^${result.namedParameterizedRoute}(?:/)?$`,
        routeKeys: result.routeKeys,
    };
}
function getNormalizedContextKey(contextKey) {
    return (0, routing_1.getContextKey)(contextKey).replace(/\/index$/, '') ?? '/';
}
//# sourceMappingURL=getServerManifest.js.map