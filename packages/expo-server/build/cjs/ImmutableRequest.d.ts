/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
declare const ImmutableHeaders_base: {
    new (init?: HeadersInit): Headers;
    prototype: Headers;
};
/**
 * An immutable version of the Fetch API's [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) object which prevents mutations.
 */
declare class ImmutableHeaders extends ImmutableHeaders_base {
    #private;
    set(): void;
    append(): void;
    delete(): void;
}
/** @hidden */
export type _ImmutableRequest = Omit<Request, 'body' | 'bodyUsed' | 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text' | 'bytes' | 'headers'> & {
    headers: ImmutableHeaders;
};
/**
 * An immutable version of the Fetch API's [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object which prevents mutations to the request body and headers.
 */
export declare class ImmutableRequest implements _ImmutableRequest, RequestInit {
    #private;
    constructor(request: Request);
    get cache(): RequestCache;
    get credentials(): RequestCredentials;
    get destination(): RequestDestination;
    get integrity(): string;
    get keepalive(): boolean;
    get method(): string;
    get mode(): RequestMode;
    get redirect(): RequestRedirect;
    get referrer(): string;
    get referrerPolicy(): ReferrerPolicy;
    get signal(): AbortSignal;
    get url(): string;
    get bodyUsed(): boolean;
    get duplex(): "half" | undefined;
    get headers(): ImmutableHeaders;
    /** The request body is not accessible in immutable requests. */
    get body(): never;
    arrayBuffer(): Promise<void>;
    blob(): Promise<void>;
    bytes(): Promise<void>;
    formData(): Promise<void>;
    json(): Promise<void>;
    text(): Promise<void>;
    /**
     * Creates a mutable clone of the original request. This is provided as an escape hatch.
     */
    clone(): Request;
}
export declare function assertRuntimeFetchAPISupport({ Request, Response, Headers, process, }?: any): void;
export {};
