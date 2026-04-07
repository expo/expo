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

import { hash } from 'crypto';
import fs from 'fs';

function sha1hex(content: string | Buffer): string {
  return hash('sha1', content, 'hex');
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

  async processFile(data: WorkerMessage): Promise<WorkerMetadata> {
    let contentPromise: Promise<Buffer> | undefined;
    let sha1Promise: Promise<WorkerMetadata['sha1']> | undefined;
    let mtimePromise: Promise<WorkerMetadata['mtime']> | undefined;
    let sizePromise: Promise<WorkerMetadata['size']> | undefined;

    const { computeSha1, computeMtime, filePath, pluginsToRun } = data;

    const getContent = (): Promise<Buffer> => {
      if (contentPromise == null) {
        contentPromise  = fs.promises.readFile(filePath);
      }
      return contentPromise;
    };

    if (computeMtime) {
      try {
        const statPromise = fs.promises.stat(filePath).catch(() => undefined);
        mtimePromise = statPromise.then((stat) => stat?.mtime.getTime());
        sizePromise = statPromise.then((stat) => stat?.size);
      } catch {
        // Will be caught as ENOENT by the caller
      }
    }

    const workerUtils = { getContent };
    const pluginDataPromise = Promise.all(
      pluginsToRun.map((pluginIdx) =>
        this.#plugins[pluginIdx]!.processFile(data, workerUtils)
      )
    );

    // If a SHA-1 is requested on update, compute it.
    if (computeSha1) {
      sha1Promise = getContent().then(sha1hex);
    }

    return {
      content: contentPromise != null && data.maybeReturnContent
        ? await contentPromise
        : undefined,
      pluginData: await pluginDataPromise,
      sha1: await sha1Promise,
      mtime: (await mtimePromise) ?? undefined,
      size: (await sizePromise) ?? undefined,
    };
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
export async function processFile(data: WorkerMessage): Promise<WorkerMetadata> {
  if (!singletonWorker) {
    throw new Error('metro-file-map: setup() must be called before processFile()');
  }
  return singletonWorker.processFile(data);
}
