import { store } from '../../global-state/router-store';
import { findDivergentState, getPayloadFromStateRoute } from '../../global-state/routing';
import { resolveHref } from '../href';
import { removeInternalExpoRouterParams } from '../../navigationParams';
export function getTabPathFromRootStateByHref(href, rootState) {
    const hrefState = store.getStateForHref(resolveHref(href));
    const state = rootState;
    if (!hrefState || !state) {
        return [];
    }
    // Replicating the logic from `linkTo`
    const { navigationRoutes } = findDivergentState(hrefState, state, true);
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
export function getPreloadedRouteFromRootStateByHref(href, rootState) {
    const hrefState = store.getStateForHref(resolveHref(href));
    const state = rootState;
    if (!hrefState || !state) {
        return undefined;
    }
    // Replicating the logic from `linkTo`
    const { navigationState, actionStateRoute } = findDivergentState(hrefState, state, true);
    if (!navigationState || !actionStateRoute) {
        return undefined;
    }
    if (navigationState.type === 'stack') {
        const stackState = navigationState;
        const payload = getPayloadFromStateRoute(actionStateRoute);
        const preloadedRoute = stackState.preloadedRoutes.find((route) => route.name === actionStateRoute.name &&
            deepEqual(removeInternalExpoRouterParams(route.params), removeInternalExpoRouterParams(payload.params)));
        const activeRoute = stackState.routes[stackState.index];
        // When the active route is the same as the preloaded route,
        // then we should not navigate. It aligns with base link behavior.
        if (activeRoute.name === preloadedRoute?.name &&
            deepEqual(
            // using ?? {}, because from our perspective undefined === {}, as both mean no params
            removeInternalExpoRouterParams(activeRoute.params ?? {}), removeInternalExpoRouterParams(payload.params ?? {}))) {
            return undefined;
        }
        return preloadedRoute;
    }
    return undefined;
}
export function deepEqual(a, b) {
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