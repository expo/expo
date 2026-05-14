/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { BuildParameters, CacheData, CacheManager, CacheManagerFactoryOptions, CacheManagerWriteOptions } from '../types';
declare global {
    namespace NodeJS {
        interface Process {
            isBun?: boolean;
        }
    }
}
interface AutoSaveOptions {
    readonly debounceMs: number;
}
interface DiskCacheConfig {
    readonly autoSave?: Partial<AutoSaveOptions> | boolean | undefined;
    readonly cacheFilePrefix?: string | undefined | null;
    readonly cacheDirectory?: string | undefined | null;
}
export declare class DiskCacheManager implements CacheManager {
    #private;
    constructor({ buildParameters }: CacheManagerFactoryOptions, { autoSave, cacheDirectory, cacheFilePrefix }: DiskCacheConfig);
    static getCacheFilePath(buildParameters: BuildParameters, cacheFilePrefix?: string | null, cacheDirectory?: string | null): string;
    getCacheFilePath(): string;
    read(): Promise<CacheData | undefined | null>;
    write(getSnapshot: () => CacheData, { changedSinceCacheRead, eventSource, onWriteError }: CacheManagerWriteOptions): Promise<void>;
    end(): Promise<void>;
}
export {};
