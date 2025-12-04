"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTabPathFromRootStateByHref = getTabPathFromRootStateByHref;
exports.getPreloadedRouteFromRootStateByHref = getPreloadedRouteFromRootStateByHref;
exports.deepEqual = deepEqual;
const router_store_1 = require("../../global-state/router-store");
const routing_1 = require("../../global-state/routing");
const href_1 = require("../href");
const navigationParams_1 = require("../../navigationParams");
function getTabPathFromRootStateByHref(href, rootState) {
    const hrefState = router_store_1.store.getStateForHref((0, href_1.resolveHref)(href));
    const state = rootState;
    if (!hrefState || !state) {
        return [];
    }
    // Replicating the logic from `linkTo`
    const { navigationRoutes } = (0, routing_1.findDivergentState)(hrefState, state, true);
    if (!navigationRoutes.length) {
        return [];
    }
    const tabPath = [];
    navigationRoutes.forEach((route, i, arr) => {
        if (route.state?.type === 'tab') {
            const tabState = route.state;
            const oldTabKey = tabState.routes[tabState.index].key;
            // The next route will be either stack inside a tab or a new tab key
            if (!arr[i + 1]) {
                throw new Error(`New tab route is missing for ${route.key}. This is likely an internal Expo Router bug.`);
            }
            const newTabKey = arr[i + 1].key;
            tabPath.push({ oldTabKey, newTabKey });
        }
    });
    return tabPath;
}
function getPreloadedRouteFromRootStateByHref(href, rootState) {
    const hrefState = router_store_1.store.getStateForHref((0, href_1.resolveHref)(href));
    const state = rootState;
    if (!hrefState || !state) {
        return undefined;
    }
    // Replicating the logic from `linkTo`
    const { navigationState, actionStateRoute } = (0, routing_1.findDivergentState)(hrefState, state, true);
    if (!navigationState || !actionStateRoute) {
        return undefined;
    }
    if (navigationState.type === 'stack') {
        const stackState = navigationState;
        const payload = (0, routing_1.getPayloadFromStateRoute)(actionStateRoute);
        const preloadedRoute = stackState.preloadedRoutes.find((route) => route.name === actionStateRoute.name &&
            deepEqual((0, navigationParams_1.removeInternalExpoRouterParams)(route.params), (0, navigationParams_1.removeInternalExpoRouterParams)(payload.params)));
        const activeRoute = stackState.routes[stackState.index];
        // When the active route is the same as the preloaded route,
        // then we should not navigate. It aligns with base link behavior.
        if (activeRoute.name === preloadedRoute?.name &&
            deepEqual(
            // using ?? {}, because from our perspective undefined === {}, as both mean no params
            (0, navigationParams_1.removeInternalExpoRouterParams)(activeRoute.params ?? {}), (0, navigationParams_1.removeInternalExpoRouterParams)(payload.params ?? {}))) {
            return undefined;
        }
        return preloadedRoute;
    }
    return undefined;
}
function deepEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }
    if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
    }
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => deepEqual(a[key], b[key]));
}
//# sourceMappingURL=utils.js.map