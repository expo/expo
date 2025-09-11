"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerManifest = getServerManifest;
exports.parseParameter = parseParameter;
const matchers_1 = require("./matchers");
const sortRoutes_1 = require("./sortRoutes");
const url_1 = require("./utils/url");
function isNotFoundRoute(route) {
    return route.dynamic && route.dynamic[route.dynamic.length - 1].notFound;
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
function getServerManifest(route) {
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
            key = (0, matchers_1.getContextKey)(route.contextKey).replace(/\/index$/, '') ?? '/';
        }
        else {
            key = (0, matchers_1.getContextKey)(absoluteRoute).replace(/\/index$/, '') ?? '/';
        }
        return [[key, '/' + absoluteRoute, route]];
    }
    // Remove duplicates from the runtime manifest which expands array syntax.
    const flat = getFlatNodes(route)
        .sort(([, , a], [, , b]) => (0, sortRoutes_1.sortRoutes)(b, a))
        .reverse();
    const apiRoutes = uniqueBy(flat.filter(([, , route]) => route.type === 'api'), ([path]) => path);
    const otherRoutes = uniqueBy(flat.filter(([, , route]) => route.type === 'route' ||
        (route.type === 'rewrite' && (route.methods === undefined || route.methods.includes('GET')))), ([path]) => path);
    const redirects = uniqueBy(flat.filter(([, , route]) => route.type === 'redirect'), ([path]) => path)
        .map((redirect) => {
        // TODO(@hassankhan): ENG-16577
        // For external redirects, use `destinationContextKey` as the destination URL
        if ((0, url_1.shouldLinkExternally)(redirect[2].destinationContextKey)) {
            redirect[1] = redirect[2].destinationContextKey;
        }
        else {
            redirect[1] =
                flat.find(([, , route]) => route.contextKey === redirect[2].destinationContextKey)?.[0] ??
                    '/';
        }
        return redirect;
    })
        .reverse();
    const rewrites = uniqueBy(flat.filter(([, , route]) => route.type === 'rewrite'), ([path]) => path)
        .map((rewrite) => {
        rewrite[1] =
            flat.find(([, , route]) => route.contextKey === rewrite[2].destinationContextKey)?.[0] ??
                '/';
        return rewrite;
    })
        .reverse();
    const standardRoutes = otherRoutes.filter(([, , route]) => !isNotFoundRoute(route));
    const notFoundRoutes = otherRoutes.filter(([, , route]) => isNotFoundRoute(route));
    const manifest = {
        apiRoutes: getMatchableManifestForPaths(apiRoutes),
        htmlRoutes: getMatchableManifestForPaths(standardRoutes),
        notFoundRoutes: getMatchableManifestForPaths(notFoundRoutes),
        redirects: getMatchableManifestForPaths(redirects),
        rewrites: getMatchableManifestForPaths(rewrites),
    };
    if (route.middleware) {
        manifest.middleware = {
            file: route.middleware.contextKey,
        };
    }
    return manifest;
}
function getMatchableManifestForPaths(paths) {
    return paths.map(([normalizedRoutePath, absoluteRoute, node]) => {
        const matcher = getNamedRouteRegex(normalizedRoutePath, absoluteRoute, node.contextKey);
        if (node.generated) {
            matcher.generated = true;
        }
        if (node.permanent) {
            matcher.permanent = true;
        }
        if (node.methods) {
            matcher.methods = node.methods;
        }
        return matcher;
    });
}
function getNamedRouteRegex(normalizedRoute, page, file) {
    const result = getNamedParametrizedRoute(normalizedRoute);
    return {
        file,
        page,
        namedRegex: `^${result.namedParameterizedRoute}(?:/)?$`,
        routeKeys: result.routeKeys,
    };
}
/**
 * Builds a function to generate a minimal routeKey using only a-z and minimal
 * number of characters.
 */
function buildGetSafeRouteKey() {
    let currentCharCode = 96; // Starting one before 'a' to make the increment logic simpler
    let currentLength = 1;
    return () => {
        let result = '';
        let incrementNext = true;
        // Iterate from right to left to build the key
        for (let i = 0; i < currentLength; i++) {
            if (incrementNext) {
                currentCharCode++;
                if (currentCharCode > 122) {
                    currentCharCode = 97; // Reset to 'a'
                    incrementNext = true; // Continue to increment the next character
                }
                else {
                    incrementNext = false;
                }
            }
            result = String.fromCharCode(currentCharCode) + result;
        }
        // If all characters are 'z', increase the length of the key
        if (incrementNext) {
            currentLength++;
            currentCharCode = 96; // This will make the next key start with 'a'
        }
        return result;
    };
}
function removeTrailingSlash(route) {
    return route.replace(/\/$/, '') || '/';
}
function getNamedParametrizedRoute(route) {
    const segments = removeTrailingSlash(route).slice(1).split('/');
    const getSafeRouteKey = buildGetSafeRouteKey();
    const routeKeys = {};
    return {
        namedParameterizedRoute: segments
            .map((segment, index) => {
            if (segment === '+not-found' && index === segments.length - 1) {
                segment = '[...not-found]';
            }
            if (/^\[.*\]$/.test(segment)) {
                const { name, optional, repeat } = parseParameter(segment);
                // replace any non-word characters since they can break
                // the named regex
                let cleanedKey = name.replace(/\W/g, '');
                let invalidKey = false;
                // check if the key is still invalid and fallback to using a known
                // safe key
                if (cleanedKey.length === 0 || cleanedKey.length > 30) {
                    invalidKey = true;
                }
                if (!isNaN(parseInt(cleanedKey.slice(0, 1), 10))) {
                    invalidKey = true;
                }
                // Prevent duplicates after sanitizing the key
                if (cleanedKey in routeKeys) {
                    invalidKey = true;
                }
                if (invalidKey) {
                    cleanedKey = getSafeRouteKey();
                }
                routeKeys[cleanedKey] = name;
                return repeat
                    ? optional
                        ? `(?:/(?<${cleanedKey}>.+?))?`
                        : `/(?<${cleanedKey}>.+?)`
                    : `/(?<${cleanedKey}>[^/]+?)`;
            }
            else if (/^\(.*\)$/.test(segment)) {
                const groupName = (0, matchers_1.matchGroupName)(segment)
                    .split(',')
                    .map((group) => group.trim())
                    .filter(Boolean);
                if (groupName.length > 1) {
                    const optionalSegment = `\\((?:${groupName.map(escapeStringRegexp).join('|')})\\)`;
                    // Make section optional
                    return `(?:/${optionalSegment})?`;
                }
                else {
                    // Use simpler regex for single groups
                    return `(?:/${escapeStringRegexp(segment)})?`;
                }
            }
            else {
                return `/${escapeStringRegexp(segment)}`;
            }
        })
            .join(''),
        routeKeys,
    };
}
// regexp is based on https://github.com/sindresorhus/escape-string-regexp
const reHasRegExp = /[|\\{}()[\]^$+*?.-]/;
const reReplaceRegExp = /[|\\{}()[\]^$+*?.-]/g;
function escapeStringRegexp(str) {
    // see also: https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/escapeRegExp.js#L23
    if (reHasRegExp.test(str)) {
        return str.replace(reReplaceRegExp, '\\$&');
    }
    return str;
}
function parseParameter(param) {
    let repeat = false;
    let optional = false;
    let name = param;
    if (/^\[.*\]$/.test(name)) {
        optional = true;
        name = name.slice(1, -1);
    }
    if (/^\.\.\./.test(name)) {
        repeat = true;
        name = name.slice(3);
    }
    return { name, repeat, optional };
}
//# sourceMappingURL=getServerManifest.js.map