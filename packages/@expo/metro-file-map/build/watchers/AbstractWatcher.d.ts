/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { WatcherBackend, WatcherBackendChangeEvent, WatcherBackendOptions } from '../types';
type EachOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type WatcherBackendChangeEventWithoutRoot = EachOmit<WatcherBackendChangeEvent, 'root'>;
export interface Listeners {
    onFileEvent(event: WatcherBackendChangeEvent): void;
    onError(error: Error): void;
}
export declare class AbstractWatcher implements WatcherBackend {
    #private;
    readonly root: string;
    readonly ignored: RegExp | undefined | null;
    readonly globs: readonly string[];
    readonly dot: boolean;
    readonly doIgnore: (path: string) => boolean;
    constructor(dir: string, opts: WatcherBackendOptions);
    onFileEvent(listener: (event: WatcherBackendChangeEvent) => void): () => void;
    onError(listener: (error: Error) => void): () => void;
    startWatching(): Promise<void>;
    stopWatching(): Promise<void>;
    emitFileEvent(event: WatcherBackendChangeEventWithoutRoot): void;
    emitError(error: Error): void;
    getPauseReason(): string | undefined | null;
}
export {};
