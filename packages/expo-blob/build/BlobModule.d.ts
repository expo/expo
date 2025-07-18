import { Blob } from "./BlobModule.types";
declare const NativeBlobModule: any;
export declare class ExpoBlob extends NativeBlobModule.Blob implements Blob {
    constructor(blobParts?: any, options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): Blob;
    text(): Promise<string>;
    stream(): ReadableStream;
}
export {};
//# sourceMappingURL=BlobModule.d.ts.map