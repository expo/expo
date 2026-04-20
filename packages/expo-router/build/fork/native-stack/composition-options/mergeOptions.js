"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeOptions = mergeOptions;
/**
 * Merges composition component options into navigation descriptors.
 *
 * For each descriptor:
 * 1. If no composition options registered → pass through unchanged
 * 2. If route is preloaded AND not focused → skip composition (pass through)
 * 3. Otherwise → merge descriptor.options with composition options (composition wins)
 */
function mergeOptions(descriptors, registry, state) {
    const result = {};
    const focusedKey = state.routes[state.index]?.key;
    for (const key in descriptors) {
        const descriptor = descriptors[key];
        const routeOptions = registry[key];
        // No composition options or empty array → pass through
        if (!routeOptions || routeOptions.length === 0) {
            result[key] = descriptor;
            continue;
        }
        // Check if route is preloaded and not focused → skip composition
        const isPreloaded = state.preloadedRoutes?.some((r) => r.key === key) ?? false;
        if (isPreloaded && key !== focusedKey) {
            result[key] = descriptor;
            continue;
        }
        // Merge: descriptor options as base, composition options override
        const mergedOptions = Object.assign({}, descriptor.options, ...routeOptions);
        const merged = {
            ...descriptor,
            options: mergedOptions,
        };
        result[key] = merged;
    }
    return result;
}
//# sourceMappingURL=mergeOptions.js.map