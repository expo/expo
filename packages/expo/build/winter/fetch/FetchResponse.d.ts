import type { NativeHeadersType, NativeResponse } from './NativeRequest';
declare const ConcreteNativeResponse: typeof NativeResponse;
export type AbortSubscriptionCleanupFunction = () => void;
type RNFormData = Awaited<ReturnType<globalThis.Response['formData']>>;
type UniversalFormData = globalThis.FormData & RNFormData;
declare const stateKey: unique symbol;
/**
 * A response implementation for the `fetch.Response` API.
 */
export declare class FetchResponse extends ConcreteNativeResponse implements Response {
    private readonly abortCleanupFunction;
    private [stateKey];
    constructor(abortCleanupFunction: AbortSubscriptionCleanupFunction);
    get _rawHeaders(): NativeHeadersType;
    get status(): number;
    get statusText(): string;
    get url(): string;
    get redirected(): boolean;
    get type(): 'default';
    get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null;
    get bodyUsed(): boolean;
    get headers(): Headers;
    get ok(): boolean;
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
    private checkBodyUsedError;
    private finalize;
}
export {};
//# sourceMappingURL=FetchResponse.d.ts.map