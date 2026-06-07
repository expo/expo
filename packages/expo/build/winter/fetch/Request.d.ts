import type { FetchRequestInit } from './fetch.types';
type RNFormData = Awaited<ReturnType<globalThis.Response['formData']>>;
type UniversalFormData = globalThis.FormData & RNFormData;
/**
 * A spec-compliant `Request` implementation for `expo/fetch`.
 *
 * React Native installs the `whatwg-fetch` polyfill as the global `Request`, which is not fully
 * spec-compliant and forces `expo/fetch` to reach into its private fields to recover the body.
 * This class lets `expo/fetch` own its `Request` so the body, headers, and metadata round-trip
 * predictably. It is installed as the global `Request` on native.
 */
export declare class Request implements Body {
    readonly url: string;
    readonly method: string;
    readonly headers: Headers;
    readonly credentials: RequestCredentials;
    readonly redirect: RequestRedirect;
    readonly signal: AbortSignal;
    readonly _bodyInit: BodyInit | null;
    private consumed;
    private bodyStream;
    constructor(input: string | URL | Request, init?: FetchRequestInit);
    get bodyUsed(): boolean;
    get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null;
    arrayBuffer(): Promise<ArrayBuffer>;
    bytes(): Promise<Uint8Array<ArrayBuffer>>;
    blob(): Promise<Blob>;
    text(): Promise<string>;
    json(): Promise<any>;
    formData(): Promise<UniversalFormData>;
    clone(): Request;
    private consumeAsBytes;
    private markConsumed;
    private setDefaultContentType;
}
export {};
//# sourceMappingURL=Request.d.ts.map