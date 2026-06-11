/// <reference types="node" />

/** @jest-environment node */

import { FetchResponse } from '../FetchResponse';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextDecoder = require('node:util').TextDecoder;
globalThis.TextEncoder = require('node:util').TextEncoder;

jest.mock('../ExpoFetchModule', () => {
  const { TextEncoder, TextDecoder } = require('node:util');
  const helloWorld = new TextEncoder().encode('hello world');

  class StubNativeResponse {
    private listeners = new Map<string, Set<(...args: any[]) => void>>();
    private _bodyUsed = false;

    // Getters on the prototype, like the real native binding, so super.x works.
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
      return this._bodyUsed;
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

    emit(event: string, ...args: any[]) {
      const listeners = this.listeners.get(event);
      if (!listeners) {
        return;
      }

      for (const listener of listeners) {
        listener(...args);
      }
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
      this._bodyUsed = true;
      return helloWorld.buffer.slice(
        helloWorld.byteOffset,
        helloWorld.byteOffset + helloWorld.byteLength
      ) as ArrayBuffer;
    }

    async text(): Promise<string> {
      this._bodyUsed = true;
      return new TextDecoder().decode(helloWorld);
    }

    async startStreaming(): Promise<Uint8Array | null> {
      return helloWorld;
    }

    cancelStreaming() {}
  }

  class StubNativeRequest {}

  return {
    ExpoFetchModule: {
      NativeRequest: StubNativeRequest,
      NativeResponse: StubNativeResponse,
    },
  };
});

function makeResponse(): FetchResponse {
  return new FetchResponse(() => {});
}

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
    const response = makeResponse();
    const body = response.body!;
    const reader = body.getReader();

    await reader.cancel('consumer canceled');
    expect(() => (response as any).emit('didComplete')).not.toThrow();
  });

  it('does not throw when native emits didFailWithError after the stream was canceled', async () => {
    const response = makeResponse();
    const body = response.body!;
    const reader = body.getReader();

    await reader.cancel('consumer canceled');
    expect(() => (response as any).emit('didFailWithError', 'late error')).not.toThrow();
  });

  it('does not throw when native emits didComplete twice', async () => {
    const response = makeResponse();
    const body = response.body!;
    const reader = body.getReader();
    const readPromise = reader.read();

    (response as any).emit('didComplete');
    expect(() => (response as any).emit('didComplete')).not.toThrow();

    await readPromise;
  });

  describe('clone()', () => {
    it('returns a Response that exposes the same metadata', () => {
      const response = makeResponse();
      const cloned = response.clone();
      expect(cloned.status).toBe(response.status);
      expect(cloned.statusText).toBe(response.statusText);
      expect(cloned.url).toBe(response.url);
      expect(cloned.redirected).toBe(response.redirected);
      expect(cloned.ok).toBe(response.ok);
      expect(cloned.type).toBe('default');
      expect(cloned.headers.get('content-type')).toBe('text/plain');
      expect(Object.prototype.toString.call(cloned)).toBe('[object Response]');
    });

    it('lets the original and the clone read the body independently', async () => {
      const response = makeResponse();
      const cloned = response.clone();

      const [originalBytes, clonedBytes] = await Promise.all([
        response.arrayBuffer(),
        cloned.arrayBuffer(),
      ]);

      expect(originalBytes.byteLength).toBe(11);
      expect(clonedBytes.byteLength).toBe(11);
      expect(response.bodyUsed).toBe(true);
      expect(cloned.bodyUsed).toBe(true);
    });

    it('supports cloning the clone', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      const reCloned = cloned.clone();
      const bytes = await reCloned.arrayBuffer();
      expect(bytes.byteLength).toBe(11);
    });

    it('does not flip bodyUsed on siblings when a second clone is read', async () => {
      const response = makeResponse();
      const second = response.clone();
      const third = response.clone();

      await third.json().catch(() => {});

      expect(response.bodyUsed).toBe(false);
      expect(second.bodyUsed).toBe(false);
      expect(third.bodyUsed).toBe(true);
    });

    it('lets the original be read after being cloned twice', async () => {
      const response = makeResponse();
      response.clone();
      response.clone();
      expect((await response.arrayBuffer()).byteLength).toBe(11);
    });

    it('throws a TypeError if the body has already been read', async () => {
      const response = makeResponse();
      await response.arrayBuffer();
      expect(() => response.clone()).toThrow(TypeError);
    });

    it('throws a TypeError if the body stream is locked', () => {
      const response = makeResponse();
      response.body!.getReader();
      expect(() => response.clone()).toThrow(TypeError);
    });

    it('throws a TypeError if the body has been partially read and released', async () => {
      const response = makeResponse();
      const reader = response.body!.getReader();
      await reader.read();
      reader.releaseLock();
      expect(() => response.clone()).toThrow(TypeError);
    });

    it('keeps the original readable after the clone body is cancelled', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      await cloned.body!.cancel();
      expect((await response.arrayBuffer()).byteLength).toBe(11);
    });

    it('keeps the clone readable after the original body is cancelled', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      await response.body!.cancel();
      expect((await cloned.arrayBuffer()).byteLength).toBe(11);
    });

    it('reads the body of a clone via text()', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      expect(await cloned.text()).toBe('hello world');
    });

    it('reads the body of a clone via blob()', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      const blob = await cloned.blob();
      expect(blob.size).toBe(11);
    });

    it('routes json() through the cloned body', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      await expect(cloned.json()).rejects.toThrow(SyntaxError);
    });

    it('routes formData() through the cloned body', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      const formData = await cloned.formData();
      expect(formData.get('hello world')).toBe('');
    });
  });

  describe('body methods', () => {
    it('rejects a second arrayBuffer() call with TypeError', async () => {
      const response = makeResponse();
      await response.arrayBuffer();
      await expect(response.arrayBuffer()).rejects.toThrow(TypeError);
    });

    it('rejects a second text() call with TypeError', async () => {
      const response = makeResponse();
      await response.arrayBuffer();
      await expect(response.text()).rejects.toThrow(TypeError);
    });

    it('rejects text() when the body stream is locked', async () => {
      const response = makeResponse();
      response.body!.getReader();
      await expect(response.text()).rejects.toThrow(TypeError);
    });

    it('rejects arrayBuffer() when the body stream is locked', async () => {
      const response = makeResponse();
      response.body!.getReader();
      await expect(response.arrayBuffer()).rejects.toThrow(TypeError);
    });

    it('rejects body methods on a clone after its body has been read', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      await cloned.arrayBuffer();
      await expect(cloned.text()).rejects.toThrow(TypeError);
    });

    it('flips bodyUsed on a clone after reading its body stream directly', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      const reader = cloned.body!.getReader();

      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }

      reader.releaseLock();
      expect(cloned.bodyUsed).toBe(true);
    });

    it('does not flip bodyUsed on the original when only the clone is read', async () => {
      const response = makeResponse();
      const cloned = response.clone();
      await cloned.arrayBuffer();
      expect(response.bodyUsed).toBe(false);
    });

    it('lets both tee() branches read the body and flips bodyUsed', async () => {
      const response = makeResponse();
      const [branchA, branchB] = response.body!.tee();

      const drain = async (stream: ReadableStream<Uint8Array<ArrayBuffer>>) => {
        const reader = stream.getReader();
        let length = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (!done) {
            length += value.byteLength;
          } else {
            break;
          }
        }

        return length;
      };

      const [aLength, bLength] = await Promise.all([drain(branchA), drain(branchB)]);
      expect(aLength).toBe(11);
      expect(bLength).toBe(11);
      expect(response.bodyUsed).toBe(true);
    });
  });
});
