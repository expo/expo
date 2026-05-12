/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventEmitter from 'events';
import type { Console, CrawlerOptions, CrawlResult, PerfLogger, WatcherBackendChangeEvent } from './types';
interface WatcherOptions {
    abortSignal: AbortSignal;
    computeSha1: boolean;
    console: Console;
    enableSymlinks: boolean;
    extensions: readonly string[];
    /** @deprecated */
    forceNodeFilesystemAPI?: boolean;
    healthCheckFilePrefix: string | null;
    ignoreForCrawl: (filePath: string) => boolean;
    ignorePatternForWatch: RegExp | null;
    previousState: CrawlerOptions['previousState'];
    perfLogger: PerfLogger | undefined | null;
    roots: readonly string[];
    rootDir: string;
    useWatchman: boolean;
    watch: boolean;
    watchmanDeferStates: readonly string[];
}
export type HealthCheckResult = {
    type: 'error';
    timeout: number;
    error: Error;
    watcher: string | undefined | null;
} | {
    type: 'success';
    timeout: number;
    timeElapsed: number;
    watcher: string | undefined | null;
} | {
    type: 'timeout';
    timeout: number;
    watcher: string | undefined | null;
    pauseReason: string | undefined | null;
};
export declare class Watcher extends EventEmitter {
    #private;
    constructor(options: WatcherOptions);
    crawl(): Promise<CrawlResult>;
    recrawl(subpath: string, currentFileSystem: CrawlerOptions['previousState']['fileSystem']): Promise<CrawlResult>;
    watch(onChange: (change: WatcherBackendChangeEvent) => void): Promise<void>;
    close(): Promise<void>;
    checkHealth(timeout: number): Promise<HealthCheckResult>;
}
export {};
