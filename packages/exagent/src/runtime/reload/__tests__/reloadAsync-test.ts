import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { readDevServerLockAsync, readLastLoggedDevServerPort } from '../../../devLock';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../../../exitCodes';
import {
  connectMessageSocketAsync,
  type MessageSocketPeers,
} from '../../messageSocket';
import {
  explainReloadFailure,
  reloadAsync,
  reloadOverDevServerAsync,
  type ReloadResultJson,
} from '../reloadAsync';
import type { ReloadOptions } from '../resolveOptions';

jest.mock('../../../devLock', () => ({
  readDevServerLockAsync: jest.fn(async () => null),
  readLastLoggedDevServerPort: jest.fn(() => null),
}));
jest.mock('../../messageSocket', () => ({
  ...jest.requireActual('../../messageSocket'),
  connectMessageSocketAsync: jest.fn(),
}));

const projectRoot = '/project';
const realPlatform = process.platform;

const EXPO_GO_TARGET = {
  id: 'device-1',
  appId: 'host.exp.Exponent',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=device&page=1',
};

/**
 * The same app after it has reloaded: a new page id under the same device.
 *
 * Metro's page ids come from a counter it does not rewind, so a runtime that registered again is a
 * new id [observed — 2026-08-23, live on port 8190: `8a9d…-1` -> `8a9d…-2`, 761 ms after the
 * broadcast]. That is what proves the app is back, and the old id staying listed for the first half
 * second is what made a plain "any target" wait report success for an app that had gone (F45).
 */
const RELOADED_EXPO_GO_TARGET = {
  ...EXPO_GO_TARGET,
  id: 'device-2',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=device&page=2',
};

/**
 * A stand-in for the dev server's command socket that answers `getpeers` from a script.
 *
 * One entry per read, so a test says what the peers look like before the broadcast and after it —
 * which is the whole of what the dev-server reload is judged on.
 */
function fakeSocket(reads: (MessageSocketPeers | null)[], onBroadcast?: () => void) {
  const sent: string[] = [];
  let call = 0;
  return {
    sent,
    socket: {
      getPeersAsync: jest.fn(async () => reads[Math.min(call++, reads.length - 1)] ?? null),
      broadcastReload: jest.fn(() => {
        sent.push('reload');
        onBroadcast?.();
      }),
      close: jest.fn(),
    } as any,
  };
}

function mockConnect(socket: any) {
  jest.mocked(connectMessageSocketAsync).mockResolvedValue(socket);
}

/**
 * Answer `GET /json/list` with the given targets, or make the dev server unreachable.
 *
 * The list is mutable through the returned handle, so a test can say what the dev server reports
 * *after* the app acted on the reload — which is the only thing a reload may be believed on.
 */
function mockDevServer(
  targets: unknown[] | null,
  { bundle = 'compiles' }: { bundle?: 'compiles' | 'broken' | 'no-manifest' } = {}
): { listing: (next: unknown[]) => void } {
  let now = targets;
  globalThis.fetch = (async (input: unknown) => {
    if (now == null) {
      throw new Error('fetch failed');
    }
    const url = String(input);
    if (url.endsWith('/json/list')) {
      return { ok: true, json: async () => now };
    }
    // The entry bundle. A broken one answers the way Metro answers a failed build: 500 with a
    // small JSON body rather than megabytes of JavaScript.
    if (url.includes('entry.bundle')) {
      if (bundle === 'broken') {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: { get: () => 'application/json' },
          text: async () => JSON.stringify(TRANSFORM_ERROR),
        };
      }
      return { ok: true, status: 200, text: async () => '' };
    }
    // The manifest: `GET /` with an `expo-platform` header, whose `launchAsset.url` is the entry
    // bundle. `no-manifest` is the dev server that answers nothing this check understands.
    if (bundle === 'no-manifest') {
      return { ok: false, status: 404, statusText: 'Not Found' };
    }
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ launchAsset: { url: 'http://127.0.0.1:8081/entry.bundle?dev=true' } }),
    };
  }) as unknown as typeof fetch;
  return { listing: (next) => (now = next) };
}

/** What Metro answers a failed build with, cut to the fields this CLI reads. */
const TRANSFORM_ERROR = {
  type: 'TransformError',
  lineNumber: 76,
  column: 4,
  filename: 'src/app/notes.tsx',
  message: "SyntaxError: /project/src/app/notes.tsx: Unexpected token (76:4)",
};

/**
 * A dev server whose app reloads when it is told to: the page id changes on the broadcast.
 *
 * This is what a real app does [observed — 2026-08-23, live], and building it into the default
 * fixture is deliberate: a test whose target id never changes is a test of an app that never
 * reloaded, and every "reloaded: true" assertion below would pass for one.
 */
function mockReloadingDevServer() {
  const server = mockDevServer([EXPO_GO_TARGET]);
  return fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () =>
    server.listing([RELOADED_EXPO_GO_TARGET])
  );
}

function mockSpawnQueue(
  answers: { stdout?: string; exitCode?: number | null }[],
  onCall?: (index: number) => void
) {
  let call = 0;
  jest.mocked(spawn).mockImplementation((() => {
    const answer = answers[call] ?? {};
    onCall?.(call++);
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    process.nextTick(() => {
      if (answer.stdout) child.stdout.emit('data', answer.stdout);
      child.emit('close', answer.exitCode ?? 0, null);
    });
    return child as any;
  }) as any);
}

const BOOTED_SIMULATOR = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
      { udid: 'IOS-1', name: 'iPhone 17', state: 'Booted' },
    ],
  },
});

function options(overrides: Partial<ReloadOptions> = {}): ReloadOptions {
  return {
    route: null,
    method: 'auto',
    cloud: false,
    devServerUrl: 'http://127.0.0.1:8081',
    timeoutMs: 2000,
    json: false,
    followups: false,
    routeCheck: true,
    bundleCheck: true,
    ...overrides,
  };
}

function writeProject(files: Record<string, string> = {}) {
  vol.fromJSON({
    [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
    [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
    ...files,
  });
}

function printed(): string {
  return jest.mocked(console.log).mock.calls.flat().join('\n');
}

let originalFetch: typeof fetch | undefined;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  jest.mocked(readDevServerLockAsync).mockResolvedValue(null);
  jest.mocked(readLastLoggedDevServerPort).mockReturnValue(null);
  Object.defineProperty(process, 'platform', { value: 'darwin' });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
  Object.defineProperty(process, 'platform', { value: realPlatform });
  vol.reset();
});

describe(reloadOverDevServerAsync, () => {
  // The property the whole method rests on: the dev server's socket ids come from a counter it
  // never rewinds, so an id that changed is the app's connection having been replaced.
  it(`should report a reload when the app's connection was replaced`, async () => {
    const { socket, sent } = fakeSocket([
      { 'socket#7': 'role=ios' },
      { 'socket#10': 'role=ios' },
    ]);

    await expect(
      reloadOverDevServerAsync('http://127.0.0.1:8081', { connect: async () => socket })
    ).resolves.toMatchObject({ method: 'dev-server', ok: true });
    expect(sent).toEqual(['reload']);
    expect(socket.close).toHaveBeenCalled();
  });

  it(`should report no reload when nothing reconnected`, async () => {
    const { socket } = fakeSocket([{ 'socket#7': 'role=ios' }]);

    await expect(
      reloadOverDevServerAsync('http://127.0.0.1:8081', {
        connect: async () => socket,
        churnTimeoutMs: 50,
      })
    ).resolves.toMatchObject({ ok: false, reason: expect.stringContaining('did not act on it') });
  });

  // Silence on the command socket means the dev server does not speak this protocol version, and
  // a broadcast sent into it would be dropped without an error. Reporting a reload there would be
  // the exact false green this command exists to remove.
  it(`should not broadcast into a dev server that did not answer`, async () => {
    const { socket, sent } = fakeSocket([null]);

    await expect(
      reloadOverDevServerAsync('http://127.0.0.1:8081', { connect: async () => socket })
    ).resolves.toMatchObject({
      ok: false,
      reason: expect.stringContaining('protocol version'),
    });
    expect(sent).toEqual([]);
  });

  it(`should say so when no app is connected to reload`, async () => {
    const { socket, sent } = fakeSocket([{}]);

    await expect(
      reloadOverDevServerAsync('http://127.0.0.1:8081', { connect: async () => socket })
    ).resolves.toMatchObject({ ok: false, reason: expect.stringContaining('no app is connected') });
    expect(sent).toEqual([]);
  });

  it(`should report a command socket it could not open`, async () => {
    await expect(
      reloadOverDevServerAsync('http://127.0.0.1:8081', {
        connect: async () => {
          throw new Error('connect ECONNREFUSED');
        },
      })
    ).resolves.toMatchObject({ ok: false, reason: expect.stringContaining('ECONNREFUSED') });
  });
});

describe(reloadAsync, () => {
  it(`should reload over the dev server and exit 0`, async () => {
    writeProject();
    mockConnect(mockReloadingDevServer().socket);

    await expect(reloadAsync(projectRoot, options({ json: true }))).resolves.toBe(EXIT_OK);
    const report = JSON.parse(printed());
    expect(report).toMatchObject({
      reloaded: true,
      method: 'dev-server',
      verifiedBy: 'message-socket-peers',
      appsConnected: 1,
      appsReconnected: 1,
      route: null,
      url: null,
    });
    // Nothing was asked of a device: that is the point of the dev-server method.
    expect(spawn).not.toHaveBeenCalled();
  });

  it(`should print a stable set of top-level keys with --json`, async () => {
    writeProject();
    mockConnect(mockReloadingDevServer().socket);

    await reloadAsync(projectRoot, options({ json: true }));

    expect(Object.keys(JSON.parse(printed())).sort()).toEqual([
      'appsConnected',
      'appsReconnected',
      'attempts',
      'bundle',
      'bundlePlatformSource',
      'bundlePlatforms',
      'devServerSource',
      'devServerUrl',
      'deviceId',
      'followups',
      'method',
      'platform',
      'reloaded',
      'route',
      'routeCheck',
      'url',
      'verifiedBy',
      'waitedMs',
    ]);
  });

  // @ref llp/0010-agent-conventions.rfc.md §The reload gate — friction run 4, F38.
  // A reload makes the app fetch the served bundle again. When that bundle does not compile the
  // app is put back on the same red screen, and the old command reported `Reloaded yes` for it.
  it(`should refuse to reload onto an entry bundle that does not compile`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET], { bundle: 'broken' });
    const { socket, sent } = fakeSocket([{ 'socket#1': 'role=ios' }]);
    mockConnect(socket);

    await expect(reloadAsync(projectRoot, options({ json: true }))).resolves.toBe(
      EXIT_OUTCOME_FAILED
    );
    expect(JSON.parse(printed())).toMatchObject({
      reloaded: false,
      method: null,
      // The count the dev server gave before the refusal, not a flat 0: nothing was waited on, so
      // reporting 0 would be inventing "no app is connected" out of a step that never ran.
      appsConnected: 1,
      appsReconnected: 0,
      bundle: {
        checked: true,
        ok: false,
        error: { type: 'TransformError', filename: 'src/app/notes.tsx', lineNumber: 76 },
      },
    });
    // The gate is before the broadcast, not after it: nothing was reloaded and no device was asked.
    expect(sent).toEqual([]);
    expect(spawn).not.toHaveBeenCalled();
  });

  // @ref llp/0010-agent-conventions.rfc.md §The reload gate — friction run 5, F48-6. "0
  // reconnected after the reload" describes an app that failed to come back from a reload that
  // never happened, which is a worse reading of the refusal than no line at all.
  it(`should not count reconnections against a reload that never happened`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET], { bundle: 'broken' });
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }]).socket);

    await reloadAsync(projectRoot, options());

    expect(printed()).toContain('Apps connected 1');
    expect(printed()).toContain('no reload happened');
    expect(printed()).not.toContain('reconnected after the reload');
  });

  it(`should still count reconnections for a reload that did happen`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () =>
        server.listing([RELOADED_EXPO_GO_TARGET])
      ).socket
    );

    await expect(reloadAsync(projectRoot, options())).resolves.toBe(EXIT_OK);
    expect(printed()).toContain('1 reconnected after the reload');
  });

  it(`should name the bundle in the failure, not the app`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET], { bundle: 'broken' });
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }]).socket);

    await reloadAsync(projectRoot, options());

    const printedError = jest.mocked(console.error).mock.calls.flat().join('\n');
    expect(printedError).toContain('does not compile');
    expect(printedError).toContain('src/app/notes.tsx:76');
  });

  // @ref llp/0010-agent-conventions.rfc.md §`checked` and `ok` move together — friction run 5,
  // F48-7. A checked run prints `Bundle compiles · for ios`, so the *absence* of the line was the
  // only signal that a gate had been skipped — and a reader cannot notice a line that is not there.
  it(`should name --no-bundle-check in a Bundle line rather than printing none`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET], { bundle: 'broken' });
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () =>
        server.listing([RELOADED_EXPO_GO_TARGET])
      ).socket
    );

    await reloadAsync(projectRoot, options({ bundleCheck: false }));

    expect(printed()).toContain('Bundle');
    expect(printed()).toContain('skipped (--no-bundle-check)');
  });

  // The other way of having no answer keeps the plainer wording: there is no flag to blame when a
  // dev server simply said nothing this CLI understands.
  it(`should say not checked, with the reason, when the check could not decide`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET], { bundle: 'no-manifest' });
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () =>
        server.listing([RELOADED_EXPO_GO_TARGET])
      ).socket
    );

    await reloadAsync(projectRoot, options());

    expect(printed()).toContain('not checked');
    expect(printed()).not.toContain('--no-bundle-check');
  });

  it(`should reload anyway with --no-bundle-check`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET], { bundle: 'broken' });
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () =>
        server.listing([RELOADED_EXPO_GO_TARGET])
      ).socket
    );

    await expect(
      reloadAsync(projectRoot, options({ json: true, bundleCheck: false }))
    ).resolves.toBe(EXIT_OK);
    expect(JSON.parse(printed()).bundle).toMatchObject({ checked: false, ok: null });
  });

  // The same fail-open rule the check follows for `dev:wait`: a dev server that answered nothing
  // this CLI understands has not shown the project to be broken, and refusing there would stop a
  // reload that would have worked.
  it(`should reload when the dev server says nothing about the entry bundle`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET], { bundle: 'no-manifest' });
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () =>
        server.listing([RELOADED_EXPO_GO_TARGET])
      ).socket
    );

    await expect(reloadAsync(projectRoot, options({ json: true }))).resolves.toBe(EXIT_OK);
    expect(JSON.parse(printed()).bundle).toMatchObject({ checked: false, ok: null });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §What proves a reload — friction run 4, F45.
  // The false success this hold exists to make impossible: peers churn, so the broadcast was acted
  // on, and the app then quits instead of coming back. The old design read the target list once,
  // caught the runtime that was on its way out, and reported `appsConnected: 1`.
  it(`should exit 22 when only the pre-reload target is still listed`, async () => {
    writeProject();
    // The listing never changes: the app that was there before is the app that is there after.
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }]).socket);

    await expect(reloadAsync(projectRoot, options({ timeoutMs: 300, json: true }))).resolves.toBe(
      EXIT_OUTCOME_TIMEOUT
    );
    expect(JSON.parse(printed())).toMatchObject({
      reloaded: true,
      appsConnected: 1,
      appsReconnected: 0,
    });
    expect(jest.mocked(console.error).mock.calls.flat().join('\n')).toContain(
      'the same debugger target'
    );
  });

  // F39: the app is mid-reload when the wait starts, so the first read answers with the runtime
  // that is being replaced. Waiting for the *new* id is what makes the next `runtime:errors` find
  // a target instead of failing with "No target found".
  it(`should keep waiting while the old target is served, and pass when the new one registers`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () => {
        setTimeout(() => server.listing([RELOADED_EXPO_GO_TARGET]), 120);
      }).socket
    );

    await expect(reloadAsync(projectRoot, options({ timeoutMs: 4000, json: true }))).resolves.toBe(
      EXIT_OK
    );
    expect(JSON.parse(printed())).toMatchObject({ appsConnected: 1, appsReconnected: 1 });
  });

  // The fallback the friction run had to run by hand: stop the app, then deep-link it back. Its
  // trigger is **no app on either list** — a peer list that is empty while `/json/list` names an
  // app is a different case, and force-stopping there is what K2 stopped this command doing.
  it(`should fall back to the device when no app is connected at all`, async () => {
    writeProject();
    const server = mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [
        { stdout: BOOTED_SIMULATOR }, // simctl list devices booted
        { stdout: '' }, // simctl terminate
        { stdout: BOOTED_SIMULATOR }, // simctl list devices booted, for the deep link
        { stdout: '' }, // simctl openurl
      ],
      // The relaunched app registers a runtime of its own, which is what the hold waits for.
      (index) => index === 2 && server.listing([RELOADED_EXPO_GO_TARGET])
    );

    await expect(reloadAsync(projectRoot, options({ json: true }))).resolves.toBe(EXIT_OK);
    const report = JSON.parse(printed());
    expect(report).toMatchObject({
      reloaded: true,
      method: 'device',
      verifiedBy: 'app-relaunch',
      platform: 'ios',
      deviceId: 'IOS-1',
    });
    expect(report.attempts).toEqual([
      {
        method: 'dev-server',
        ok: false,
        reason: expect.stringContaining('no app is connected'),
        leftAppStopped: null,
      },
      {
        method: 'device',
        ok: true,
        reason: expect.stringContaining('simctl terminate'),
        // The relaunch worked, so nothing was left stopped.
        leftAppStopped: null,
      },
    ]);
  });

  it(`should stay on the dev server when --method dev-server pins it`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);

    await expect(
      reloadAsync(projectRoot, options({ json: true, method: 'dev-server' }))
    ).resolves.toBe(EXIT_OUTCOME_FAILED);
    expect(JSON.parse(printed()).attempts).toHaveLength(1);
    expect(spawn).not.toHaveBeenCalled();
  });

  it(`should never open the command socket with --method device`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue(
      [{ stdout: BOOTED_SIMULATOR }, { stdout: '' }, { stdout: BOOTED_SIMULATOR }, { stdout: '' }],
      (index) => index === 2 && server.listing([RELOADED_EXPO_GO_TARGET])
    );

    await expect(reloadAsync(projectRoot, options({ method: 'device' }))).resolves.toBe(EXIT_OK);
    expect(connectMessageSocketAsync).not.toHaveBeenCalled();
  });

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes. A reload nothing acted on is `20`: the
  // tool worked and the operation failed.
  it(`should exit 20 when no method reloaded the app`, async () => {
    writeProject();
    mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue([{ stdout: '{"devices":{}}' }]);

    await expect(reloadAsync(projectRoot, options())).resolves.toBe(EXIT_OUTCOME_FAILED);
  });

  // ...and a reload that happened, with an app that has not come back yet, is `22`: nothing is
  // known to be wrong, so the answer is "look again" rather than "it failed".
  it(`should exit 22 when the app reloaded but had not reconnected`, async () => {
    writeProject();
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }]).socket);
    let listCalls = 0;
    globalThis.fetch = (async () => ({
      ok: true,
      // Attached while the reload is decided on, gone by the time the wait reads it.
      json: async () => (listCalls++ === 0 ? [EXPO_GO_TARGET] : []),
    })) as unknown as typeof fetch;

    await expect(reloadAsync(projectRoot, options({ timeoutMs: 300, json: true }))).resolves.toBe(
      EXIT_OUTCOME_TIMEOUT
    );
    expect(JSON.parse(printed())).toMatchObject({ reloaded: true, appsConnected: 0 });
  });

  it(`should refuse to reload onto a dev server that is not there`, async () => {
    writeProject();
    mockDevServer(null);

    const error = await reloadAsync(projectRoot, options()).catch((e) => e);
    expect(error.code).toBe('NO_DEV_SERVER');
  });

  it(`should open the route once the app is back`, async () => {
    writeProject({
      [`${projectRoot}/app/index.tsx`]: '',
      [`${projectRoot}/app/notes.tsx`]: '',
    });
    mockConnect(mockReloadingDevServer().socket);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await expect(
      reloadAsync(projectRoot, options({ route: '/notes', json: true }))
    ).resolves.toBe(EXIT_OK);
    expect(JSON.parse(printed())).toMatchObject({
      route: '/notes',
      url: 'exp://127.0.0.1:8081/--/notes',
      routeCheck: { checked: true, ok: true, matched: '/notes' },
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route — a reload that lands on the
  // "Unmatched Route" screen has replaced one wrong screen with another.
  it(`should refuse a --route the project has not got, before reloading anything`, async () => {
    writeProject({ [`${projectRoot}/app/index.tsx`]: '' });
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }]).socket);

    const error = await reloadAsync(projectRoot, options({ route: '/nope' })).catch((e) => e);
    expect(error.code).toBe('ROUTE_NOT_FOUND');
    expect(connectMessageSocketAsync).not.toHaveBeenCalled();
  });
});

// @ref ../../bundleCheck — friction run 6, F53. With an Android-only break and no platform flag,
// this command built the **iOS** bundle, passed the gate, and reloaded the Android app onto the
// bundle that does not compile — reporting `Bundle compiles · for ios` while doing it.
describe(`${reloadAsync.name} and the platform it checks the bundle for`, () => {
  const ANDROID_TARGET = {
    id: 'android-1',
    appId: 'host.exp.exponent',
    deviceName: 'sdk_gphone64_arm64 - 15 - API 35',
    webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=android&page=1',
  };

  it(`asks the dev server for the platform the connected app is on`, async () => {
    const platformsAsked: string[] = [];
    const server = mockDevServer([ANDROID_TARGET]);
    // Record the `expo-platform` header of every manifest request the check makes.
    const inner = globalThis.fetch;
    globalThis.fetch = (async (input: unknown, init?: any) => {
      const header = init?.headers?.['expo-platform'];
      if (header) {
        platformsAsked.push(String(header));
      }
      return await (inner as any)(input, init);
    }) as unknown as typeof fetch;

    const { socket } = fakeSocket([{ 'socket#1': 'role=android' }, { 'socket#4': 'role=android' }], () =>
      server.listing([{ ...ANDROID_TARGET, id: 'android-2' }])
    );
    mockConnect(socket);

    await reloadAsync(projectRoot, options({ json: true }));

    expect(platformsAsked).toEqual(['android']);
    expect(JSON.parse(printed()).bundlePlatformSource).toBe('connected-app');
    expect(JSON.parse(printed()).bundlePlatforms).toEqual(['android']);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §What the cloud backend can and cannot do — live
// staging, S12.
//
// The device fallback is a force-stop and a relaunch. When the relaunch is refused, the app is left
// **closed** — and on a cloud session the controller's own session app is what was closed, which
// nothing in this command can restore. The report said only "The app was not reloaded", so a reader
// was left with a session they could not use and no idea that this run is what emptied it.
describe(explainReloadFailure, () => {
  function strandedReport(): ReloadResultJson {
    return {
      reloaded: false,
      method: null,
      verifiedBy: null,
      devServerUrl: 'http://127.0.0.1:8081',
      devServerSource: 'flag',
      appsConnected: 0,
      appsReconnected: 0,
      bundle: { checked: true, ok: true, platform: 'ios', url: null, error: null, reason: null },
      bundlePlatforms: ['ios'],
      bundlePlatformSource: 'flag',
      route: null,
      routeCheck: { checked: false, ok: null, route: null, reason: 'no --route', routes: [] } as any,
      url: null,
      platform: 'ios',
      deviceId: 'session-1',
      attempts: [
        {
          method: 'dev-server',
          ok: false,
          reason: 'the reload was broadcast, but no client reconnected within 8000ms',
          leftAppStopped: null,
        },
        {
          method: 'device',
          ok: false,
          reason: 'the app was stopped, but the device refused the link that would start it again',
          leftAppStopped: 'host.exp.Exponent',
        },
      ],
      waitedMs: 12_000,
      followups: [],
    };
  }

  it(`says the app was left closed, which is a state this run produced`, () => {
    const explained = explainReloadFailure(strandedReport(), options({ cloud: true }));

    expect(explained).toMatch(/left .*(closed|not running)/i);
    expect(explained).toContain('host.exp.Exponent');
  });

  it(`hands back the command that reopens it by hand on a cloud session`, () => {
    const explained = explainReloadFailure(strandedReport(), options({ cloud: true }));

    expect(explained).toContain('eas simulator:exec');
    expect(explained).toContain('open host.exp.Exponent');
  });

  it(`does not claim a cloud session for a local run`, () => {
    const explained = explainReloadFailure(strandedReport(), options({ cloud: false }));

    expect(explained).toContain('host.exp.Exponent');
    expect(explained).not.toContain('eas simulator:exec');
    expect(explained).toContain('npx exagent navigate /');
  });

  it(`says nothing about a stopped app when the fallback never stopped one`, () => {
    const report = strandedReport();
    report.attempts = [report.attempts[0]!];

    expect(explainReloadFailure(report, options({ cloud: true }))).not.toMatch(/left/i);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Two lists, one question — Kudo's cloud loop, K2.
//
// The peer list on the dev server's command socket and the debugger target list in `/json/list`
// describe one app and disagree. Against a cloud app the first was empty and the second had the app
// in it, and this command read the first: "Apps connected 1 · no reload happened", then "no app is
// connected to the dev server", then a search for a booted simulator on a machine that had none —
// while `runtime:eval` was evaluating in that same app.
describe('an app the command socket cannot see', () => {
  /** A CDP client whose evaluate answers the reload probe and the call. */
  function mockCdp(answers: { probe?: unknown; call?: unknown } = {}) {
    const evaluateAsync = jest.fn(async (expression: string) => ({
      // The probe carries the diagnostic strings it can answer with; the call carries none.
      value: expression.includes('no-expo-global')
        ? (answers.probe ?? 'ready')
        : (answers.call ?? 'sent'),
      type: 'string',
    }));
    jest
      .spyOn(require('../../cdpClient'), 'CdpClient')
      .mockImplementation(() => ({ evaluateAsync }) as any);
    return evaluateAsync;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`reloads through the debugger when --method runtime asks for it`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    const evaluateAsync = mockCdp();
    // The app registers a new runtime after the call, which is the only proof of this method.
    setTimeout(() => server.listing([RELOADED_EXPO_GO_TARGET]), 10).unref();

    await expect(
      reloadAsync(projectRoot, options({ json: true, method: 'runtime' }))
    ).resolves.toBe(EXIT_OK);
    const report = JSON.parse(printed());
    expect(report).toMatchObject({
      reloaded: true,
      method: 'runtime',
      verifiedBy: 'fresh-debugger-target',
      appsReconnected: 1,
    });
    // The probe first, then the call: nothing is asked of an app that cannot answer it.
    expect(evaluateAsync).toHaveBeenCalledTimes(2);
    expect(evaluateAsync.mock.calls[0]![0]).toContain('no-expo-global');
    expect(evaluateAsync.mock.calls[1]![0]).toContain('expo.reloadAppAsync()');
  });

  it(`says the two lists disagreed rather than that nothing is connected`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    mockCdp();

    await reloadAsync(projectRoot, options({ json: true, timeoutMs: 300 }));
    const broadcast = JSON.parse(printed()).attempts.find(
      (attempt: { method: string }) => attempt.method === 'dev-server'
    );
    expect(broadcast.reason).toContain('no client is registered');
    expect(broadcast.reason).toContain('1 connected app');
  });

  it(`never force-stops an app the dev server can see`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await expect(reloadAsync(projectRoot, options({ json: true, timeoutMs: 300 }))).resolves.toBe(
      EXIT_OUTCOME_FAILED
    );
    // Nothing was spawned at all: no simctl, no terminate.
    expect(jest.mocked(spawn)).not.toHaveBeenCalled();
    const report = JSON.parse(printed());
    const device = report.attempts.find(
      (attempt: { method: string }) => attempt.method === 'device'
    );
    expect(device).toMatchObject({ ok: false });
    expect(device.reason).toContain('--method device');
    // The debugger method is not in the ladder either: on Expo Go it closes the app, so it is a
    // method a caller picks.
    expect(report.attempts.map((attempt: { method: string }) => attempt.method)).toEqual([
      'dev-server',
      'device',
    ]);
  });

  it(`names both deliberate methods for an app neither the broadcast nor a save can reach`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);

    await reloadAsync(projectRoot, options({ timeoutMs: 300 }));
    const explained = jest.mocked(console.error).mock.calls.flat().join('\n');

    expect(explained).toContain('the app is connected');
    expect(explained).toContain('--method device');
    // And what the other one costs on Expo Go, said where the caller is deciding.
    expect(explained).toContain('--method runtime');
    expect(explained).toContain('closes the app');
  });

  it(`still force-stops it when --method device says so`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue(
      [
        { stdout: BOOTED_SIMULATOR },
        { stdout: '' },
        { stdout: BOOTED_SIMULATOR },
        { stdout: '' },
      ],
      (index) => index === 2 && server.listing([RELOADED_EXPO_GO_TARGET])
    );

    await expect(
      reloadAsync(projectRoot, options({ json: true, method: 'device' }))
    ).resolves.toBe(EXIT_OK);
    expect(JSON.parse(printed())).toMatchObject({ method: 'device', verifiedBy: 'app-relaunch' });
  });

  it(`reports a runtime whose expo global cannot reload it, without guessing`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    mockCdp({ probe: 'no-reload-function' });

    await reloadAsync(projectRoot, options({ json: true, timeoutMs: 300, method: 'runtime' }));
    const runtime = JSON.parse(printed()).attempts.find(
      (attempt: { method: string }) => attempt.method === 'runtime'
    );
    expect(runtime).toMatchObject({ ok: false });
    expect(runtime.reason).toContain('reloadAppAsync');
  });

  it(`treats a runtime that stops answering the call as having been asked`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    const evaluateAsync = jest.fn(async (expression: string) => {
      if (expression.includes('no-expo-global')) {
        return { value: 'ready', type: 'string' };
      }
      // The reload tore down the context that was answering, which is the usual outcome.
      throw new Error('The app did not answer the Runtime.evaluate request within 4000ms.');
    });
    jest
      .spyOn(require('../../cdpClient'), 'CdpClient')
      .mockImplementation(() => ({ evaluateAsync }) as any);
    setTimeout(() => server.listing([RELOADED_EXPO_GO_TARGET]), 10).unref();

    await expect(
      reloadAsync(projectRoot, options({ json: true, method: 'runtime' }))
    ).resolves.toBe(EXIT_OK);
    const report = JSON.parse(printed());
    expect(report.method).toBe('runtime');
    expect(
      report.attempts.find((attempt: { method: string }) => attempt.method === 'runtime').reason
    ).toContain('stopped answering');
  });
});
