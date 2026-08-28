/* eslint-env jest */
// @ref llp/0005-runtime-loop-tools.rfc.md §The runtime loop
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
//
// `runtime:eval` and `runtime:errors` had no e2e suite: the two commands appeared in `wrapper-test`
// and `skills-test` only as names in a help listing, so nothing ran them through the published bin.
//
// **What this tier can ask them, and what it cannot.** llp/0002 §Tier 0 doubles the dev server, not
// the app: the stub carries no CDP inspector, so nothing downstream of a debugger *conversation* is
// reachable here and a successful `eval` is not a thing this file can produce. What is reachable is
// everything on the near side of that connection — the three states of "there is nobody to talk to"
// and the exit code each leaves the process with — and those are precisely the states a driving
// agent hits most often and the ones the contract is about.
import {
  executeExagentAsync,
  holdDevLockAsync,
  setupFixtureAsync,
  startStubDevServerAsync,
  type StubDevServer,
} from '../utils';

/**
 * A debugger target the default selector will consider.
 *
 * `reactNative.capabilities.nativePageReloads` is the gate: the selector skips every target without
 * it, because Metro also lists stale and internal pages (`createDefaultTargetSelector`). A fixture
 * missing it is not a connected app — it is a page no runtime command would ever talk to.
 */
const EXPO_GO_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  title: 'Expo Go',
  type: 'native',
  description: '',
  devtoolsFrontendUrl: '/devtools',
  reactNative: { capabilities: { nativePageReloads: true } },
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
};

/** Point the project's dev-server lock at the stub, the way an `exagent`-started server does. */
async function holdLockForAsync(projectRoot: string, stub: StubDevServer): Promise<() => void> {
  return await holdDevLockAsync(projectRoot, {
    url: stub.url,
    port: stub.port,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    projectRoot,
  });
}

/** A port nothing listens on, for the "no dev server" cases. */
const DEAD_URL = 'http://127.0.0.1:1';

describe('exagent runtime:eval', () => {
  it('exits 1 and names the command that starts one when no dev server answers', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['runtime:eval', '1 + 1', '--dev-server-url', DEAD_URL, '--json'],
      { reject: false }
    );

    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.error.code).toBe('NO_DEV_SERVER');
    expect(report.error.suggestedCommand).toBe('npx exagent dev --detach');
    expect(report.error.needsHuman).toBeFalsy();
  });

  // The other half of "nobody to talk to", and a different answer in both the code and the band: the
  // dev server is up, so the recovery is opening the app rather than starting a server, and a
  // reloading app makes an empty list a thing a second look can disagree with (F141, exit 22). An
  // agent that could not tell these apart would restart a healthy dev server.
  it('exits 22 with a different code when the dev server has no app attached', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [] });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:eval', '1 + 1', '--dev-server-url', stub.url, '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(22);
      const report = JSON.parse(result.stdout);
      expect(report.error.code).toBe('NO_APP_CONNECTED');
    } finally {
      await stub.close();
    }
  });

  it('reads the dev server off the project lock rather than assuming 8081', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [] });
    const release = await holdLockForAsync(projectRoot, stub);
    try {
      const result = await executeExagentAsync(projectRoot, ['runtime:eval', '1 + 1', '--json'], {
        reject: false,
      });

      // The lock was read: the failure names the stub's own port, not 8081.
      const report = JSON.parse(result.stdout);
      expect(report.error.code).toBe('NO_APP_CONNECTED');
      expect(report.error.message).toContain(`:${stub.port}`);
    } finally {
      release();
      await stub.close();
    }
  });

  it('refuses an invocation with no expression, before it opens a connection', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['runtime:eval', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(typeof report.error.message).toBe('string');
    // A usage error, so nothing was attempted: the dev server is never named.
    expect(report.error.code).not.toBe('NO_DEV_SERVER');
  });

  it('reports an unknown flag rather than passing it through as an expression', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['runtime:eval', '1', '--nope'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('--nope');
  });

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — the property, checked as
  // a property: a caller that committed to parsing stdout can parse a failure too.
  it('prints exactly one parseable object on stdout for every failure', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    for (const argv of [
      ['runtime:eval', '1 + 1', '--dev-server-url', DEAD_URL, '--json'],
      ['runtime:errors', '--dev-server-url', DEAD_URL, '--json'],
      ['runtime:eval', '--json'],
    ]) {
      const result = await executeExagentAsync(projectRoot, argv, { reject: false });
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      expect(Object.keys(JSON.parse(result.stdout))).toEqual(['error']);
    }
  });
});

describe('exagent runtime:errors', () => {
  it('exits 1 when no dev server answers, whatever --fail-on-error says', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['runtime:errors', '--dev-server-url', DEAD_URL, '--fail-on-error', '--json'],
      { reject: false }
    );

    // A tool error, not an outcome: the window never opened, so there is no outcome to report.
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error.code).toBe('NO_DEV_SERVER');
  });

  it('exits 22 when the dev server is up and nothing is attached', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [] });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:errors', '--dev-server-url', stub.url, '--fail-on-error', '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(22);
      expect(JSON.parse(result.stdout).error.code).toBe('NO_APP_CONNECTED');
    } finally {
      await stub.close();
    }
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Android — a gate given no observation must not exit 0.
  // This is the 20-vs-22 rule at the process boundary: 22 is "nothing was shown to be wrong and
  // nothing was proved right", and it is the answer whenever the window could not observe.
  it('exits 22, never 0, for a gate that could observe nothing', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    // A runtime with no debugger behind a listed page: the socket is open and every method comes
    // back -32601, which is what Expo Go for Android does.
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorSocket: 'no-debugger',
    });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        [
          'runtime:errors',
          '--dev-server-url',
          stub.url,
          '--duration',
          '400ms',
          '--fail-on-error',
          '--json',
        ],
        { reject: false }
      );

      expect(result.exitCode).toBe(22);
      expect(result.exitCode).not.toBe(0);
    } finally {
      await stub.close();
    }
  });

  it('exits 0 for the same window without the gate flag', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorSocket: 'no-debugger',
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:errors',
        '--dev-server-url',
        stub.url,
        '--duration',
        '400ms',
        '--json',
      ]);

      // An empty window is a report, not a failure: the command was asked to watch and it watched.
      expect(result.exitCode).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(Array.isArray(report.errors)).toBe(true);
    } finally {
      await stub.close();
    }
  });

  it('rejects a duration that is not one, before it connects to anything', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['runtime:errors', '--duration', 'soon', '--json'],
      { reject: false }
    );

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error.message).toContain('soon');
  });

  it('accepts a duration with a unit, which is what the help promises', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorSocket: 'no-debugger',
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:errors',
        '--dev-server-url',
        stub.url,
        '--duration',
        '1s',
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
    } finally {
      await stub.close();
    }
  });
});

describe('the runtime group at the process boundary', () => {
  it('resolves the space form to the same command as the colon form', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const colon = await executeExagentAsync(
      projectRoot,
      ['runtime:errors', '--dev-server-url', DEAD_URL, '--json'],
      { reject: false }
    );
    const space = await executeExagentAsync(
      projectRoot,
      ['runtime', 'errors', '--dev-server-url', DEAD_URL, '--json'],
      { reject: false }
    );

    expect(space.exitCode).toBe(colon.exitCode);
    expect(JSON.parse(space.stdout).error.code).toBe(JSON.parse(colon.stdout).error.code);
  });

  it('names the actions of the group for an action it does not have', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['runtime:evaluate', '1'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('runtime:eval');
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Two lists, one question — Kudo's cloud loop, K3.
//
// The runtime an expression lands in is Hermes, and finding that out cost a dogfooding session:
// there is no `require` and no `import()`, so every "reload it by hand" recipe written for Node or
// for a browser is unreachable, and the one door — `expo.reloadAppAsync()` — was findable only by
// dumping `Object.keys(expo)`.
describe('what runtime:eval says about the runtime it evaluates in', () => {
  it('documents the Hermes idioms, so the expo global is not a discovery', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['runtime:eval', '--help']);

    expect(result.stdout).toContain('Hermes');
    expect(result.stdout).toMatch(/no require/i);
    expect(result.stdout).toContain('Object.keys(expo)');
    expect(result.stdout).toContain('expo.reloadAppAsync()');
    // And the command that makes the manual call unnecessary.
    expect(result.stdout).toContain('npx exagent runtime:reload');
  });

  it('names the three reload mechanisms in runtime:reload --help', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['runtime:reload', '--help']);

    expect(result.stdout).toContain('auto (default), dev-server, runtime, or device');
    expect(result.stdout).toContain('expo.reloadAppAsync()');
    // What picks the rung, in the help rather than only in a failure (wave 21): the command socket,
    // and never `--cloud`, which names the device backend that may relaunch.
    expect(result.stdout).toMatch(/the command socket picks the rung/i);
    expect(result.stdout).toMatch(/the rung is the socket, not the location/i);
    // ...and what the rung that relaunches costs, where a caller is deciding.
    expect(result.stdout).toMatch(/costs the app's JavaScript state/i);
  });
});
