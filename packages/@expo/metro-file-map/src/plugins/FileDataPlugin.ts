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
  Observations,
  ReadonlyFileSystemChanges,
  V8Serializable,
} from '../types';

export type FileDataPluginOptions = Readonly<
  FileMapPluginWorker & {
    name: string;
    cacheKey: string;
  }
>;

/**
 * Base class for FileMap plugins that store per-file data via a worker and
 * have no separate serializable state. Provides default no-op implementations
 * of lifecycle methods that subclasses can override as needed.
 */
export default class FileDataPlugin<
  PerFileData extends void | V8Serializable = void | V8Serializable,
> implements FileMapPlugin<null, PerFileData> {
  readonly name: string;

  #worker: FileMapPluginWorker;
  #cacheKey: string;
  #files: FileMapPluginInitOptions<null, PerFileData>['files'] | undefined | null;
  #getOrComputeFileData:
    | FileMapPluginInitOptions<null, PerFileData>['getOrComputeFileData']
    | undefined
    | null;

  constructor(opts: FileDataPluginOptions) {
    this.name = opts.name;
    this.#worker = {
      worker: opts.worker,
      filter: opts.filter,
      lazy: opts.lazy,
    };
    this.#cacheKey = opts.cacheKey;
  }

  async initialize(initOptions: FileMapPluginInitOptions<null, PerFileData>): Promise<void> {
    this.#files = initOptions.files;
    this.#getOrComputeFileData = initOptions.getOrComputeFileData;
  }

  /**
   * This plugin's data for the file at `mixedPath`, running its worker on the
   * file first if the plugin is lazy and the file has no data yet. If
   * `observations` is given, a regular file found is recorded in `content`.
   */
  getOrComputeFileData(
    mixedPath: string,
    observations?: Observations | null
  ): ReturnType<FileMapPluginInitOptions<null, PerFileData>['getOrComputeFileData']> {
    const getOrComputeFileData = this.#getOrComputeFileData;
    if (getOrComputeFileData == null) {
      throw new Error(`${this.name} plugin has not been initialized`);
    }
    return getOrComputeFileData(mixedPath, observations);
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
