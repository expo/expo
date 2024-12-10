import { ReadableStream } from 'web-streams-polyfill';

import { ExpoFetchModule } from './ExpoFetchModule';
import type { NativeResponse } from './NativeRequest';

const ConcreteNativeResponse = ExpoFetchModule.NativeResponse as typeof NativeResponse;

/**
 * A response implementation for the `fetch.Response` API.
 */
export class FetchResponse extends ConcreteNativeResponse implements Response {
  private streamingStarted = false;

  get body(): ReadableStream<Uint8Array> | null {
    const response = this;
    return new ReadableStream({
      start(controller) {
        response.addListener('didReceiveResponseData', (data: Uint8Array) => {
          controller.enqueue(data);
        });

        response.addListener('didComplete', () => {
          response.removeAllRegisteredListeners();
          controller.close();
        });

        response.addListener('didFailWithError', (error: string) => {
          response.removeAllRegisteredListeners();
          controller.error(new Error(error));
        });
      },
      pull() {
        if (!response.streamingStarted) {
          response.startStreaming();
          response.streamingStarted = true;
        }
      },
      cancel(reason) {
        response.removeAllRegisteredListeners();
        response.cancelStreaming(String(reason));
      },
    });
  }

  get headers(): Headers {
    return new Headers(this._rawHeaders);
  }

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  public readonly type = 'default';

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

  private removeAllRegisteredListeners() {
    this.removeAllListeners('didReceiveResponseData');
    this.removeAllListeners('didComplete');
    this.removeAllListeners('didFailWithError');
  }
}
