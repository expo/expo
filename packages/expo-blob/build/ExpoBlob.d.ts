import { Blob, BlobPart, ExpoBlobModule } from './ExpoBlob.types';
declare const NativeBlobModule: ExpoBlobModule;
export declare class ExpoBlob extends NativeBlobModule.Blob implements Blob {
    constructor(blobParts?: BlobPart[] | Iterable<any>, options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): ExpoBlob;
    stream(): ReadableStream;
    arrayBuffer(): Promise<ArrayBufferLike>;
    toString(): string;
    static get length(): number;
}
export {};
//# sourceMappingURL=ExpoBlob.d.ts.map