/// <reference types="node" />

import { Request } from '../ExpoRequest';
import { fetch } from '../fetch';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextDecoder = require('node:util').TextDecoder;
globalThis.TextEncoder = require('node:util').TextEncoder;

const mockStart = jest.fn();
const mockCreateNativeRequest = jest.fn();

jest.mock('../ExpoFetchModule', () => {
  class StubNativeResponse {
    addListener() {}
    removeListener() {}
    removeAllListeners() {}
  }
  class StubNativeRequest {
    constructor() {
      mockCreateNativeRequest();
    }
    start(...args: unknown[]) {
      return mockStart(...args);
    }
    cancel() {}
  }
  return {
    ExpoFetchModule: { NativeResponse: StubNativeResponse, NativeRequest: StubNativeRequest },
  };
});

function getStartedHeaders(): [string, string][] {
  return (mockStart.mock.calls[0] as any[])[1].headers;
}

describe('Setting the Content-Type header from the body', () => {
  beforeEach(() => {
    mockStart.mockClear();
  });

  it('should keep the caller content-type header for a blob body', async () => {
    await fetch('https://example.test/', {
      method: 'POST',
      headers: { Accept: '*/*', 'content-type': 'application/octet-stream' },
      body: new Blob(['hello'], { type: 'text/plain' }),
    });
    expect(getStartedHeaders()).toEqual([
      ['Accept', '*/*'],
      ['content-type', 'application/octet-stream'],
    ]);
  });

  it('should keep the caller content-type header for a blob body without a type', async () => {
    await fetch('https://example.test/', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: new Blob(['hello']),
    });
    expect(getStartedHeaders()).toEqual([['Content-Type', 'image/jpeg']]);
  });
});

describe('DevTools request id', () => {
  beforeEach(() => {
    mockStart.mockClear();
  });

  afterEach(() => {
    delete (globalThis as any).__NETWORK_REPORTER__;
  });

  it('creates a DevTools request id in the calling frame and passes it to native', async () => {
    const createDevToolsRequestId = jest.fn(() => 'devtools-request-id');
    (globalThis as any).__NETWORK_REPORTER__ = { createDevToolsRequestId };

    const pending = fetch('https://example.com/', { body: 'hello', method: 'POST' });
    // Must run before the first `await` so the initiator stack points at the caller.
    expect(createDevToolsRequestId).toHaveBeenCalledTimes(1);
    await pending;

    expect(mockStart).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({ devToolsRequestId: 'devtools-request-id' }),
      expect.anything()
    );
  });

  it('passes no DevTools request id when the network reporter is unavailable', async () => {
    await fetch('https://example.com/');

    const [, requestInit] = mockStart.mock.calls[0] as any[];
    expect(requestInit.devToolsRequestId).toBeUndefined();
  });
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

  it("sends a FormData body with the Request's content-type and boundary", async () => {
    const formData = new FormData();
    formData.append('a', 'b');
    const request = new Request('https://example.test/', { method: 'POST', body: formData });
    const contentType = request.headers.get('content-type');
    await fetch(request);
    const sentHeaders = new Map(
      (mockStart.mock.calls[0][1].headers as [string, string][]).map(([k, v]) => [
        k.toLowerCase(),
        v,
      ])
    );
    expect(sentHeaders.get('content-type')).toBe(contentType);
    const boundary = contentType!.split('boundary=')[1];
    expect(sentBody()).toMatch(new RegExp(`^--${boundary}\r\n`));
  });

  it('keeps the quotes of a quoted multipart boundary', async () => {
    const formData = new FormData();
    formData.append('a', 'b');
    const request = new Request('https://example.test/', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data; boundary="a b"' },
    });
    await fetch(request);
    const sentHeaders = new Map(getStartedHeaders().map(([k, v]) => [k.toLowerCase(), v]));
    expect(sentHeaders.get('content-type')).toBe('multipart/form-data; boundary="a b"');
    expect(sentBody()).toMatch(/^--a b\r\n/);
  });

  it('does not use the Request signal when the init signal is null', async () => {
    const request = new Request('https://example.test/', { signal: AbortSignal.abort() });
    await expect(fetch(request, { signal: null })).resolves.toBeDefined();
  });

  it('lets the init body override the Request body', async () => {
    const request = new Request('https://example.test/', { method: 'POST', body: 'original' });
    await fetch(request, { method: 'POST', body: 'override' });
    expect(sentBody()).toBe('override');
  });

  it('marks a stream body as used after sending it', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('streamed'));
        controller.close();
      },
    });
    const request = new Request('https://example.test/', { method: 'POST', body });
    await fetch(request);
    expect(sentBody()).toBe('streamed');
    expect(request.bodyUsed).toBe(true);
    expect(() => request.clone()).toThrow('Request body is already used');
  });

  it('rejects sending a Request with an already-disturbed or locked stream body', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('streamed'));
        controller.close();
      },
    });
    const request = new Request('https://example.test/', { method: 'POST', body });
    // Simulate a disturbed-but-unlocked stream (as with web-streams-polyfill after read + releaseLock).
    (body as unknown as { _disturbed: boolean })._disturbed = true;
    await expect(fetch(request)).rejects.toThrow(TypeError);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('does not create a native request when the body was already used', async () => {
    mockCreateNativeRequest.mockClear();
    const body = new ReadableStream<Uint8Array>();
    body.getReader();
    await expect(fetch('https://example.test/', { method: 'POST', body })).rejects.toThrow(
      TypeError
    );
    expect(mockCreateNativeRequest).not.toHaveBeenCalled();
  });

  it('names the stream, not a Request, when a locked init body is rejected', async () => {
    const body = new ReadableStream<Uint8Array>();
    body.getReader();
    await expect(fetch('https://example.test/', { method: 'POST', body })).rejects.toThrow(
      'the body stream is locked or was already read'
    );
  });
});
