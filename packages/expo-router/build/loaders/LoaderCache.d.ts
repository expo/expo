/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export declare class LoaderCache {
    private data;
    private errors;
    private promises;
    getData<T = unknown>(path: string): T | undefined;
    hasData(path: string): boolean;
    getError(path: string): Error | undefined;
    getPromise<T = unknown>(path: string): Promise<T> | undefined;
    setData(path: string, value: unknown): void;
    setError(path: string, error: Error): void;
    deleteError(path: string): void;
    setPromise(path: string, promise: Promise<unknown>): void;
    deletePromise(path: string): void;
    clear(): void;
}
export declare const defaultLoaderCache: LoaderCache;
export declare const LoaderCacheContext: import("react").Context<LoaderCache>;
//# sourceMappingURL=LoaderCache.d.ts.map