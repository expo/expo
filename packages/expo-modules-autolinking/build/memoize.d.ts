export interface Memoizer {
    /** Calls a function with a memoizer cache, caching its return value */
    call<T, Args extends any[], Fn extends MemoizableAsyncFn<Args, T>>(fn: Fn, input: string, ...args: Args): Promise<T>;
    /** Invokes an async context with a memoizer cache */
    withMemoizer<R>(callback: () => R): R;
    withMemoizer<R, TArgs extends any[]>(callback: (...args: TArgs) => R, ...args: TArgs): R;
}
export interface MemoizableAsyncFn<Args extends any[] = any[], T = any> {
    (input: string, ...args: Args): Promise<T>;
}
/** Wraps a function in a memoizer, using the memoizer async local storage */
export declare function memoize<Args extends any[], T, Fn extends MemoizableAsyncFn<Args, T>>(fn: Fn): MemoizableAsyncFn<Args, T>;
/** Creates a memoizer that can provide a cache to memoized functions */
export declare function createMemoizer(): Memoizer;
/** @internal Used in tests to verify the memoizer was freed */
export declare function _verifyMemoizerFreed(): boolean;
