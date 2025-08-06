"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNextScreenId = useNextScreenId;
const react_1 = require("react");
const router_store_1 = require("../../global-state/router-store");
const routing_1 = require("../../global-state/routing");
const href_1 = require("../href");
function useNextScreenId() {
    const [internalNextScreenId, internalSetNextScreenId] = (0, react_1.useState)();
    const setNextScreenId = (0, react_1.useCallback)((href) => {
        const preloadedRoute = getPreloadedRouteFromRootStateByHref(href);
        const routeKey = preloadedRoute?.key;
        internalSetNextScreenId(routeKey);
    }, []);
    return [internalNextScreenId, setNextScreenId];
}
function getPreloadedRouteFromRootStateByHref(href) {
    const rootState = router_store_1.store.state;
    const hrefState = router_store_1.store.getStateForHref((0, href_1.resolveHref)(href));
    const state = rootState;
    if (!hrefState || !state) {
        return undefined;
    }
    // Replicating the logic from `linkTo`
    const { navigationState, actionStateRoute } = (0, routing_1.findDivergentState)(hrefState, state);
    if (!navigationState || !actionStateRoute) {
        return undefined;
    }
    if (navigationState.type === 'stack') {
        const stackState = navigationState;
        const payload = (0, routing_1.getPayloadFromStateRoute)(actionStateRoute);
        const preloadedRoute = stackState.preloadedRoutes.find((route) => route.name === actionStateRoute.name && deepEqual(route.params, payload.params));
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
    return (Object.keys(a).length === Object.keys(b).length &&
        Object.keys(a).every((key) => deepEqual(a[key], b[key])));
}
//# sourceMappingURL=useNextScreenId.js.map