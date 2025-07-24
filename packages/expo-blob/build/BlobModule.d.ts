import { NativeModule, SharedObject } from 'expo';
import { Blob, BlobPart } from './BlobModule.types';
declare class NativeBlob extends SharedObject {
    readonly size: number;
    readonly type: string;
    constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): ExpoBlob;
    bytes(): Promise<Uint8Array>;
    text(): Promise<string>;
}
declare class ExpoBlobModule extends NativeModule {
    Blob: typeof NativeBlob;
}
declare const NativeBlobModule: ExpoBlobModule;
export declare class ExpoBlob extends NativeBlobModule.Blob implements Blob {
    constructor(blobParts?: any[] | Iterable<any>, options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): ExpoBlob;
    stream(): ReadableStream;
    arrayBuffer(): Promise<ArrayBufferLike>;
    toString(): string;
    static get length(): number;
}
export {};
//# sourceMappingURL=BlobModule.d.ts.map