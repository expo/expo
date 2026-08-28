import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import { vol } from 'memfs';

import { detachedLogPath } from '../../../dev/logFile';
import { readDevServerLockAsync, readLastLoggedDevServerPort } from '../../../devLock';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../../../exitCodes';
import { resetPackageRunnerCache } from '../../../utils/packageRunner';
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
  {
    bundle = 'compiles',
    manifestOrigin = 'http://127.0.0.1:8081',
  }: {
    bundle?: 'compiles' | 'broken' | 'no-manifest';
    /**
     * Origin of the manifest's `launchAsset.url`, which is where the tunnel host comes from.
     *
     * The dev server builds it from `getDevServerUrl()`, so a tunnelled run advertises the tunnel
     * origin here and nowhere else a detached run can read (`src/dev/advertisedUrl.ts`, S3).
     */
    manifestOrigin?: string;
  } = {}
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
      json: async () => ({ launchAsset: { url: `${manifestOrigin}/entry.bundle?dev=true` } }),
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
  answers: { stdout?: string; stderr?: string; exitCode?: number | null }[],
  onCall?: (index: number) => void
) {
  let call = 0;
  jest.mocked(spawn).mockImplementation((() => {
    // The index advances on every spawn, whether or not a caller passed `onCall`. It used to
    // advance inside `onCall?.(call++)`, where the optional call skips its own argument — so a test
    // with no `onCall` answered every spawn from `answers[0]`, and an exit code meant for the
    // second command was never delivered.
    const index = call++;
    const answer = answers[index] ?? {};
    onCall?.(index);
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    process.nextTick(() => {
      if (answer.stdout) child.stdout.emit('data', answer.stdout);
      if (answer.stderr) child.stderr.emit('data', answer.stderr);
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
      'appsReconnectedReason',
      'attempts',
      'bundle',
      'bundlePlatformSource',
      'bundlePlatforms',
      'bundlesAfterReload',
      'commandSocketChurn',
      'commandSocketClients',
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

  // @ref llp/0005-runtime-loop-tools.rfc.md §A broadcast that was delivered is a mechanism that ran
  // — F97, the second live-cloud run.
  //
  // The socket held a client, the frame went out, and the peer list did not move inside the churn
  // window. That is one fact — the *proof* is missing — and the run used to read it as a second:
  // that no mechanism ran at all. So it exited `20` with `method: null`, and skipped the two
  // observations that exist for exactly this state: nothing watched the dev server's output, because
  // "no mechanism ran, so there was nothing to watch for" [observed — live cloud, 2026-08-27:
  // `commandSocketClients: 1`, the broadcast sent, exit 20 in 8.9 s of a 180 s budget].
  //
  // A delivered frame is a mechanism. What it is not is a reload, and `verifiedBy` stays null until
  // something is observed — which is `22`, not `20`.
  it(`treats a broadcast that reached a client as a mechanism, and looks for the proof`, async () => {
    writeProject();
    // A client, throughout: the same peer id before and after, so the churn window closes empty.
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }]).socket);
    mockDevServer([EXPO_GO_TARGET]);

    await expect(reloadAsync(projectRoot, options({ timeoutMs: 300, json: true }))).resolves.toBe(
      EXIT_OUTCOME_TIMEOUT
    );
    const report = JSON.parse(printed());
    expect(report.method).toBe('dev-server');
    // Never a proof off a frame that was accepted by a socket: F95's rule, unchanged.
    expect(report.verifiedBy).toBeNull();
    expect(report.reloaded).toBe(false);
    // And the observations ran, which is the whole point — this said "no mechanism ran, so there
    // was nothing to watch for" while a reload may well have been in flight.
    expect(report.bundlesAfterReload.observed).toBe(false);
    expect(report.bundlesAfterReload.reason).not.toContain('no mechanism ran');
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The ladder climbs — F99, the second live-cloud run.
  //
  // The evidence that settled it, in one pair of runs. `runtime:reload --cloud` found one client on
  // the command socket, broadcast to it, and nothing happened for the whole 180 s budget: no fresh
  // debugger target, no bundle. The **next** command, seconds later, found **zero** clients — so the
  // broadcast had taken the client away without reloading the app — climbed to the relaunch, and
  // exited 0 with `iOS Bundled 42ms` in 18.5 s [observed — live cloud, 2026-08-27, artifacts 005 and
  // 006 of `live-cloud-2026-08-27T19-17-35-037Z`].
  //
  // So `auto` reaching rung 1 and stopping there made the command fail on a state its own second rung
  // handled. llp/0005 already said the ladder "spends [the app's state] when nothing cheaper can
  // reach the app"; a frame that was delivered and produced no churn inside its window *is* nothing
  // cheaper reaching the app. `--method dev-server` still pins rung 1 and never climbs.
  it(`climbs to the relaunch when the broadcast was delivered and proved nothing`, async () => {
    writeProject();
    // One client, and the same one afterwards: delivered, and no churn.
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }]).socket);
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue(
      [{ stdout: BOOTED_SIMULATOR }, { stdout: '' }, { stdout: BOOTED_SIMULATOR }, { stdout: '' }],
      (index) => index === 2 && server.listing([RELOADED_EXPO_GO_TARGET])
    );

    await expect(reloadAsync(projectRoot, options({ json: true }))).resolves.toBe(EXIT_OK);
    const report: ReloadResultJson = JSON.parse(printed());
    expect(report.method).toBe('device');
    expect(report.reloaded).toBe(true);
    // Both rungs are in the payload, in the order they were taken, and the first says why the second
    // was needed.
    expect(report.attempts.map((attempt) => attempt.method)).toEqual(['dev-server', 'device']);
    expect(report.attempts[0]!.reason).toContain('did not act on it');
    // And the cost is on the attempt that spent it, never silent — with the reason the rung was
    // actually reached for. The first live run of this climb printed "no client was registered on
    // the dev server's command socket" over a payload whose own `commandSocketClients` was 1, which
    // is a report arguing with itself.
    expect(report.attempts[1]!.reason).toContain("costs the app's JavaScript state");
    expect(report.attempts[1]!.reason).toContain('nothing was seen to come of it');
    expect(report.attempts[1]!.reason).not.toContain('no client was registered');
    expect(report.commandSocketClients).toBe(1);
  });

  // The other half: a pinned rung is still a pinned rung. A caller who asked for the broadcast and
  // nothing else must not have their app's state spent by a fallback they excluded.
  it(`never climbs past a rung the caller pinned`, async () => {
    writeProject();
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }]).socket);
    mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }]);

    await reloadAsync(projectRoot, options({ method: 'dev-server', json: true, timeoutMs: 300 }));
    const report: ReloadResultJson = JSON.parse(printed());
    expect(report.attempts.map((attempt) => attempt.method)).toEqual(['dev-server']);
    expect(report.method).toBe('dev-server');
    expect(report.verifiedBy).toBeNull();
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
      commandSocketClients: 1,
      commandSocketChurn: {
        observed: false,
        before: 1,
        after: 1,
        reconnected: 0,
        reason: 'the reload was broadcast, but no client reconnected within 8000ms',
      },
      appsReconnected: 0,
      appsReconnectedReason: 'no reload happened, so nothing had reason to reconnect',
      bundle: { checked: true, ok: true, platform: 'ios', url: null, error: null, reason: null },
      bundlesAfterReload: { observed: null, count: 0, line: null, reason: null },
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
    expect(explained).toContain('npx @expo/agent-cli navigate /');
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

  // @ref llp/0005-runtime-loop-tools.rfc.md §One ladder, chosen by the command socket — wave 21.
  //
  // What this replaces: `auto` used to refuse here — "never force-stop an app the dev server can
  // see" — and exit 20 with two deliberate methods to choose between. That rule was written to
  // protect a *cheaper alternative*, and in this state there is none: the broadcast has nobody to
  // reach, and the only mechanism left is the relaunch. Wave 19 had already made it the primary
  // mechanism on a cloud session for exactly that reason; the state is the same one locally, so the
  // ladder is the same.
  it(`relaunches on the device when the command socket has no client`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [{ stdout: BOOTED_SIMULATOR }, { stdout: '' }, { stdout: BOOTED_SIMULATOR }, { stdout: '' }],
      (index) => index === 2 && server.listing([RELOADED_EXPO_GO_TARGET])
    );

    await expect(reloadAsync(projectRoot, options({ json: true }))).resolves.toBe(EXIT_OK);
    const report = JSON.parse(printed());
    expect(report).toMatchObject({ reloaded: true, method: 'device', verifiedBy: 'app-relaunch' });
    // Both rungs are in the report, in the order they were tried: the broadcast that had nobody to
    // reach, then the relaunch that did the work.
    expect(report.attempts.map((attempt: { method: string }) => attempt.method)).toEqual([
      'dev-server',
      'device',
    ]);
  });

  // The relaunch costs the app's JavaScript state, and a run that spends it says so on the attempt
  // — the old design made the caller choose it by name, and what replaces that consent is a report
  // a reader can see the cost in.
  it(`says what the relaunch cost when it ran on an app that was connected`, async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [{ stdout: BOOTED_SIMULATOR }, { stdout: '' }, { stdout: BOOTED_SIMULATOR }, { stdout: '' }],
      (index) => index === 2 && server.listing([RELOADED_EXPO_GO_TARGET])
    );

    await reloadAsync(projectRoot, options({ json: true }));
    const device = JSON.parse(printed()).attempts.find(
      (attempt: { method: string }) => attempt.method === 'device'
    );
    expect(device.reason).toContain(`the app's JavaScript state`);
    expect(device.reason).toContain('simctl terminate');
  });

  it(`names both deliberate methods for an app no rung of the ladder could reach`, async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    // No booted device, so the relaunch rung has nothing to act on either.
    mockSpawnQueue([{ stdout: '{"devices":{}}' }]);

    await expect(reloadAsync(projectRoot, options({ timeoutMs: 300 }))).resolves.toBe(
      EXIT_OUTCOME_FAILED
    );
    const explained = jest.mocked(console.error).mock.calls.flat().join('\n');

    expect(explained).toContain('the app is connected');
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

// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading a cloud session — wave 19.
//
// The premise this command shipped on: "the dev-server broadcast reaches a cloud session already —
// a cloud session has to reach that dev server through a tunnel to be running the bundle at all".
// Live, the tunnel carried the **bundle** and not the client command socket: the broadcast reached
// nobody, the fallback stopped the app, and the relaunch was refused
// [observed — live staging, 2026-08-26, S12; reproduced by Kudo, 2026-08-27].
describe('reloading an app on a cloud simulator session', () => {
  const SESSION_LISTING = JSON.stringify({
    sessions: [
      {
        id: 'session-1',
        status: 'IN_PROGRESS',
        platform: 'IOS',
        type: 'agent-device',
        name: 'wave19',
        createdAt: '2026-08-27T09:00:00.000Z',
      },
    ],
  });

  const BUNDLED_LINE = 'iOS Bundled 812ms node_modules/expo-router/entry.js (943 modules)';

  function writeCloudProject({ log = ['Starting project at /project'] }: { log?: string[] } = {}) {
    writeProject({
      // A package runner has to be findable for any `eas` to be spawned at all
      // (`src/utils/easCli.ts` — one rung, and it is the runner).
      '/usr/bin/npx': '#!/bin/sh\n',
      [detachedLogPath(projectRoot)]: log.join('\n') + '\n',
    });
    resetPackageRunnerCache();
  }

  /** What the dev server writes when something fetches the bundle over the tunnel. */
  function appendBundledLine(): void {
    const file = detachedLogPath(projectRoot);
    fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8')}${BUNDLED_LINE}\n`);
  }

  function cloudOptions(overrides: Partial<ReloadOptions> = {}): ReloadOptions {
    return options({ cloud: true, devServerUrl: 'https://tunnel.example', ...overrides });
  }

  /** The argv of every `eas` this run spawned, as one string per spawn. */
  function spawnedCommands(): string[] {
    return jest
      .mocked(spawn)
      .mock.calls.map(([bin, args]) => [bin, ...((args as string[]) ?? [])].join(' '));
  }

  // The whole fix, in two verbs, and each half is there for something that was observed to break:
  //
  //  1. `open <app-id> --relaunch` restarts the app **with no URL on the launch**. Launching Expo Go
  //     cold *with* a dev-server URL crashed it every time on the live session —
  //     `SQLiteGetResultsError … UNIQUE constraint failed: updates.scope_key, updates.commit_time`
  //     [observed — 2026-08-27, twice, session `01a04378-…`].
  //  2. `open <url>` then deep-links the route into the app that is now running, which is the same
  //     verb `navigate --cloud` runs and the one that loaded the project live.
  //
  // No `close` anywhere: that is the verb that ended the controller's own session and stranded the
  // app (S12). And no `exp+<slug>://` launcher form — the URL is the manifest-derived one.
  it(`relaunches the app and deep-links the URL, and never closes it`, async () => {
    writeCloudProject();
    mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [{ stdout: SESSION_LISTING }, { stdout: '{"success":true}' }, { stdout: '{"success":true}' }],
      (index) => index === 2 && appendBundledLine()
    );

    await expect(reloadAsync(projectRoot, cloudOptions({ json: true }))).resolves.toBe(EXIT_OK);
    const report = JSON.parse(printed());
    expect(report).toMatchObject({
      reloaded: true,
      method: 'device',
      // The debugger target list is not what decided this: a relaunched app re-registers under the
      // **same** page id, because Metro's per-device counter restarts with the app [observed —
      // 2026-08-27, live: `…ce-1` before the relaunch and `…ce-1` after it]. The proof is the one
      // the dev server can make on its own — it served the bundle again.
      verifiedBy: 'dev-server-bundle',
      platform: 'ios',
      deviceId: 'session-1',
      url: 'exp://tunnel.example/--/?',
      bundlesAfterReload: { observed: true, count: 1, line: BUNDLED_LINE },
    });
    const commands = spawnedCommands();
    expect(commands[1]).toContain('open host.exp.Exponent --platform ios --relaunch');
    expect(commands[1]).not.toContain('exp://');
    expect(commands[2]).toContain('open exp://tunnel.example/--/? --platform ios');
    expect(commands.join('\n')).not.toContain('agent-device@latest close');
  });

  // Both proofs are watched at once, and the first to answer ends the wait. Waiting out the whole
  // budget for the other one spent 90 s of a billed session on a reload that was already proved
  // [observed — 2026-08-27, live: `waitedMs: 89913` for a bundle seen in the first seconds].
  it(`stops waiting as soon as one of the two proofs arrives`, async () => {
    writeCloudProject();
    mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [{ stdout: SESSION_LISTING }, { stdout: '{"success":true}' }, { stdout: '{"success":true}' }],
      (index) => index === 2 && appendBundledLine()
    );

    await expect(
      reloadAsync(projectRoot, cloudOptions({ json: true, timeoutMs: 8000 }))
    ).resolves.toBe(EXIT_OK);
    expect(JSON.parse(printed()).waitedMs).toBeLessThan(4000);
  });

  // The deep link is the half that puts the app on the project, so a refusal there is its own
  // failure: the app is running its shell and not this project.
  it(`says which half of the relaunch failed`, async () => {
    writeCloudProject();
    mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue([
      { stdout: SESSION_LISTING },
      { stdout: '{"success":true}' },
      { stderr: 'Error (COMMAND_FAILED): Simulator device failed to open exp://x.', exitCode: 1 },
    ]);

    await expect(reloadAsync(projectRoot, cloudOptions({ json: true }))).resolves.toBe(
      EXIT_OUTCOME_FAILED
    );
    const device = JSON.parse(printed()).attempts.find(
      (attempt: { method: string }) => attempt.method === 'device'
    );
    expect(device).toMatchObject({ ok: false });
    expect(device.reason).toContain('the app was restarted');
    expect(device.reason).toContain('refused the link');
  });

  // The URL a device opens is not the URL this machine talks to. Without `--dev-server-url` the
  // host comes from the manifest the dev server builds from `getDevServerUrl()`, which is the
  // tunnel origin whenever a tunnel is up (wave 17, S3).
  it(`takes the host from the manifest when no flag named a dev server`, async () => {
    writeCloudProject();
    mockDevServer([], { manifestOrigin: 'https://chx3ba8-kudochien-8303.exp.direct' });
    jest.mocked(readDevServerLockAsync).mockResolvedValue({
      url: 'http://127.0.0.1:8081',
      port: 8081,
      pid: 1,
      startedAt: '2026-08-27T09:00:00.000Z',
      projectRoot,
    });
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [{ stdout: SESSION_LISTING }, { stdout: '{"success":true}' }, { stdout: '{"success":true}' }],
      (index) => index === 2 && appendBundledLine()
    );

    await expect(
      reloadAsync(projectRoot, cloudOptions({ json: true, devServerUrl: null }))
    ).resolves.toBe(EXIT_OK);
    expect(JSON.parse(printed()).url).toBe('exp://chx3ba8-kudochien-8303.exp.direct/--/?');
  });

  // The broadcast is asked and never sent, and the reason is the observation rather than an
  // assumption: the socket held no client, which is what a cloud session over a tunnel is
  // [observed — live staging, S12]. Wave 21 asks it rather than skipping it on the strength of
  // `--cloud`, because the flag names a *device backend* and not a fact about this socket.
  it(`sends no broadcast to a command socket a cloud session never registered on`, async () => {
    writeCloudProject();
    mockDevServer([]);
    const { socket, sent } = fakeSocket([{}]);
    mockConnect(socket);
    mockSpawnQueue(
      [{ stdout: SESSION_LISTING }, { stdout: '{"success":true}' }, { stdout: '{"success":true}' }],
      (index) => index === 2 && appendBundledLine()
    );

    await reloadAsync(projectRoot, cloudOptions({ json: true }));

    expect(sent).toEqual([]);
    const broadcast = JSON.parse(printed()).attempts.find(
      (attempt: { method: string }) => attempt.method === 'dev-server'
    );
    expect(broadcast).toMatchObject({ ok: false });
    expect(broadcast.reason).toContain('nothing to broadcast to');
  });

  // @ref llp/0005 §Two lists, one question. Never one number for two lists: "Apps connected 1" off
  // `/json/list` while broadcasting into an empty peer set is the reading that cost Kudo the loop.
  it(`reports the debugger targets and the command-socket clients as two facts`, async () => {
    writeCloudProject();
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [{ stdout: SESSION_LISTING }, { stdout: '{"success":true}' }, { stdout: '{"success":true}' }],
      (index) => index === 2 && appendBundledLine()
    );

    await reloadAsync(projectRoot, cloudOptions({ json: true }));

    expect(JSON.parse(printed())).toMatchObject({ appsConnected: 1, commandSocketClients: 0 });
  });

  it(`prints both lists in the human report`, async () => {
    writeCloudProject();
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [{ stdout: SESSION_LISTING }, { stdout: '{"success":true}' }, { stdout: '{"success":true}' }],
      (index) => index === 2 && appendBundledLine()
    );

    await reloadAsync(projectRoot, cloudOptions());

    expect(printed()).toContain('Apps connected 1');
    expect(printed()).toContain('Command socket 0');
  });

  // @ref llp/0005 §A cloud simulator requires a tunnel. The refusal has to come **before** the
  // relaunch: a run that stops the app and then finds out the URL is unusable is exactly S12.
  it(`refuses a dev server the session cannot reach, before touching the device`, async () => {
    writeCloudProject();
    mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue([{ stdout: SESSION_LISTING }]);

    const error = await reloadAsync(
      projectRoot,
      cloudOptions({ devServerUrl: 'http://127.0.0.1:8081' })
    ).catch((thrown) => thrown);

    expect(error.code).toBe('CLOUD_SIMULATOR_UNREACHABLE_DEV_SERVER');
    expect(spawnedCommands().join('\n')).not.toContain('agent-device');
  });

  // Nothing observed is the 22 band, and the report says which observations were made and which
  // could not be: an app that came back invisibly and an app that did not come back look the same
  // from here, and this command must not pick one.
  it(`exits 22 and names what was and was not observed`, async () => {
    writeCloudProject();
    mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue([
      { stdout: SESSION_LISTING },
      { stdout: '{"success":true}' },
      { stdout: '{"success":true}' },
    ]);

    await expect(
      reloadAsync(projectRoot, cloudOptions({ json: true, timeoutMs: 600 }))
    ).resolves.toBe(EXIT_OUTCOME_TIMEOUT);
    expect(JSON.parse(printed())).toMatchObject({
      reloaded: false,
      method: 'device',
      verifiedBy: null,
      bundlesAfterReload: { observed: false, count: 0 },
    });
    const explained = jest.mocked(console.error).mock.calls.flat().join('\n');
    expect(explained).toContain('was relaunched');
    expect(explained).toContain('no debugger target');
  });

  // @ref llp/0005 §Finding the session — S14. The controller names the session holding the device,
  // and binding the verb to it is the remedy. Starting a second session bills another machine.
  it(`binds the verb to the controller session that holds the device, once`, async () => {
    writeCloudProject();
    mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [
        { stdout: SESSION_LISTING },
        {
          stderr: 'Error (DEVICE_IN_USE): Device is already in use by session "default".',
          exitCode: 1,
        },
        { stdout: '{"success":true}' },
        { stdout: '{"success":true}' },
      ],
      (index) => index === 3 && appendBundledLine()
    );

    await expect(reloadAsync(projectRoot, cloudOptions({ json: true }))).resolves.toBe(EXIT_OK);
    const commands = spawnedCommands();
    expect(commands[1]).not.toContain('--session');
    expect(commands[2]).toContain('--session default');
    // And the session it was bound to carries into the deep link, which is the same device.
    expect(commands[3]).toContain('--session default');
    expect(commands).toHaveLength(4);
  });

  // A refused relaunch is not evidence that the app is still up: `--relaunch` terminates before it
  // launches. The report says that rather than claiming either state.
  it(`says the app may be off the screen when the relaunch is refused`, async () => {
    writeCloudProject();
    mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue([
      { stdout: SESSION_LISTING },
      { stderr: 'Error (COMMAND_FAILED): Simulator device failed to launch app.', exitCode: 1 },
    ]);

    await expect(reloadAsync(projectRoot, cloudOptions({ json: true }))).resolves.toBe(
      EXIT_OUTCOME_FAILED
    );
    const explained = jest.mocked(console.error).mock.calls.flat().join('\n');
    expect(explained).toContain('terminates the app before it launches it');
    expect(explained).toContain('eas simulator:exec');
  });

  it(`reaches the same one-verb relaunch when --method device names it`, async () => {
    writeCloudProject();
    mockDevServer([]);
    mockSpawnQueue(
      [{ stdout: SESSION_LISTING }, { stdout: '{"success":true}' }, { stdout: '{"success":true}' }],
      (index) => index === 2 && appendBundledLine()
    );

    await expect(
      reloadAsync(projectRoot, cloudOptions({ json: true, method: 'device' }))
    ).resolves.toBe(EXIT_OK);
    expect(spawnedCommands()[1]).toContain('--relaunch');
    // A pinned method never opens the command socket.
    expect(connectMessageSocketAsync).not.toHaveBeenCalled();
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §One ladder, chosen by the command socket — wave 21.
//
// `--cloud` used to change the ladder: it skipped the broadcast on the strength of the flag. The
// flag names which **device backend** may relaunch, and the rung is chosen by one observable fact —
// whether the dev server's client command socket holds a client. A cloud session that did register
// one is reloaded the cheap way, and a local app that did not is relaunched, because in both cases
// that is the mechanism that can reach the app.
describe('the rung the ladder picks', () => {
  const SESSION_LISTING = JSON.stringify({
    sessions: [
      {
        id: 'session-1',
        status: 'IN_PROGRESS',
        platform: 'IOS',
        type: 'agent-device',
        name: 'wave21',
        createdAt: '2026-08-27T09:00:00.000Z',
      },
    ],
  });

  it(`broadcasts on --cloud when the command socket does hold a client`, async () => {
    writeProject({ '/usr/bin/npx': '#!/bin/sh\n' });
    resetPackageRunnerCache();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () =>
        server.listing([RELOADED_EXPO_GO_TARGET])
      ).socket
    );
    mockSpawnQueue([{ stdout: SESSION_LISTING }]);

    await expect(
      reloadAsync(
        projectRoot,
        options({ json: true, cloud: true, devServerUrl: 'https://tunnel.example' })
      )
    ).resolves.toBe(EXIT_OK);
    expect(JSON.parse(printed())).toMatchObject({
      method: 'dev-server',
      verifiedBy: 'message-socket-peers',
      commandSocketClients: 1,
    });
    // No controller verb was spawned, so no billed session was touched.
    expect(spawn).not.toHaveBeenCalled();
  });

  // The other half of one ladder: the verification is the same on every rung. A `Bundled` line in
  // the dev server's captured output is the proof wave 19 added for a session with no debugger
  // target to wait for, and it is the same proof here — the local rungs simply have a better one
  // most of the time.
  it(`takes a bundle the dev server served as the proof on the local rung too`, async () => {
    const bundled = 'iOS Bundled 812ms node_modules/expo-router/entry.js (943 modules)';
    writeProject({ [detachedLogPath(projectRoot)]: 'Starting project at /project\n' });
    // The listing never changes, so there is no fresh debugger target to be had.
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () => {
        const file = detachedLogPath(projectRoot);
        fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8')}${bundled}\n`);
      }).socket
    );

    await expect(reloadAsync(projectRoot, options({ json: true, timeoutMs: 2000 }))).resolves.toBe(
      EXIT_OK
    );
    expect(JSON.parse(printed())).toMatchObject({
      reloaded: true,
      method: 'dev-server',
      // The mechanism keeps the label — peer churn is what this rung observed — and the bundle is
      // what the exit code was decided on, which the `bundlesAfterReload` object carries.
      verifiedBy: 'message-socket-peers',
      appsReconnected: 0,
      bundlesAfterReload: { observed: true, count: 1, line: bundled },
    });
  });

  // ...and with neither observation it is still 22, which is the hold F45 put in: peer churn proves
  // the app acted and never that it came back.
  it(`stays at 22 when neither a fresh target nor a bundle arrived`, async () => {
    writeProject({ [detachedLogPath(projectRoot)]: 'Starting project at /project\n' });
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }]).socket);

    await expect(reloadAsync(projectRoot, options({ json: true, timeoutMs: 600 }))).resolves.toBe(
      EXIT_OUTCOME_TIMEOUT
    );
    expect(JSON.parse(printed())).toMatchObject({
      reloaded: true,
      bundlesAfterReload: { observed: false },
    });
  });
});

// F95 — MAJOR, found by the live tier on 2026-08-27 and observed twice.
//
// The report said `verifiedBy: 'message-socket-peers'` while `appsReconnected: 0`. Both numbers were
// true of the run, and the report was still not honest: `appsReconnected` is the evidence for
// `fresh-debugger-target`, so a reader checking the label was checking it against a *different*
// signal's count — and the label's own count was nowhere in the payload at all.
//
// The rule this block pins (llp/0021 §An observed signal, or the band): `verifiedBy` may name only a
// signal whose own evidence is in the payload and non-empty. Every rung of the ladder, because "the
// dev-server rung is consistent" is the claim that was made before.
describe('the verification payload', () => {
  /**
   * The one invariant, applied to whatever a rung produced.
   *
   * Written as a function rather than repeated per test so that a rung added later cannot be added
   * without it — and so the failure message names the label and the count it could not show.
   */
  function expectVerificationIsBacked(report: ReloadResultJson): void {
    const evidence: Record<string, number> = {
      'message-socket-peers': report.commandSocketChurn.reconnected,
      'fresh-debugger-target': report.appsReconnected,
      'dev-server-bundle': report.bundlesAfterReload.count,
      // The relaunch's evidence is not a count: it is the attempt that stopped and started the app.
      'app-relaunch': report.attempts.filter((a) => a.method === 'device' && a.ok).length,
    };
    // `reloaded` is exactly "a label was earned", so the two can never disagree.
    expect(report.reloaded).toBe(report.verifiedBy != null);
    if (report.verifiedBy == null) {
      return;
    }
    expect(Object.keys(evidence)).toContain(report.verifiedBy);
    expect({
      verifiedBy: report.verifiedBy,
      evidence: evidence[report.verifiedBy],
    }).toEqual({ verifiedBy: report.verifiedBy, evidence: expect.any(Number) });
    expect(evidence[report.verifiedBy]).toBeGreaterThan(0);
    // And a zero on the other count is never left as a bare number.
    if (report.appsReconnected === 0) {
      expect(report.appsReconnectedReason).not.toBeNull();
    } else {
      expect(report.appsReconnectedReason).toBeNull();
    }
  }

  it('backs message-socket-peers with the churn count on the ordinary dev-server rung', async () => {
    writeProject();
    mockConnect(mockReloadingDevServer().socket);

    await expect(reloadAsync(projectRoot, options({ json: true }))).resolves.toBe(EXIT_OK);
    const report: ReloadResultJson = JSON.parse(printed());
    expectVerificationIsBacked(report);
    expect(report.verifiedBy).toBe('message-socket-peers');
    expect(report.commandSocketChurn).toEqual({
      observed: true,
      before: 1,
      after: 1,
      reconnected: 1,
      reason: null,
    });
  });

  // The live failure, reproduced: the bundle watch answers first and ends the debugger-target watch,
  // so `appsReconnected` is 0 for a run that was verified. The label keeps its name — peer churn is
  // what this rung observed — and the payload now carries the count behind it, plus the sentence that
  // says what the zero is.
  it('says why appsReconnected is zero when another proof ended that watch', async () => {
    const bundled = 'iOS Bundled 812ms node_modules/expo-router/entry.js (943 modules)';
    writeProject({ [detachedLogPath(projectRoot)]: 'Starting project at /project\n' });
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () => {
        const file = detachedLogPath(projectRoot);
        fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8')}${bundled}\n`);
      }).socket
    );

    await expect(reloadAsync(projectRoot, options({ json: true, timeoutMs: 2000 }))).resolves.toBe(
      EXIT_OK
    );
    const report: ReloadResultJson = JSON.parse(printed());
    expectVerificationIsBacked(report);
    expect(report.verifiedBy).toBe('message-socket-peers');
    expect(report.appsReconnected).toBe(0);
    expect(report.commandSocketChurn.reconnected).toBe(1);
    expect(report.appsReconnectedReason).toContain('serve a bundle first');
  });

  // The same run without `--json`, because the reader met the contradiction in the prose: "verified
  // by message-socket-peers" printed directly above "0 reconnected after the reload".
  it('prints the label with its own count, and never a bare zero under it', async () => {
    const bundled = 'iOS Bundled 812ms node_modules/expo-router/entry.js (943 modules)';
    writeProject({ [detachedLogPath(projectRoot)]: 'Starting project at /project\n' });
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(
      fakeSocket([{ 'socket#1': 'role=ios' }, { 'socket#4': 'role=ios' }], () => {
        const file = detachedLogPath(projectRoot);
        fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8')}${bundled}\n`);
      }).socket
    );

    await reloadAsync(projectRoot, options({ timeoutMs: 2000 }));

    expect(printed()).toContain('verified by message-socket-peers');
    expect(printed()).toContain("1 client(s) registered on the dev server's command socket");
    expect(printed()).not.toContain('0 reconnected after the reload');
    expect(printed()).toContain('serve a bundle first');
  });

  it('backs fresh-debugger-target with appsReconnected on the runtime rung', async () => {
    writeProject();
    const server = mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{}]).socket);
    jest
      .spyOn(require('../../cdpClient'), 'CdpClient')
      .mockImplementation(() => ({ evaluateAsync: jest.fn(async () => ({ value: 'ready', type: 'string' })) }) as any);
    setTimeout(() => server.listing([RELOADED_EXPO_GO_TARGET]), 10).unref();

    await expect(
      reloadAsync(projectRoot, options({ json: true, method: 'runtime' }))
    ).resolves.toBe(EXIT_OK);
    const report: ReloadResultJson = JSON.parse(printed());
    expectVerificationIsBacked(report);
    expect(report.verifiedBy).toBe('fresh-debugger-target');
    expect(report.appsReconnected).toBe(1);
    // A pinned `--method runtime` never opens the socket, so its evidence is `null` — nothing was
    // established either way — rather than a zero that would read as "the socket held no client".
    expect(report.commandSocketChurn.observed).toBeNull();
    expect(report.commandSocketChurn.reconnected).toBe(0);
    jest.restoreAllMocks();
  });

  it('backs app-relaunch with the attempt that stopped and started the app', async () => {
    writeProject();
    const server = mockDevServer([]);
    mockConnect(fakeSocket([{}]).socket);
    mockSpawnQueue(
      [{ stdout: BOOTED_SIMULATOR }, { stdout: '' }, { stdout: BOOTED_SIMULATOR }, { stdout: '' }],
      (index) => index === 2 && server.listing([RELOADED_EXPO_GO_TARGET])
    );

    await expect(reloadAsync(projectRoot, options({ json: true }))).resolves.toBe(EXIT_OK);
    const report: ReloadResultJson = JSON.parse(printed());
    expectVerificationIsBacked(report);
    expect(report.verifiedBy).toBe('app-relaunch');
  });

  // The false-green this closes on the way past. `peersChanged` was the old test, and a list changes
  // in two directions: an app that dropped its connection and did not come back satisfied it, and the
  // rung then reported the reload as observed off a client *leaving*.
  it('refuses the label when the only churn was a client leaving', async () => {
    writeProject();
    // One client before, none after, and the listing never changes — so nothing came back on either
    // list. The peers *did* change.
    mockDevServer([EXPO_GO_TARGET]);
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }, {}]).socket);

    // `22`, not `20`, and that moved with F97: the frame **was** delivered to a client this socket
    // had named, so a mechanism ran and its proof is what is missing. The label this test is about
    // is still refused — which is the whole assertion below — and the exit code now says "look
    // again" instead of "nothing ran".
    await expect(reloadAsync(projectRoot, options({ json: true, timeoutMs: 900 }))).resolves.toBe(
      EXIT_OUTCOME_TIMEOUT
    );
    const report: ReloadResultJson = JSON.parse(printed());
    expectVerificationIsBacked(report);
    expect(report.verifiedBy).toBeNull();
    expect(report.reloaded).toBe(false);
    expect(report.commandSocketChurn).toMatchObject({ observed: false, reconnected: 0 });
    expect(report.commandSocketChurn.reason).toContain('did not come back');
  });

  it('reports the socket as unasked rather than empty when the rung was skipped', async () => {
    writeProject();
    mockDevServer([EXPO_GO_TARGET], { bundle: 'broken' });
    mockConnect(fakeSocket([{ 'socket#1': 'role=ios' }]).socket);

    await reloadAsync(projectRoot, options({ json: true }));
    const report: ReloadResultJson = JSON.parse(printed());
    expectVerificationIsBacked(report);
    // Null and not false: nothing asked, so nothing was established either way.
    expect(report.commandSocketChurn.observed).toBeNull();
    expect(report.commandSocketChurn.reason).toContain('not asked');
    expect(report.appsReconnectedReason).toContain('no reload happened');
  });
});
