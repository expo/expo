/// <reference types="node" />
/// <reference types="node" />
import { Transform, type TransformCallback } from 'stream';
interface Options {
    /**
     * If true, only the first chunk will be transformed.
     * @default true given the first chunk is usually good enough for imports.
     */
    onlyTransformFirstChunk?: boolean;
    /**
     * A function that transforms a chunk of data. Exposing this for testing purposes.
     * @default The `patchChunk`
     */
    transformFn?: (chunk: string) => string;
}
/**
 * A transform stream that patches React import statements in Objective-C files.
 */
export declare class ReactImportsPatchTransform extends Transform {
    private chunkIndex;
    private readonly onlyTransformFirstChunk;
    private readonly transformFn;
    constructor(options?: Options);
    _transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback): void;
}
/**
 * Patch imports from a data chunk
 * @param headerSet prebuilt React-Core header set
 * @param chunk target chunk data
 */
export declare function patchChunk(chunk: string, headerSet?: Set<string>): string;
export {};
