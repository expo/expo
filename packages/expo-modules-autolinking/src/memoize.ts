// expo-modules-autolinking has a few memoizable operations that we don't want to repeat.
// However, memoizing them naively means that we may hold on to the cached values for too long.
// Instead, we wrap all calls with a `Memoizer`.
//
// The Memoizer uses an AsyncLocalStorage to distribute itself, and provides a cached
// `.call` method that uses its `Map` to return cached values. Since the `Memoizer` is
// created and held on to for only as long as we need it, it's freed after the relevant
// scope.
//
// NOTE: If you need to debug whether the memoizer is properly used, change when the
// `console.warn` appears to see if you have any uncached calls. We allow uncached calls
// for backwards-compatibility, since, at worst, we have an uncached call, if the
// Memoizer is missing.

import { AsyncLocalStorage } from 'node:async_hooks';

const memoizeContext = new AsyncLocalStorage<Memoizer>();
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

/** Wraps a function in a memoizer, using the memoizer async local storage */
export function memoize<Args extends any[], T, Fn extends MemoizableAsyncFn<Args, T>>(
  fn: Fn
): MemoizableAsyncFn<Args, T> {
  return (input: string, ...args: Args) => {
    // We either use the current memoizer (sync) or the memoize context (async)
    const memoizer = currentMemoizer ?? memoizeContext.getStore();
    if (!memoizer) {
      if (process.env.NODE_ENV === 'test') {
        console.warn(
          `expo-modules-autolinking: Memoized function called without memoize context (${fn.name})\n` +
            new Error().stack
        );
      }
      return fn(input, ...args);
    }
    return memoizer.call(fn, input, ...args);
  };
}

/** Creates a memoizer that can provide a cache to memoized functions */
export function createMemoizer(): Memoizer {
  const cacheByFn = new Map<MemoizableAsyncFn, Map<string, any>>();
  const memoizer: Memoizer = {
    async call(fn, input, ...args) {
      let cache = cacheByFn.get(fn);
      if (!cache) {
        cache = new Map();
        cacheByFn.set(fn, cache);
      }
      if (!cache.has(input)) {
        let promise: Promise<any>;
        try {
          // We provide the current memoizer synchronously, so we're able
          // to use `.call()` on functions directly
          currentMemoizer = memoizer;
          promise = fn(input, ...args);
        } finally {
          currentMemoizer = undefined;
        }
        const value = await promise;
        if (cache.size > MAX_SIZE) {
          cache.clear();
        }
        cache.set(input, value);
        return value;
      }
      return cache.get(input);
    },
    withMemoizer<R, TArgs extends any[] = []>(fn: (...args: TArgs) => R, ...args: TArgs) {
      return memoizeContext.run(memoizer, fn, ...args);
    },
  };
  return memoizer;
}
