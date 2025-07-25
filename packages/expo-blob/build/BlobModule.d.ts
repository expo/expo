import { Blob, ExpoBlobModule } from './BlobModule.types';
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