/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  MetadataWorker,
  WorkerMessage,
  WorkerMetadata,
  WorkerSetupArgs,
} from './types';
import { unwrapESModuleDefault } from './lib/unwrapESModule';

import { createHash } from 'crypto';
import fs from 'graceful-fs';

function sha1hex(content: string | Buffer): string {
  return createHash('sha1').update(content).digest('hex');
}

/**
 * Exposed for use outside a jest-worker context, ie when processing in-band.
 */
export class Worker {
  #plugins: readonly MetadataWorker[];

  constructor({ plugins = [] }: WorkerSetupArgs) {
    this.#plugins = plugins.map(({ modulePath, setupArgs }) => {
      const PluginWorker = unwrapESModuleDefault(require(modulePath));
      return new PluginWorker(setupArgs);
    });
  }

  processFile(data: WorkerMessage): WorkerMetadata {
    let content: Buffer | undefined;
    let sha1: WorkerMetadata['sha1'];
    let mtime: WorkerMetadata['mtime'];
    let size: WorkerMetadata['size'];

    const { computeSha1, computeMtime, filePath, pluginsToRun } = data;

    const getContent = (): Buffer => {
      if (content == null) {
        content = fs.readFileSync(filePath) as Buffer;
      }

      return content!;
    };

    if (computeMtime) {
      try {
        const stat = fs.statSync(filePath);
        mtime = stat.mtime.getTime();
        size = stat.size;
      } catch {
        // Will be caught as ENOENT by the caller
      }
    }

    const workerUtils = { getContent };
    const pluginData = pluginsToRun.map((pluginIdx) =>
      this.#plugins[pluginIdx]!.processFile(data, workerUtils)
    );

    // If a SHA-1 is requested on update, compute it.
    if (computeSha1) {
      sha1 = sha1hex(getContent());
    }

    return content && data.maybeReturnContent
      ? { content, pluginData, sha1, mtime, size }
      : { pluginData, sha1, mtime, size };
  }
}

let singletonWorker: Worker | undefined;

/**
 * Called automatically by jest-worker before the first call to `worker` when
 * this module is used as worker thread or child process.
 */
export function setup(args: WorkerSetupArgs): void {
  if (singletonWorker) {
    throw new Error('metro-file-map: setup() should only be called once');
  }
  singletonWorker = new Worker(args);
}

/**
 * Called by jest-worker with each workload
 */
export function processFile(data: WorkerMessage): WorkerMetadata {
  if (!singletonWorker) {
    throw new Error('metro-file-map: setup() must be called before processFile()');
  }
  return singletonWorker.processFile(data);
}
