/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { FileMapPlugin, FileMapPluginInitOptions, FileMapPluginWorker, ReadonlyFileSystemChanges, V8Serializable } from '../types';
export interface FileDataPluginOptions extends FileMapPluginWorker {
    readonly name: string;
    readonly cacheKey: string;
}
/**
 * Base class for FileMap plugins that store per-file data via a worker and
 * have no separate serializable state. Provides default no-op implementations
 * of lifecycle methods that subclasses can override as needed.
 */
export default class FileDataPlugin<PerFileData extends undefined | V8Serializable = undefined | V8Serializable> implements FileMapPlugin<null, PerFileData> {
    #private;
    readonly name: string;
    constructor({ name, worker, filter, cacheKey }: FileDataPluginOptions);
    initialize(initOptions: FileMapPluginInitOptions<null, PerFileData>): Promise<void>;
    getFileSystem(): FileMapPluginInitOptions<null, PerFileData>['files'];
    onChanged(_changes: ReadonlyFileSystemChanges<PerFileData | undefined | null>): void;
    assertValid(): void;
    getSerializableSnapshot(): null;
    getCacheKey(): string;
    getWorker(): FileMapPluginWorker;
}
