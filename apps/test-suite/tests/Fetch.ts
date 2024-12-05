import { fetch } from 'expo/fetch';
import * as FS from 'expo-file-system';
import { Platform } from 'react-native';

export const name = 'Fetch';

export function test({ describe, expect, it, ...t }) {
  describe('Response types', () => {
    setupTestTimeout(t);

    it('should support redirect and contain basic properties', async () => {
      const resp = await fetch('https://httpbin.org/redirect-to?url=https://httpbin.org/get');
      expect(resp.status).toBe(200);
      expect(resp.url).toBe('https://httpbin.org/get');
      expect(resp.ok).toBe(true);
    });

    it('should process json', async () => {
      const resp = await fetch('https://httpbin.org/get');
      const json = await resp.json();
      expect(json.url).toBe('https://httpbin.org/get');
    });

    it('should process text', async () => {
      const resp = await fetch('https://httpbin.org/xml');
      const xml = await resp.text();
      expect(xml).toContain(`<?xml version='1.0'`);
    });

    it('should process arrayBuffer', async () => {
      const resp = await fetch('https://httpbin.org/bytes/20');
      const buffer = await resp.arrayBuffer();
      expect(buffer.byteLength).toBe(20);
    });
  });

  describe('Request body', () => {
    setupTestTimeout(t);

    it('should post with json', async () => {
      const resp = await fetch('https://httpbin.org/post', {
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
      const resp = await fetch('https://httpbin.org/post', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: 'foo=foo',
      });
      const json = await resp.json();
      expect(json.form).toEqual({ foo: 'foo' });
    });

    it('should post with FormData without files', async () => {
      const formData = new FormData();
      formData.append('foo', 'foo');
      const resp = await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: formData,
      });
      const json = await resp.json();
      expect(json.form).toEqual({ foo: 'foo' });
      expect(json.headers['Content-Type'].startsWith('multipart/form-data; boundary=')).toBe(true);
    });

    it('should post with blob in FormData', async () => {
      const formData = new FormData();
      formData.append('foo', 'foo');
      formData.append('file', new Blob(['file content'], { type: 'text/plain' }), 'file.txt');
      const resp = await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: formData,
      });
      const json = await resp.json();
      expect(json.form.foo).toEqual('foo');
      expect(json.files.file).toEqual('file content');
      expect(json.headers['Content-Type'].startsWith('multipart/form-data; boundary=')).toBe(true);
    });
  });

  describe('Headers', () => {
    setupTestTimeout(t);

    it('should process request and response headers', async () => {
      const resp = await fetch('https://httpbin.org/get', {
        headers: {
          'X-Test': 'test',
        },
      });
      expect(resp.headers.get('Content-Type')).toBe('application/json');
      const json = await resp.json();
      expect(json.headers['X-Test']).toBe('test');
    });
  });

  describe('Cookies', () => {
    setupTestTimeout(t);

    it('should include cookies when credentials are set to include', async () => {
      await fetch(
        'https://httpbin.org/response-headers?Set-Cookie=foo=bar;Path=/;SameSite=None;Secure',
        {
          credentials: 'include',
        }
      );
      const resp = await fetch('https://httpbin.org/cookies', {
        credentials: 'include',
      });
      const json = await resp.json();
      expect(json.cookies.foo).toBe('bar');
    });

    it('should not include cookies when credentials are set to omit', async () => {
      await fetch(
        'https://httpbin.org/response-headers?Set-Cookie=foo=bar;Path=/;SameSite=None;Secure',
        {
          credentials: 'include',
        }
      );
      const resp = await fetch('https://httpbin.org/cookies', {
        credentials: 'omit',
      });
      const json = await resp.json();
      expect(json.cookies).toEqual({});
    });
  });

  describe('Error handling', () => {
    setupTestTimeout(t);

    it('should process 404', async () => {
      const resp = await fetch('https://httpbin.org/status/404');
      expect(resp.status).toBe(404);
      expect(resp.ok).toBe(false);
    });

    it('should abort request', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 500);
      let error: Error | null = null;
      try {
        await fetch('https://httpbin.org/delay/3', {
          signal: controller.signal,
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e;
        }
      }
      expect(error).not.toBeNull();
    });
  });

  describe('Streaming', () => {
    setupTestTimeout(t);

    it('should stream response', async () => {
      const resp = await fetch('https://httpbin.org/drip?numbytes=512&duration=2', {
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
  });

  describe('Concurrent requests', () => {
    setupTestTimeout(t);

    it('should process multiple requests concurrently', async () => {
      const resps = await Promise.all([
        fetch('https://httpbin.org/get'),
        fetch('https://httpbin.org/post', {
          method: 'POST',
          body: 'test',
          headers: { 'Content-Type': 'text/plain' },
        }),
        fetch('https://httpbin.org/patch', {
          method: 'PATCH',
          body: 'test',
          headers: { 'Content-Type': 'text/plain' },
        }),
        fetch('https://httpbin.org/put', {
          method: 'PUT',
          body: 'test',
          headers: { 'Content-Type': 'text/plain' },
        }),
        fetch('https://httpbin.org/delete', { method: 'DELETE' }),
      ]);

      const jsons = await Promise.all(resps.map((resp) => resp.json()));
      expect(jsons.length).toBe(5);
      expect(jsons[0].url).toBe('https://httpbin.org/get');
      expect(jsons[1].url).toBe('https://httpbin.org/post');
      expect(jsons[2].url).toBe('https://httpbin.org/patch');
      expect(jsons[3].url).toBe('https://httpbin.org/put');
      expect(jsons[4].url).toBe('https://httpbin.org/delete');
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
    // Increase the timeout in general because httpbin.org can be slow.
    originalTimeout = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
    t.jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  t.afterAll(() => {
    t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
}
