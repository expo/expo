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

// The two targets one dev server lists when a simulator and an emulator are both on it. Copied from
// `fixtures/json-list-ios-and-android.json`, which is a real `/json/list` payload: nothing in it
// names a platform, and the two Expo Go app ids differ by one capital letter (llp/0005 §The dev
// server does not label its targets). `nativePageReloads` is what the default selector requires
// before it will probe a target at all.
const MIXED_CAPABILITIES = { reactNative: { capabilities: { nativePageReloads: true } } };

const IOS_TARGET = {
  ...TARGET,
  ...MIXED_CAPABILITIES,
  id: 'ios-1',
  appId: 'host.exp.Exponent',
  deviceName: 'iPhone 17 Pro',
  webSocketDebuggerUrl: 'ws://debugger/ios',
};

const ANDROID_TARGET = {
  ...TARGET,
  ...MIXED_CAPABILITIES,
  id: 'android-1',
  appId: 'host.exp.exponent',
  deviceName: 'sdk_gphone64_arm64 - 15 - API 35',
  webSocketDebuggerUrl: 'ws://debugger/android',
};

/**
 * A socket that answers the way the runtime behind that URL really answers.
 *
 * The iOS runtime returns a value for `Runtime.evaluate`; Expo Go for Android answers `-32601`
 * [observed — 2026-08-25, and again 2026-08-27]. That asymmetry is not decoration: the default
 * target selector keeps a `-32601` target only as a *fallback*, so an unscoped selection over both
 * of these lands on iOS every time.
 */
function mixedPlatformSocket(url: string): WebSocketImpl {
  const android = url.endsWith('/android');
  return new MockWebSocket(url, (request, socket) => {
    if (request.method !== 'Runtime.evaluate') {
      return;
    }
    socket.emit(
      'message',
      JSON.stringify(
        android
          ? {
              id: request.id,
              error: { code: -32601, message: "Unsupported method 'Runtime.evaluate'" },
            }
          : { id: request.id, result: { result: { type: 'undefined' } } }
      )
    );
  }) as unknown as WebSocketImpl;
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
      // Two openings for the capability probe, not for the window: `Log.enable` is where a runtime
      // with no CDP debugger announces itself, and the evaluate is the second, independent way of
      // learning the same thing (llp/0005-runtime-loop-tools.rfc.md §Android, F52).
      'Log.enable',
      'Runtime.evaluate',
      'Runtime.disable',
    ]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toEqual({
      source: 'exception',
      timestamp: 1700000000000,
      message: 'TypeError: undefined is not a function',
      stack: '  at renderRow (http://localhost:8081/index.bundle:42:9)',
      // CDP counts lines and columns from 0; Metro's symbolicator wants a 1-based line and a
      // 0-based column, and the rendered text above is 1-based in both.
      frames: [
        {
          methodName: 'renderRow',
          file: 'http://localhost:8081/index.bundle',
          lineNumber: 42,
          column: 8,
        },
      ],
      isError: true,
      location: 'http://localhost:8081/index.bundle:42:9',
    });
    expect(errors[1]).toEqual({
      source: 'console',
      timestamp: 1700000000001,
      message: 'Request failed',
      stack: undefined,
      frames: undefined,
      // A line of text, so it carries no stack of its own — which is the difference a gate acts
      // on, because `source` cannot answer it (see the field's own documentation).
      isError: false,
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

  // F100 — CRITICAL, found live on 2026-08-27 against Expo Go on `tuft-pixel` with an iPhone 17 Pro
  // simulator on the same dev server.
  //
  // What it was: this collector accepted `platform` and `deviceIndex` — `runtimeAsync` and
  // `smokeAsync` both pass them — and then **left them out of the `CdpClient` it built**. So the
  // narrowing llp/0005 §Android describes reached every command
  // that opens a `CdpClient` itself (`runtime:eval`, `runtime:tree`, `runtime:tap`, `runtime:type`)
  // and neither of the two that go through here: `runtime:errors` and `smoke`'s `errors` phase.
  //
  // Why it was the dangerous direction rather than a mislabel. The default selector ranks a target
  // that answers `Runtime.evaluate` **above** one that answers `-32601` (llp/0005-runtime-loop-tools.rfc.md §Android),
  // and Expo Go for Android is the second kind — so on a mixed machine the unscoped selector picks
  // iOS *by design*. Live, in one minute [observed — 2026-08-27, port 8560, both apps on `/lab`
  // throwing `new Error("W25 boom on " + Platform.OS)`]:
  //
  //     runtime:eval "1+1" --android  → exit 1, RUNTIME_EVALUATE_UNSUPPORTED
  //     runtime:errors --android      → count 1, message "W25 boom on ios", runtimeReadable: true
  //
  // The second answer is an iOS runtime's error list reported as Android's, under a
  // `runtimeReadable: true` that also suppressed the dev-server-log fallback F52 built for exactly
  // this runtime. Two commands given the same flag read two different apps.
  it(`talks only to a target on the platform it was given (F100)`, async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => [IOS_TARGET, ANDROID_TARGET],
    })) as unknown as typeof fetch;

    const opened: string[] = [];
    const collector = new CdpRuntimeErrorCollector({
      metroUrl: 'http://localhost:8081',
      durationMs: 20,
      platform: 'android',
      // The index this machine's own device tools would report, which is the strongest of the three
      // pieces of evidence `platformOfTarget` ranks.
      deviceIndex: { iosNames: ['iPhone 17 Pro'], androidModels: ['sdk_gphone64_arm64'] },
      createWebSocket: (url) => {
        opened.push(url);
        return mixedPlatformSocket(url);
      },
    });

    await collector.collectAsync();

    // No `targetSelector` is injected on purpose: the default one is what ranks an answering
    // runtime above a `-32601` one — `mixedPlatformSocket` reproduces both answers — so this
    // asserts the narrowing happens *before* the selector rather than that some selector happened
    // to choose right. Unscoped, the same list resolves to iOS, which is the live defect.
    expect(collector.metadata.webSocketDebuggerUrl).toBe(ANDROID_TARGET.webSocketDebuggerUrl);
    expect(opened).not.toContain(IOS_TARGET.webSocketDebuggerUrl);
  });

  it(`refuses rather than reading the other platform when none of its own is listed (F100)`, async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => [
        {
          ...TARGET,
          id: 'ios-1',
          appId: 'host.exp.Exponent',
          deviceName: 'iPhone 17 Pro',
          webSocketDebuggerUrl: 'ws://debugger/ios',
        },
      ],
    })) as unknown as typeof fetch;

    const collector = new CdpRuntimeErrorCollector({
      metroUrl: 'http://localhost:8081',
      durationMs: 20,
      platform: 'android',
      deviceIndex: { iosNames: ['iPhone 17 Pro'], androidModels: ['sdk_gphone64_arm64'] },
      createWebSocket: (url) => new MockWebSocket(url, () => {}) as unknown as WebSocketImpl,
    });

    // The message `NoTargetOnPlatformError` writes: an empty window from the wrong app is worse
    // than no window, so the scoped failure has to reach the caller as a failure.
    await expect(collector.collectAsync()).rejects.toThrow(/No android app is connected/);
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
      // Text, not an Error: nothing here carries a stack of its own.
      isError: false,
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
      // Read back out of the text, because that is the only place this stack exists — and it has
      // to be symbolicated like any other. Text stacks count columns from 1, Metro from 0.
      frames: [{ methodName: 'App', file: 'App.tsx', lineNumber: 3, column: 0 }],
      isError: true,
      location: undefined,
    });
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate — the three cases measured live on
// 2026-08-24 against notesapp on SDK 57 in Expo Go on an iOS 26.5 simulator. They are pinned here
// because a gate is built on the difference between them, and because the one a reader would
// predict from the protocol — an uncaught throw arriving as `Runtime.exceptionThrown` — did not
// happen once in any of the runs.
describe('an Error told apart from a line of text', () => {
  /** One `Runtime.consoleAPICalled` frame, in the shape React Native sends. */
  function consoleCall(text: string, stackFrames: { functionName: string; url: string }[] = []) {
    return parseRuntimeErrorMessage({
      method: 'Runtime.consoleAPICalled',
      params: {
        type: 'error',
        timestamp: 1,
        args: [{ type: 'string', value: text }],
        stackTrace: {
          callFrames: stackFrames.map((frame) => ({
            ...frame,
            scriptId: '1',
            lineNumber: 0,
            columnNumber: 0,
          })),
        },
      },
    });
  }

  // `console.error("some text")`: the message is text, and the `stackTrace` CDP sends alongside
  // describes the console machinery that reported it rather than any file of this project.
  it(`reads a plain log as text, not as an error`, () => {
    const record = consoleCall('WAVE6_PLAIN_LOG plain text log', [
      { functionName: 'methodName', url: 'node_modules/@react-native/js-polyfills/console.js' },
      { functionName: 'overrideMethod', url: 'node_modules/react-devtools-core/dist/backend.js' },
    ]);

    expect(record!.isError).toBe(false);
  });

  // `throw new Error(x)` — which never reaches `Runtime.exceptionThrown` on this runtime. React
  // Native catches it and reports it through the console path as one string holding the message
  // and the error's own frames.
  it(`reads an uncaught throw as an error, through the console path`, () => {
    const record = consoleCall(
      'Error: WAVE6_UNCAUGHT\n    at setTimeout$argument_0 (src/app/index.tsx:112:18)'
    );

    expect(record!.source).toBe('console');
    expect(record!.isError).toBe(true);
    expect(record!.message).toBe('Error: WAVE6_UNCAUGHT');
  });

  // The limit, pinned so nobody removes it believing it was an oversight: `console.error(new
  // Error(x))` produces the same bytes as the throw above, so nothing over this protocol tells
  // them apart. A gate built on this flag fails on both, deliberately.
  it(`cannot tell a logged Error from an uncaught one, and says so by reading both as errors`, () => {
    const logged = consoleCall(
      'Error: WAVE6_LOGGED_ERROR\n    at setTimeout$argument_0 (src/app/index.tsx:109:26)'
    );

    expect(logged!.isError).toBe(true);
  });
});
