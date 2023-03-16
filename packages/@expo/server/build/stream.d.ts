/// <reference types="node" />
/// <reference types="node" />
import type { Readable, Writable } from 'stream';
export declare function writeReadableStreamToWritable(stream: ReadableStream, writable: Writable): Promise<void>;
export declare function writeAsyncIterableToWritable(iterable: AsyncIterable<Uint8Array>, writable: Writable): Promise<void>;
export declare function readableStreamToString(stream: ReadableStream<Uint8Array>, encoding?: BufferEncoding): Promise<string>;
export declare const createReadableStreamFromReadable: (source: Readable & {
    readableHighWaterMark?: number;
}) => ReadableStream<Uint8Array>;
