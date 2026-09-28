/* oxlint-disable unicorn/no-invalid-fetch-options -- WPT constructs invalid requests on purpose */
// Based on tests in https://github.com/web-platform-tests/wpt/tree/master/fetch/api/request
//
// Ported to Jasmine. Relative URLs are replaced with absolute ones because native runtimes have no
// document base URL. Tests that need a server, a document, a worker, or `Response` are not ported.
// On web, `expo/fetch` exports the platform `Request`, so these tests also check the expectations
// against a browser's implementation.

import { Request } from 'expo/fetch';
import { Platform } from 'react-native';

import type { JasmineInterface } from '../types';

export const name = 'FetchRequest';

const URL = 'https://example.test/';

// Where the native `expo/fetch` Request knowingly deviates from the spec, to stay compatible with
// React Native's `whatwg-fetch` Request. These are skipped on native only.
const NATIVE_DEVIATIONS = new Set([
  // Invalid URLs are kept as-is instead of throwing.
  'Input URL is not valid',
  'Input URL has credentials',
  // Stream bodies don't require `duplex: 'half'`.
  'It is error to omit .duplex when the body is a ReadableStream.',
  // A FormData body gets its multipart Content-Type in `fetch()`, not at construction.
  'Default Content-Type for Request with FormData body',
  'Initialize Request\'s body with "[object FormData]", multipart/form-data',
]);

// Where browsers fail WPT. On web, these tests run against the browser's own `Request`, not ours.
// Checked with Chrome 140.
const WEB_DEVIATIONS = new Set([
  'Check isReloadNavigation attribute',
  "RequestInit's window is not null",
  'Input request used for creating new request became disturbed',
]);

// WPT expects the input request to be disturbed even when the init replaces its body, but the
// current spec creates a proxy for (and so disturbs) the input body only when the init body is
// null: https://fetch.spec.whatwg.org/#dom-request. undici follows the spec here.
const SPEC_CONFLICTS = new Set([
  'Input request used for creating new request became disturbed even if body is not used',
]);

export async function test({ describe, it, xit, expect }: JasmineInterface) {
  const isSkipped = (name: string) =>
    SPEC_CONFLICTS.has(name) ||
    (Platform.OS === 'web' ? WEB_DEVIATIONS : NATIVE_DEVIATIONS).has(name);
  const wptIt = (name: string, fn: () => void | Promise<void>) =>
    (isSkipped(name) ? xit : it)(name, fn);

  const expectThrows = (fn: () => unknown, errorType: new (...args: any[]) => Error) => {
    expect(fn).toThrowError(errorType);
  };

  const expectRejects = async (
    promise: Promise<unknown>,
    errorType: new (...args: any[]) => Error
  ) => {
    let error: unknown = null;
    try {
      await promise;
    } catch (e: unknown) {
      error = e;
    }
    expect(error instanceof errorType)
      .withContext(`expected a ${errorType.name}, got ${String(error)}`)
      .toBe(true);
  };

  // React Native's Blob has no `text()`, so read it through FileReader there.
  const readBlobText = (blob: Blob): Promise<string> => {
    if (typeof blob.text === 'function') {
      return blob.text();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(blob);
    });
  };

  const validateBufferFromString = (buffer: ArrayBuffer, expected: string) => {
    const bytes = new Uint8Array(buffer);
    expect(bytes.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(bytes[i]).toBe(expected.charCodeAt(i));
    }
  };

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/forbidden-method.any.js
  describe('forbidden methods', () => {
    for (const method of ['CONNECT', 'TRACE', 'TRACK', 'connect', 'trace', 'track']) {
      wptIt(`Request() with a forbidden method ${method} must throw.`, () => {
        expectThrows(() => new Request(URL, { method }), TypeError);
      });
    }
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-structure.any.js
  describe('structure', () => {
    const methods = ['clone', 'arrayBuffer', 'blob', 'formData', 'json', 'text'];
    const attributes: [string, unknown, unknown][] = [
      // [attribute, default value (undefined if not checked), value to try to set]
      ['method', 'GET', 'POST'],
      ['url', undefined, 'http://url.test'],
      ['destination', '', 'worker'],
      ['referrer', 'about:client', 'http://url.test'],
      ['referrerPolicy', '', 'unsafe-url'],
      ['mode', 'cors', 'navigate'],
      ['credentials', 'same-origin', 'cors'],
      ['cache', 'default', 'reload'],
      ['redirect', 'follow', 'manual'],
      ['integrity', undefined, 'CannotWriteIntegrity'],
      ['isReloadNavigation', false, true],
      ['isHistoryNavigation', false, true],
      ['duplex', 'half', 'full'],
      ['bodyUsed', false, true],
    ];

    for (const method of methods) {
      wptIt(`Request has ${method} method`, () => {
        expect(method in new Request(URL)).toBe(true);
      });
    }

    for (const [attribute, defaultValue, newValue] of attributes) {
      wptIt(`Check ${attribute} attribute`, () => {
        const request = new Request(URL) as any;
        expect(attribute in request).toBe(true);
        try {
          // Assigning to a read-only attribute throws in strict mode, which is fine.
          request[attribute] = newValue;
        } catch {}
        if (defaultValue === undefined) {
          expect(request[attribute]).not.toEqual(newValue);
        } else {
          expect(request[attribute]).toEqual(defaultValue);
        }
      });
    }

    wptIt('Check headers attribute', () => {
      const request = new Request(URL) as any;
      expect('headers' in request).toBe(true);
      try {
        request.headers = new Headers({ name: 'value' });
      } catch {}
      expect(request.headers.has('name')).toBe(false);
    });

    for (const attribute of ['priority', 'internalpriority', 'blocking']) {
      wptIt(`Request does not expose ${attribute} attribute`, () => {
        expect(attribute in new Request(URL)).toBe(false);
      });
    }
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-error.any.js
  describe('errors', () => {
    const badRequestArgTests: { args: [string, object?]; testName: string }[] = [
      { args: [URL, { window: 'http://test.url' }], testName: "RequestInit's window is not null" },
      { args: ['http://:not a valid URL'], testName: 'Input URL is not valid' },
      { args: ['http://user:pass@test.url'], testName: 'Input URL has credentials' },
      { args: [URL, { mode: 'navigate' }], testName: "RequestInit's mode is navigate" },
      {
        args: [URL, { referrer: 'http://:not a valid URL' }],
        testName: "RequestInit's referrer is invalid",
      },
      { args: [URL, { method: 'IN VALID' }], testName: "RequestInit's method is invalid" },
      { args: [URL, { method: 'TRACE' }], testName: "RequestInit's method is forbidden" },
      {
        args: [URL, { mode: 'no-cors', method: 'PUT' }],
        testName: "RequestInit's mode is no-cors and method is not simple",
      },
      {
        args: [URL, { mode: 'cors', cache: 'only-if-cached' }],
        testName: "RequestInit's cache mode is only-if-cached and mode is not same-origin",
      },
      {
        args: [URL, { cache: 'only-if-cached', mode: 'no-cors' }],
        testName: 'Request with cache mode: only-if-cached and fetch mode no-cors',
      },
      ...['referrerPolicy', 'mode', 'credentials', 'cache', 'redirect'].map(
        (option): { args: [string, object]; testName: string } => ({
          args: [URL, { [option]: 'BAD' }],
          testName: `Bad ${option} init parameter value`,
        })
      ),
    ];

    for (const { args, testName } of badRequestArgTests) {
      wptIt(testName, () => {
        expectThrows(() => new Request(...(args as [string, RequestInit])), TypeError);
      });
    }

    wptIt("Calling Request constructor without 'new' must throw", () => {
      expectThrows(() => (Request as any)('about:blank'), TypeError);
    });

    wptIt('Request should get its content-type from the init request', () => {
      const initialRequest = new Request(URL, {
        headers: new Headers([['Content-Type', 'potato']]),
      });
      const request = new Request(initialRequest);
      expect(request.headers.get('Content-Type')).toBe('potato');
    });

    wptIt(
      'Request should not get its content-type from the init request if init headers are provided',
      () => {
        const initialRequest = new Request(URL, {
          headers: new Headers([['Content-Type', 'potato']]),
        });
        const request = new Request(initialRequest, { headers: new Headers([]) });
        expect(request.headers.has('Content-Type')).toBe(false);
      }
    );

    wptIt('Request should get its content-type from the body if none is provided', () => {
      const initialRequest = new Request(URL, {
        headers: new Headers([['Content-Type-Extra', 'potato']]),
        body: 'this is my plate',
        method: 'POST',
      });
      const request = new Request(initialRequest);
      expect(request.headers.get('Content-Type')).toBe('text/plain;charset=UTF-8');
    });

    wptIt('Request should get its content-type from init headers if one is provided', () => {
      const initialRequest = new Request(URL, {
        headers: new Headers([['Content-Type', 'potato']]),
        body: 'this is my plate',
        method: 'POST',
      });
      const request = new Request(initialRequest);
      expect(request.headers.get('Content-Type')).toBe('potato');
    });

    wptIt('Request with cache mode: only-if-cached and fetch mode: same-origin', () => {
      // Must not throw.
      new Request(URL, { cache: 'only-if-cached', mode: 'same-origin' });
    });
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-init-002.any.js
  describe('init: headers and body', () => {
    wptIt('Initialize Request with headers values', () => {
      const headerDict: Record<string, string> = {
        name1: 'value1',
        name2: 'value2',
        name3: 'value3',
      };
      const request = new Request(URL, { headers: new Headers(headerDict) });
      for (const name in headerDict) {
        expect(request.headers.get(name)).toBe(headerDict[name]);
      }
    });

    // `label` is what WPT's test name interpolates the body as.
    const checkRequestInit = (
      label: string,
      getBody: () => any,
      bodyType: string | null | undefined,
      expectedTextBody: string
    ) => {
      const body = getBody();
      wptIt(`Initialize Request's body with "${label}", ${bodyType}`, async () => {
        const request = new Request(URL, { method: 'POST', body: getBody() });
        if (body) {
          expectThrows(() => new Request(URL, { method: 'GET', body: getBody() }), TypeError);
          expectThrows(() => new Request(URL, { method: 'HEAD', body: getBody() }), TypeError);
        } else {
          // Must not throw.
          new Request(URL, { method: 'GET', body: getBody() });
        }
        const mime = request.headers.get('Content-Type');
        expect(!body || (mime != null && mime.search(bodyType!) > -1))
          .withContext(`Content-Type should be "${bodyType}", not "${mime}"`)
          .toBe(true);
        const bodyAsText = await request.text();
        expect(bodyAsText.search(expectedTextBody) > -1).toBe(true);
      });
    };

    const formDataBody = () => {
      const formData = new FormData();
      formData.append('name', 'value');
      return formData;
    };

    checkRequestInit('undefined', () => undefined, undefined, '');
    checkRequestInit('null', () => null, null, '');
    checkRequestInit(
      '[object Blob]',
      () => new Blob(['This is a blob'], { type: 'application/octet-binary' }),
      'application/octet-binary',
      'This is a blob'
    );
    checkRequestInit(
      '[object FormData]',
      formDataBody,
      'multipart/form-data',
      'name="name"\r\n\r\nvalue'
    );
    checkRequestInit(
      'This is a USVString',
      () => 'This is a USVString',
      'text/plain;charset=UTF-8',
      'This is a USVString'
    );
    checkRequestInit('hi!', () => ({ toString: () => 'hi!' }), 'text/plain;charset=UTF-8', 'hi!');
    checkRequestInit(
      'name=value',
      () => new URLSearchParams('name=value'),
      'application/x-www-form-urlencoded;charset=UTF-8',
      'name=value'
    );
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-init-contenttype.any.js
  describe('init: default Content-Type', () => {
    const requestFromBody = (body: any, headers?: HeadersInit) =>
      new Request(URL, { method: 'POST', body, headers, duplex: 'half' } as RequestInit);
    const OVERRIDE_MIME = 'test/only; mime=type';

    const cases: [string, () => any, string | null][] = [
      ['empty body', () => undefined, null],
      ['Blob body (no type set)', () => new Blob([]), null],
      ['Blob body (empty type)', () => new Blob([], { type: '' }), null],
      ['Blob body (set type)', () => new Blob([], { type: 'a/b; c=d' }), 'a/b; c=d'],
      ['buffer source body', () => new Uint8Array(), null],
      [
        'URLSearchParams body',
        () => new URLSearchParams(),
        'application/x-www-form-urlencoded;charset=UTF-8',
      ],
      ['string body', () => '', 'text/plain;charset=UTF-8'],
      ['ReadableStream body', () => new ReadableStream(), null],
    ];

    for (const [description, getBody, expected] of cases) {
      wptIt(`Default Content-Type for Request with ${description}`, () => {
        expect(requestFromBody(getBody()).headers.get('Content-Type')).toBe(expected);
      });
    }

    wptIt('Default Content-Type for Request with FormData body', async () => {
      const formData = new FormData();
      formData.append('a', 'b');
      const request = requestFromBody(formData);
      const boundary = (await request.text()).split('\r\n')[0]!.slice(2);
      expect(request.headers.get('Content-Type')).toBe(`multipart/form-data; boundary=${boundary}`);
    });

    const overrideCases: [string, () => any][] = [
      ...cases.map(([description, getBody]): [string, () => any] => [description, getBody]),
      ['FormData body', () => new FormData()],
    ];
    for (const [description, getBody] of overrideCases) {
      wptIt(`Can override Content-Type for Request with ${description}`, () => {
        const request = requestFromBody(getBody(), { 'Content-Type': OVERRIDE_MIME });
        expect(request.headers.get('Content-Type')).toBe(OVERRIDE_MIME);
      });
    }
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-init-stream.any.js
  describe('init: stream body', () => {
    const method = 'POST';
    const duplex = 'half';
    const init = (body: any, extra: object = { duplex }) =>
      ({ method, body, ...extra }) as RequestInit;

    wptIt('Constructing a Request with a stream holds the original object.', () => {
      const body = new ReadableStream();
      expect(new Request(URL, init(body)).body).toBe(body);
    });

    wptIt('Constructing a Request with a stream on which getReader() is called', () => {
      const body = new ReadableStream();
      body.getReader();
      expectThrows(() => new Request(URL, init(body)), TypeError);
    });

    wptIt('Constructing a Request with a stream on which read() is called', () => {
      const body = new ReadableStream();
      body.getReader().read();
      expectThrows(() => new Request(URL, init(body)), TypeError);
    });

    wptIt(
      'Constructing a Request with a stream on which read() and releaseLock() are called',
      async () => {
        const body = new ReadableStream({ pull: (c) => c.enqueue(new Uint8Array()) });
        const reader = body.getReader();
        await reader.read();
        reader.releaseLock();
        expectThrows(() => new Request(URL, init(body)), TypeError);
      }
    );

    wptIt('Constructing a Request with a Request on which body.getReader() is called', () => {
      const request = new Request(URL, { method: 'POST', body: '...' });
      request.body!.getReader();
      expectThrows(() => new Request(request), TypeError);
      // This doesn't throw.
      new Request(request, { body: '...' });
    });

    wptIt(
      'Constructing a Request with a Request on which body.getReader().read() is called',
      () => {
        const request = new Request(URL, { method: 'POST', body: '...' });
        request.body!.getReader().read();
        expectThrows(() => new Request(request), TypeError);
        // This doesn't throw.
        new Request(request, { body: '...' });
      }
    );

    wptIt(
      'Constructing a Request with a Request on which read() and releaseLock() are called',
      async () => {
        const request = new Request(URL, { method: 'POST', body: '...' });
        const reader = request.body!.getReader();
        await reader.read();
        reader.releaseLock();
        expectThrows(() => new Request(request), TypeError);
        // This doesn't throw.
        new Request(request, { body: '...' });
      }
    );

    const bodies: [string, () => any][] = [
      ['null', () => null],
      ['a string', () => '...'],
      ['a Uint8Array', () => new Uint8Array(3)],
      ['a Blob', () => new Blob([])],
    ];
    for (const [description, getBody] of bodies) {
      wptIt(`It is OK to omit .duplex when the body is ${description}.`, () => {
        new Request(URL, init(getBody(), {}));
      });
    }

    wptIt('It is error to omit .duplex when the body is a ReadableStream.', () => {
      expectThrows(() => new Request(URL, init(new ReadableStream(), {})), TypeError);
    });

    for (const [description, getBody] of [
      ...bodies,
      ['a ReadableStream', () => new ReadableStream()] as [string, () => any],
    ]) {
      wptIt(`It is OK to set .duplex = 'half' when the body is ${description}.`, () => {
        new Request(URL, init(getBody()));
      });
      wptIt(`It is error to set .duplex = 'full' when the body is ${description}.`, () => {
        expectThrows(() => new Request(URL, init(getBody(), { duplex: 'full' })), TypeError);
      });
    }

    wptIt('It is OK to omit duplex when init.body is not given and input.body is given.', () => {
      const req1 = new Request(URL, init(new ReadableStream()));
      new Request(req1);
    });
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-consume.any.js
  describe('consume', () => {
    const checkRequestBody = (getBody: () => any, expected: string, bodyType: string) => {
      wptIt(`Consume ${bodyType} request's body as text`, async () => {
        const request = new Request(URL, {
          method: 'POST',
          body: getBody(),
          headers: [['Content-Type', 'text/PLAIN']],
        });
        expect(request.bodyUsed).toBe(false);
        expect(await request.text()).toBe(expected);
        expect(request.bodyUsed).toBe(true);
      });
      wptIt(`Consume ${bodyType} request's body as blob`, async () => {
        const request = new Request(URL, { method: 'POST', body: getBody() });
        expect(request.bodyUsed).toBe(false);
        const blob = await request.blob();
        expect(await readBlobText(blob)).toBe(expected);
        expect(request.bodyUsed).toBe(true);
      });
      wptIt(`Consume ${bodyType} request's body as arrayBuffer`, async () => {
        const request = new Request(URL, { method: 'POST', body: getBody() });
        expect(request.bodyUsed).toBe(false);
        validateBufferFromString(await request.arrayBuffer(), expected);
        expect(request.bodyUsed).toBe(true);
      });
      wptIt(`Consume ${bodyType} request's body as bytes`, async () => {
        const request = new Request(URL, { method: 'POST', body: getBody() });
        expect(request.bodyUsed).toBe(false);
        const bytes = await request.bytes();
        expect(bytes instanceof Uint8Array).toBe(true);
        validateBufferFromString(bytes.buffer as ArrayBuffer, expected);
        expect(request.bodyUsed).toBe(true);
      });
      wptIt(`Consume ${bodyType} request's body as JSON`, async () => {
        const request = new Request(URL, { method: 'POST', body: getBody() });
        expect(request.bodyUsed).toBe(false);
        expect(JSON.stringify(await request.json())).toBe(expected);
        expect(request.bodyUsed).toBe(true);
      });
    };

    const textData = JSON.stringify("This is response's body");
    const string = '"123456"';
    const getArrayBuffer = () => {
      const arrayBuffer = new ArrayBuffer(8);
      const int8Array = new Int8Array(arrayBuffer);
      for (let i = 0; i < 8; i++) {
        int8Array[i] = string.charCodeAt(i);
      }
      return arrayBuffer;
    };
    const getArrayBufferWithZeros = () => {
      const arrayBuffer = new ArrayBuffer(10);
      const int8Array = new Int8Array(arrayBuffer);
      for (let i = 0; i < 8; i++) {
        int8Array[i + 1] = string.charCodeAt(i);
      }
      return arrayBuffer;
    };

    checkRequestBody(() => textData, textData, 'String');
    checkRequestBody(getArrayBuffer, string, 'ArrayBuffer');
    checkRequestBody(() => new Uint8Array(getArrayBuffer()), string, 'Uint8Array');
    checkRequestBody(() => new Int8Array(getArrayBufferWithZeros(), 1, 8), string, 'Int8Array');
    checkRequestBody(() => new Float32Array(getArrayBuffer()), string, 'Float32Array');
    checkRequestBody(() => new DataView(getArrayBufferWithZeros(), 1, 8), string, 'DataView');

    wptIt("Consume FormData request's body as FormData", async () => {
      const formData = new FormData();
      formData.append('name', 'value');
      const request = new Request(URL, { method: 'POST', body: formData });
      expect(request.bodyUsed).toBe(false);
      expect((await request.formData()) instanceof FormData).toBe(true);
      expect(request.bodyUsed).toBe(true);
    });

    for (const value of ['null', '1', 'true', '"string"']) {
      wptIt(`Consume JSON from text: '${JSON.stringify(value)}'`, async () => {
        const request = new Request(URL, { method: 'POST', body: value });
        expect(await request.json()).toEqual(JSON.parse(value));
      });
    }

    for (const value of ['undefined', '{', 'a', '[']) {
      wptIt(`Trying to consume bad JSON text as JSON: '${value}'`, async () => {
        const request = new Request(URL, { method: 'POST', body: value });
        await expectRejects(request.json(), SyntaxError);
      });
    }
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-consume-empty.any.js
  describe('consume empty', () => {
    const checkRequestWithNoBody = (
      bodyType: string,
      check: (request: Request) => Promise<void>,
      headers: [string, string][] = []
    ) => {
      wptIt(`Consume request's body as ${bodyType}`, async () => {
        const request = new Request(URL, { method: 'POST', headers });
        expect(request.bodyUsed).toBe(false);
        await check(request);
      });
    };

    checkRequestWithNoBody('text', async (request) => {
      expect(await request.text()).toBe('');
      expect(request.bodyUsed).toBe(false);
    });
    checkRequestWithNoBody('blob', async (request) => {
      expect(await readBlobText(await request.blob())).toBe('');
      expect(request.bodyUsed).toBe(false);
    });
    checkRequestWithNoBody('arrayBuffer', async (request) => {
      expect((await request.arrayBuffer()).byteLength).toBe(0);
      expect(request.bodyUsed).toBe(false);
    });
    checkRequestWithNoBody('json (error case)', async (request) => {
      await expectRejects(request.json(), SyntaxError);
      expect(request.bodyUsed).toBe(false);
    });
    checkRequestWithNoBody(
      'formData with correct multipart type (error case)',
      async (request) => {
        await expectRejects(request.formData(), TypeError);
        expect(request.bodyUsed).toBe(false);
      },
      [['Content-Type', 'multipart/form-data; boundary="boundary"']]
    );
    checkRequestWithNoBody(
      'formData with correct urlencoded type',
      async (request) => {
        expect((await request.formData()) instanceof FormData).toBe(true);
        expect(request.bodyUsed).toBe(false);
      },
      [['Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8']]
    );
    checkRequestWithNoBody('formData without correct type (error case)', async (request) => {
      await expectRejects(request.formData(), TypeError);
      expect(request.bodyUsed).toBe(false);
    });

    const checkRequestWithEmptyBody = (bodyType: string, getBody: () => any, asText: boolean) => {
      wptIt(
        `Consume empty ${bodyType} request body as ${asText ? 'text' : 'arrayBuffer'}`,
        async () => {
          const request = new Request(URL, { method: 'POST', body: getBody() });
          expect(request.bodyUsed).toBe(false);
          if (asText) {
            expect((await request.text()).length).toBe(0);
          } else {
            expect((await request.arrayBuffer()).byteLength).toBe(0);
          }
          expect(request.bodyUsed).toBe(true);
        }
      );
    };

    checkRequestWithEmptyBody('blob', () => new Blob([], { type: 'text/plain' }), false);
    checkRequestWithEmptyBody('text', () => '', false);
    checkRequestWithEmptyBody('blob', () => new Blob([], { type: 'text/plain' }), true);
    checkRequestWithEmptyBody('text', () => '', true);
    checkRequestWithEmptyBody('URLSearchParams', () => new URLSearchParams(''), true);
    checkRequestWithEmptyBody('ArrayBuffer', () => new ArrayBuffer(0), true);
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-disturbed.any.js
  describe('disturbed', () => {
    const initValuesDict = { method: 'POST', body: "Request's body" };

    wptIt("Request's body: initial state", () => {
      const noBody = new Request(URL);
      const withBody = new Request(URL, initValuesDict);
      expect(noBody.body).toBeNull();
      expect(noBody.bodyUsed).toBe(false);
      expect(withBody.body).not.toBeNull();
      expect(withBody.body instanceof ReadableStream).toBe(true);
    });

    wptIt('Request without body cannot be disturbed', async () => {
      const noBody = new Request(URL);
      await noBody.blob();
      expect(noBody.bodyUsed).toBe(false);
      // Must not throw.
      noBody.clone();
    });

    const consumedRequest = async () => {
      const request = new Request(URL, initValuesDict);
      await request.blob();
      return request;
    };

    wptIt('Check cloning a disturbed request', async () => {
      const request = await consumedRequest();
      expect(request.bodyUsed).toBe(true);
      expectThrows(() => request.clone(), TypeError);
    });

    wptIt('Check creating a new request from a disturbed request', async () => {
      const request = await consumedRequest();
      expectThrows(() => new Request(request), TypeError);
    });

    wptIt('Check creating a new request with a new body from a disturbed request', async () => {
      const request = await consumedRequest();
      const originalBody = request.body;
      const bodyReplaced = new Request(request, { body: 'Replaced body' });
      expect(bodyReplaced.body).not.toBe(originalBody);
      expect(bodyReplaced.bodyUsed).toBe(false);
      expect(await bodyReplaced.text()).toBe('Replaced body');
    });

    wptIt('Input request used for creating new request became disturbed', async () => {
      const bodyRequest = new Request(URL, initValuesDict);
      const originalBody = bodyRequest.body;
      expect(bodyRequest.bodyUsed).toBe(false);
      const requestFromRequest = new Request(bodyRequest);
      expect(bodyRequest.bodyUsed).toBe(true);
      expect(bodyRequest.body).toBe(originalBody);
      expect(originalBody).not.toBeNull();
      expect(requestFromRequest.body).not.toBe(originalBody);
      expect(await requestFromRequest.text()).toBe("Request's body");
    });

    wptIt(
      'Input request used for creating new request became disturbed even if body is not used',
      async () => {
        const bodyRequest = new Request(URL, initValuesDict);
        const originalBody = bodyRequest.body;
        expect(bodyRequest.bodyUsed).toBe(false);
        const requestFromRequest = new Request(bodyRequest, { body: 'init body' });
        expect(bodyRequest.bodyUsed).toBe(true);
        expect(bodyRequest.body).toBe(originalBody);
        expect(requestFromRequest.body).not.toBe(originalBody);
        expect(await requestFromRequest.text()).toBe('init body');
      }
    );

    wptIt('Check consuming a disturbed request', async () => {
      const request = await consumedRequest();
      await expectRejects(request.blob(), TypeError);
    });

    wptIt('Request construction failure should not set "bodyUsed"', () => {
      const req = new Request(URL, { method: 'POST', body: 'hello' });
      expect(req.bodyUsed).toBe(false);
      expectThrows(() => new Request(req, { method: 'GET' }), TypeError);
      expect(req.bodyUsed).toBe(false);
      expectThrows(() => new Request(req, { method: 'CONNECT' }), TypeError);
      expect(req.bodyUsed).toBe(false);
      new Request(req);
      expect(req.bodyUsed).toBe(true);
    });
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-constructor-init-body-override.any.js
  describe('init body override', () => {
    wptIt(
      'Check that the body of a new request can be overridden when created from an existing Request object',
      async () => {
        const req1 = new Request(URL, { body: 'req1', method: 'POST' });
        expect(await req1.text()).toBe('req1');
        const req2 = new Request(req1, { body: 'req2' });
        expect(await req2.text()).toBe('req2');
      }
    );

    wptIt(
      'Check that the body of a new request can be duplicated from an existing Request object',
      async () => {
        const req1 = new Request(URL, { body: 'req1', method: 'POST' });
        const req2 = new Request(URL, req1 as unknown as RequestInit);
        expect(await req2.text()).toBe('req1');
      }
    );
  });

  // https://github.com/web-platform-tests/wpt/blob/master/fetch/api/request/request-clone-readable-stream-body.any.js
  describe('clone', () => {
    wptIt('new Request(clone) preserves a ReadableStream body that came from clone()', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('hello'));
          controller.close();
        },
      });
      const r1 = new Request(URL, {
        method: 'POST',
        body: stream,
        duplex: 'half',
      } as RequestInit);
      const r2 = r1.clone();
      expect(r2.bodyUsed).toBe(false);
      expect(r2.body).not.toBeNull();
      const r3 = new Request(r2);
      expect(r3.body).not.toBeNull();
      expect(await r3.text()).toBe('hello');
    });
  });
}
