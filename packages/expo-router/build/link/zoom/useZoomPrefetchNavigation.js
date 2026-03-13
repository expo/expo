"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZoomPrefetchNavigation = useZoomPrefetchNavigation;
const NOOP = () => false;
/**
 * On non-iOS platforms, zoom transitions are not supported.
 */
function useZoomPrefetchNavigation(_) {
    return NOOP;
}
//# sourceMappingURL=useZoomPrefetchNavigation.js.map