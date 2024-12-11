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
    constructor(source: FileHookTransformSource, transformFn: FileHookTransformFunction);
    _transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback): void;
}
