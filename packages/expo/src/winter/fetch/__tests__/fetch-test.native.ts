/// <reference types="node" />

import { fetch } from '../fetch';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextEncoder = require('node:util').TextEncoder;

const mockStart = jest.fn(async () => {});

jest.mock('../ExpoFetchModule', () => {
  class StubNativeResponse {
    addListener() {}
    removeListener() {}
  }
  class StubNativeRequest {
    start = mockStart;
    cancel() {}
  }
  return {
    ExpoFetchModule: {
      NativeRequest: StubNativeRequest,
      NativeResponse: StubNativeResponse,
    },
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
