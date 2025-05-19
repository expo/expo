import type { NativeResponse } from './NativeRequest';
declare const ConcreteNativeResponse: typeof NativeResponse;
export type AbortSubscriptionCleanupFunction = () => void;
type RNFormData = Awaited<ReturnType<globalThis.Response['formData']>>;
type UniversalFormData = globalThis.FormData & RNFormData;
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
    formData(): Promise<UniversalFormData>;
    json(): Promise<any>;
    bytes(): Promise<Uint8Array>;
    toString(): string;
    toJSON(): object;
    clone(): Response;
    private finalize;
}
export {};
//# sourceMappingURL=FetchResponse.d.ts.map