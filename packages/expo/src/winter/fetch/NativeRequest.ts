import type { SharedObject } from 'expo-modules-core';

export type NativeHeadersType = [string, string][];

export declare class NativeRequest extends SharedObject {
  public start(
    url: string,
    requestInit: NativeRequestInit,
    requestBody: Uint8Array | null
  ): Promise<NativeResponse>;
  public cancel(): void;
}

export interface NativeRequestInit {
  credentials?: RequestCredentials; // same-origin is not supported
  headers?: NativeHeadersType;
  method?: string;
  redirect?: RequestRedirect;
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
  startStreaming(): Promise<Uint8Array<ArrayBuffer> | null>;
  cancelStreaming(reason: string): void;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}
