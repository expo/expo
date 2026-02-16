"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeOptions = mergeOptions;
/**
 * Merges composition component options into navigation descriptors.
 *
 * Does not mutate `descriptors`, `registry`, or `state`.
 * The `cache` parameter **is** mutated as a side effect for memoization purposes.
 *
 * For each descriptor:
 * 1. If no composition options registered → pass through unchanged
 * 2. If route is preloaded AND not focused → skip composition (pass through)
 * 3. Otherwise → merge descriptor.options with composition options (composition wins)
 *
 * Per-route results are memoized in cache by reference
 * equality on `descriptor` and `routeOptions`. Stale entries (routes no longer
 * present) are pruned after each call.
 */
function mergeOptions(descriptors, registry, state, cache) {
    const result = {};
    const focusedKey = state.routes[state.index]?.key;
    for (const key of Object.keys(descriptors)) {
        const descriptor = descriptors[key];
        const routeOptions = registry.get(key);
        // No composition options or empty map → pass through
        if (!routeOptions || routeOptions.size === 0) {
            result[key] = descriptor;
            if (cache) {
                cache.set(key, { descriptor, routeOptions: undefined, result: descriptor });
            }
            continue;
        }
        // Check if route is preloaded and not focused → skip composition
        const isPreloaded = state.preloadedRoutes?.some((r) => r.key === key) ?? false;
        if (isPreloaded && key !== focusedKey) {
            result[key] = descriptor;
            if (cache) {
                cache.set(key, { descriptor, routeOptions: undefined, result: descriptor });
            }
            continue;
        }
        // Cache hit: reuse previous result when descriptor and routeOptions refs are unchanged
        const cached = cache.get(key);
        if (cached && cached.descriptor === descriptor && cached.routeOptions === routeOptions) {
            result[key] = cached.result;
            continue;
        }
        // Merge: descriptor options as base, composition options override
        const mergedOptions = { ...descriptor.options };
        for (const [, componentOptions] of routeOptions) {
            Object.assign(mergedOptions, componentOptions);
        }
        const merged = {
            ...descriptor,
            options: mergedOptions,
        };
        result[key] = merged;
        cache.set(key, { descriptor, routeOptions, result: merged });
    }
    // Prune stale cache entries for routes no longer in descriptors
    for (const key of cache.keys()) {
        if (!(key in descriptors)) {
            cache.delete(key);
        }
    }
    return result;
}
//# sourceMappingURL=mergeOptions.js.map