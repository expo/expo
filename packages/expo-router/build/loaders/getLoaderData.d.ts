/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { LoaderCache } from './LoaderCache';
type LoaderFetcher<T> = (path: string) => Promise<T>;
export declare function getLoaderData<T>({ resolvedPath, cache, fetcher, }: {
    resolvedPath: string;
    cache: LoaderCache;
    fetcher: LoaderFetcher<T>;
}): T | Promise<T>;
export {};
//# sourceMappingURL=getLoaderData.d.ts.map