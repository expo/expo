"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNextScreenId = useNextScreenId;
const react_1 = require("react");
const router_store_1 = require("../../global-state/router-store");
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
    let hrefState = router_store_1.store.getStateForHref((0, href_1.resolveHref)(href));
    let state = rootState;
    while (hrefState && state) {
        const currentHrefRoute = hrefState.routes[0];
        const currentStateRoute = currentHrefRoute
            ? state.routes.find((r) => r.name === currentHrefRoute.name)
            : undefined;
        if (!currentStateRoute) {
            // Only checking stack, because it is the only native navigator.
            if (state.type === 'stack') {
                const stackState = state;
                // Sometimes the route is stored inside params
                const innerRoute = currentHrefRoute.state ? currentHrefRoute.state.routes[0] : undefined;
                const preloadedRoute = stackState.preloadedRoutes.find((route) => route.name === currentHrefRoute.name &&
                    (!innerRoute ||
                        (route.params && 'screen' in route.params && route.params.screen === innerRoute.name)));
                return preloadedRoute;
            }
        }
        hrefState = currentHrefRoute?.state;
        state = currentStateRoute?.state;
    }
    return undefined;
}
//# sourceMappingURL=useNextScreenId.js.map