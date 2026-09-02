// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
import { EventEmitter } from 'events';
import type WebSocketImpl from 'ws';

import { MockWebSocket } from '../../../runtime/__tests__/MockWebSocket';
import {
  CdpNetworkCollector,
  classifyNetworkDomainRefusal,
  NetworkDomainUnavailableError,
  parseNetworkMessage,
  targetAdvertisesNetworkPanel,
} from '../networkCollector';

const TARGET = {
  id: '1',
  appId: 'app',
  deviceName: 'device',
  description: '',
  type: 'native',
  title: 'title',
  devtoolsFrontendUrl: '/debugger-frontend/rn_fusebox.html?unstable_enableNetworkPanel=true',
  webSocketDebuggerUrl: 'ws://debugger',
};

/** `Network.requestWillBeSent`: `wallTime` is seconds since the epoch, `timestamp` is monotonic. */
const REQUEST_EVENT = {
  method: 'Network.requestWillBeSent',
  params: {
    requestId: 'r1',
    timestamp: 12345.678,
    wallTime: 1700000000,
    request: { method: 'GET', url: 'http://api.example.com/users' },
  },
};

const RESPONSE_EVENT = {
  method: 'Network.responseReceived',
  params: {
    requestId: 'r1',
    timestamp: 12345.9,
    response: { status: 200, statusText: 'OK', mimeType: 'application/json' },
  },
};

/** A socket that connects but never opens, to exercise the connection timeout. */
class NeverOpeningWebSocket extends EventEmitter {
  send() {}
  close() {}
}

/**
 * Build a collector whose socket replays `events` once `Network.enable` is sent, and record every
 * request the collector made.
 */
function mockCollector(
  events: unknown[],
  { enableFails = false, durationMs = 20 }: { enableFails?: boolean; durationMs?: number } = {}
) {
  const requests: any[] = [];
  const collector = new CdpNetworkCollector({
    metroUrl: 'http://localhost:8081',
    targetSelector: async () => TARGET,
    durationMs,
    createWebSocket: (url) =>
      new MockWebSocket(url, (request, socket) => {
        requests.push(request);
        if (request.method !== 'Network.enable') {
          return;
        }
        if (enableFails) {
          socket.emit(
            'message',
            JSON.stringify({
              id: request.id,
              error: { code: -32601, message: `'Network.enable' wasn't found` },
            })
          );
          return;
        }
        socket.emit('message', JSON.stringify({ id: request.id, result: {} }));
        for (const event of events) {
          socket.emit('message', typeof event === 'string' ? event : JSON.stringify(event));
        }
      }) as unknown as WebSocketImpl,
  });
  return { collector, requests };
}

describe('CdpNetworkCollector.collectAsync', () => {
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

  it(`should correlate a response with its request and enable then disable the domain`, async () => {
    const { collector, requests } = mockCollector([REQUEST_EVENT, RESPONSE_EVENT]);

    const collected = await collector.collectAsync();

    expect(requests.map((request) => request.method)).toEqual([
      'Network.enable',
      // The capability probe, for the reason `CdpNetworkCollector.capability` documents: an
      // acknowledged `Network.enable` is not a promise of events (llp/0005-runtime-loop-tools.rfc.md §Android, F61).
      'Log.enable',
      'Runtime.evaluate',
      'Network.disable',
    ]);
    expect(collected).toEqual([
      {
        requestId: 'r1',
        method: 'GET',
        url: 'http://api.example.com/users',
        timestamp: 1700000000000,
        status: 200,
        statusText: 'OK',
        mimeType: 'application/json',
        failure: null,
      },
    ]);
    expect(collector.metadata).toEqual({
      metroUrl: 'http://localhost:8081',
      webSocketDebuggerUrl: 'ws://debugger',
    });
  });

  it(`should record a failed request with the reason the runtime reported`, async () => {
    const { collector } = mockCollector([
      REQUEST_EVENT,
      {
        method: 'Network.loadingFailed',
        params: {
          requestId: 'r1',
          timestamp: 12346,
          errorText: 'Could not connect to the server.',
          canceled: false,
        },
      },
    ]);

    const collected = await collector.collectAsync();

    expect(collected).toHaveLength(1);
    expect(collected[0]).toMatchObject({
      url: 'http://api.example.com/users',
      status: null,
      failure: 'Could not connect to the server.',
    });
  });

  it(`should report a request that never answered as pending`, async () => {
    const { collector } = mockCollector([REQUEST_EVENT]);

    const collected = await collector.collectAsync();

    expect(collected).toHaveLength(1);
    expect(collected[0]).toMatchObject({ status: null, mimeType: null, failure: null });
  });

  it(`should keep the requests in the order the app sent them`, async () => {
    const { collector } = mockCollector([
      REQUEST_EVENT,
      {
        method: 'Network.requestWillBeSent',
        params: {
          requestId: 'r2',
          wallTime: 1700000001,
          request: { method: 'POST', url: 'http://api.example.com/login' },
        },
      },
      { ...RESPONSE_EVENT, params: { ...RESPONSE_EVENT.params, requestId: 'r2' } },
      RESPONSE_EVENT,
    ]);

    const collected = await collector.collectAsync();

    expect(collected.map((request) => request.requestId)).toEqual(['r1', 'r2']);
    expect(collected.map((request) => request.status)).toEqual([200, 200]);
  });

  it(`should ignore events that belong to no captured request and events of other domains`, async () => {
    const { collector } = mockCollector([
      { method: 'Network.dataReceived', params: { requestId: 'r1', dataLength: 12 } },
      { method: 'Runtime.consoleAPICalled', params: { type: 'log', args: [] } },
      { ...RESPONSE_EVENT, params: { ...RESPONSE_EVENT.params, requestId: 'unknown' } },
    ]);

    await expect(collector.collectAsync()).resolves.toEqual([]);
  });

  // The Network domain is behind an unstable flag in React Native's Fusebox: a runtime that does
  // not implement it answers `Network.enable` with an error, which must not read as "no traffic".
  it(`should reject with an unsupported-domain error when the runtime refuses Network.enable`, async () => {
    const { collector } = mockCollector([], { enableFails: true, durationMs: 5000 });

    const error = await collector.collectAsync().catch((e) => e);

    expect(error).toBeInstanceOf(NetworkDomainUnavailableError);
    expect(error.message).toMatch(/Network\.enable/);
    expect(error.reason).toMatch(/wasn't found/);
  });

  it(`should reject when the debugger connection does not open in time`, async () => {
    const collector = new CdpNetworkCollector({
      metroUrl: 'http://localhost:8081',
      targetSelector: async () => TARGET,
      timeoutMs: 20,
      createWebSocket: () => new NeverOpeningWebSocket() as unknown as WebSocketImpl,
    });

    await expect(collector.collectAsync()).rejects.toThrow(/did not open within 20ms/);
  });

  it(`should reject when the app cannot be reached`, async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => [],
    })) as unknown as typeof fetch;

    const collector = new CdpNetworkCollector({ metroUrl: 'http://localhost:8081' });
    await expect(collector.collectAsync()).rejects.toThrow(/No target found/);
  });

  it(`should resolve with the requests seen so far when the app disconnects`, async () => {
    const collector = new CdpNetworkCollector({
      metroUrl: 'http://localhost:8081',
      targetSelector: async () => TARGET,
      durationMs: 5000,
      createWebSocket: (url) =>
        new MockWebSocket(url, (request, socket) => {
          if (request.method !== 'Network.enable') {
            return;
          }
          socket.emit('message', JSON.stringify({ id: request.id, result: {} }));
          socket.emit('message', JSON.stringify(REQUEST_EVENT));
          socket.close();
        }) as unknown as WebSocketImpl,
    });

    await expect(collector.collectAsync()).resolves.toHaveLength(1);
  });

  it(`should ignore a message that is not JSON instead of failing the window`, async () => {
    const { collector } = mockCollector(['not json at all', REQUEST_EVENT]);

    await expect(collector.collectAsync()).resolves.toHaveLength(1);
  });
});

describe(parseNetworkMessage, () => {
  it(`should read a request, with the wall clock time the runtime reported`, () => {
    expect(parseNetworkMessage(REQUEST_EVENT)).toEqual({
      kind: 'request',
      requestId: 'r1',
      method: 'GET',
      url: 'http://api.example.com/users',
      timestamp: 1700000000000,
    });
  });

  it(`should default the method and the url of a request without them`, () => {
    expect(
      parseNetworkMessage({
        method: 'Network.requestWillBeSent',
        params: { requestId: 'r9', wallTime: 1700000000 },
      })
    ).toEqual({
      kind: 'request',
      requestId: 'r9',
      method: 'GET',
      url: '',
      timestamp: 1700000000000,
    });
  });

  it(`should read a response`, () => {
    expect(parseNetworkMessage(RESPONSE_EVENT)).toEqual({
      kind: 'response',
      requestId: 'r1',
      status: 200,
      statusText: 'OK',
      mimeType: 'application/json',
    });
  });

  it(`should read a failure, and mark a canceled request as canceled`, () => {
    expect(
      parseNetworkMessage({
        method: 'Network.loadingFailed',
        params: { requestId: 'r1', canceled: true },
      })
    ).toEqual({
      kind: 'failure',
      requestId: 'r1',
      failure: 'The request was canceled.',
      canceled: true,
    });
  });

  it(`should return null for events without a request id and for other domains`, () => {
    expect(parseNetworkMessage({ method: 'Network.requestWillBeSent', params: {} })).toBeNull();
    expect(parseNetworkMessage({ method: 'Network.dataReceived', params: {} })).toBeNull();
    expect(parseNetworkMessage({ method: 'Runtime.enable' })).toBeNull();
  });
});

describe(targetAdvertisesNetworkPanel, () => {
  it(`should read the unstable network panel flag of the debugger frontend URL`, () => {
    expect(targetAdvertisesNetworkPanel(TARGET)).toBe(true);
    expect(targetAdvertisesNetworkPanel({ ...TARGET, devtoolsFrontendUrl: '/devtools' })).toBe(
      false
    );
    expect(targetAdvertisesNetworkPanel({ ...TARGET, devtoolsFrontendUrl: '' })).toBe(false);
  });
});

// The two refusals React Native ships need opposite next steps, and only the answer tells them
// apart: one is about the state of the app process, the other about how the runtime was built.
describe(classifyNetworkDomainRefusal, () => {
  it(`should recognise the multiple-hosts refusal by its message`, () => {
    expect(
      classifyNetworkDomainRefusal({
        reason:
          'The Network domain is unavailable when multiple React Native hosts are registered.',
        rpcCode: -32603,
      })
    ).toBe('multiple-hosts');
  });

  it(`should recognise a missing handler by its JSON-RPC code`, () => {
    expect(classifyNetworkDomainRefusal({ reason: 'nope', rpcCode: -32601 })).toBe(
      'not-implemented'
    );
  });

  it(`should fall back to the wording when no code came back`, () => {
    expect(
      classifyNetworkDomainRefusal({ reason: `'Network.enable' wasn't found`, rpcCode: undefined })
    ).toBe('not-implemented');
  });

  it(`should call an answer it has not seen unknown rather than guessing`, () => {
    expect(classifyNetworkDomainRefusal({ reason: 'something else', rpcCode: -1 })).toBe('unknown');
  });
});

// @ref ../networkCollector §NetworkDomainRefusal — friction run 6, F61. `Network.enable` is
// *acknowledged* by Expo Go for Android and then nothing arrives, so nothing was ever refused and
// this classification never ran — the empty list stood for "the app made no requests".
describe(`${classifyNetworkDomainRefusal.name} with nothing refused`, () => {
  it(`names the acknowledged-then-silent runtime`, () => {
    expect(classifyNetworkDomainRefusal(null, { debuggerBlind: true })).toBe(
      'acknowledged-but-blind'
    );
  });

  it(`says nothing is wrong when the runtime does carry a debugger`, () => {
    expect(classifyNetworkDomainRefusal(null, { debuggerBlind: false })).toBe('none');
  });

  it(`does not claim blindness it has no evidence for`, () => {
    expect(classifyNetworkDomainRefusal(null, { debuggerBlind: null })).toBe('none');
    expect(classifyNetworkDomainRefusal(null)).toBe('none');
  });
});
