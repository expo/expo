/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { FileMapPluginWorker, FileMetadata, PerfLogger } from '../types';
interface ProcessFileRequest {
    /**
     * Populate metadata[H.SHA1] with the SHA1 of the file's contents.
     */
    readonly computeSha1: boolean;
    /**
     * Only if processing has already required reading the file's contents, return
     * the contents as a Buffer - null otherwise. Not supported for batches.
     */
    readonly maybeReturnContent: boolean;
}
interface MaybeCodedError extends Error {
    code?: string;
}
export declare class FileProcessor {
    #private;
    constructor(opts: Readonly<{
        maxFilesPerWorker?: number | null;
        maxWorkers: number;
        pluginWorkers?: readonly FileMapPluginWorker[] | null;
        perfLogger?: PerfLogger | null;
        rootDir: string;
    }>);
    processBatch(files: readonly [relativePath: string, FileMetadata][], req: ProcessFileRequest): Promise<{
        errors: {
            normalFilePath: string;
            error: MaybeCodedError;
        }[];
    }>;
    processRegularFile(normalPath: string, fileMetadata: FileMetadata, req: ProcessFileRequest): Promise<{
        content: Buffer | undefined | null;
    } | null>;
    end(): Promise<void>;
}
export {};
