import type { SharedObject } from 'expo-modules-core';
export type NativeHeadersType = [string, string][];
export declare class NativeRequest extends SharedObject {
    start(url: string, requestInit: NativeRequestInit, requestBody: Uint8Array | null): Promise<NativeResponse>;
    cancel(): void;
}
export interface NativeRequestInit {
    credentials?: RequestCredentials;
    headers?: NativeHeadersType;
    method?: string;
}
export type NativeResponseEvents = {
    didReceiveResponseData(data: Uint8Array): void;
    didComplete(): void;
    didFailWithError(error: string): void;
    readyForJSFinalization(): void;
};
export declare class NativeResponse extends SharedObject<NativeResponseEvents> {
    readonly bodyUsed: boolean;
    readonly _rawHeaders: NativeHeadersType;
    readonly status: number;
    readonly statusText: string;
    readonly url: string;
    readonly redirected: boolean;
    startStreaming(): Promise<Uint8Array | null>;
    cancelStreaming(reason: string): void;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
}
//# sourceMappingURL=NativeRequest.d.ts.map