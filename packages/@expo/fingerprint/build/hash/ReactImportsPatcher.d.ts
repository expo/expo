import { Transform, type TransformCallback } from 'stream';
interface Options {
    /**
     * Length of the file portion containing headers to transform.
     * @default ReactImportsPatchTransform.DEFAULT_LENGTH_OF_FILE_PORTION_CONTAINING_HEADERS_TO_TRANSFORM
     */
    lengthOfFilePortionContainingHeadersToTransform?: number;
    /**
     * A function that transforms a chunk of data. Exposing this for testing purposes.
     * @default `patchChunk`
     */
    transformFn?: (chunk: string) => string;
}
/**
 * A transform stream that patches React import statements in Objective-C files.
 */
export declare class ReactImportsPatchTransform extends Transform {
    private readLength;
    private readonly lengthOfFilePortionContainingHeadersToTransform;
    private readonly transformFn;
    private static DEFAULT_LENGTH_OF_FILE_PORTION_CONTAINING_HEADERS_TO_TRANSFORM;
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
