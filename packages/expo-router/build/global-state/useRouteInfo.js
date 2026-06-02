"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouteInfo = useRouteInfo;
const react_1 = require("react");
const routeInfoCache_1 = require("./routeInfoCache");
const store_1 = require("./store");
const PreviewRouteContext_1 = require("../link/preview/PreviewRouteContext");
function useRouteInfo() {
    // Route info is a derived projection of the navigation tree, finalized after each commit with the
    // leaf-accurate focused params (via setFocusedState). Read it during render and force a re-render
    // only when it actually changed since the last render — `getCachedRouteInfo` returns
    // referentially-stable values, so this gives uSES-like snapshot-equality bail-out and
    // render-once-per-navigation, without the `useSyncExternalStore` API.
    //
    // NOTE: this is an APPROXIMATION of uSES, not an equivalent. It reads a mutable external during
    // render, so it forgoes uSES's mid-render tearing protection — acceptable today because navigation
    // is not yet wrapped in startTransition, but a real gap to revisit when it is (see RouteInfoContext
    // follow-up). The mount-time re-check below closes the render→subscribe gap (cf. imperative-api).
    const routeInfo = store_1.store.getRouteInfo();
    const lastRouteInfoRef = (0, react_1.useRef)(routeInfo);
    lastRouteInfoRef.current = routeInfo;
    const [, forceUpdate] = (0, react_1.useReducer)((count) => count + 1, 0);
    (0, react_1.useEffect)(() => {
        const checkForChange = () => {
            if (store_1.store.getRouteInfo() !== lastRouteInfoRef.current) {
                forceUpdate();
            }
        };
        const unsubscribe = (0, routeInfoCache_1.routeInfoSubscribe)(checkForChange);
        // Safety net: catch a change that landed between the render-phase read and this subscribe
        // (cold-start navigation, StrictMode resubscribe gap) so the update isn't missed.
        checkForChange();
        return unsubscribe;
    }, []);
    const { isPreview, segments, params, pathname } = (0, PreviewRouteContext_1.usePreviewInfo)();
    if (isPreview) {
        return {
            pathname: pathname ?? '',
            segments: segments ?? [],
            unstable_globalHref: '',
            params: params ?? {},
            searchParams: new URLSearchParams(),
            pathnameWithParams: pathname ?? '',
            isIndex: false,
        };
    }
    return routeInfo;
}
//# sourceMappingURL=useRouteInfo.js.map