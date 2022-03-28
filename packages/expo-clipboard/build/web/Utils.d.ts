/**
 * Converts base64-encoded data to a `Blob` object.
 * @see https://stackoverflow.com/a/20151856
 */
export declare function base64toBlob(base64Data: string, contentType: string): Blob;
/**
 * Converts blob to base64-encoded string with Data-URL prefix.
 */
export declare function blobToBase64Async(blob: Blob): Promise<string>;
export declare function htmlToPlainText(html: string): string;
export declare function getImageSizeFromBlobAsync(blob: Blob): Promise<{
    width: number;
    height: number;
}>;
export declare function findImageInClipboardAsync(items: ClipboardItems): Promise<Blob | null>;
export declare function findHtmlInClipboardAsync(items: ClipboardItems): Promise<Blob | null>;
export declare function isClipboardPermissionDeniedAsync(): Promise<boolean>;
//# sourceMappingURL=Utils.d.ts.map