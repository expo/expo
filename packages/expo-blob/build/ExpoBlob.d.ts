import { BlobPart, ExpoBlobModule } from './ExpoBlob.types';
declare const NativeBlobModule: ExpoBlobModule;
export declare class ExpoBlob extends NativeBlobModule.Blob {
    constructor(blobParts?: BlobPart[] | Iterable<any>, options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): ExpoBlob;
    stream(): ReadableStream;
    arrayBuffer(): Promise<ArrayBuffer>;
    toString(): string;
    static get length(): number;
}
export {};
//# sourceMappingURL=ExpoBlob.d.ts.map