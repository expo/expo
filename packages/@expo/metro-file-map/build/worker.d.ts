/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { WorkerMessage, WorkerMetadata, WorkerSetupArgs } from './types';
/**
 * Exposed for use outside a jest-worker context, ie when processing in-band.
 */
export declare class Worker {
    #private;
    constructor({ plugins }: WorkerSetupArgs);
    processFile(data: WorkerMessage): Promise<WorkerMetadata>;
}
/**
 * Called automatically by jest-worker before the first call to `worker` when
 * this module is used as worker thread or child process.
 */
export declare function setup(args: WorkerSetupArgs): void;
/**
 * Called by jest-worker with each workload
 */
export declare function processFile(data: WorkerMessage): Promise<WorkerMetadata>;
