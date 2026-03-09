"use strict";
// expo-modules-autolinking has a few memoizable operations that we don't want to repeat.
// However, memoizing them naively means that we may hold on to the cached values for too long.
// Instead, we wrap all calls with a `Memoizer`.
//
// This could use AsyncLocalStorage, but those are expensive. Instead, we only share one
// cache for all calls, and assume that all memoizable return values may be memoized and
// shared globally.
//
// Memoizers are created once per run, and then shared between all subsequent calls. They
// are freed when their usage count to zero, after one tick.
//
// NOTE: If you need to debug whether the memoizer is properly used, change when the
// `console.warn` appears to see if you have any uncached calls. We allow uncached calls
// for backwards-compatibility, since, at worst, we have an uncached call, if the
// Memoizer is missing.
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoize = memoize;
exports.createMemoizer = createMemoizer;
exports._verifyMemoizerFreed = _verifyMemoizerFreed;
const MAX_SIZE = 5_000;
let currentMemoizer;
let currentContexts = 0;
/** Wraps a function in a memoizer, using the memoizer async local storage */
function memoize(fn) {
    return (input, ...args) => {
        // We either use the current memoizer (sync) or the memoize context (async)
        if (!currentMemoizer) {
            if (process.env.NODE_ENV === 'test') {
                console.warn(`expo-modules-autolinking: Memoized function called without memoize context (${fn.name})\n` +
                    new Error().stack);
            }
            return fn(input, ...args);
        }
        return currentMemoizer.call(fn, input, ...args);
    };
}
/** Creates a memoizer that can provide a cache to memoized functions */
function createMemoizer() {
    // If we already have a memoizer, reuse it, since we can share them globally
    if (currentMemoizer) {
        return currentMemoizer;
    }
    const cacheByFn = new Map();
    const memoizer = {
        async call(fn, input, ...args) {
            let cache = cacheByFn.get(fn);
            if (!cache) {
                cache = new Map();
                cacheByFn.set(fn, cache);
            }
            if (!cache.has(input)) {
                const value = await memoizer.withMemoizer(fn, input, ...args);
                if (cache.size > MAX_SIZE) {
                    cache.clear();
                }
                cache.set(input, value);
                return value;
            }
            return cache.get(input);
        },
        async withMemoizer(fn, ...args) {
            currentMemoizer = memoizer;
            currentContexts++;
            try {
                return await fn(...args);
            }
            finally {
                if (currentContexts > 0) {
                    currentContexts--;
                }
                if (currentContexts === 0) {
                    currentMemoizer = undefined;
                }
            }
        },
    };
    return memoizer;
}
/** @internal Used in tests to verify the memoizer was freed */
function _verifyMemoizerFreed() {
    return currentMemoizer === undefined && currentContexts === 0;
}
//# sourceMappingURL=memoize.js.map