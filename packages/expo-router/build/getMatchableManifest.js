/**
 * Copyright © 2023 650 Industries.
 * Copyright © 2023 Vercel, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on https://github.com/vercel/next.js/blob/1df2686bc9964f1a86c444701fa5cbf178669833/packages/next/src/shared/lib/router/utils/route-regex.ts
 */
import { sortRoutes } from './Route';
import { getContextKey } from './matchers';
// Given a nested route tree, return a flattened array of all routes that can be matched.
export function getMatchableManifest(route) {
    function getFlatNodes(route) {
        if (route.children.length) {
            return route.children.map((child) => getFlatNodes(child)).flat();
            // .sort(([, a], [, b]) => sortRoutes(a, b));
        }
        const key = getContextKey(route.contextKey).replace(/\/index$/, '') ?? '/';
        return [[key, route]];
    }
    // TODO: Ensure routes are sorted
    const flat = getFlatNodes(route)
        .sort(([, a], [, b]) => sortRoutes(a, b))
        .reverse();
    return getMatchableManifestForPaths(flat.map(([normalizedRoutePath, node]) => [normalizedRoutePath, node]));
}
function isApiRoute(route) {
    return !route.children.length && !!route.contextKey.match(/\+api\.[jt]sx?$/);
}
// Given a nested route tree, return a flattened array of all routes that can be matched.
export function getServerManifest(route) {
    function getFlatNodes(route) {
        if (route.children.length) {
            return route.children.map((child) => getFlatNodes(child)).flat();
            // .sort(([, a], [, b]) => sortRoutes(a, b));
        }
        const key = getContextKey(route.contextKey).replace(/\/index$/, '') ?? '/';
        return [[key, route]];
    }
    // TODO: Ensure routes are sorted
    const flat = getFlatNodes(route)
        .sort(([, a], [, b]) => sortRoutes(a, b))
        .reverse();
    const apiRoutes = flat.filter(([, route]) => isApiRoute(route));
    const otherRoutes = flat.filter(([, route]) => !isApiRoute(route));
    return {
        dynamicRoutes: getMatchableManifestForPaths(apiRoutes.map(([normalizedRoutePath, node]) => [normalizedRoutePath, node])),
        staticRoutes: getMatchableManifestForPaths(otherRoutes.map(([normalizedRoutePath, node]) => [normalizedRoutePath, node])),
    };
}
function getMatchableManifestForPaths(paths) {
    return paths.map((normalizedRoutePath) => ({
        ...getNamedRouteRegex(normalizedRoutePath[0], normalizedRoutePath[1].contextKey),
        generated: normalizedRoutePath[1].generated,
    }));
}
export function getNamedRouteRegex(normalizedRoute, page) {
    const result = getNamedParametrizedRoute(normalizedRoute);
    return {
        page: page.replace(/\.[jt]sx?$/, ''),
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
            .map((segment) => {
            if (/^\[.*\]$/.test(segment)) {
                const { name, optional, repeat } = parseParameter(segment.slice(1, -1));
                // replace any non-word characters since they can break
                // the named regex
                let cleanedKey = name.replace(/\W/g, '');
                let invalidKey = false;
                // check if the key is still invalid and fallback to using a known
                // safe key
                if (cleanedKey.length === 0 || cleanedKey.length > 30) {
                    invalidKey = true;
                }
                if (!isNaN(parseInt(cleanedKey.slice(0, 1)))) {
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
                // Make section optional
                return `(?:/${escapeStringRegexp(segment)})?`;
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
//# sourceMappingURL=getMatchableManifest.js.map