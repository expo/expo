"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNextScreenId = useNextScreenId;
const react_1 = require("react");
const router_store_1 = require("../../global-state/router-store");
const routing_1 = require("../../global-state/routing");
const href_1 = require("../href");
const LinkPreviewContext_1 = require("./LinkPreviewContext");
const hooks_1 = require("../../hooks");
function useNextScreenId() {
    const router = (0, hooks_1.useRouter)();
    const { setOpenPreviewKey } = (0, LinkPreviewContext_1.useLinkPreviewContext)();
    const [internalNextScreenId, internalSetNextScreenId] = (0, react_1.useState)();
    const currentHref = (0, react_1.useRef)(undefined);
    (0, react_1.useEffect)(() => {
        // When screen is prefetched, then the root state is updated with the preloaded route.
        return router_store_1.store.navigationRef.addListener('state', () => {
            // If we have the current href, it means that we prefetched the route
            if (currentHref.current) {
                const preloadedRoute = getPreloadedRouteFromRootStateByHref(currentHref.current);
                const routeKey = preloadedRoute?.key;
                // Without this timeout react-native does not have enough time to mount the new screen
                // and thus it will not be found on the native side
                if (routeKey) {
                    setTimeout(() => {
                        internalSetNextScreenId(routeKey);
                        setOpenPreviewKey(routeKey);
                    });
                    // We found the preloaded route, so we can reset the currentHref
                    // to prevent unnecessary processing
                    currentHref.current = undefined;
                }
            }
        });
    }, []);
    const prefetch = (0, react_1.useCallback)((href) => {
        // Resetting the nextScreenId to undefined
        internalSetNextScreenId(undefined);
        router.prefetch(href);
        currentHref.current = href;
    }, [router.prefetch]);
    return [internalNextScreenId, prefetch];
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