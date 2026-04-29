/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MetadataWorker, V8Serializable, WorkerMessage } from '../../types';
export default class Worker implements MetadataWorker {
    #private;
    constructor({ hasteImplModulePath }: Readonly<{
        hasteImplModulePath: string | null;
    }>);
    processFile(data: WorkerMessage, utils: {
        readonly getContent: () => Promise<Buffer>;
    }): Promise<V8Serializable>;
}
