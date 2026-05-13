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
    private consumed;
    private wasCloned;
    constructor(abortCleanupFunction: AbortSubscriptionCleanupFunction);
    get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null;
    get bodyUsed(): boolean;
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
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    toString(): string;
    toJSON(): object;
    clone(): FetchResponse;
    private wrapBodyStreamWithConsumption;
    private checkBodyUsedError;
    private readBodyAsBuffer;
    private finalize;
}
export {};
//# sourceMappingURL=FetchResponse.d.ts.map