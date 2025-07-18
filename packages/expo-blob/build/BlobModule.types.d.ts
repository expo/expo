export declare class Blob {
    constructor(blobParts?: any, options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): Blob;
    text(): Promise<string>;
    stream(): ReadableStream;
}
export type BlobPart = string | ArrayBuffer | ArrayBufferView | Blob;
//# sourceMappingURL=BlobModule.types.d.ts.map