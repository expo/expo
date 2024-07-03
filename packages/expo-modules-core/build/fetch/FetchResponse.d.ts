import { ReadableStream } from 'web-streams-polyfill';
import { NativeResponse } from './NativeRequest';
/**
 * A response implementation for the `fetch.Response` API.
 */
export declare class FetchResponse implements Response {
    private readonly response;
    constructor(response: NativeResponse);
    get body(): ReadableStream<Uint8Array> | null;
    get bodyUsed(): boolean;
    get headers(): Headers;
    get ok(): boolean;
    get status(): number;
    get statusText(): string;
    readonly type = "default";
    get url(): string;
    get redirected(): boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    json(): Promise<any>;
    text(): Promise<string>;
    toString(): string;
    toJSON(): object;
    clone(): FetchResponse;
}
//# sourceMappingURL=FetchResponse.d.ts.map