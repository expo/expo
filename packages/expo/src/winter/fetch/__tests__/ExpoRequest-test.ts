/// <reference types="node" />

import { getRequestBodyInit, Request } from '../ExpoRequest';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextDecoder = require('node:util').TextDecoder;
globalThis.TextEncoder = require('node:util').TextEncoder;

// Mirrors the shape of React Native's `whatwg-fetch` Request: no `Symbol.toStringTag`, and the body
// is kept on the hidden `_bodyInit`/`_noBody` fields instead of a `body` stream.
class WhatwgFetchRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly credentials = 'same-origin' as const;
  readonly signal = new AbortController().signal;
  bodyUsed = false;
  _bodyInit: BodyInit | undefined;
  _noBody: boolean;

  constructor(url: string, init: { method?: string; body?: BodyInit; headers?: HeadersInit } = {}) {
    this.url = url;
    this.method = init.method ?? 'GET';
    this.headers = new Headers(init.headers);
    this._bodyInit = init.body;
    this._noBody = init.body === undefined;
  }
}

describe('Request', () => {
  it('defaults to GET and an empty body', () => {
    const request = new Request('https://example.test/');
    expect(request.url).toBe('https://example.test/');
    expect(request.method).toBe('GET');
    expect(request.body).toBeNull();
    expect(request.bodyUsed).toBe(false);
    expect(request.credentials).toBe('same-origin');
    expect(request.redirect).toBe('follow');
  });

  it('accepts a URL instance as input', () => {
    const request = new Request(new URL('https://example.test/path?q=1'));
    expect(request.url).toBe('https://example.test/path?q=1');
  });

  it('normalizes the method', () => {
    expect(new Request('https://example.test/', { method: 'post' }).method).toBe('POST');
    // The spec uppercases only DELETE, GET, HEAD, OPTIONS, POST and PUT.
    expect(new Request('https://example.test/', { method: 'patch' }).method).toBe('patch');
  });

  it('throws when a body is given to a GET or HEAD request', () => {
    // oxlint-disable-next-line unicorn/no-invalid-fetch-options -- testing the invalid case
    expect(() => new Request('https://example.test/', { body: 'x' })).toThrow(TypeError);
    // oxlint-disable-next-line unicorn/no-invalid-fetch-options -- testing the invalid case
    expect(() => new Request('https://example.test/', { method: 'HEAD', body: 'x' })).toThrow(
      TypeError
    );
  });

  it('exposes the headers as a Headers instance', () => {
    const request = new Request('https://example.test/', {
      headers: { 'X-Custom': 'value' },
    });
    expect(request.headers).toBeInstanceOf(Headers);
    expect(request.headers.get('x-custom')).toBe('value');
  });

  it('sets a default content-type for a string body', () => {
    const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
    expect(request.headers.get('content-type')).toBe('text/plain;charset=UTF-8');
  });

  it('does not override an explicit content-type', () => {
    const request = new Request('https://example.test/', {
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'application/json' },
    });
    expect(request.headers.get('content-type')).toBe('application/json');
  });

  it('sets the default content-type from the type of a Blob-like body', async () => {
    // Like a `File` from `expo-file-system`, which isn't an instance of `Blob`.
    const body = { size: 0, type: 'image/png', arrayBuffer: async () => new ArrayBuffer(0) };
    const request = new Request('https://example.test/', { method: 'POST', body: body as any });
    expect(request.headers.get('content-type')).toBe('image/png');
    expect((await request.blob()).type).toBe('image/png');
  });

  it('preserves the original body for later retrieval', () => {
    const request = new Request('https://example.test/', { method: 'POST', body: 'payload' });
    // The fetch implementation needs the raw body without consuming the request.
    expect(getRequestBodyInit(request)).toBe('payload');
    expect(request.bodyUsed).toBe(false);
  });

  it('throws when constructed with no arguments', () => {
    expect(() => new (Request as unknown as new () => Request)()).toThrow(TypeError);
  });

  describe('body consumption', () => {
    it('reads a string body as text', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: 'hello world',
      });
      expect(await request.text()).toBe('hello world');
      expect(request.bodyUsed).toBe(true);
    });

    it('reads a body as JSON', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: JSON.stringify({ a: 1 }),
      });
      expect(await request.json()).toEqual({ a: 1 });
    });

    it('reads a body as an ArrayBuffer', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: 'abc',
      });
      const buffer = await request.arrayBuffer();
      expect(new TextDecoder().decode(buffer)).toBe('abc');
    });

    it('reads a body as bytes', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: 'abc',
      });
      const bytes = await request.bytes();
      expect(new TextDecoder().decode(bytes)).toBe('abc');
    });

    it('throws when the body is read twice', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: 'hello',
      });
      await request.text();
      await expect(request.text()).rejects.toThrow(TypeError);
    });
  });

  describe('body stream', () => {
    async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
        length += value.byteLength;
      }
      const out = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return out;
    }

    it('returns null when there is no body', () => {
      expect(new Request('https://example.test/').body).toBeNull();
    });

    it('exposes the body as a ReadableStream', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      expect(request.body).toBeInstanceOf(ReadableStream);
      const bytes = await readStream(request.body!);
      expect(new TextDecoder().decode(bytes)).toBe('hello');
    });

    it('returns the same stream object across gets', () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      expect(request.body).toBe(request.body);
    });

    it('does not disturb the body merely by getting it', () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      // Touching `.body` must not flip bodyUsed (spec: only reading/locking disturbs it).
      expect(request.body).toBeInstanceOf(ReadableStream);
      expect(request.bodyUsed).toBe(false);
    });

    it('marks the body used once the stream is read', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      await readStream(request.body!);
      expect(request.bodyUsed).toBe(true);
    });

    it('treats a locked stream as unusable without marking bodyUsed until read', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      const reader = request.body!.getReader();
      expect(request.bodyUsed).toBe(false);
      expect(() => request.clone()).toThrow(TypeError);
      expect(() => new Request(request)).toThrow(TypeError);
      await expect(request.text()).rejects.toThrow(TypeError);
      // Releasing the lock without reading leaves the body usable per the Fetch spec.
      reader.releaseLock();
      expect(request.bodyUsed).toBe(false);
      expect(await request.text()).toBe('hello');
    });

    it('throws from another read method after the stream has been read', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      await readStream(request.body!);
      await expect(request.text()).rejects.toThrow(TypeError);
    });

    it('locks the body stream after another read method reads the body', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      const body = request.body!;
      await request.text();
      expect(body.locked).toBe(true);
    });

    it('returns a locked body stream when .body is accessed after consumption', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      await request.text();
      expect(request.body!.locked).toBe(true);
      expect(() => request.body!.getReader()).toThrow(/locked/);
    });

    it('passes a ReadableStream body through unchanged', () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('streamed'));
          controller.close();
        },
      });
      const request = new Request('https://example.test/', { method: 'POST', body: stream });
      expect(request.body).toBe(stream);
    });

    it('closes without enqueuing an empty chunk for an empty string body', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: '' });
      const result = await request.body!.getReader().read();
      expect(result).toEqual({ done: true, value: undefined });
    });

    it('locks a ReadableStream body when formData() rejects on an unsupported Content-Type', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data'));
          controller.close();
        },
      });
      const request = new Request('https://example.test/', { method: 'POST', body: stream });
      await expect(request.formData()).rejects.toThrow(TypeError);
      expect(request.bodyUsed).toBe(true);
      expect(request.body!.locked).toBe(true);
    });
  });

  describe('construction from another request', () => {
    it('copies url, method, headers and body', () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: 'payload',
        headers: { 'X-Custom': 'value' },
        credentials: 'include',
        redirect: 'error',
      });
      const copy = new Request(original);
      expect(copy.url).toBe('https://example.test/');
      expect(copy.method).toBe('POST');
      expect(copy.headers.get('x-custom')).toBe('value');
      expect(copy.credentials).toBe('include');
      expect(copy.redirect).toBe('error');
      expect(getRequestBodyInit(copy)).toBe('payload');
    });

    it('marks the source request as used and locks its body stream when reused', () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: 'payload',
      });
      const originalBody = original.body!;
      // Passing no body in the init reuses the source body, consuming and locking it.
      const copy = new Request(original);
      expect(getRequestBodyInit(copy)).toBe('payload');
      expect(original.bodyUsed).toBe(true);
      expect(originalBody.locked).toBe(true);
      expect(copy.body).not.toBe(originalBody);

      // Also locked when `.body` is accessed only after reuse.
      const original2 = new Request('https://example.test/', { method: 'POST', body: 'payload' });
      new Request(original2);
      expect(original2.body!.locked).toBe(true);
    });

    it('locks and proxies a ReadableStream body from the source request', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('streamed'));
          controller.close();
        },
      });
      const original = new Request('https://example.test/', { method: 'POST', body: stream });
      const copy = new Request(original);
      expect(original.bodyUsed).toBe(true);
      expect(original.body!.locked).toBe(true);
      expect(copy.body).not.toBe(original.body);
      expect(copy.bodyUsed).toBe(false);
      expect(await copy.text()).toBe('streamed');
    });

    it('throws when the source request body is already used', async () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: 'payload',
      });
      await original.text();
      expect(() => new Request(original)).toThrow(TypeError);
    });

    it('does not consume the source body when construction fails', () => {
      const original = new Request('https://example.test/', { method: 'POST', body: 'payload' });
      expect(() => new Request(original, { method: 'GET' })).toThrow(TypeError);
      expect(() => new Request(original, { method: 'CONNECT' })).toThrow(TypeError);
      expect(original.bodyUsed).toBe(false);
    });

    it('lets the init override the source body without consuming it', () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: 'original',
      });
      const copy = new Request(original, { method: 'POST', body: 'override' });
      expect(getRequestBodyInit(copy)).toBe('override');
      expect(original.bodyUsed).toBe(false);
    });

    it('applies the mode check to a stream body from the source request', () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: new ReadableStream<Uint8Array>(),
      });
      expect(() => new Request(original, { mode: 'no-cors' })).toThrow(TypeError);
      expect(original.bodyUsed).toBe(false);
    });

    it('does not add a default content-type for a body from the source request', () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: new URLSearchParams('a=1'),
      });
      const copy = new Request(original, { headers: { 'X-Trace': '1' } });
      expect(copy.headers.get('content-type')).toBeNull();
    });

    it('copies url, method, headers and body from a whatwg-fetch Request', async () => {
      const original = new WhatwgFetchRequest('https://example.test/', {
        method: 'POST',
        body: 'payload',
        headers: { 'X-Custom': 'value' },
      });
      const copy = new Request(original as unknown as Request);
      expect(copy.url).toBe('https://example.test/');
      expect(copy.method).toBe('POST');
      expect(copy.headers.get('x-custom')).toBe('value');
      expect(await copy.text()).toBe('payload');
      expect(original.bodyUsed).toBe(true);
    });

    it('treats a bodyless whatwg-fetch Request as having no body', () => {
      const original = new WhatwgFetchRequest('https://example.test/');
      const copy = new Request(original as unknown as Request);
      expect(copy.url).toBe('https://example.test/');
      expect(copy.body).toBeNull();
    });

    it('reads the body stream of a foreign spec-compliant Request', async () => {
      // A Request from another implementation, recognized by its tag and exposing only `body`.
      const original = {
        [Symbol.toStringTag]: 'Request',
        url: 'https://example.test/',
        method: 'POST',
        headers: new Headers(),
        bodyUsed: false,
        body: new Request('https://example.test/', { method: 'POST', body: 'payload' }).body,
      };
      const copy = new Request(original as unknown as Request);
      expect(copy.url).toBe('https://example.test/');
      expect(copy.method).toBe('POST');
      expect(await copy.text()).toBe('payload');
    });
    it('accepts a globalThis.Request typed value without casting', async () => {
      const globalReq: globalThis.Request = new Request('https://example.test/', {
        method: 'POST',
        body: 'from-global',
      });
      const copy = new Request(globalReq);
      expect(copy.url).toBe('https://example.test/');
      expect(copy.method).toBe('POST');
      expect(await copy.text()).toBe('from-global');
    });
  });

  describe('clone', () => {
    it('produces an independent request with the same body', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: 'payload',
      });
      const clone = request.clone();
      expect(clone.url).toBe(request.url);
      expect(clone.method).toBe(request.method);
      expect(await clone.text()).toBe('payload');
      expect(await request.text()).toBe('payload');
    });

    it('tees a ReadableStream body so both requests can be read', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('streamed'));
          controller.close();
        },
      });
      const request = new Request('https://example.test/', { method: 'POST', body: stream });
      const clone = request.clone();
      expect(clone.body).not.toBe(request.body);
      expect(await request.text()).toBe('streamed');
      expect(await clone.text()).toBe('streamed');
    });

    it('does not re-add a deleted Content-Type header', async () => {
      for (const body of ['hello', new URLSearchParams('a=1')]) {
        const request = new Request('https://example.test/', { method: 'POST', body });
        request.headers.delete('content-type');
        const clone = request.clone();
        expect(clone.headers.get('content-type')).toBeNull();
      }
      const form = new FormData();
      form.append('a', 'b');
      const formRequest = new Request('https://example.test/', { method: 'POST', body: form });
      const boundary = formRequest.headers.get('content-type')!.split('boundary=')[1]!;
      formRequest.headers.delete('content-type');
      const formClone = formRequest.clone();
      expect(formClone.headers.get('content-type')).toBeNull();
      expect(await formClone.text()).toMatch(new RegExp(`^--${boundary}\r\n`));
    });

    it('clones a keepalive request carrying a ReadableStream body copied from another request', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('streamed'));
          controller.close();
        },
      });
      const r1 = new Request('https://example.test/', { method: 'POST', body: stream });
      const r2 = new Request(r1, { keepalive: true });
      const r3 = r2.clone();
      expect(r3.keepalive).toBe(true);
      expect(await r2.text()).toBe('streamed');
      expect(await r3.text()).toBe('streamed');
    });

    it('throws when cloning an already-used request', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: 'payload',
      });
      await request.text();
      expect(() => request.clone()).toThrow(TypeError);
    });
  });

  it('names the method that failed when the body is already used', async () => {
    const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
    await request.text();
    await expect(request.json()).rejects.toThrow("Failed to execute 'json'");
    await expect(request.text()).rejects.toThrow("Failed to execute 'text'");
  });

  // Expected values follow the Fetch standard (https://fetch.spec.whatwg.org/#request-class) and
  // match what undici returns.
  describe('spec conformance', () => {
    describe('method', () => {
      it.each(['CONNECT', 'trace', 'Track'])('throws for the forbidden method %s', (method) => {
        expect(() => new Request('https://example.test/', { method })).toThrow(TypeError);
      });

      it.each(['bad method', '', 'GET\n'])('throws for the invalid method %j', (method) => {
        expect(() => new Request('https://example.test/', { method })).toThrow(TypeError);
      });

      it('keeps a valid custom method as-is', () => {
        expect(new Request('https://example.test/', { method: 'Custom' }).method).toBe('Custom');
      });
    });

    describe('url', () => {
      it('serializes a parsed URL', () => {
        expect(new Request('https://example.test').url).toBe('https://example.test/');
        expect(new Request('HTTPS://Example.Test/a/../b').url).toBe('https://example.test/b');
      });

      it('keeps input that cannot be parsed as-is for whatwg-fetch compatibility', () => {
        expect(new Request('not a url').url).toBe('not a url');
      });
    });

    describe('properties', () => {
      it('has the spec defaults', () => {
        const request = new Request('https://example.test/');
        expect(request.mode).toBe('cors');
        expect(request.cache).toBe('default');
        expect(request.referrer).toBe('about:client');
        expect(request.referrerPolicy).toBe('');
        expect(request.integrity).toBe('');
        expect(request.keepalive).toBe(false);
        expect(request.destination).toBe('');
        expect(request.duplex).toBe('half');
      });

      it('takes the values from the init', () => {
        const request = new Request('https://example.test/', {
          mode: 'no-cors',
          cache: 'no-store',
          referrer: '',
          referrerPolicy: 'no-referrer',
          integrity: 'sha256-abc',
          keepalive: true,
        });
        expect(request.mode).toBe('no-cors');
        expect(request.cache).toBe('no-store');
        expect(request.referrer).toBe('');
        expect(request.referrerPolicy).toBe('no-referrer');
        expect(request.integrity).toBe('sha256-abc');
        expect(request.keepalive).toBe(true);
      });

      it('copies the values from a source request', () => {
        const original = new Request('https://example.test/', {
          mode: 'same-origin',
          cache: 'reload',
          integrity: 'sha256-abc',
          keepalive: true,
        });
        const copy = new Request(original);
        expect(copy.mode).toBe('same-origin');
        expect(copy.cache).toBe('reload');
        expect(copy.integrity).toBe('sha256-abc');
        expect(copy.keepalive).toBe(true);
      });

      it('resets the referrer and referrer policy of a source request for a non-empty init', () => {
        const original = new Request('https://example.test/', {
          referrer: 'https://referrer.test/',
          referrerPolicy: 'origin',
        });
        const copy = new Request(original, { redirect: 'manual' });
        expect(copy.referrer).toBe('about:client');
        expect(copy.referrerPolicy).toBe('');
        // Like in WebIDL, an init with only undefined members is empty.
        const copyWithEmptyInit = new Request(original, { signal: undefined });
        expect(copyWithEmptyInit.referrer).toBe('https://referrer.test/');
        expect(copyWithEmptyInit.referrerPolicy).toBe('origin');
      });
    });

    describe('signal', () => {
      it('uses the init signal', () => {
        const controller = new AbortController();
        const request = new Request('https://example.test/', { signal: controller.signal });
        expect(request.signal).toBe(controller.signal);
      });

      it('is aborted when the init signal is already aborted', () => {
        const request = new Request('https://example.test/', { signal: AbortSignal.abort() });
        expect(request.signal.aborted).toBe(true);
      });

      it('follows the source request signal', () => {
        const controller = new AbortController();
        const original = new Request('https://example.test/', { signal: controller.signal });
        const copy = new Request(original);
        const clone = original.clone();
        controller.abort();
        expect(copy.signal.aborted).toBe(true);
        expect(clone.signal.aborted).toBe(true);
      });

      it('does not follow the source request signal when the init signal is null', () => {
        const controller = new AbortController();
        const original = new Request('https://example.test/', { signal: controller.signal });
        const copy = new Request(original, { signal: null });
        controller.abort();
        expect(copy.signal.aborted).toBe(false);
      });

      it('throws for an invalid init signal', () => {
        expect(() => new Request('https://example.test/', { signal: {} as any })).toThrow(
          TypeError
        );
        expect(() => new Request('https://example.test/', { signal: 'bad' as any })).toThrow(
          TypeError
        );
      });

      it('throws for an init signal that has no addEventListener()', () => {
        expect(
          () => new Request('https://example.test/', { signal: { aborted: false } as any })
        ).toThrow(TypeError);
      });
    });

    describe('body', () => {
      it('takes the blob type from the content-type header', async () => {
        const request = new Request('https://example.test/', {
          method: 'POST',
          body: 'x',
          headers: { 'content-type': 'text/foo' },
        });
        expect((await request.blob()).type).toBe('text/foo');
      });

      it('converts a number or boolean body to a string', async () => {
        const request = new Request('https://example.test/', { method: 'POST', body: 123 as any });
        expect(request.headers.get('content-type')).toBe('text/plain;charset=UTF-8');
        expect(await request.text()).toBe('123');
        const booleanRequest = new Request('https://example.test/', {
          method: 'POST',
          body: false as any,
        });
        expect(await booleanRequest.text()).toBe('false');
      });

      it('converts a Response-like body to a string', async () => {
        // Like React Native's `whatwg-fetch` Response, which has `arrayBuffer()` and `type`, but isn't
        // a Blob.
        const body = {
          type: 'default',
          arrayBuffer: async () => new ArrayBuffer(0),
          toString: () => '[object Response]',
        };
        const request = new Request('https://example.test/', { method: 'POST', body: body as any });
        expect(request.headers.get('content-type')).toBe('text/plain;charset=UTF-8');
        expect(await request.text()).toBe('[object Response]');
      });

      it('throws for a Symbol body', () => {
        expect(
          () => new Request('https://example.test/', { method: 'POST', body: Symbol('x') as any })
        ).toThrow(TypeError);
      });

      it('parses a urlencoded body with formData()', async () => {
        const request = new Request('https://example.test/', {
          method: 'POST',
          body: new URLSearchParams('a=1&b=2'),
        });
        const formData = await request.formData();
        expect(formData.get('a')).toBe('1');
        expect(formData.get('b')).toBe('2');
      });

      it('rejects formData() for a body that is not form data', async () => {
        const request = new Request('https://example.test/', { method: 'POST', body: 'a=1' });
        await expect(request.formData()).rejects.toThrow(TypeError);
        const badMime = new Request('https://example.test/', {
          method: 'POST',
          body: 'a=1',
          headers: { 'content-type': 'application/x-www-form-urlencoded-extra' },
        });
        await expect(badMime.formData()).rejects.toThrow(TypeError);
      });

      it('copies a URLSearchParams body at construction', async () => {
        const params = new URLSearchParams('a=1');
        const request = new Request('https://example.test/', { method: 'POST', body: params });
        params.set('a', '2');
        expect(await request.text()).toBe('a=1');
      });

      it('copies a byte body at construction', async () => {
        const bytes = new TextEncoder().encode('abc');
        const request = new Request('https://example.test/', { method: 'POST', body: bytes });
        bytes[0] = 'x'.charCodeAt(0);
        expect(await request.text()).toBe('abc');
      });

      it('returns a copy of a byte body from bytes()', async () => {
        const request = new Request('https://example.test/', {
          method: 'POST',
          body: new TextEncoder().encode('abc'),
        });
        const bytes = await request.bytes();
        bytes[0] = 'x'.charCodeAt(0);
        expect(new TextDecoder().decode(getRequestBodyInit(request) as Uint8Array)).toBe('abc');
      });

      it('copies a FormData body at construction', async () => {
        const formData = new FormData();
        formData.append('a', '1');
        const request = new Request('https://example.test/', { method: 'POST', body: formData });
        formData.append('b', '2');
        const read = await request.formData();
        expect(read.get('a')).toBe('1');
        expect(read.has('b')).toBe(false);
      });
    });
  });

  describe('FormData body', () => {
    const formData = () => {
      const form = new FormData();
      form.append('a', 'b');
      return form;
    };
    const boundaryOf = (request: Request) =>
      request.headers.get('content-type')?.match(/^multipart\/form-data; boundary=(.+)$/)?.[1];

    it('sets a multipart content-type with the boundary its body uses', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: formData() });
      const boundary = boundaryOf(request);
      expect(boundary).toBeTruthy();
      expect(await request.text()).toMatch(new RegExp(`^--${boundary}\r\n`));
    });

    it('uses the same boundary in the body stream', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: formData() });
      const boundary = boundaryOf(request);
      // The stream enqueues the whole serialized body as one chunk.
      const { value } = await request.body!.getReader().read();
      expect(new TextDecoder().decode(value)).toMatch(new RegExp(`^--${boundary}\r\n`));
    });

    it('keeps the boundary in a clone and in a request built from it', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: formData() });
      const boundary = boundaryOf(request);
      const clone = request.clone();
      const copy = new Request(request);
      expect(boundaryOf(clone)).toBe(boundary);
      expect(boundaryOf(copy)).toBe(boundary);
      expect(await clone.text()).toMatch(new RegExp(`^--${boundary}\r\n`));
      expect(await copy.text()).toMatch(new RegExp(`^--${boundary}\r\n`));
    });

    it('uses the boundary of an explicit multipart content-type', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: formData(),
        headers: { 'content-type': 'multipart/form-data; boundary=custom' },
      });
      expect(request.headers.get('content-type')).toBe('multipart/form-data; boundary=custom');
      expect(await request.text()).toMatch(/^--custom\r\n/);
    });

    it('keeps an explicit non-multipart content-type', () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: formData(),
        headers: { 'content-type': 'text/plain' },
      });
      expect(request.headers.get('content-type')).toBe('text/plain');
    });

    it('preserves the source boundary without adding Content-Type when init replaces headers', async () => {
      const original = new Request('https://example.test/', { method: 'POST', body: formData() });
      const boundary = boundaryOf(original);
      const copy = new Request(original, { headers: { 'X-Trace': '1' } });
      expect(copy.headers.get('content-type')).toBeNull();
      expect(await copy.text()).toMatch(new RegExp(`^--${boundary}\r\n`));
    });
  });

  // WebIDL: https://webidl.spec.whatwg.org/#es-interfaces
  describe('WebIDL shape', () => {
    it('has a constructor length of 1', () => {
      expect(Request.length).toBe(1);
    });

    it.each(['url', 'method', 'headers', 'body', 'bodyUsed', 'signal', 'keepalive'])(
      'exposes the %s attribute as an enumerable prototype getter',
      (name) => {
        const descriptor = Object.getOwnPropertyDescriptor(Request.prototype, name);
        expect(typeof descriptor?.get).toBe('function');
        expect(descriptor?.set).toBeUndefined();
        expect(descriptor?.enumerable).toBe(true);
      }
    );

    it.each(['clone', 'arrayBuffer', 'blob', 'bytes', 'formData', 'json', 'text'])(
      'exposes the %s operation as an enumerable prototype method',
      (name) => {
        const descriptor = Object.getOwnPropertyDescriptor(Request.prototype, name);
        expect(typeof descriptor?.value).toBe('function');
        expect(descriptor?.enumerable).toBe(true);
      }
    );

    it('does not expose internal fields on instances', () => {
      const formData = new FormData();
      formData.append('a', 'b');
      const request = new Request('https://example.test/', { method: 'POST', body: formData });
      expect('_formDataBoundary' in request).toBe(false);
      expect('_bodyInit' in request).toBe(false);
      expect(Object.getOwnPropertyNames(request)).toEqual([]);
    });
  });

  it('is tagged as a Request', () => {
    const request = new Request('https://example.test/');
    expect(Object.prototype.toString.call(request)).toBe('[object Request]');
  });
});
