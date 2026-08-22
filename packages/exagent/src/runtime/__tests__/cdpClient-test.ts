import { EventEmitter } from 'events';
import type WebSocketImpl from 'ws';

import {
  CdpClient,
  CdpRequestError,
  createDefaultTargetSelector,
  deriveInspectorOrigin,
  evaluateJsFromCdpAsync,
  isMethodNotFoundError,
  parseEvaluateResponse,
  RPC_METHOD_NOT_FOUND,
  type CdpTarget,
} from '../cdpClient';
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

  // The caller has to tell "this runtime has no evaluate handler" from "the evaluate failed", so
  // the JSON-RPC code rides on the error rather than being flattened into its message.
  it(`should carry the JSON-RPC code of a rejected request`, async () => {
    const client = createClient((request, socket) => {
      socket.emit(
        'message',
        JSON.stringify({
          id: request.id,
          error: { code: RPC_METHOD_NOT_FOUND, message: 'Runtime.evaluate' },
        })
      );
    });

    const error = await client.evaluateAsync('1').catch((e) => e);

    expect(error).toBeInstanceOf(CdpRequestError);
    expect(error.rpcCode).toBe(RPC_METHOD_NOT_FOUND);
    expect(isMethodNotFoundError(error)).toBe(true);
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

describe(evaluateJsFromCdpAsync, () => {
  it(`should reject with the JSON-RPC code the runtime answered`, async () => {
    const error = await evaluateJsFromCdpAsync('ws://debugger', '1', 2000, {
      createWebSocket: (url) =>
        new MockWebSocket(url, (request, socket) => {
          socket.emit(
            'message',
            JSON.stringify({
              id: request.id,
              error: { code: RPC_METHOD_NOT_FOUND, message: 'Runtime.evaluate' },
            })
          );
        }) as unknown as WebSocketImpl,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(CdpRequestError);
    expect(error.rpcCode).toBe(RPC_METHOD_NOT_FOUND);
  });

  it(`should reject without a JSON-RPC code when the transport fails`, async () => {
    const error = await evaluateJsFromCdpAsync('ws://debugger', '1', 2000, {
      createWebSocket: () => new FailingWebSocket() as unknown as WebSocketImpl,
    }).catch((e) => e);

    expect(isMethodNotFoundError(error)).toBe(false);
  });
});

/** A socket that never connects, to exercise the transport-failure path. */
class FailingWebSocket extends EventEmitter {
  constructor() {
    super();
    process.nextTick(() => this.emit('error', new Error('connect ECONNREFUSED 127.0.0.1:8081')));
  }
  send() {}
  close() {}
}

type ProbeBehavior =
  /** The runtime answered; a string value means it asks to be hidden from the inspector. */
  | { kind: 'answers'; hidden?: boolean }
  /** The runtime answered the request with a JSON-RPC error. */
  | { kind: 'rpcError'; code: number }
  /** The debugger connection never opened. */
  | { kind: 'transportError' };

function target(overrides: Partial<CdpTarget>): CdpTarget {
  return {
    ...TARGET,
    reactNative: { logicalDeviceId: 'device', capabilities: { nativePageReloads: true } },
    ...overrides,
  } as CdpTarget;
}

/** A default selector whose probe answers per debugger URL, so no dev server is needed. */
function selectorWithProbes(behaviors: Record<string, ProbeBehavior>) {
  return createDefaultTargetSelector({
    createWebSocket: (url) => {
      const behavior = behaviors[url];
      if (behavior?.kind === 'transportError') {
        return new FailingWebSocket() as unknown as WebSocketImpl;
      }
      return new MockWebSocket(url, (request, socket) => {
        if (behavior?.kind === 'rpcError') {
          socket.emit(
            'message',
            JSON.stringify({ id: request.id, error: { code: behavior.code, message: 'x' } })
          );
          return;
        }
        socket.emit(
          'message',
          JSON.stringify({
            id: request.id,
            result: {
              result:
                behavior?.kind === 'answers' && behavior.hidden
                  ? { type: 'string', value: 'true' }
                  : { type: 'undefined' },
            },
          })
        );
      }) as unknown as WebSocketImpl;
    },
  });
}

describe(createDefaultTargetSelector, () => {
  it(`should pick the first target that answers and does not ask to be hidden`, async () => {
    const first = target({ webSocketDebuggerUrl: 'ws://a' });
    const second = target({ webSocketDebuggerUrl: 'ws://b' });
    const selector = selectorWithProbes({
      'ws://a': { kind: 'answers' },
      'ws://b': { kind: 'answers' },
    });

    await expect(selector([first, second])).resolves.toBe(first);
  });

  it(`should skip a target that asks to be hidden from the inspector`, async () => {
    const hidden = target({ webSocketDebuggerUrl: 'ws://hidden' });
    const app = target({ webSocketDebuggerUrl: 'ws://app' });
    const selector = selectorWithProbes({
      'ws://hidden': { kind: 'answers', hidden: true },
      'ws://app': { kind: 'answers' },
    });

    await expect(selector([hidden, app])).resolves.toBe(app);
  });

  it(`should skip a target that does not reload natively`, async () => {
    const stale = target({
      webSocketDebuggerUrl: 'ws://stale',
      reactNative: { logicalDeviceId: 'device', capabilities: { nativePageReloads: false } },
    });
    const app = target({ webSocketDebuggerUrl: 'ws://app' });
    const selector = selectorWithProbes({ 'ws://app': { kind: 'answers' } });

    await expect(selector([stale, app])).resolves.toBe(app);
  });

  it(`should skip a target whose debugger connection fails`, async () => {
    const gone = target({ webSocketDebuggerUrl: 'ws://gone' });
    const app = target({ webSocketDebuggerUrl: 'ws://app' });
    const selector = selectorWithProbes({
      'ws://gone': { kind: 'transportError' },
      'ws://app': { kind: 'answers' },
    });

    await expect(selector([gone, app])).resolves.toBe(app);
  });

  // Expo Go on Android answers `Runtime.evaluate` with -32601, so the probe cannot say whether the
  // target asks to be hidden. "Cannot determine" must not read as "exclude": that made every
  // runtime command report "No target found" on Android, including the ones that never evaluate.
  it(`should keep a target whose runtime has no evaluate handler, behind one that answered`, async () => {
    const android = target({ webSocketDebuggerUrl: 'ws://android', deviceName: 'sdk_gphone64' });
    const ios = target({ webSocketDebuggerUrl: 'ws://ios', deviceName: 'iPhone' });
    const selector = selectorWithProbes({
      'ws://android': { kind: 'rpcError', code: RPC_METHOD_NOT_FOUND },
      'ws://ios': { kind: 'answers' },
    });

    // Android is listed first, but a target that answered the probe is the safer answer: it is the
    // only one `runtime eval` can drive.
    await expect(selector([android, ios])).resolves.toBe(ios);
  });

  it(`should fall back to a target whose runtime has no evaluate handler`, async () => {
    const android = target({ webSocketDebuggerUrl: 'ws://android' });
    const selector = selectorWithProbes({
      'ws://android': { kind: 'rpcError', code: RPC_METHOD_NOT_FOUND },
    });

    await expect(selector([android])).resolves.toBe(android);
  });

  // Any other JSON-RPC error is a runtime that answered and refused, which is not the same as one
  // that has no handler: it stays excluded.
  it(`should skip a target that refuses the probe with another error`, async () => {
    const refusing = target({ webSocketDebuggerUrl: 'ws://refusing' });
    const selector = selectorWithProbes({ 'ws://refusing': { kind: 'rpcError', code: -32000 } });

    await expect(selector([refusing])).resolves.toBeNull();
  });

  it(`should return null when every target is skipped`, async () => {
    const hidden = target({ webSocketDebuggerUrl: 'ws://hidden' });
    const selector = selectorWithProbes({ 'ws://hidden': { kind: 'answers', hidden: true } });

    await expect(selector([hidden])).resolves.toBeNull();
    await expect(selector([])).resolves.toBeNull();
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
