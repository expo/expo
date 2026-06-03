import { type RouteInfoAccumulator, type UrlObject } from './routeInfo';
/**
 * Finalizes an accumulator into route info, caching by the accumulator's identity. Accumulators
 * are memoized per navigation level, so unchanged levels return the same reference without
 * recomputing, and the result is value-deduped so identical URLs share a reference.
 */
export declare function getCachedRouteInfoFromAccumulator(acc: RouteInfoAccumulator): UrlObject;
/**
 * Registers an already-computed route info in the value cache, returning the canonical reference.
 * Used to seed the store from a full state (e.g. the static-render prefetch) so subsequent
 * incrementally-computed route info for the same URL reuses the same reference.
 */
export declare function setCachedRouteInfo(routeInfo: UrlObject): UrlObject;
export declare const routeInfoSubscribers: Set<() => void>;
export declare const routeInfoSubscribe: (callback: () => void) => () => void;
//# sourceMappingURL=routeInfoCache.d.ts.map