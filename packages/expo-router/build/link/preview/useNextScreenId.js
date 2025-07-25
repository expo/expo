"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNextScreenId = useNextScreenId;
const react_1 = require("react");
const router_store_1 = require("../../global-state/router-store");
const routing_1 = require("../../global-state/routing");
const href_1 = require("../href");
function useNextScreenId() {
    const [internalNextScreenId, internalSetNextScreenId] = (0, react_1.useState)();
    const [tabPath, setTabPath] = (0, react_1.useState)([]);
    const setNextScreenId = (0, react_1.useCallback)((href) => {
        console.log('>>>>>>>>> Setting next screen id for', href);
        const preloadedRoute = getPreloadedRouteFromRootStateByHref(href);
        const routeKey = preloadedRoute?.key;
        internalSetNextScreenId(routeKey);
        const tabPathFromRootState = getTabPathFromRootStateByHref(href);
        setTabPath(tabPathFromRootState);
        console.log('preloadedRoute', preloadedRoute);
        console.log('tabPathFromRootState', tabPathFromRootState);
    }, []);
    return [{ internalNextScreenId, tabPath }, setNextScreenId];
}
function getTabPathFromRootStateByHref(href) {
    const rootState = router_store_1.store.state;
    const hrefState = router_store_1.store.getStateForHref((0, href_1.resolveHref)(href));
    const state = rootState;
    if (!hrefState || !state) {
        return [];
    }
    // Replicating the logic from `linkTo`
    const { navigationRoutes } = (0, routing_1.findDivergentState)(hrefState, state, 'PRELOAD');
    if (!navigationRoutes.length) {
        return [];
    }
    const tabPath = [];
    navigationRoutes.forEach((route, i, arr) => {
        if (route.state?.type === 'tab') {
            const tabState = route.state;
            const oldTabKey = tabState.routes[tabState.index].key;
            if (!arr[i + 1]) {
                throw new Error(`New tab route is missing for ${route.key}. This is likely an internal Expo Router bug.`);
            }
            const newTabKey = arr[i + 1].key;
            tabPath.push({ oldTabKey, newTabKey });
        }
    });
    console.log(tabPath, 'tabPath');
    return tabPath;
}
function getPreloadedRouteFromRootStateByHref(href) {
    const rootState = router_store_1.store.state;
    const hrefState = router_store_1.store.getStateForHref((0, href_1.resolveHref)(href));
    const state = rootState;
    if (!hrefState || !state) {
        return undefined;
    }
    // Replicating the logic from `linkTo`
    const { navigationState, actionStateRoute } = (0, routing_1.findDivergentState)(hrefState, state, 'PRELOAD');
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