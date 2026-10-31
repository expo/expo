/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { MetadataWorker, V8Serializable, WorkerMessage } from '../types';

// A plugin worker for tests, whose data for a file is the length of its content.
export default class LazyPluginWorker implements MetadataWorker {
  processFile(data: WorkerMessage, utils: Readonly<{ getContent: () => Buffer }>): V8Serializable {
    return { length: utils.getContent().toString().length };
  }
}
