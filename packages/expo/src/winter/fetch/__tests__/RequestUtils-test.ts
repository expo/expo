/// <reference types="node" />

/** @jest-environment node */
// Specify node environment because jsdom for web testing doesn't support standard Blob

import { TextDecoder, TextEncoder } from 'node:util';
import RNFormData from 'react-native/Libraries/Network/FormData';
import { ReadableStream } from 'web-streams-polyfill';

import { type NativeHeadersType } from '../NativeRequest';
import {
  convertReadableStreamToUint8ArrayAsync,
  normalizeBodyInitAsync,
  normalizeHeadersInit,
  overrideHeaders,
} from '../RequestUtils';

declare namespace globalThis {
  let TextDecoder: typeof import('util').TextDecoder;
  let TextEncoder: typeof import('util').TextEncoder;
}

globalThis.TextDecoder ??= TextDecoder;
globalThis.TextEncoder ??= TextEncoder;

describe(convertReadableStreamToUint8ArrayAsync, () => {
  it('should convert a readable stream to a Uint8Array', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('Hello, world!'));
        controller.close();
      },
    });

    const result = await convertReadableStreamToUint8ArrayAsync(stream);
    const resultString = new TextDecoder().decode(result);
    expect(resultString).toEqual('Hello, world!');
  });

  it('should handle an empty readable stream', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const result = await convertReadableStreamToUint8ArrayAsync(stream);
    expect(result).toEqual(new Uint8Array());
  });

  it('should handle errors in the readable stream', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new Error('Stream error'));
      },
    });

    await expect(convertReadableStreamToUint8ArrayAsync(stream)).rejects.toThrow('Stream error');
  });
});

declare namespace globalThis {
  let FormData: typeof RNFormData;
}

describe(normalizeBodyInitAsync, () => {
  let originalFormData: any;

  beforeAll(() => {
    originalFormData = globalThis.FormData;
    globalThis.FormData = RNFormData;
  });
  afterAll(() => {
    globalThis.FormData = originalFormData;
  });

  it('should normalize a string body', async () => {
    const body = 'Hello, world!';
    const result = await normalizeBodyInitAsync(body);
    expect(new TextDecoder().decode(result.body)).toBe(body);
  });

  it('should normalize a Blob body', async () => {
    const body = new Blob(['Hello, world!'], { type: 'text/plain' });
    const result = await normalizeBodyInitAsync(body);
    expect(new TextDecoder().decode(result.body)).toBe('Hello, world!');
  });

  // TODO(@kitten): We know this should work but the instanceof check fails in the Web jest preset env
  it.skip('should normalize an ArrayBuffer body', async () => {
    const body = new TextEncoder().encode('Hello, world!').buffer;
    const result = await normalizeBodyInitAsync(body as ArrayBuffer);
    expect(new TextDecoder().decode(result.body)).toBe('Hello, world!');
  });

  it('should throw a FormData body', async () => {
    const body = new RNFormData();
    body.append('key', 'value');
    const result = await normalizeBodyInitAsync(body as any);
    const resultBodyString = new TextDecoder().decode(result.body);
    expect(resultBodyString).toMatch(/------ExpoFetchFormBoundary[\w]{16}/);
    const overrideHeaders = result.overriddenHeaders;
    expect(overrideHeaders?.length).toBe(1);
    expect(overrideHeaders?.[0][0]).toBe('Content-Type');
    expect(overrideHeaders?.[0][1]).toMatch(
      /^multipart\/form-data; boundary=----ExpoFetchFormBoundary[\w]{16}$/
    );
  });

  it('should handle undefined body', async () => {
    const result = await normalizeBodyInitAsync(undefined);
    expect(result.body).toBeNull();
  });

  it('should handle null body', async () => {
    const result = await normalizeBodyInitAsync(null);
    expect(result.body).toBeNull();
  });
});

describe(normalizeHeadersInit, () => {
  it('should normalize Headers instance', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const result = normalizeHeadersInit(headers);
    const expected: NativeHeadersType = [
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
    ];
    expect(isEqualHeaders(result, expected)).toBe(true);
  });

  it('should normalize plain object headers', () => {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const result = normalizeHeadersInit(headers);
    const expected: NativeHeadersType = [
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
    ];
    expect(isEqualHeaders(result, expected)).toBe(true);
  });

  it('should normalize array of key-value pairs headers', () => {
    const headers: [string, string][] = [
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
    ];

    const result = normalizeHeadersInit(headers);
    const expected: NativeHeadersType = [
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
    ];
    expect(isEqualHeaders(result, expected)).toBe(true);
  });

  it('should handle empty headers', () => {
    const headers = {};

    const result = normalizeHeadersInit(headers);
    expect(result).toEqual([]);
  });

  it('should handle undefined headers', () => {
    const result = normalizeHeadersInit(undefined);
    expect(result).toEqual([]);
  });

  function sortHeadersByKeys(headers: NativeHeadersType): NativeHeadersType {
    return headers.sort((a, b) => a[0].localeCompare(b[0]));
  }

  /**
   * Compare two arrays of headers since the order of headers and string cases are not guaranteed.
   */
  function isEqualHeaders(a: NativeHeadersType, b: NativeHeadersType): boolean {
    const sortedA = sortHeadersByKeys(a);
    const sortedB = sortHeadersByKeys(b);

    if (sortedA.length !== sortedB.length) {
      return false;
    }

    for (let i = 0; i < sortedA.length; i++) {
      if (
        sortedA[i][0].toLocaleLowerCase() !== sortedB[i][0].toLocaleLowerCase() ||
        sortedA[i][1].toLocaleLowerCase() !== sortedB[i][1].toLocaleLowerCase()
      ) {
        return false;
      }
    }

    return true;
  }
});

describe(overrideHeaders, () => {
  it('should add new headers if they do not exist', () => {
    const headers: NativeHeadersType = [
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
    ];
    const newHeaders: NativeHeadersType = [
      ['Authorization', 'Bearer token'],
      ['Cache-Control', 'no-cache'],
    ];
    const result = overrideHeaders(headers, newHeaders);
    const expected = [
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
      ['Authorization', 'Bearer token'],
      ['Cache-Control', 'no-cache'],
    ];
    expect(result).toEqual(expected);
  });

  it('should remove headers if new header has same key', () => {
    const headers: NativeHeadersType = [
      ['Content-Type', 'application/json'],
      ['Content-Type', 'application/json2'],
      ['Accept', 'application/json'],
      ['Authorization', 'Bearer token'],
    ];
    const newHeaders: NativeHeadersType = [['Content-Type', 'text/plain']];
    const result = overrideHeaders(headers, newHeaders);
    const expected = [
      ['Accept', 'application/json'],
      ['Authorization', 'Bearer token'],
      ['Content-Type', 'text/plain'],
    ];
    expect(result).toEqual(expected);
  });

  it('should remove headers if new header has same case-insensitive key', () => {
    const headers: NativeHeadersType = [
      ['content-type', 'application/json'],
      ['Accept', 'application/json'],
      ['Authorization', 'Bearer token'],
    ];
    const newHeaders: NativeHeadersType = [['Content-Type', 'text/plain']];
    const result = overrideHeaders(headers, newHeaders);
    const expected = [
      ['Accept', 'application/json'],
      ['Authorization', 'Bearer token'],
      ['Content-Type', 'text/plain'],
    ];
    expect(result).toEqual(expected);
  });
});
