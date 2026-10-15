/// <reference types="node" />

/** @jest-environment node */

import { FetchError } from '../FetchErrors';
import { fetch } from '../fetch';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextDecoder = require('node:util').TextDecoder;
globalThis.TextEncoder = require('node:util').TextEncoder;

/** The rejection the native module produces for a failed request, including its `code`. */
function nativeFailure(message: string, code: string): Error {
  return Object.assign(new Error(message), { code });
}

// jest.mock factories are hoisted, so the stub reads the pending rejection through a
// `mock`-prefixed binding each test can reassign.
const mockState: { startRejection: Error } = {
  startRejection: nativeFailure('network error', 'ERR_FETCH_FAILED'),
};

jest.mock('../ExpoFetchModule', () => {
  class StubNativeResponse {
    get _rawHeaders(): [string, string][] {
      return [];
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
    addListener(): void {}
    removeListener(): void {}
    removeAllListeners(): void {}
  }

  class StubNativeRequest {
    async start(): Promise<never> {
      throw mockState.startRejection;
    }
    cancel(): void {}
  }

  return {
    ExpoFetchModule: {
      NativeRequest: StubNativeRequest,
      NativeResponse: StubNativeResponse,
    },
  };
});

describe('FetchError', () => {
  it('is a TypeError, so retry libraries recognise a network failure', async () => {
    // Repros expo/expo#50212. The Fetch Standard rejects a network error with a TypeError, and so
    // do browsers, undici and the React Native `fetch` that `expo/fetch` replaces as the global.
    // Libraries such as get-it (the HTTP layer under @sanity/client) end their retry predicate
    // with `error instanceof TypeError`, so a plain Error silently disables retries on native.
    mockState.startRejection = nativeFailure('Unable to resolve host', 'ERR_FETCH_FAILED');

    await expect(fetch('https://does-not-exist.invalid/')).rejects.toBeInstanceOf(TypeError);
  });

  it('keeps the native rejection as the cause, so its code survives', async () => {
    // A cancel and a transport failure both arrive as `fetch failed: …`; the native `code` is the
    // only field that tells them apart, and it was dropped because createFromError copied
    // `error.cause` (always undefined here) instead of the error itself.
    mockState.startRejection = nativeFailure(
      'Fetch request has been canceled',
      'ERR_FETCH_REQUEST_CANCELED'
    );

    await expect(fetch('https://example.test/')).rejects.toMatchObject({
      cause: { code: 'ERR_FETCH_REQUEST_CANCELED' },
    });
  });

  it('still satisfies instanceof Error and FetchError', async () => {
    mockState.startRejection = nativeFailure('network error', 'ERR_FETCH_FAILED');

    const error = await fetch('https://example.test/').catch((e: unknown) => e);
    // TypeError is an Error, so every existing `instanceof Error` check keeps working.
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FetchError);
  });

  it('prefixes the native message without losing it', async () => {
    mockState.startRejection = nativeFailure(
      'Unable to resolve host "does-not-exist.invalid"',
      'ERR_FETCH_FAILED'
    );

    await expect(fetch('https://does-not-exist.invalid/')).rejects.toThrow(
      'fetch failed: Unable to resolve host "does-not-exist.invalid"'
    );
  });
});

describe('FetchError.createFromError', () => {
  it('points cause at the original error rather than the original error’s cause', () => {
    const native = nativeFailure('boom', 'ERR_FETCH_FAILED');
    const error = FetchError.createFromError(native);

    expect(error.cause).toBe(native);
    expect(error.stack).toBe(native.stack);
  });
});
