// @ref llp/0005-runtime-loop-tools.rfc.md §One preflight for the runtime family
// The one place the `runtime:*` commands ask "is there anything to talk to", and the one refusal
// they all print when there is not.

import { EXIT_OUTCOME_TIMEOUT } from '../../exitCodes';
import { APP_RECONNECT_GRACE_MS } from '../devServer';
import { preflightRuntimeAsync, reachTheAppLadder } from '../preflight';

const TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  deviceName: 'iPhone 17',
  description: '',
  type: 'native',
  title: 'Expo Go',
  devtoolsFrontendUrl: '/devtools',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
};

const ANDROID_TARGET = {
  ...TARGET,
  id: '2',
  appId: 'host.exp.exponent',
  deviceName: 'sdk_gphone64_arm64 - 15 - API 35',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=2&page=1',
};

const devServerUrl = 'http://127.0.0.1:8081';

let originalFetch: typeof fetch | undefined;
/** Every URL the preflight asked for, which is how "one probe" is a testable claim. */
let requested: string[] = [];

/** Answer `GET /json/list` with these targets, or make the dev server unreachable with null. */
function mockDevServer(targets: unknown[] | null) {
  requested = [];
  globalThis.fetch = (async (url: string) => {
    requested.push(String(url));
    if (targets == null) {
      throw new Error('fetch failed');
    }
    return { ok: true, json: async () => targets };
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockDevServer([TARGET]);
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});

describe(preflightRuntimeAsync, () => {
  it(`should hand back the connection a command needs, so nothing resolves it twice`, async () => {
    const connection = await preflightRuntimeAsync({ need: 'debugger-target', devServerUrl });

    expect(connection).toMatchObject({
      devServerUrl,
      devServerSource: 'flag',
      named: true,
      reachable: true,
      targets: [TARGET],
      appTargets: [TARGET],
    });
  });

  // The reason this exists at all: `runtime:eval` used to read `/json/list` three times before it
  // opened a socket — once to find the dev server, once for the device index, once to require an
  // app — and each read could answer differently about which app was connected.
  it(`should read the debugger target list once`, async () => {
    await preflightRuntimeAsync({ need: 'debugger-target', devServerUrl, platform: 'ios' });

    expect(requested).toEqual([`${devServerUrl}/json/list`]);
  });

  it(`should scope the targets to the platform the caller named`, async () => {
    mockDevServer([TARGET, ANDROID_TARGET]);

    const connection = await preflightRuntimeAsync({
      need: 'debugger-target',
      devServerUrl,
      platform: 'android',
    });

    expect(connection.appTargets).toEqual([ANDROID_TARGET]);
    // Both lists are kept: the report owes the reader what else was attached.
    expect(connection.targets).toHaveLength(2);
  });
});

describe(`${preflightRuntimeAsync.name} with no dev server`, () => {
  it(`should name the dev server it probed and the command that starts one`, async () => {
    mockDevServer(null);

    const error = await preflightRuntimeAsync({ need: 'debugger-target', devServerUrl }).catch(
      (e) => e
    );

    expect(error.code).toBe('NO_DEV_SERVER');
    expect(error.message).toContain(devServerUrl);
    expect(error.message).toContain('npx @expo/agent-cli dev --detach');
    expect(error.message).not.toContain('npx expo start');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli dev --detach');
  });

  // Both halves of the family ask the same question, so the answer is the same object: an agent
  // branching on it must not need a per-command allowlist of shapes.
  it(`should carry the counts it observed, so a caller need not parse the prose`, async () => {
    mockDevServer(null);

    const error = await preflightRuntimeAsync({ need: 'dev-server', devServerUrl }).catch((e) => e);

    expect(error.data).toEqual({
      devServerUrl,
      devServerReachable: false,
      debuggerTargets: 0,
      commandSocketClients: null,
      platform: null,
    });
  });

  // @ref llp/0005 §Cloud simulator — the F5x/S5 rule. A caller who passed
  // `--cloud` is on a machine whose device is in a datacenter, so a suggestion that drops the flag
  // sends them to a local simulator they have not got, and one that drops `--tunnel` starts a dev
  // server the session cannot reach.
  it(`should keep --cloud and the tunnel in the ladder when the caller passed --cloud`, async () => {
    mockDevServer(null);

    const error = await preflightRuntimeAsync({
      need: 'dev-server',
      devServerUrl,
      cloud: true,
    }).catch((e) => e);

    expect(error.message).toContain('npx @expo/agent-cli dev --detach --tunnel');
    expect(error.message).toContain('npx @expo/agent-cli navigate / --cloud');
  });

  it(`should not retry a dev server that does not answer`, async () => {
    mockDevServer(null);

    const error = await preflightRuntimeAsync({
      need: 'debugger-target',
      devServerUrl,
      retryMs: 2000,
    }).catch((e) => e);

    expect(error.code).toBe('NO_DEV_SERVER');
    expect(requested).toHaveLength(1);
  });

  // `runtime:stop` stops an app on a device, and an app can be running with no dev server behind
  // it at all. The dev server is its evidence for *which* app, never a precondition.
  it(`should hand back an unreachable dev server when the command only wants the evidence`, async () => {
    mockDevServer(null);

    const connection = await preflightRuntimeAsync({ need: 'optional', devServerUrl });

    expect(connection.reachable).toBe(false);
    expect(connection.targets).toEqual([]);
    expect(connection.unreachableReason).toContain('fetch failed');
  });
});

describe(`${preflightRuntimeAsync.name} with no app connected`, () => {
  it(`should say which list is empty, on which dev server, and how to fill it`, async () => {
    mockDevServer([]);

    const error = await preflightRuntimeAsync({ need: 'debugger-target', devServerUrl }).catch(
      (e) => e
    );

    expect(error.code).toBe('NO_APP_CONNECTED');
    expect(error.message).toContain('no app is connected');
    expect(error.message).toContain(`${devServerUrl}/json/list`);
    expect(error.message).toContain('npx @expo/agent-cli navigate /');
    // Not a keypress in a terminal: a detached dev server has none, and a driving agent has no
    // keyboard for one that has (friction run 5, F48-5).
    expect(error.message).not.toContain('press "i"');
    expect(error.data).toEqual({
      devServerUrl,
      devServerReachable: true,
      debuggerTargets: 0,
      commandSocketClients: null,
      platform: null,
    });
  });

  it(`should wait out the reconnect window before it reports no app`, async () => {
    let reconnected = false;
    setTimeout(() => (reconnected = true), 60);
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => (reconnected ? [TARGET] : []),
    })) as unknown as typeof fetch;

    const connection = await preflightRuntimeAsync({
      need: 'debugger-target',
      devServerUrl,
      retryMs: 2000,
    });

    expect(connection.appTargets).toEqual([TARGET]);
  });

  it(`should say how long it kept asking`, async () => {
    mockDevServer([]);

    const error = await preflightRuntimeAsync({
      need: 'debugger-target',
      devServerUrl,
      retryMs: 300,
    }).catch((e) => e);

    expect(error.message).toContain('still empty 300ms later');
  });

  it(`should refuse only on the dev server for a command that starts an app itself`, async () => {
    mockDevServer([]);

    const connection = await preflightRuntimeAsync({ need: 'dev-server', devServerUrl });

    expect(connection.reachable).toBe(true);
    expect(connection.appTargets).toEqual([]);
  });

  // @ref llp/0010-agent-conventions.rfc.md §An empty target list is inconclusive — **F141.** A
  // `runtime:tree` run straight after a reload landed in the app's re-registration window and
  // reported exit 1, "no target". It recovered on a plain retry, four times out of five — and `1`
  // is the code that promises the opposite: running the same line again changes nothing.
  it(`should answer an empty list with 22, because a retry may answer`, async () => {
    mockDevServer([]);

    const error = await preflightRuntimeAsync({ need: 'debugger-target', devServerUrl }).catch(
      (e) => e
    );

    expect(error.exitCode).toBe(EXIT_OUTCOME_TIMEOUT);
    expect(error.message).toContain('re-registering');
  });

  // The dev server itself is the other half, and it stays 1: nothing answered, and asking again
  // inside a second does not start one. Pinned next to the case above so the two cannot merge.
  it(`should keep 1 for a dev server that is not there`, async () => {
    mockDevServer(null);

    const error = await preflightRuntimeAsync({ need: 'debugger-target', devServerUrl }).catch(
      (e) => e
    );

    expect(error.code).toBe('NO_DEV_SERVER');
    expect(error.exitCode).toBeUndefined();
  });

  // And so does the wrong-platform refusal: apps *are* connected, they are on another platform, and
  // that is a fact a second look reports identically. The fix is to change the line.
  it(`should keep 1 for apps that are all on another platform`, async () => {
    mockDevServer([TARGET]);

    const error = await preflightRuntimeAsync({
      need: 'debugger-target',
      devServerUrl,
      platform: 'android',
    }).catch((e) => e);

    expect(error.message).toContain('No android app is connected');
    expect(error.exitCode).toBeUndefined();
  });

  // The grace was `runtime:errors`' alone, which is why `runtime:tree` was the command that hit the
  // gap: it asked once and reported the answer. Every command that needs a runtime asks the same
  // question, so every one of them now waits out the same window (F39's mechanism, F141's reach).
  it(`should wait out the reconnect window without being asked to`, async () => {
    let reconnected = false;
    setTimeout(() => (reconnected = true), 60);
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => (reconnected ? [TARGET] : []),
    })) as unknown as typeof fetch;

    const connection = await preflightRuntimeAsync({ need: 'debugger-target', devServerUrl });

    expect(connection.appTargets).toEqual([TARGET]);
  });

  // A command that needs no runtime is not made to wait for one: `runtime:reload` can start the app
  // it finds nothing of, and `runtime:stop` calls an app that is not running a success.
  it.each([['dev-server'], ['optional']] as const)(
    `should not wait out that window for a %s command`,
    async (need) => {
      mockDevServer([]);
      const startedAt = Date.now();

      await preflightRuntimeAsync({ need, devServerUrl });

      expect(Date.now() - startedAt).toBeLessThan(APP_RECONNECT_GRACE_MS);
    }
  );
});

// @ref llp/0021-honest-reports.rfc.md §How they show up — F58, S5, F103,
// F142. The ladder already kept `--cloud` and the platform on `navigate`, and dropped the platform
// from the `dev` that comes before it — and a bare `dev` plans for whichever platform this machine's
// probe picks, so the first rung of the ladder out was a different run from the one asked for.
describe(reachTheAppLadder, () => {
  it.each([['ios'], ['android']] as const)(`keeps --%s on every rung, dev included`, (platform) => {
    for (const state of ['no-dev-server', 'no-app'] as const) {
      const ladder = reachTheAppLadder({ state, cloud: false, platform });

      expect(ladder).toContain(`npx @expo/agent-cli navigate / --${platform}`);
      if (state === 'no-dev-server') {
        expect(ladder).toContain(`npx @expo/agent-cli dev --detach --${platform}`);
      }
    }
  });

  // `--cloud` is not `dev`'s flag; what a cloud session needs from a dev server is a tunnel. Both
  // still have to be on the one line, in the order the CLI accepts them.
  it(`keeps the tunnel next to the platform for a cloud session`, () => {
    expect(reachTheAppLadder({ state: 'no-dev-server', cloud: true, platform: 'ios' })).toContain(
      'npx @expo/agent-cli dev --detach --tunnel --ios'
    );
  });

  it(`offers no platform flag when the caller named none`, () => {
    expect(reachTheAppLadder({ state: 'no-dev-server', cloud: false })).toContain(
      'npx @expo/agent-cli dev --detach"'
    );
  });
});

// @ref ./targetPlatform — friction run 6, F51. With an iOS simulator and an Android emulator on
// one dev server, a command told `--android` used to be handed whichever target came first.
describe(`${preflightRuntimeAsync.name} scoped to a platform`, () => {
  it(`should name the platform the connected app is actually on`, async () => {
    mockDevServer([TARGET]);

    const error = await preflightRuntimeAsync({
      need: 'debugger-target',
      devServerUrl,
      platform: 'android',
    }).catch((e) => e);

    expect(error.code).toBe('NO_APP_CONNECTED');
    expect(error.message).toContain('No android app is connected');
    expect(error.message).toContain('it is on ios');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli navigate / --android');
    // The count is of the list as the dev server gave it, so a caller can see that an app *is*
    // attached and that it is the wrong one.
    expect(error.data).toMatchObject({ debuggerTargets: 1, platform: 'android' });
  });

  it(`should say plainly when nothing about the connected app names a platform`, async () => {
    mockDevServer([{ ...TARGET, appId: 'com.example.app', deviceName: 'Ada’s phone' }]);

    const error = await preflightRuntimeAsync({
      need: 'debugger-target',
      devServerUrl,
      platform: 'android',
      // Empty on purpose: the device tools have nothing to say about this device either.
      deviceIndex: { iosNames: [], androidModels: [] },
    }).catch((e) => e);

    expect(error.code).toBe('NO_APP_CONNECTED');
    expect(error.message).toContain('could be shown to be running on android');
    // Never a guess in either direction.
    expect(error.message).not.toContain('is connected to the Expo dev server at');
  });
});

// The other half of `howToNameTheDevServer`: a caller who let this CLI find the dev server is told
// how to name one, and a caller who named it is not told to pass the flag they just passed
// [friction run 4].
describe(`${preflightRuntimeAsync.name} on a dev server nobody named`, () => {
  it(`should say how to name one when it discovered the URL itself`, async () => {
    mockDevServer(null);

    const error = await preflightRuntimeAsync({
      need: 'debugger-target',
      devServerUrl: null,
    }).catch((e) => e);

    expect(error.code).toBe('NO_DEV_SERVER');
    expect(error.message).toContain('--dev-server-url');
    expect(error.message).not.toContain('the one you named');
  });
});
