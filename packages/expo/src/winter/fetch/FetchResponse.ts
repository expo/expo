import { ReadableStream } from 'web-streams-polyfill';

import { NativeResponse } from './NativeRequest';

/**
 * A response implementation for the `fetch.Response` API.
 */
export class FetchResponse implements Response {
  constructor(private readonly response: NativeResponse) {}

  get body(): ReadableStream<Uint8Array> | null {
    const response = this.response;
    return new ReadableStream({
      start(controller) {
        response.addListener('didReceiveResponseData', (data: Uint8Array) => {
          controller.enqueue(data);
        });

        response.addListener('didComplete', () => {
          controller.close();
        });

        response.addListener('didFailWithError', (error: string) => {
          controller.error(new Error(error));
        });

        response.startStreaming();
      },
      cancel(reason) {
        response.cancelStreaming(String(reason));
      },
    });
  }

  get bodyUsed(): boolean {
    return this.response.bodyUsed;
  }

  get headers(): Headers {
    return new Headers(this.response.headers);
  }

  get ok(): boolean {
    return this.response.status >= 200 && this.response.status < 300;
  }

  get status(): number {
    return this.response.status;
  }

  get statusText(): string {
    return this.response.statusText;
  }

  public readonly type = 'default';

  get url(): string {
    return this.response.url;
  }

  get redirected(): boolean {
    return this.response.redirected;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.response.arrayBuffer();
  }

  async blob(): Promise<Blob> {
    const buffer = await this.arrayBuffer();
    return new Blob([buffer]);
  }

  async formData(): Promise<FormData> {
    // Reference implementation:
    // https://chromium.googlesource.com/chromium/src/+/ed9f0b5933cf5ffb413be1ca844de5be140514bf/third_party/blink/renderer/core/fetch/body.cc#120
    const text = await this.text();
    const searchParams = new URLSearchParams(text);
    const formData = new FormData();
    searchParams.forEach((value, key) => {
      formData.append(key, value);
    });
    return formData;
  }

  async json(): Promise<any> {
    const text = await this.text();
    return JSON.parse(text);
  }

  async text(): Promise<string> {
    return this.response.text();
  }

  toString(): string {
    return `FetchResponse: { status: ${this.status}, statusText: ${this.statusText}, url: ${this.url} }`;
  }

  toJSON(): object {
    return {
      status: this.status,
      statusText: this.statusText,
      redirected: this.redirected,
      url: this.url,
    };
  }

  clone(): FetchResponse {
    throw new Error('Not implemented');
  }
}
