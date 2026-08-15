/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  FileMapPlugin,
  FileMapPluginInitOptions,
  FileMapPluginWorker,
  ReadonlyFileSystemChanges,
  V8Serializable,
} from '../types';

export interface FileDataPluginOptions extends FileMapPluginWorker {
  readonly name: string;
  readonly cacheKey: string;
}

/**
 * Base class for FileMap plugins that store per-file data via a worker and
 * have no separate serializable state. Provides default no-op implementations
 * of lifecycle methods that subclasses can override as needed.
 */
export default class FileDataPlugin<
  PerFileData extends undefined | V8Serializable = undefined | V8Serializable,
> implements FileMapPlugin<null, PerFileData> {
  readonly name: string;

  #worker: FileMapPluginWorker;
  #cacheKey: string;
  #files: FileMapPluginInitOptions<null, PerFileData>['files'] | undefined | null;

  constructor({ name, worker, filter, cacheKey }: FileDataPluginOptions) {
    this.name = name;
    this.#worker = { worker, filter };
    this.#cacheKey = cacheKey;
  }

  async initialize(initOptions: FileMapPluginInitOptions<null, PerFileData>): Promise<void> {
    this.#files = initOptions.files;
  }

  getFileSystem(): FileMapPluginInitOptions<null, PerFileData>['files'] {
    const files = this.#files;
    if (files == null) {
      throw new Error(`${this.name} plugin has not been initialized`);
    }
    return files;
  }

  onChanged(_changes: ReadonlyFileSystemChanges<PerFileData | undefined | null>): void {}

  assertValid(): void {}

  getSerializableSnapshot(): null {
    return null;
  }

  getCacheKey(): string {
    return this.#cacheKey;
  }

  getWorker(): FileMapPluginWorker {
    return this.#worker;
  }
}
