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
    private bodyStreamClosed;
    private bodyStreamController;
    private abortReason;
    constructor(abortCleanupFunction: AbortSubscriptionCleanupFunction);
    /**
     * Rejects the pending body read with the abort reason and closes the
     * teardown guard so late native events are dropped (#34804). Idempotent,
     * and safe to call before the body stream exists.
     */
    abort(reason?: unknown): void;
    /**
     * These helpers run on the native emitter's stack, where a throw reaches the
     * global handler. The guard can be stale (internal stream errors bypass
     * `controller.error()`), so check `desiredSize` (null = errored) and catch.
     */
    private closeBodyStream;
    private errorBodyStream;
    private enqueueBodyChunk;
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