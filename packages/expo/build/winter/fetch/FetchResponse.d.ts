import { ReadableStream } from 'web-streams-polyfill';
import type { NativeResponse } from './NativeRequest';
declare const ConcreteNativeResponse: typeof NativeResponse;
/**
 * A response implementation for the `fetch.Response` API.
 */
export declare class FetchResponse extends ConcreteNativeResponse implements Response {
    get body(): ReadableStream<Uint8Array> | null;
    get headers(): Headers;
    get ok(): boolean;
    readonly type = "default";
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    json(): Promise<any>;
    toString(): string;
    toJSON(): object;
    clone(): FetchResponse;
}
export {};
//# sourceMappingURL=FetchResponse.d.ts.map