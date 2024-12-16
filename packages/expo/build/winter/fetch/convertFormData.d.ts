/**
 * Convert FormData to Uint8Array with a boundary
 *
 * `uri` is not supported for React Native's FormData.
 * `blob` is not supported for standard FormData.
 */
export declare function convertFormDataAsync(formData: FormData, boundary?: string): Promise<{
    body: Uint8Array;
    boundary: string;
}>;
/**
 * Create mutipart boundary
 */
export declare function createBoundary(): string;
/**
 * Merge Uint8Arrays into a single Uint8Array
 */
export declare function joinUint8Arrays(arrays: Uint8Array[]): Uint8Array;
//# sourceMappingURL=convertFormData.d.ts.map