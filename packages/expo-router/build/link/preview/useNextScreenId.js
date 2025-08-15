"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNextScreenId = useNextScreenId;
const react_1 = require("react");
const LinkPreviewContext_1 = require("./LinkPreviewContext");
const utils_1 = require("./utils");
const router_store_1 = require("../../global-state/router-store");
const hooks_1 = require("../../hooks");
function useNextScreenId() {
    const router = (0, hooks_1.useRouter)();
    const { setOpenPreviewKey } = (0, LinkPreviewContext_1.useLinkPreviewContext)();
    const [internalNextScreenId, internalSetNextScreenId] = (0, react_1.useState)();
    const currentHref = (0, react_1.useRef)(undefined);
    const [tabPath, setTabPath] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        // When screen is prefetched, then the root state is updated with the preloaded route.
        return router_store_1.store.navigationRef.addListener('state', ({ data: { state } }) => {
            // If we have the current href, it means that we prefetched the route
            if (currentHref.current && state) {
                const preloadedRoute = (0, utils_1.getPreloadedRouteFromRootStateByHref)(currentHref.current, state);
                const routeKey = preloadedRoute?.key;
                const tabPathFromRootState = (0, utils_1.getTabPathFromRootStateByHref)(currentHref.current, state);
                // Without this timeout react-native does not have enough time to mount the new screen
                // and thus it will not be found on the native side
                if (routeKey || tabPathFromRootState.length) {
                    setTimeout(() => {
                        internalSetNextScreenId(routeKey);
                        setOpenPreviewKey(routeKey);
                        setTabPath(tabPathFromRootState);
                    });
                }
                // We got the preloaded state, so we can reset the currentHref
                // to prevent unnecessary processing
                currentHref.current = undefined;
            }
        });
    }, []);
    const prefetch = (0, react_1.useCallback)((href) => {
        // Resetting the nextScreenId to undefined
        internalSetNextScreenId(undefined);
        router.prefetch(href);
        currentHref.current = href;
    }, [router.prefetch]);
    return [{ nextScreenId: internalNextScreenId, tabPath }, prefetch];
}
//# sourceMappingURL=useNextScreenId.js.map