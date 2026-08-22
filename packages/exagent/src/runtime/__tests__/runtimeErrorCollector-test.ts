import { EventEmitter } from 'events';
import type WebSocketImpl from 'ws';

import { CdpRuntimeErrorCollector, parseRuntimeErrorMessage } from '../runtimeErrorCollector';
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

const EXCEPTION_EVENT = {
  method: 'Runtime.exceptionThrown',
  params: {
    timestamp: 1700000000000,
    exceptionDetails: {
      exceptionId: 1,
      text: 'Uncaught',
      lineNumber: 41,
      columnNumber: 8,
      url: 'http://localhost:8081/index.bundle',
      exception: {
        type: 'object',
        className: 'TypeError',
        description: 'TypeError: undefined is not a function',
      },
      stackTrace: {
        callFrames: [
          {
            functionName: 'renderRow',
            scriptId: '1',
            url: 'http://localhost:8081/index.bundle',
            lineNumber: 41,
            columnNumber: 8,
          },
        ],
      },
    },
  },
};

/** A socket that connects but never opens, to exercise the connection timeout. */
class NeverOpeningWebSocket extends EventEmitter {
  send() {}
  close() {}
}

describe('CdpRuntimeErrorCollector.collectAsync', () => {
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

  it(`should capture exceptions and console errors, and skip other console output`, async () => {
    const requests: any[] = [];
    const collector = new CdpRuntimeErrorCollector({
      metroUrl: 'http://localhost:8081',
      targetSelector: async () => TARGET,
      durationMs: 20,
      createWebSocket: (url) =>
        new MockWebSocket(url, (request, socket) => {
          requests.push(request);
          if (request.method !== 'Runtime.enable') {
            return;
          }
          socket.emit('message', JSON.stringify(EXCEPTION_EVENT));
          socket.emit(
            'message',
            JSON.stringify({
              method: 'Runtime.consoleAPICalled',
              params: {
                type: 'error',
                timestamp: 1700000000001,
                args: [{ type: 'string', value: 'Request failed' }],
              },
            })
          );
          socket.emit(
            'message',
            JSON.stringify({
              method: 'Runtime.consoleAPICalled',
              params: {
                type: 'log',
                timestamp: 1700000000002,
                args: [{ type: 'string', value: 'just a log' }],
              },
            })
          );
        }) as unknown as WebSocketImpl,
    });

    const errors = await collector.collectAsync();

    expect(requests.map((request) => request.method)).toEqual([
      'Runtime.enable',
      'Runtime.disable',
    ]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toEqual({
      source: 'exception',
      timestamp: 1700000000000,
      message: 'TypeError: undefined is not a function',
      stack: '  at renderRow (http://localhost:8081/index.bundle:42:9)',
      location: 'http://localhost:8081/index.bundle:42:9',
    });
    expect(errors[1]).toEqual({
      source: 'console',
      timestamp: 1700000000001,
      message: 'Request failed',
      stack: undefined,
    });
    expect(collector.metadata).toEqual({
      metroUrl: 'http://localhost:8081',
      webSocketDebuggerUrl: 'ws://debugger',
    });
  });

  it(`should resolve with the errors seen so far when the app disconnects`, async () => {
    const collector = new CdpRuntimeErrorCollector({
      metroUrl: 'http://localhost:8081',
      targetSelector: async () => TARGET,
      durationMs: 5000,
      createWebSocket: (url) =>
        new MockWebSocket(url, (request, socket) => {
          if (request.method !== 'Runtime.enable') {
            return;
          }
          socket.emit('message', JSON.stringify(EXCEPTION_EVENT));
          socket.close();
        }) as unknown as WebSocketImpl,
    });

    const errors = await collector.collectAsync();
    expect(errors).toHaveLength(1);
    expect(errors[0]!.source).toBe('exception');
  });

  it(`should reject when the app cannot be reached`, async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => [],
    })) as unknown as typeof fetch;

    const collector = new CdpRuntimeErrorCollector({ metroUrl: 'http://localhost:8081' });
    await expect(collector.collectAsync()).rejects.toThrow(/No target found/);
  });

  it(`should reject when the debugger connection does not open in time`, async () => {
    const collector = new CdpRuntimeErrorCollector({
      metroUrl: 'http://localhost:8081',
      targetSelector: async () => TARGET,
      timeoutMs: 20,
      createWebSocket: () => new NeverOpeningWebSocket() as unknown as WebSocketImpl,
    });

    await expect(collector.collectAsync()).rejects.toThrow(/did not open within 20ms/);
  });

  it(`should ignore a message that is not JSON instead of failing the window`, async () => {
    const collector = new CdpRuntimeErrorCollector({
      metroUrl: 'http://localhost:8081',
      targetSelector: async () => TARGET,
      durationMs: 20,
      createWebSocket: (url) =>
        new MockWebSocket(url, (request, socket) => {
          if (request.method !== 'Runtime.enable') {
            return;
          }
          socket.emit('message', 'not json at all');
          socket.emit('message', JSON.stringify(EXCEPTION_EVENT));
        }) as unknown as WebSocketImpl,
    });

    await expect(collector.collectAsync()).resolves.toHaveLength(1);
  });
});

describe(parseRuntimeErrorMessage, () => {
  it(`should return null for events that are not errors`, () => {
    expect(parseRuntimeErrorMessage({ method: 'Log.entryAdded', params: {} })).toBeNull();
    expect(
      parseRuntimeErrorMessage({
        method: 'Runtime.consoleAPICalled',
        params: { type: 'warning', args: [] },
      })
    ).toBeNull();
    expect(parseRuntimeErrorMessage({ method: 'Runtime.exceptionThrown', params: {} })).toBeNull();
  });

  it(`should treat console.assert as an error`, () => {
    const record = parseRuntimeErrorMessage({
      method: 'Runtime.consoleAPICalled',
      params: {
        type: 'assert',
        timestamp: 5,
        args: [
          { type: 'string', value: 'Assertion failed:' },
          { type: 'number', value: 1 },
        ],
      },
    });

    expect(record).toEqual({
      source: 'console',
      timestamp: 5,
      message: 'Assertion failed: 1',
      stack: undefined,
    });
  });

  it(`should fall back to the description stack when there are no call frames`, () => {
    const record = parseRuntimeErrorMessage({
      method: 'Runtime.exceptionThrown',
      params: {
        timestamp: 7,
        exceptionDetails: {
          exceptionId: 2,
          text: 'Uncaught',
          lineNumber: 0,
          columnNumber: 0,
          exception: {
            type: 'object',
            description: 'Error: nope\n    at App (App.tsx:3:1)',
          },
        },
      },
    });

    expect(record).toEqual({
      source: 'exception',
      timestamp: 7,
      message: 'Error: nope',
      stack: '    at App (App.tsx:3:1)',
      location: undefined,
    });
  });
});
