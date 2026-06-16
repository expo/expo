/// <reference types="node" />

/** @jest-environment node */

import { Request } from '../Request';

globalThis.ReadableStream = require('node:stream/web').ReadableStream;
globalThis.TextDecoder = require('node:util').TextDecoder;
globalThis.TextEncoder = require('node:util').TextEncoder;

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
    expect(new Request('https://example.test/', { method: 'patch' }).method).toBe('PATCH');
  });

  it('throws when a body is given to a GET or HEAD request', () => {
    expect(() => new Request('https://example.test/', { body: 'x' })).toThrow(TypeError);
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

  it('preserves the original body for later retrieval', () => {
    const request = new Request('https://example.test/', { method: 'POST', body: 'payload' });
    // The fetch implementation needs the raw body without consuming the request.
    expect(request._bodyInit).toBe('payload');
    expect(request.bodyUsed).toBe(false);
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

    it('marks the body used once the stream is locked', () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      request.body!.getReader();
      expect(request.bodyUsed).toBe(true);
    });

    it('throws from another read method after the stream has been read', async () => {
      const request = new Request('https://example.test/', { method: 'POST', body: 'hello' });
      await readStream(request.body!);
      await expect(request.text()).rejects.toThrow(TypeError);
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
      expect(copy._bodyInit).toBe('payload');
    });

    it('marks the source request as used when its body is reused', () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: 'payload',
      });
      // Passing no body in the init reuses the source body, consuming it.
      const copy = new Request(original);
      expect(copy._bodyInit).toBe('payload');
      expect(original.bodyUsed).toBe(true);
    });

    it('throws when the source request body is already used', async () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: 'payload',
      });
      await original.text();
      expect(() => new Request(original)).toThrow(TypeError);
    });

    it('lets the init override the source body without consuming it', () => {
      const original = new Request('https://example.test/', {
        method: 'POST',
        body: 'original',
      });
      const copy = new Request(original, { body: 'override' });
      expect(copy._bodyInit).toBe('override');
      expect(original.bodyUsed).toBe(false);
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

    it('throws when cloning an already-used request', async () => {
      const request = new Request('https://example.test/', {
        method: 'POST',
        body: 'payload',
      });
      await request.text();
      expect(() => request.clone()).toThrow(TypeError);
    });
  });

  it('is tagged as a Request', () => {
    const request = new Request('https://example.test/');
    expect(Object.prototype.toString.call(request)).toBe('[object Request]');
  });
});
