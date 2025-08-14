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
    get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null;
    get headers(): Headers;
    get ok(): boolean;
    readonly type = "default";
    /**
     * This method is not currently supported by react-native's Blob constructor.
     */
    blob(): Promise<Blob>;
    formData(): Promise<UniversalFormData>;
    json(): Promise<any>;
    bytes(): Promise<Uint8Array<ArrayBuffer>>;
    toString(): string;
    toJSON(): object;
    clone(): Response;
    private finalize;
}
export {};
//# sourceMappingURL=FetchResponse.d.ts.map