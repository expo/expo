/// <reference types="node" />

/** @jest-environment node */

import { ExpoFetchModule } from '../ExpoFetchModule';
import { fetch } from '../fetch';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextDecoder = require('node:util').TextDecoder;
globalThis.TextEncoder = require('node:util').TextEncoder;

jest.mock('../ExpoFetchModule', () => {
  class StubNativeResponse {
    private listeners = new Map<string, Set<(...args: any[]) => void>>();

    get _rawHeaders(): [string, string][] {
      return [['content-type', 'text/plain']];
    }
    get status(): number {
      return 200;
    }
    get statusText(): string {
      return 'OK';
    }
    get url(): string {
      return 'https://example.test/';
    }
    get redirected(): boolean {
      return false;
    }
    get bodyUsed(): boolean {
      return false;
    }

    addListener(event: string, listener: (...args: any[]) => void) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(listener);
    }

    removeListener(event: string, listener: (...args: any[]) => void) {
      this.listeners.get(event)?.delete(listener);
    }

    removeAllListeners(event: string) {
      this.listeners.delete(event);
    }
  }

  // Mirrors the native request: `start` stays pending until the response is
  // received or the request errors, and `cancel` errors it.
  class StubNativeRequest {
    static last: StubNativeRequest | null = null;

    private settle: { resolve: () => void; reject: (error: Error) => void } | null = null;

    constructor() {
      StubNativeRequest.last = this;
    }

    start(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        this.settle = { resolve, reject };
      });
    }

    cancel() {
      this.settle?.reject(new Error('Fetch request has been canceled'));
    }

    // Test helpers
    receiveResponse() {
      this.settle?.resolve();
    }

    failWith(error: Error) {
      this.settle?.reject(error);
    }
  }

  return {
    ExpoFetchModule: {
      NativeRequest: StubNativeRequest,
      NativeResponse: StubNativeResponse,
      unstable_createBlobData: jest.fn(async () => 'mock-blob-id'),
    },
  };
});

const NativeRequestStub = ExpoFetchModule.NativeRequest as any;

// Lets `fetch` reach `request.start()` before the test drives the request.
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('fetch', () => {
  it('resolves with a response once the response is received', async () => {
    const promise = fetch('https://example.test/');
    await flush();
    NativeRequestStub.last.receiveResponse();

    const response = await promise;
    expect(response.status).toBe(200);
  });

  it('rejects with a named FetchError when the request fails', async () => {
    const promise = fetch('https://example.test/');
    await flush();
    NativeRequestStub.last.failWith(new Error('The network connection was lost.'));

    await expect(promise).rejects.toMatchObject({
      name: 'FetchError',
      message: 'fetch failed: The network connection was lost.',
    });
  });

  it('rejects with an AbortError when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetch('https://example.test/', { signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects with the reason the signal was already aborted with', async () => {
    const controller = new AbortController();
    const reason = new Error('replaced by a newer request');
    controller.abort(reason);

    await expect(fetch('https://example.test/', { signal: controller.signal })).rejects.toBe(
      reason
    );
  });

  it('rejects with an AbortError when the request is aborted in flight', async () => {
    const controller = new AbortController();
    const promise = fetch('https://example.test/', { signal: controller.signal });
    await flush();

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects with the abort reason when the request is aborted in flight', async () => {
    const controller = new AbortController();
    const reason = new Error('user left the screen');
    const promise = fetch('https://example.test/', { signal: controller.signal });
    await flush();

    controller.abort(reason);

    await expect(promise).rejects.toBe(reason);
  });
});
