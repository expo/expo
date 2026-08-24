import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { readDevServerLockAsync, readLastLoggedDevServerPort } from '../../../devLock';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../../../exitCodes';
import {
  connectMessageSocketAsync,
  type MessageSocketPeers,
} from '../../messageSocket';
import { reloadAsync, reloadOverDevServerAsync } from '../reloadAsync';
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
function mockDevServer(targets: unknown[] | null): { listing: (next: unknown[]) => void } {
  let now = targets;
  globalThis.fetch = (async () => {
    if (now == null) {
      throw new Error('fetch failed');
    }
    return { ok: true, json: async () => now };
  }) as unknown as typeof fetch;
  return { listing: (next) => (now = next) };
}

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
    devServerUrl: 'http://127.0.0.1:8081',
    timeoutMs: 2000,
    json: false,
    followups: false,
    routeCheck: true,
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

  // The fallback the friction run had to run by hand: stop the app, then deep-link it back.
  it(`should fall back to the device when no app answers on the command socket`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
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
      { method: 'dev-server', ok: false, reason: expect.stringContaining('no app is connected') },
      { method: 'device', ok: true, reason: expect.stringContaining('simctl terminate') },
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
