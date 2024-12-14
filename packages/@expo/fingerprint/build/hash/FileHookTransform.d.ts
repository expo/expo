/// <reference types="node" />
/// <reference types="node" />
import { Transform, type TransformCallback } from 'stream';
import type { FileHookTransformSource, FileHookTransformFunction } from '../Fingerprint.types';
/**
 * A transform stream that allows to hook into file contents and transform them.
 */
export declare class FileHookTransform extends Transform {
    private readonly source;
    private readonly transformFn;
    private readonly debug;
    private _isTransformed;
    constructor(source: FileHookTransformSource, transformFn: FileHookTransformFunction, debug: boolean | undefined);
    /**
     * Indicates whether the file content has been transformed.
     * @returns boolean value if `debug` is true, otherwise the value would be undefined.
     */
    get isTransformed(): boolean | undefined;
    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void;
    _flush(callback: TransformCallback): void;
}
