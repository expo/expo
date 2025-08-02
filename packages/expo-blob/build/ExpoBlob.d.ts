import { BlobPart, ExpoBlobModule } from './ExpoBlob.types';
declare const NativeBlobModule: ExpoBlobModule;
export declare class Blob extends NativeBlobModule.Blob {
    constructor(blobParts?: BlobPart[] | Iterable<BlobPart>, options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): Blob;
    stream(): ReadableStream;
    arrayBuffer(): Promise<ArrayBuffer>;
    toString(): string;
    static get length(): number;
}
export {};
//# sourceMappingURL=ExpoBlob.d.ts.map