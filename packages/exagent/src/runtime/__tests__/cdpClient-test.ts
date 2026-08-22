import type WebSocketImpl from 'ws';

import { CdpClient, deriveInspectorOrigin, parseEvaluateResponse } from '../cdpClient';
import { MockWebSocket } from './MockWebSocket';

const TARGET = {
  id: '1',
  appId: 'app',
  deviceName: 'device',
  description: '',
  type: 'native',
  title: 'title',
  devtoolsFrontendUrl: '/devtools',
  webSocketDebuggerUrl: 'ws://debugger',
};

function createClient(responder: (request: any, socket: MockWebSocket) => void): CdpClient {
  return new CdpClient({
    metroUrl: 'http://localhost:8081',
    targetSelector: async () => TARGET,
    createWebSocket: (url) => new MockWebSocket(url, responder) as unknown as WebSocketImpl,
  });
}

describe('CdpClient.evaluateAsync', () => {
  let originalFetch: typeof fetch | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => [TARGET],
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
  });

  it(`should send Runtime.evaluate with returnByValue and awaitPromise`, async () => {
    const requests: any[] = [];
    const client = createClient((request, socket) => {
      requests.push(request);
      socket.emit(
        'message',
        JSON.stringify({
          id: request.id,
          result: { result: { type: 'number', value: 42 } },
        })
      );
    });

    const result = await client.evaluateAsync('1 + 41', { awaitPromise: false });

    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe('Runtime.evaluate');
    expect(requests[0].params).toMatchObject({
      expression: '1 + 41',
      awaitPromise: false,
      returnByValue: true,
    });
    expect(result).toEqual({ value: 42, type: 'number', description: undefined });
  });

  it(`should resolve object values by value`, async () => {
    const client = createClient((request, socket) => {
      socket.emit(
        'message',
        JSON.stringify({
          id: request.id,
          result: { result: { type: 'object', value: { user: { id: 7 } } } },
        })
      );
    });

    const result = await client.evaluateAsync('({ user: { id: 7 } })');
    expect(result.value).toEqual({ user: { id: 7 } });
    expect(result.exceptionText).toBeUndefined();
  });

  it(`should report exceptions thrown by the expression`, async () => {
    const client = createClient((request, socket) => {
      socket.emit(
        'message',
        JSON.stringify({
          id: request.id,
          result: {
            result: { type: 'object', subtype: 'error' },
            exceptionDetails: {
              exceptionId: 1,
              text: 'Uncaught',
              lineNumber: 11,
              columnNumber: 4,
              url: 'http://localhost:8081/index.bundle',
              exception: {
                type: 'object',
                className: 'TypeError',
                description: 'TypeError: boom\n    at foo (index.js:1:1)',
              },
              stackTrace: {
                callFrames: [
                  {
                    functionName: 'foo',
                    scriptId: '1',
                    url: 'http://localhost:8081/index.bundle',
                    lineNumber: 11,
                    columnNumber: 4,
                  },
                ],
              },
            },
          },
        })
      );
    });

    const result = await client.evaluateAsync('foo()');

    expect(result.value).toBeUndefined();
    expect(result.exceptionText).toBe('TypeError: boom (http://localhost:8081/index.bundle:12:5)');
    expect(result.exceptionStack).toBe('  at foo (http://localhost:8081/index.bundle:12:5)');
  });

  it(`should reject when the app does not answer in time`, async () => {
    const client = createClient(() => {
      // Never answer, to exercise the timeout path.
    });

    await expect(client.evaluateAsync('1', { timeoutMs: 20 })).rejects.toThrow(
      /did not answer the evaluate request within 20ms/
    );
  });

  it(`should reject when the app rejects the request`, async () => {
    const client = createClient((request, socket) => {
      socket.emit(
        'message',
        JSON.stringify({
          id: request.id,
          error: { code: -32000, message: 'Runtime agent is not enabled' },
        })
      );
    });

    await expect(client.evaluateAsync('1')).rejects.toThrow(/Runtime agent is not enabled/);
  });

  it(`should reject when the connection closes before an answer`, async () => {
    const client = createClient((_request, socket) => {
      socket.close();
    });

    await expect(client.evaluateAsync('1')).rejects.toThrow(/connection closed before/);
  });

  it(`should ignore messages for other request ids`, async () => {
    const client = createClient((request, socket) => {
      socket.emit('message', JSON.stringify({ method: 'Runtime.consoleAPICalled', params: {} }));
      socket.emit('message', JSON.stringify({ id: 999, result: { result: { value: 'other' } } }));
      socket.emit(
        'message',
        JSON.stringify({ id: request.id, result: { result: { type: 'string', value: 'mine' } } })
      );
    });

    const result = await client.evaluateAsync('"mine"');
    expect(result.value).toBe('mine');
  });

  it(`should reject when the dev server does not answer the target list`, async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      statusText: 'Not Found',
      json: async () => [],
    })) as unknown as typeof fetch;

    const client = new CdpClient({ metroUrl: 'http://localhost:8081' });
    await expect(client.evaluateAsync('1')).rejects.toThrow(/Failed to fetch debugger targets/);
  });

  it(`should reject when no target matches`, async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => [],
    })) as unknown as typeof fetch;

    const client = new CdpClient({ metroUrl: 'http://localhost:8081' });
    await expect(client.evaluateAsync('1')).rejects.toThrow(/No target found/);
  });
});

describe(parseEvaluateResponse, () => {
  it(`should describe values the runtime cannot serialize`, () => {
    const result = parseEvaluateResponse({
      result: { type: 'function', className: 'Function', description: 'function foo() {}' },
    } as any);

    expect(result).toEqual({
      value: undefined,
      type: 'function',
      description: 'function foo() {}',
    });
  });

  it(`should fall back to the exception text when there is no description`, () => {
    const result = parseEvaluateResponse({
      result: { type: 'object' },
      exceptionDetails: {
        exceptionId: 1,
        text: 'Uncaught',
        lineNumber: 0,
        columnNumber: 0,
        exception: { type: 'string', value: 'plain throw' },
      },
    } as any);

    expect(result.exceptionText).toBe('plain throw');
  });

  it(`should treat a missing response as undefined`, () => {
    expect(parseEvaluateResponse(undefined)).toEqual({ type: 'undefined' });
  });
});

// Metro's inspector proxy answers 401 to WebSocket handshakes without a same-origin
// `Origin` header (observed live against SDK 57 / Expo Go, 2026-08-22). Every default
// connection path must therefore present the dev server's own origin.
describe(deriveInspectorOrigin, () => {
  it(`should derive an http origin from a ws debugger url`, () => {
    expect(deriveInspectorOrigin('ws://127.0.0.1:8081/inspector/debug?device=abc&page=1')).toBe(
      'http://127.0.0.1:8081'
    );
  });

  it(`should derive an https origin from a wss debugger url`, () => {
    expect(deriveInspectorOrigin('wss://tunnel.example.dev/inspector/debug?page=2')).toBe(
      'https://tunnel.example.dev'
    );
  });

  it(`should keep a non-default port in the origin`, () => {
    expect(deriveInspectorOrigin('ws://localhost:19000/inspector/debug')).toBe(
      'http://localhost:19000'
    );
  });
});
