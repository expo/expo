/// <reference types="node" />

/** @jest-environment node */

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

  it('should keep the caller Content-Type header for a Blob body', async () => {
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

  it('should send an empty Content-Type header for a Blob without a type', async () => {
    await fetch('https://example.test/', { method: 'POST', body: new Blob(['hello']) });
    expect(getStartedHeaders()).toEqual([['Content-Type', '']]);
  });

  it('should use the Blob type when the caller Content-Type header is undefined', async () => {
    await fetch('https://example.test/', {
      method: 'POST',
      headers: { 'Content-Type': undefined } as any,
      body: new Blob(['hello'], { type: 'text/plain' }),
    });
    expect(getStartedHeaders()).toEqual([['Content-Type', 'text/plain']]);
  });
});
