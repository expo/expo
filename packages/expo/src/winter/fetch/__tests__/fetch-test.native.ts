/// <reference types="node" />

/** @jest-environment node */

import { Request } from '../ExpoRequest';
import { fetch } from '../fetch';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextDecoder = require('node:util').TextDecoder;
globalThis.TextEncoder = require('node:util').TextEncoder;

const mockStart = jest.fn();

jest.mock('../ExpoFetchModule', () => {
  class StubNativeResponse {
    addListener() {}
    removeListener() {}
    removeAllListeners() {}
  }
  class StubNativeRequest {
    start(...args: unknown[]) {
      return mockStart(...args);
    }
    cancel() {}
  }
  return {
    ExpoFetchModule: { NativeResponse: StubNativeResponse, NativeRequest: StubNativeRequest },
  };
});

// Mirrors the shape of React Native's `whatwg-fetch` Request: not an instance of the installed
// global `Request`, and the body is kept on the hidden `_bodyInit`/`_noBody` fields.
class WhatwgFetchRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  bodyUsed = false;
  _bodyInit: BodyInit | undefined;
  _noBody: boolean;

  constructor(url: string, init: { method?: string; body?: BodyInit } = {}) {
    this.url = url;
    this.method = init.method ?? 'GET';
    this.headers = new Headers();
    this._bodyInit = init.body;
    this._noBody = init.body === undefined;
  }
}

function sentBody(): string | null {
  const body = mockStart.mock.calls[0][2] as Uint8Array | null;
  return body == null ? null : new TextDecoder().decode(body);
}

describe('fetch', () => {
  beforeEach(() => {
    mockStart.mockReset();
  });

  it('sends the url, method and body of our Request', async () => {
    const request = new Request('https://example.test/', { method: 'post', body: 'payload' });
    await fetch(request);
    expect(mockStart.mock.calls[0][0]).toBe('https://example.test/');
    expect(mockStart.mock.calls[0][1].method).toBe('POST');
    expect(sentBody()).toBe('payload');
  });

  it('sends the url, method and body of a whatwg-fetch Request', async () => {
    const request = new WhatwgFetchRequest('https://example.test/', {
      method: 'POST',
      body: 'payload',
    });
    await fetch(request as any);
    expect(mockStart.mock.calls[0][0]).toBe('https://example.test/');
    expect(mockStart.mock.calls[0][1].method).toBe('POST');
    expect(sentBody()).toBe('payload');
  });

  it('sends no body for a bodyless whatwg-fetch Request', async () => {
    await fetch(new WhatwgFetchRequest('https://example.test/') as any);
    expect(sentBody()).toBeNull();
  });

  it('lets the init body override the Request body', async () => {
    const request = new Request('https://example.test/', { method: 'POST', body: 'original' });
    await fetch(request, { method: 'POST', body: 'override' });
    expect(sentBody()).toBe('override');
  });
});
