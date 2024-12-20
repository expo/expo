import { ReadableStream } from 'web-streams-polyfill';
import type { NativeResponse } from './NativeRequest';
declare const ConcreteNativeResponse: typeof NativeResponse;
export type AbortSubscriptionCleanupFunction = () => void;
/**
 * A response implementation for the `fetch.Response` API.
 */
export declare class FetchResponse extends ConcreteNativeResponse implements Response {
    private readonly abortCleanupFunction;
    private streamingState;
    private bodyStream;
    constructor(abortCleanupFunction: AbortSubscriptionCleanupFunction);
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
    private finalize;
}
export {};
//# sourceMappingURL=FetchResponse.d.ts.map