import { fetch } from 'expo/fetch';
import * as FS from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export const name = 'Fetch';

export function test({ describe, expect, it, ...t }) {
  describe('Response types', () => {
    setupTestTimeout(t);

    it('should support redirect and contain basic properties', async () => {
      const resp = await fetch('https://httpbin.io/redirect-to?url=https://httpbin.io/get');
      expect(resp.status).toBe(200);
      expect(resp.url).toBe('https://httpbin.io/get');
      expect(resp.ok).toBe(true);
    });

    it('should process json', async () => {
      const resp = await fetch('https://httpbin.io/get');
      const json = await resp.json();
      expect(json.url).toMatch(/^https?:\/\/httpbin.io\/get$/);
    });

    it('should process text', async () => {
      const resp = await fetch('https://httpbin.io/xml');
      const xml = await resp.text();
      expect(xml).toContain(`<?xml version='1.0'`);
    });

    it('should process arrayBuffer', async () => {
      const resp = await fetch('https://httpbin.io/bytes/20');
      const buffer = await resp.arrayBuffer();
      expect(buffer.byteLength).toBe(20);
    });

    it('should process response in readablestream from late get reader call', async () => {
      const resp = await fetch('https://httpbin.io/get');
      expect(resp.ok).toBe(true);
      expect(resp.body).not.toBeNull();

      // Delay 0.5s to ensure the response is completed before streaming started
      await delayAsync(500);

      const chunks = [];
      const reader = resp.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
      }
      const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }

      const text = new TextDecoder().decode(buffer);
      expect(text).not.toBe('');
      const json = JSON.parse(text);
      expect(json.url).toMatch(/^https?:\/\/httpbin\.io\/get$/);
    });
  });

  describe('Redirect handling', () => {
    setupTestTimeout(t);

    it('should follow redirects by default', async () => {
      const resp = await fetch('https://httpbin.io/redirect-to?url=https://httpbin.io/get');
      expect(resp.status).toBe(200);
      expect(resp.url).toBe('https://httpbin.io/get');
      const json = await resp.json();
      expect(json.url).toMatch(/^http?:\/\/httpbin\.io\/get$/);
    });

    it('should follow redirects when redirect is set to follow', async () => {
      const resp = await fetch('https://httpbin.io/redirect-to?url=https://httpbin.io/get', {
        redirect: 'follow',
      });
      expect(resp.status).toBe(200);
      expect(resp.url).toBe('https://httpbin.io/get');
      const json = await resp.json();
      expect(json.url).toMatch(/^http?:\/\/httpbin\.io\/get$/);
    });

    it('should throw an error when redirect is set to error and a redirect occurs', async () => {
      let error: Error | null = null;
      try {
        await fetch('https://httpbin.io/redirect-to?url=https://httpbin.io/get', {
          redirect: 'error',
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e;
        }
      }
      expect(error).not.toBeNull();
      expect(error?.message).toContain('redirect');
    });

    it('should not follow redirects when redirect is set to manual', async () => {
      const resp = await fetch('https://httpbin.io/redirect-to?url=https://httpbin.io/get', {
        redirect: 'manual',
      });
      // When redirect is manual, the response should be the redirect response itself
      expect(resp.status).toBeGreaterThanOrEqual(300);
      expect(resp.status).toBeLessThan(400);
      expect(resp.headers.get('location')).toBe('https://httpbin.io/get');
    });

    it('should handle multiple redirects with follow mode', async () => {
      const resp = await fetch('https://httpbin.io/redirect/3', {
        redirect: 'follow',
      });
      expect(resp.status).toBe(200);
      expect(resp.url).toBe('https://httpbin.io/get');
    });

    it('should throw error on multiple redirects with error mode', async () => {
      let error: Error | null = null;
      try {
        await fetch('https://httpbin.io/redirect/3', {
          redirect: 'error',
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e;
        }
      }
      expect(error).not.toBeNull();
    });

    it('should not throw error when no redirect occurs with error mode', async () => {
      const resp = await fetch('https://httpbin.io/get', {
        redirect: 'error',
      });
      expect(resp.status).toBe(200);
      expect(resp.ok).toBe(true);
    });
  });

  describe('Request body', () => {
    setupTestTimeout(t);

    it('should post with json', async () => {
      const resp = await fetch('https://httpbin.io/post', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ foo: 'foo' }),
      });
      const json = await resp.json();
      expect(json.json).toEqual({ foo: 'foo' });
    });

    it('should post with x-www-form-urlencoded', async () => {
      const resp = await fetch('https://httpbin.io/post', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: 'foo=foo',
      });
      const json = await resp.json();
      expect(json.form).toEqual({ foo: ['foo'] });
    });

    it('should post with FormData without files', async () => {
      const formData = new FormData();
      formData.append('foo', 'foo');
      const resp = await fetch('https://httpbin.io/post', {
        method: 'POST',
        body: formData,
      });
      const json = await resp.json();
      expect(json.form).toEqual({ foo: ['foo'] });
      expect(json.headers['Content-Type'][0].startsWith('multipart/form-data; boundary=')).toBe(
        true
      );
    });

    it('should post with blob in FormData', async () => {
      const formData = new FormData();
      formData.append('foo', 'foo');
      formData.append('file', new Blob(['file content'], { type: 'text/plain' }), 'file.txt');
      const resp = await fetch('https://httpbin.io/post', {
        method: 'POST',
        body: formData,
      });
      const json = await resp.json();
      expect(json.form.foo).toEqual(['foo']);
      expect(json.files.file).toEqual(['file content']);
      expect(json.headers['Content-Type'][0].startsWith('multipart/form-data; boundary=')).toBe(
        true
      );
    });
  });

  describe('Headers', () => {
    setupTestTimeout(t);

    it('should process request and response headers', async () => {
      const resp = await fetch('https://httpbin.io/get', {
        headers: {
          'X-Test': 'test',
        },
      });
      expect(resp.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
      const json = await resp.json();
      expect(json.headers['X-Test'][0]).toBe('test');
    });
  });

  describe('Cookies', () => {
    setupTestTimeout(t);

    it('should include cookies when credentials are set to include', async () => {
      const resp = await fetch('https://httpbin.io/cookies/set?foo=bar', {
        credentials: 'include',
      });
      const json = await resp.json();
      console.log(json);
      expect(json.foo).toBe('bar');
    });

    it('should not include cookies when credentials are set to omit', async () => {
      const resp = await fetch('https://httpbin.io/cookies/set?foo=bar', {
        credentials: 'omit',
      });
      const json = await resp.json();
      expect(json).toEqual({});
    });
  });

  describe('Error handling', () => {
    setupTestTimeout(t);

    it('should process 404', async () => {
      const resp = await fetch('https://httpbin.io/status/404');
      expect(resp.status).toBe(404);
      expect(resp.ok).toBe(false);
    });

    it('should abort request', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 500);
      let error: Error | null = null;
      try {
        await fetch('https://httpbin.io/delay/3', {
          signal: controller.signal,
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e;
        }
      }
      expect(error).not.toBeNull();
    });

    it('should abort streaming request', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      let error: Error | null = null;
      let hasReceivedChunk = false;
      try {
        const resp = await fetch('https://httpbin.io/drip?numbytes=512&duration=8', {
          signal: controller.signal,
          headers: {
            Accept: 'text/event-stream',
          },
        });
        const reader = resp.body.getReader();
        while (true) {
          const { done } = await reader.read();
          hasReceivedChunk = true;
          if (done) {
            break;
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e;
        }
      }
      expect(error).not.toBeNull();
      expect(hasReceivedChunk).toBe(true);
    });

    // Same as the previous test but abort at 0ms,
    // that to ensure the request is aborted before receiving any chunks.
    it('should abort streaming request before receiving chunks', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 0);
      let error: Error | null = null;
      let hasReceivedChunk = false;
      try {
        const resp = await fetch('https://httpbin.io/drip?numbytes=512&duration=2', {
          signal: controller.signal,
          headers: {
            Accept: 'text/event-stream',
          },
        });
        const reader = resp.body.getReader();
        while (true) {
          const { done } = await reader.read();
          hasReceivedChunk = true;
          if (done) {
            break;
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e;
        }
      }
      expect(error).not.toBeNull();
      expect(error.message).toContain('Fetch request has been canceled');
      expect(hasReceivedChunk).toBe(false);
    });
  });

  describe('Streaming', () => {
    setupTestTimeout(t);

    it('should stream response', async () => {
      const resp = await fetch('https://httpbin.io/drip?numbytes=512&duration=2', {
        headers: {
          Accept: 'text/event-stream',
        },
      });
      const reader = resp.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
      }
      expect(chunks.length).toBeGreaterThan(3);
      const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      expect(buffer.length).toBe(512);
    });

    it('should complete stream response async iterator', async () => {
      const resp = await fetch('https://httpbin.io/drip?numbytes=512&duration=2', {
        headers: {
          Accept: 'text/event-stream',
        },
      });

      expect(resp.body[Symbol.asyncIterator]).not.toBeNull();

      const chunks = [];
      for await (const chunk of resp.body) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(3);
      const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      expect(buffer.length).toBe(512);
    });

    it('should break stream response async iterator', async () => {
      const resp = await fetch('https://httpbin.io/drip?numbytes=512&duration=2', {
        headers: {
          Accept: 'text/event-stream',
        },
      });

      expect(resp.body[Symbol.asyncIterator]).not.toBeNull();

      const chunks = [];
      for await (const chunk of resp.body) {
        chunks.push(chunk);
        if (chunks.length === 2) {
          break;
        }
      }
      expect(chunks.length).toBe(2);
    });
  });

  describe('Concurrent requests', () => {
    setupTestTimeout(t);

    it('should process multiple requests concurrently', async () => {
      const resps = await Promise.all([
        fetch('https://httpbin.io/get'),
        fetch('https://httpbin.io/post', {
          method: 'POST',
          body: 'test',
          headers: { 'Content-Type': 'text/plain' },
        }),
        fetch('https://httpbin.io/patch', {
          method: 'PATCH',
          body: 'test',
          headers: { 'Content-Type': 'text/plain' },
        }),
        fetch('https://httpbin.io/put', {
          method: 'PUT',
          body: 'test',
          headers: { 'Content-Type': 'text/plain' },
        }),
        fetch('https://httpbin.io/delete', { method: 'DELETE' }),
      ]);

      const jsons = await Promise.all(resps.map((resp) => resp.json()));
      expect(jsons.length).toBe(5);
      expect(jsons[0].url).toMatch(/^https?:\/\/httpbin.io\/get$/);
      expect(jsons[1].url).toMatch(/^https?:\/\/httpbin.io\/post$/);
      expect(jsons[2].url).toMatch(/^https?:\/\/httpbin.io\/patch$/);
      expect(jsons[3].url).toMatch(/^https?:\/\/httpbin.io\/put$/);
      expect(jsons[4].url).toMatch(/^https?:\/\/httpbin.io\/delete$/);
    });
  });

  addLocalFileTestSuite({ describe, expect, it, ...t });
}

function addLocalFileTestSuite({ describe, expect, it, ...t }) {
  if (Platform.OS === 'web') {
    return;
  }

  const itIos = Platform.OS === 'ios' ? it : t.xit;
  const itAndroid = Platform.OS === 'android' ? it : t.xit;

  describe('Local file', () => {
    it('should fetch a text file in document directory', async () => {
      const outputFile = FS.documentDirectory + 'file.txt';
      await FS.writeAsStringAsync(outputFile, 'Hello world');

      const resp = await fetch(`file://${outputFile}`);
      expect(resp.status).toBe(200);
      expect(resp.ok).toBe(true);

      const text = await resp.text();
      expect(text).toBe('Hello world');
      await FS.deleteAsync(outputFile);
    });

    it('should return 404 when local file not found', async () => {
      const resp = await fetch(`file:///notfound.txt`);
      expect(resp.status).toBe(404);
      expect(resp.ok).toBe(false);
    });

    it('should throw an error when permission is denied', async () => {
      let error = null;
      const deniedFile = Platform.OS === 'ios' ? '/etc/master.passwd' : '/data/system/packages.xml';
      try {
        await fetch(`file://${deniedFile}`);
      } catch (e) {
        error = e;
      }
      expect(error).not.toBeNull();
    });

    itIos('should fetch ios app info.plist as binary', async () => {
      const file = FS.bundleDirectory + 'Info.plist';
      const resp = await fetch(`file://${file}`);
      expect(resp.status).toBe(200);
      expect(resp.ok).toBe(true);

      const buffer = await resp.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);

      // Check if the file is a binary plist with the prefix "bplist"
      const prefixBuffer = buffer.slice(0, 6);
      const array = new Uint8Array(prefixBuffer);
      expect(array).toEqual(new Uint8Array([0x62, 0x70, 0x6c, 0x69, 0x73, 0x74]));
    });

    itAndroid('should fetch asset data using file:///android_asset/', async () => {
      const resp = await fetch('file:///android_asset/app.config');
      expect(resp.status).toBe(200);
      expect(resp.ok).toBe(true);
      const config = await resp.json();
      expect(config.name.length).toBeGreaterThan(0);
    });

    itAndroid(
      'should return 404 for not found asset using file:///android_asset/notfound',
      async () => {
        const resp = await fetch(`file:///android_asset/notfound`);
        expect(resp.status).toBe(404);
        expect(resp.ok).toBe(false);
      }
    );
  });
}

function setupTestTimeout(t: Record<string, any>, timeout: number = 30000) {
  let originalTimeout;

  t.beforeAll(() => {
    // Increase the timeout in general because httpbin.test.k6.io can be slow.
    originalTimeout = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
    t.jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  t.afterAll(() => {
    t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
}

function delayAsync(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
