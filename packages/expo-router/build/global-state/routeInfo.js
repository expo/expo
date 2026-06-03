"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRouteInfo = void 0;
exports.computeRouteInfo = computeRouteInfo;
exports.routeInfoFromState = routeInfoFromState;
const constants_1 = require("../constants");
const getPathFromState_forks_1 = require("../fork/getPathFromState-forks");
exports.defaultRouteInfo = {
    unstable_globalHref: '',
    searchParams: new URLSearchParams(),
    pathname: '/',
    params: {},
    segments: [],
    pathnameWithParams: '/',
    // TODO: Remove this, it is not used anywhere
    isIndex: false,
};
/**
 * Extends a parent level's route info with one more navigation level, returning the route info for
 * the path up to that level. This is the incremental building block carried in `RouteInfoContext`:
 * each level memoizes `computeRouteInfo(parent, route)`, so the route info (and its reference)
 * changes only when this route's params change. Reducing the focused levels of a full state through
 * it (see {@link routeInfoFromState}) reproduces a whole-state computation.
 *
 * `__root` (the internal slot) contributes nothing — it's unwrapped just like the whole-state walk.
 */
function computeRouteInfo(parent, route) {
    if (route.name === constants_1.INTERNAL_SLOT_NAME) {
        return parent;
    }
    let routeName = route.name;
    if (routeName.startsWith('/')) {
        routeName = routeName.slice(1);
    }
    // The parent's already-decoded params plus this level's decoded params. Decoding per level (only
    // the new params) is equivalent to decoding the merged params once, and avoids double-decoding.
    const params = {
        ...parent.params,
        ...decodeParams(route.params),
    };
    const segments = [...parent.segments, ...routeName.split('/')];
    if (segments[segments.length - 1] === 'index') {
        segments.pop();
    }
    delete params['screen'];
    delete params['params'];
    const pathParams = new Set();
    const pathname = '/' +
        segments
            .filter((segment) => {
            return !(segment.startsWith('(') && segment.endsWith(')'));
        })
            .flatMap((segment) => {
            if (segment === '+not-found') {
                const notFoundPath = params['not-found'];
                pathParams.add('not-found');
                if (typeof notFoundPath === 'undefined') {
                    // Not founds are optional, do nothing if its not present
                    return [];
                }
                else if (Array.isArray(notFoundPath)) {
                    return notFoundPath;
                }
                else {
                    return [notFoundPath];
                }
            }
            else if (segment.startsWith('[...') && segment.endsWith(']')) {
                let paramName = segment.slice(4, -1);
                // Legacy for React Navigation optional params
                if (paramName.endsWith('?')) {
                    paramName = paramName.slice(0, -1);
                }
                const values = params[paramName];
                pathParams.add(paramName);
                // Catchall params are optional
                return values || [];
            }
            else if (segment.startsWith('[') && segment.endsWith(']')) {
                const paramName = segment.slice(1, -1);
                const value = params[paramName];
                pathParams.add(paramName);
                // Optional params are optional
                return value ? [value] : [];
            }
            else {
                return [segment];
            }
        })
            .join('/');
    const searchParams = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => {
        // Search params should not include path params
        if (pathParams.has(key)) {
            return [];
        }
        else if (Array.isArray(value)) {
            return value.map((v) => [key, v]);
        }
        return [[key, value]];
    }));
    let hash;
    if (searchParams.has('#')) {
        hash = searchParams.get('#') || undefined;
        searchParams.delete('#');
    }
    // We cannot use searchParams.size because it is not included in the React Native polyfill
    const searchParamString = searchParams.toString();
    let pathnameWithParams = searchParamString ? pathname + '?' + searchParamString : pathname;
    pathnameWithParams = hash ? pathnameWithParams + '#' + hash : pathnameWithParams;
    return {
        segments,
        pathname,
        params,
        unstable_globalHref: (0, getPathFromState_forks_1.appendBaseUrl)(pathnameWithParams),
        searchParams,
        pathnameWithParams,
        // TODO: Remove this, it is not used anywhere
        isIndex: false,
    };
}
/**
 * Builds route info from a full navigation state by reducing each focused level through
 * {@link computeRouteInfo}. Used where a complete state is available outside of React rendering
 * (e.g. the static-render prefetch in `useStore`); the rendered app instead accumulates
 * incrementally via `RouteInfoContext`.
 */
function routeInfoFromState(state) {
    if (!state)
        return exports.defaultRouteInfo;
    // TODO(@kitten): Review edge-case type safety
    const index = 'index' in state ? (state.index ?? 0) : 0;
    let route = state.routes[index];
    // A top-level `+not-found` / `_sitemap` (rendered as a sibling of `__root`) derives its pathname
    // from `route.path`, not from params. A `+not-found` *under* `__root` is a normal route and goes
    // through the general path below, resolving its catch-all `not-found` param.
    if (route.name === constants_1.NOT_FOUND_ROUTE_NAME || route.name === constants_1.SITEMAP_ROUTE_NAME) {
        const path = route.path || (route.name === constants_1.NOT_FOUND_ROUTE_NAME ? '/' : `/${route.name}`);
        return {
            ...exports.defaultRouteInfo,
            unstable_globalHref: (0, getPathFromState_forks_1.appendBaseUrl)(path),
            pathname: path,
            pathnameWithParams: path,
            segments: [route.name],
        };
    }
    if (route.name !== constants_1.INTERNAL_SLOT_NAME) {
        throw new Error(`Expected the first route to be ${constants_1.INTERNAL_SLOT_NAME}, but got ${route.name}`);
    }
    let routeInfo = exports.defaultRouteInfo;
    let nestedState = route.state;
    while (nestedState) {
        route =
            nestedState.routes['index' in nestedState && nestedState.index ? nestedState.index : 0];
        routeInfo = computeRouteInfo(routeInfo, route);
        nestedState = route.state;
    }
    // If the tree wasn't fully rendered (e.g. a navigation was interrupted in a layout), the rest of
    // the path lives in the leaf route's `screen`/`params`. Unroll it as additional virtual levels.
    // This only applies to the leaf — intermediate routes' `screen` markers are already rendered as
    // real nested routes (so they were descended into above) and must not be unrolled again.
    let marker = route.params;
    while (marker && 'screen' in marker) {
        if (typeof marker.screen === 'string') {
            routeInfo = computeRouteInfo(routeInfo, { name: marker.screen });
        }
        marker =
            typeof marker.params === 'object' && !Array.isArray(marker.params)
                ? marker.params
                : undefined;
    }
    return routeInfo;
}
function decodeParams(params) {
    if (!params)
        return {};
    return Object.fromEntries(Object.entries(params).map(([key, value]) => {
        if (typeof value === 'string') {
            return [key, safeDecodeURIComponent(value)];
        }
        else if (Array.isArray(value)) {
            return [key, value.map((v) => safeDecodeURIComponent(v))];
        }
        else {
            return [key, value];
        }
    }));
}
function safeDecodeURIComponent(value) {
    try {
        return typeof value === 'string' ? decodeURIComponent(value) : value;
    }
    catch {
        // If the value is not a valid URI component, return it as is
        return value;
    }
}
//# sourceMappingURL=routeInfo.js.map