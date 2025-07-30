"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRouteInfo = void 0;
exports.getRouteInfoFromState = getRouteInfoFromState;
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
function getRouteInfoFromState(state) {
    if (!state)
        return exports.defaultRouteInfo;
    const index = 'index' in state ? (state.index ?? 0) : 0;
    let route = state.routes[index];
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
    state = route.state;
    const segments = [];
    let params = Object.create(null);
    while (state) {
        route = state.routes['index' in state && state.index ? state.index : 0];
        Object.assign(params, route.params);
        let routeName = route.name;
        if (routeName.startsWith('/')) {
            routeName = routeName.slice(1);
        }
        segments.push(...routeName.split('/'));
        state = route.state;
    }
    params = Object.fromEntries(Object.entries(params).map(([key, value]) => {
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
    /**
     * If React Navigation didn't render the entire tree (e.g it was interrupted in a layout)
     * then the state maybe incomplete. The reset of the path is in the params, instead of being a route
     */
    let routeParams = route.params;
    while (routeParams && 'screen' in routeParams) {
        if (typeof routeParams.screen === 'string') {
            const screen = routeParams.screen.startsWith('/')
                ? routeParams.screen.slice(1)
                : routeParams.screen;
            segments.push(...screen.split('/'));
        }
        if (typeof routeParams.params === 'object' && !Array.isArray(routeParams.params)) {
            routeParams = routeParams.params;
        }
        else {
            routeParams = undefined;
        }
    }
    if (route.params && 'screen' in route.params && route.params.screen === 'string') {
        const screen = route.params.screen.startsWith('/')
            ? route.params.screen.slice(1)
            : route.params.screen;
        segments.push(...screen.split('/'));
    }
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