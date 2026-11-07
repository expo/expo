/// <reference types="node" />

import { fetch } from '../fetch';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextEncoder = require('node:util').TextEncoder;

const mockStart = jest.fn(async () => {});

jest.mock('../ExpoFetchModule', () => {
  const state: { createFetch?: (implementation: Function) => Function } = {
    // Forwards like the native host function: the id first, then whatever the caller passed.
    createFetch:
      (implementation) =>
      (...args: unknown[]) =>
        implementation('from-host', ...args),
  };

  class StubNativeResponse {
    addListener() {}
    removeListener() {}
  }
  class StubNativeRequest {
    start = mockStart;
    cancel() {}
  }
  return {
    __state: state,
    ExpoFetchModule: {
      NativeRequest: StubNativeRequest,
      NativeResponse: StubNativeResponse,
      get createFetch() {
        return state.createFetch;
      },
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
  const { __state } = require('../ExpoFetchModule');

  beforeEach(() => {
    mockStart.mockClear();
  });

  afterEach(() => {
    delete (globalThis as any).__NETWORK_REPORTER__;
    __state.createFetch =
      (implementation: Function) =>
      (...args: unknown[]) =>
        implementation('from-host', ...args);
  });

  it('takes the DevTools request id from the native host function instead of fetch.js', async () => {
    const createDevToolsRequestId = jest.fn(() => 'from-js');
    (globalThis as any).__NETWORK_REPORTER__ = { createDevToolsRequestId };

    const pending = fetch('https://example.com/', { body: 'hello', method: 'POST' });
    expect(createDevToolsRequestId).not.toHaveBeenCalled();
    await pending;

    expect(mockStart).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({ devToolsRequestId: 'from-host' }),
      expect.anything()
    );
  });

  it('passes the host request id for fetch(url) without init', async () => {
    await fetch('https://example.com/');

    expect(mockStart).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({ devToolsRequestId: 'from-host' }),
      null
    );
  });

  it('creates the DevTools request id in JS when the native host function is unavailable', async () => {
    __state.createFetch = undefined;

    let fallbackFetch: typeof fetch;
    jest.isolateModules(() => {
      fallbackFetch = require('../fetch').fetch;
    });

    const createDevToolsRequestId = jest.fn(() => 'from-js');
    (globalThis as any).__NETWORK_REPORTER__ = { createDevToolsRequestId };

    const pending = fallbackFetch!('https://example.com/');
    expect(createDevToolsRequestId).toHaveBeenCalledTimes(1);
    await pending;

    expect(mockStart).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({ devToolsRequestId: 'from-js' }),
      null
    );
  });

  it('passes no DevTools request id when the network reporter is unavailable', async () => {
    __state.createFetch = undefined;

    let fallbackFetch: typeof fetch;
    jest.isolateModules(() => {
      fallbackFetch = require('../fetch').fetch;
    });

    await fallbackFetch!('https://example.com/');

    const [, requestInit] = mockStart.mock.calls[0] as any[];
    expect(requestInit.devToolsRequestId).toBeUndefined();
  });
});
