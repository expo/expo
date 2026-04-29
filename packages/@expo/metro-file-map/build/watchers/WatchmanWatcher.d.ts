/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { AbstractWatcher } from './AbstractWatcher';
import type { WatcherOptions } from './common';
/**
 * Watches `dir`.
 */
export default class WatchmanWatcher extends AbstractWatcher {
    #private;
    readonly subscriptionName: string;
    constructor(dir: string, opts: WatcherOptions);
    startWatching(): Promise<void>;
    /**
     * Closes the watcher.
     */
    stopWatching(): Promise<void>;
    getPauseReason(): string | undefined | null;
}
