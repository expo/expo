/// <reference types="node" />

/** @jest-environment node */

// jest's `node` environment (jest-environment-node < 30) doesn't expose
// `ReadableStream` as a global even though modern Node does. Pull it from
// `node:stream/web` so the tests below can instantiate the body stream.
import { ReadableStream as NodeReadableStream } from 'node:stream/web';
if (typeof globalThis.ReadableStream === 'undefined') {
  (globalThis as any).ReadableStream = NodeReadableStream;
}

import { FetchResponse } from '../FetchResponse';

jest.mock('../ExpoFetchModule', () => {
  class StubNativeResponse {
    private listeners = new Map<string, Set<(...args: any[]) => void>>();
    _rawHeaders: [string, string][] = [];
    streamingState: 'none' | 'started' | 'completed' = 'none';

    addListener(event: string, listener: (...args: any[]) => void) {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event)!.add(listener);
    }
    removeListener(event: string, listener: (...args: any[]) => void) {
      this.listeners.get(event)?.delete(listener);
    }
    removeAllListeners(event: string) {
      this.listeners.delete(event);
    }
    emit(event: string, ...args: any[]) {
      const ls = this.listeners.get(event);
      if (!ls) return;
      for (const l of ls) l(...args);
    }
    startStreaming(): Promise<Uint8Array<ArrayBuffer> | null> {
      return Promise.resolve(null);
    }
    cancelStreaming(_reason: string) {}
  }
  class StubNativeRequest {}
  return {
    ExpoFetchModule: {
      NativeRequest: StubNativeRequest,
      NativeResponse: StubNativeResponse,
    },
  };
});

describe('FetchResponse', () => {
  it('identifies as a standard Response via Symbol.toStringTag', () => {
    expect(Object.prototype.toString.call(FetchResponse.prototype)).toBe('[object Response]');
  });

  it('does not throw when native emits didComplete after the stream was canceled', async () => {
    // Repros expo/expo#34804: native can deliver didComplete after the JS
    // consumer has already canceled the stream. Before the fix this would
    // call controller.close() on an already-closed controller and throw
    // "The stream is not in a state that permits close" out of the event
    // listener, surfacing as a fatal unhandled error.
    const response = new FetchResponse(() => {});
    const body = response.body!;
    const reader = body.getReader();

    await reader.cancel('consumer canceled');
    expect(() => (response as any).emit('didComplete')).not.toThrow();
  });

  it('does not throw when native emits didFailWithError after the stream was canceled', async () => {
    const response = new FetchResponse(() => {});
    const body = response.body!;
    const reader = body.getReader();

    await reader.cancel('consumer canceled');
    expect(() => (response as any).emit('didFailWithError', 'late error')).not.toThrow();
  });

  it('does not throw when native emits didComplete twice', async () => {
    const response = new FetchResponse(() => {});
    const body = response.body!;
    // Start pulling so the start() callback registers listeners.
    const reader = body.getReader();
    const readPromise = reader.read();

    (response as any).emit('didComplete');
    expect(() => (response as any).emit('didComplete')).not.toThrow();

    await readPromise; // resolves with { done: true }
  });
});
