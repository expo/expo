// @ref llp/0005-runtime-loop-tools.rfc.md §One preflight for the runtime family
// The one place the `runtime:*` commands ask "is there anything to talk to", and the one refusal
// they all print when there is not.

import { preflightRuntimeAsync } from '../preflight';

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
    expect(error.message).toContain('npx exagent dev --detach');
    expect(error.message).not.toContain('npx expo start');
    expect(error.suggestedCommand).toBe('npx exagent dev --detach');
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

  // @ref llp/0005 §A cloud simulator requires a tunnel — the F5x/S5 rule. A caller who passed
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

    expect(error.message).toContain('npx exagent dev --detach --tunnel');
    expect(error.message).toContain('npx exagent navigate / --cloud');
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
    expect(error.message).toContain('npx exagent navigate /');
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
    expect(error.suggestedCommand).toBe('npx exagent navigate / --android');
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
