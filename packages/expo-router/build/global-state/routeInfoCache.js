"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeInfoSubscribe = exports.routeInfoSubscribers = void 0;
exports.getCachedRouteInfoFromAccumulator = getCachedRouteInfoFromAccumulator;
exports.setCachedRouteInfo = setCachedRouteInfo;
const routeInfo_1 = require("./routeInfo");
const accumulatorCache = new WeakMap();
const routeInfoValuesCache = new Map();
/**
 * Deduplicates route info by value: identical route info keeps the same object reference so
 * `useSyncExternalStore` consumers don't re-render when the URL hasn't actually changed. This is
 * the single reference-stability guarantee shared by every route info producer.
 */
function dedupeRouteInfo(routeInfo) {
    const routeInfoString = JSON.stringify(routeInfo);
    const cachedRouteInfo = routeInfoValuesCache.get(routeInfoString);
    if (cachedRouteInfo) {
        return cachedRouteInfo;
    }
    routeInfoValuesCache.set(routeInfoString, routeInfo);
    return routeInfo;
}
/**
 * Finalizes an accumulator into route info, caching by the accumulator's identity. Accumulators
 * are memoized per navigation level, so unchanged levels return the same reference without
 * recomputing, and the result is value-deduped so identical URLs share a reference.
 */
function getCachedRouteInfoFromAccumulator(acc) {
    let routeInfo = accumulatorCache.get(acc);
    if (!routeInfo) {
        routeInfo = dedupeRouteInfo((0, routeInfo_1.finalizeRouteInfo)(acc));
        accumulatorCache.set(acc, routeInfo);
    }
    return routeInfo;
}
/**
 * Registers an already-computed route info in the value cache, returning the canonical reference.
 * Used to seed the store from a full state (e.g. the static-render prefetch) so subsequent
 * incrementally-computed route info for the same URL reuses the same reference.
 */
function setCachedRouteInfo(routeInfo) {
    return dedupeRouteInfo(routeInfo);
}
exports.routeInfoSubscribers = new Set();
const routeInfoSubscribe = (callback) => {
    exports.routeInfoSubscribers.add(callback);
    return () => {
        exports.routeInfoSubscribers.delete(callback);
    };
};
exports.routeInfoSubscribe = routeInfoSubscribe;
//# sourceMappingURL=routeInfoCache.js.map