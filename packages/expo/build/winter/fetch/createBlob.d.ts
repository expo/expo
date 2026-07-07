export declare function isReactNativeBlobGlobal(): boolean;
/**
 * react-native's `Blob` cannot be created from binary data in JS, so store the
 * bytes in its native blob store and reference them, like XHR responses do.
 * TODO(kudo,20260706): remove this when we install expo-blob as globalThis.Blob
 */
export declare function createReactNativeBlobAsync(buffer: ArrayBuffer, type: string): Promise<Blob>;
//# sourceMappingURL=createBlob.d.ts.map