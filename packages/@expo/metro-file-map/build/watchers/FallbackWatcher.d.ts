/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import { AbstractWatcher } from './AbstractWatcher';
export default class FallbackWatcher extends AbstractWatcher {
    #private;
    startWatching(): Promise<void>;
    /**
     * End watching.
     */
    stopWatching(): Promise<void>;
    getPauseReason(): string | undefined | null;
}
