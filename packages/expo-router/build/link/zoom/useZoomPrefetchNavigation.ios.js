"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZoomPrefetchNavigation = useZoomPrefetchNavigation;
const react_1 = require("react");
const hooks_1 = require("../../hooks");
const useNavigation_1 = require("../../useNavigation");
const NOOP = () => false;
/**
 * Manages the prefetch-then-navigate flow for zoom transitions.
 *
 * When a zoom transition is active, pressing the link prefetches the route first,
 * then navigates on the next render. This ensures the target screen component is
 * mounted before the zoom animation starts, avoiding visual glitches.
 *
 * @returns A press handler that either prefetches-then-navigates (zoom) or navigates directly (no zoom).
 */
function useZoomPrefetchNavigation({ withZoomTransition, resolvedHref, navigate, }) {
    const router = (0, hooks_1.useRouter)();
    const navigation = (0, useNavigation_1.useNavigation)();
    const [zoomPrefetched, setZoomPrefetched] = (0, react_1.useState)(false);
    // After prefetch, navigate on the next render
    (0, react_1.useEffect)(() => {
        if (zoomPrefetched) {
            setZoomPrefetched(false);
            navigate();
        }
    }, [zoomPrefetched]);
    if (!withZoomTransition) {
        return NOOP;
    }
    return (e) => {
        // Only prefetch when the current screen is focused.
        // Otherwise the prefetch can cause unexpected behavior
        // when a currently dismissed screen gets prefetched.
        if (navigation.isFocused() && !e?.defaultPrevented) {
            e?.preventDefault();
            router.prefetch(resolvedHref);
            setZoomPrefetched(true);
            return true;
        }
        return false;
    };
}
//# sourceMappingURL=useZoomPrefetchNavigation.ios.js.map