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
