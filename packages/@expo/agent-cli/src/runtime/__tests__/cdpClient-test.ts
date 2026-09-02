import { EventEmitter } from 'events';
import type WebSocketImpl from 'ws';

import {
  CdpClient,
  CdpPromisePendingError,
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
import LIVE from './fixtures/live-promise-frames.json';

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

  // The expression the app runs carries the caller's verbatim, inside the wrapper that detects a
  // thenable in the app; a value that is not one comes back in exactly one round trip, unchanged.
  it(`should send one Runtime.evaluate carrying the caller's expression`, async () => {
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
    expect(requests[0].params.expression).toContain('1 + 41');
    expect(requests[0].params).toMatchObject({ returnByValue: true });
    expect(result).toEqual({
      value: 42,
      type: 'number',
      description: undefined,
      promise: undefined,
    });
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
      /did not answer the Runtime.evaluate request within 20ms/
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

  // @ref llp/0005-runtime-loop-tools.rfc.md §What proves a reload — friction run 4, F39.
  // The target a reloading app leaves listed cannot be connected to, so the selector skips it and
  // answers null. Re-reading the list is what finds the runtime that replaced it.
  it(`should re-read the target list while targetRetryMs runs`, async () => {
    let reconnected = false;
    setTimeout(() => (reconnected = true), 60);
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => (reconnected ? [TARGET] : []),
    })) as unknown as typeof fetch;

    const client = new CdpClient({
      metroUrl: 'http://localhost:8081',
      targetSelector: async (targets) => targets[0] ?? null,
      createWebSocket: (url) =>
        new MockWebSocket(url, (request, socket) =>
          socket.emit(
            'message',
            JSON.stringify({ id: request.id, result: { result: { type: 'number', value: 1 } } })
          )
        ) as unknown as WebSocketImpl,
      targetRetryMs: 2000,
    });

    await expect(client.evaluateAsync('1', { awaitPromise: false })).resolves.toMatchObject({
      value: 1,
    });
  });

  it(`should give up on the deadline rather than retry forever`, async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => [],
    })) as unknown as typeof fetch;

    const client = new CdpClient({ metroUrl: 'http://localhost:8081', targetRetryMs: 300 });
    await expect(client.evaluateAsync('1')).rejects.toThrow(/No target found/);
  });
});

/**
 * F21: React Native's `Promise` is a JavaScript polyfill, so the inspector never tags a promise and
 * CDP's `awaitPromise` does nothing. Every frame below is replayed from `fixtures/
 * live-promise-frames.json`, captured verbatim from a live SDK 57 app in Expo Go on an iPhone 17 Pro
 * simulator [observed — 2026-08-23]: the bug was invisible to a unit test written from the CDP spec,
 * because the spec says `awaitPromise` works.
 */
describe('CdpClient.evaluateAsync, settling promises', () => {
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

  /** The nonce the client generated, read back out of the expression it sent. */
  function nonceOf(request: any): string {
    const match = /__agentCliPendingPromise_([0-9a-f]+)__/.exec(request.params.expression);
    if (!match) {
      throw new Error(`No nonce in: ${request.params.expression}`);
    }
    return match[1]!;
  }

  /**
   * Answer like the app: the wrapper gets the marker, and each poll gets `answers` in turn.
   *
   * @param answers the `value` of each successive poll, verbatim from a live runtime.
   */
  function createPromiseClient(answers: unknown[]) {
    const requests: any[] = [];
    let poll = 0;
    const client = createClient((request, socket) => {
      requests.push(request);
      // Only the wrapper declares `__agentCliValue`; the poll and the release read the slots.
      const isWrapper = String(request.params.expression).includes('__agentCliValue');
      const value = isWrapper
        ? { [`__agentCliPendingPromise_${nonceOf(requests[0])}__`]: nonceOf(requests[0]) }
        : (answers[Math.min(poll++, answers.length - 1)] ?? { state: 'pending' });
      socket.emit(
        'message',
        JSON.stringify({
          id: request.id,
          result: {
            result: { type: 'object', className: 'Object', description: 'Object', value },
          },
        })
      );
    });
    return { client, requests };
  }

  it(`should report the settled value of a resolved promise, with its type`, async () => {
    const { client, requests } = createPromiseClient([
      { state: 'pending' },
      LIVE.resolvedNumber.result.result.value,
    ]);

    const result = await client.evaluateAsync('Promise.resolve(42)');

    expect(result.value).toBe(42);
    expect(result.type).toBe('number');
    expect(result.promise).toMatchObject({ state: 'fulfilled', awaited: true });
    expect(result.exceptionText).toBeUndefined();
    // One evaluate, then one poll per answer: everything runs over the same connection.
    expect(requests).toHaveLength(3);
  });

  it(`should report the status a live fetch resolved with`, async () => {
    const { client } = createPromiseClient([LIVE.resolvedFetchStatus.result.result.value]);

    const result = await client.evaluateAsync("fetch('https://example.com').then((r) => r.status)");

    expect(result).toMatchObject({ value: 200, type: 'number' });
  });

  it(`should report a rejection as its own outcome, with the reason`, async () => {
    const { client } = createPromiseClient([LIVE.rejected.result.result.value]);

    const result = await client.evaluateAsync(`Promise.reject(new Error('BOOM_REJECT_LIVE'))`);

    // Not an exception: the expression returned normally, and only `promise` has the outcome.
    expect(result.exceptionText).toBeUndefined();
    expect(result.value).toBeUndefined();
    expect(result.promise).toMatchObject({
      state: 'rejected',
      awaited: true,
      reason: { text: 'Error: BOOM_REJECT_LIVE' },
    });
  });

  it(`should give up on a promise that outlives the wait, and release it`, async () => {
    const { client, requests } = createPromiseClient([{ state: 'pending' }]);

    const error = await client
      .evaluateAsync('new Promise(() => {})', { timeoutMs: 150 })
      .catch((e) => e);

    expect(error).toBeInstanceOf(CdpPromisePendingError);
    expect(error.lost).toBe(false);
    // The last thing sent is the release, not another poll: the app is not left holding a value.
    expect(requests.at(-1).params.expression).toContain('delete');
    expect(requests.at(-1).params.expression).not.toContain('fulfilled');
  });

  it(`should say that a reload lost the outcome, rather than that it is slow`, async () => {
    const { client } = createPromiseClient([{ state: 'missing' }]);

    const error = await client.evaluateAsync('fetch(url)').catch((e) => e);

    expect(error).toBeInstanceOf(CdpPromisePendingError);
    expect(error.lost).toBe(true);
  });

  // The shape the polyfill used to hand back, kept as the thing this must never print again.
  it(`should never report the promise polyfill's internal fields`, async () => {
    const { client } = createPromiseClient([LIVE.resolvedNumber.result.result.value]);

    const result = await client.evaluateAsync('Promise.resolve(42)');

    expect(LIVE.polyfillInternals.result.result.value).toEqual({ _A: null, _x: 0, _y: 1, _z: 42 });
    expect(result.value).not.toEqual(LIVE.polyfillInternals.result.result.value);
    expect(result.value).toBe(42);
  });

  it(`should report a promise without waiting when asked not to await it`, async () => {
    const { client, requests } = createPromiseClient([]);

    const result = await client.evaluateAsync('fetch(url)', { awaitPromise: false });

    expect(result).toEqual({ type: 'promise', promise: { state: 'pending', awaited: false } });
    // Nothing was polled, and the app was never asked to hold anything.
    expect(requests).toHaveLength(1);
    expect(requests[0].params.expression).not.toContain('__agentCliPromiseSlots');
  });

  // `var x = 1` is a statement, which the wrapper's assignment cannot hold. It used to evaluate.
  it(`should re-run the expression as written when the wrapper will not compile`, async () => {
    const requests: any[] = [];
    const client = createClient((request, socket) => {
      requests.push(request);
      const wrapped = String(request.params.expression).includes('__agentCliValue');
      socket.emit(
        'message',
        JSON.stringify(
          wrapped
            ? {
                id: request.id,
                result: {
                  result: { type: 'object' },
                  exceptionDetails: LIVE.statementCompileFailure.result.exceptionDetails,
                },
              }
            : { id: request.id, result: { result: { type: 'undefined' } } }
        )
      );
    });

    const result = await client.evaluateAsync('var x = 1');

    expect(result.exceptionText).toBeUndefined();
    expect(result.type).toBe('undefined');
    expect(requests).toHaveLength(2);
    expect(requests[1].params.expression).toBe('var x = 1');
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
    // only one `runtime:eval` can drive.
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
