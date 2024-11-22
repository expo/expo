import { ReadableStream } from 'web-streams-polyfill';
import { type NativeHeadersType } from './NativeRequest';
/**
 * convert a ReadableStream to a Uint8Array
 */
export declare function convertReadableStreamToUint8ArrayAsync(stream: ReadableStream<Uint8Array>): Promise<Uint8Array>;
/**
 * Convert FormData to string
 *
 * `uri` is not supported for React Native's FormData.
 * `blob` is not supported for standard FormData.
 */
export declare function convertFormData(formData: FormData, boundary?: string): {
    body: string;
    boundary: string;
};
/**
 * Create mutipart boundary
 */
export declare function createBoundary(): string;
/**
 * Normalize a BodyInit object to a Uint8Array for NativeRequest
 */
export declare function normalizeBodyInitAsync(body: BodyInit | null | undefined): Promise<{
    body: Uint8Array | null;
    overriddenHeaders?: NativeHeadersType;
}>;
/**
 * Normalize a HeadersInit object to an array of key-value tuple for NativeRequest.
 */
export declare function normalizeHeadersInit(headers: HeadersInit | null | undefined): NativeHeadersType;
/**
 * Create a new header array by overriding the existing headers with new headers (by header key).
 */
export declare function overrideHeaders(headers: NativeHeadersType, newHeaders: NativeHeadersType): NativeHeadersType;
//# sourceMappingURL=RequestUtils.d.ts.map