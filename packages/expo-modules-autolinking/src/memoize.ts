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

const MAX_SIZE = 5_000;

export interface Memoizer {
  /** Calls a function with a memoizer cache, caching its return value */
  call<T, Args extends any[], Fn extends MemoizableAsyncFn<Args, T>>(
    fn: Fn,
    input: string,
    ...args: Args
  ): Promise<T>;

  /** Invokes an async context with a memoizer cache */
  withMemoizer<R>(callback: () => R): R;
  withMemoizer<R, TArgs extends any[]>(callback: (...args: TArgs) => R, ...args: TArgs): R;
}

export interface MemoizableAsyncFn<Args extends any[] = any[], T = any> {
  (input: string, ...args: Args): Promise<T>;
}

let currentMemoizer: Memoizer | undefined;
let currentContexts = 0;

/** Wraps a function in a memoizer, using the memoizer async local storage */
export function memoize<Args extends any[], T, Fn extends MemoizableAsyncFn<Args, T>>(
  fn: Fn
): MemoizableAsyncFn<Args, T> {
  return (input: string, ...args: Args) => {
    // We either use the current memoizer (sync) or the memoize context (async)
    if (!currentMemoizer) {
      if (process.env.NODE_ENV === 'test') {
        console.warn(
          `expo-modules-autolinking: Memoized function called without memoize context (${fn.name})\n` +
            new Error().stack
        );
      }
      return fn(input, ...args);
    }
    return currentMemoizer.call(fn, input, ...args);
  };
}

/** Creates a memoizer that can provide a cache to memoized functions */
export function createMemoizer(): Memoizer {
  // If we already have a memoizer, reuse it, since we can share them globally
  if (currentMemoizer) {
    return currentMemoizer;
  }

  const cacheByFn = new Map<MemoizableAsyncFn, Map<string, any>>();
  const memoizer: Memoizer = {
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
    async withMemoizer<R, TArgs extends any[] = []>(fn: (...args: TArgs) => R, ...args: TArgs) {
      currentMemoizer = memoizer;
      currentContexts++;
      try {
        return await fn(...args);
      } finally {
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
export function _verifyMemoizerFreed() {
  return currentMemoizer === undefined && currentContexts === 0;
}
