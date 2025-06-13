"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScreenPreload = useScreenPreload;
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const react_1 = require("react");
const HrefPreview_1 = require("./HrefPreview");
const storeContext_1 = require("../../global-state/storeContext");
const hooks_1 = require("../../hooks");
function useScreenPreload(href) {
    const router = (0, hooks_1.useRouter)();
    const [navigationKey, setNavigationKey] = (0, react_1.useState)();
    const store = (0, storeContext_1.useExpoRouterStore)();
    const { params, routeNode } = (0, react_1.useMemo)(() => (0, HrefPreview_1.getParamsAndNodeFromHref)(href), [href]);
    // TODO: check if this can be done with listener to navigation state
    const updateNavigationKey = (0, react_1.useCallback)(() => {
        const rootState = store.state;
        const allPreloadedRoutes = rootState ? getAllPreloadedRoutes(rootState) : [];
        const routeKey = allPreloadedRoutes.find((r) => {
            // TODO: find out if this is correct and necessary solution. This is to cover cases of (.......)/index
            if (r.params && 'screen' in r.params && 'params' in r.params) {
                return r.params.screen === routeNode?.route && (0, fast_deep_equal_1.default)(r.params.params, params);
            }
            return r.name === routeNode?.route && (0, fast_deep_equal_1.default)(r.params, params);
        })?.key;
        setNavigationKey(routeKey);
    }, [params, routeNode]);
    const preload = (0, react_1.useCallback)(() => {
        router.prefetch(href);
    }, [href]);
    return {
        preload,
        updateNavigationKey,
        navigationKey,
    };
}
function getAllPreloadedRoutes(state) {
    const routes = [];
    if (state.type === 'stack') {
        routes.push(...state.preloadedRoutes);
    }
    if (state.type === 'tab') {
        const castedState = state;
        routes.push(...castedState.preloadedRouteKeys
            .map((key) => castedState.routes.find((route) => route.key === key))
            .filter((x) => !!x));
    }
    for (const route of state.routes) {
        if (route.state) {
            routes.push(...getAllPreloadedRoutes(route.state));
        }
    }
    return routes;
}
//# sourceMappingURL=useScreenPreload.js.map