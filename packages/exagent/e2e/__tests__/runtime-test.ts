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

/** A debugger target that looks like Expo Go, so the platform is placeable. */
const EXPO_GO_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  deviceName: 'iPhone 17 Pro',
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

  // The other half of "nobody to talk to", and a different answer: the dev server is up, so the
  // recovery is opening the app rather than starting a server. An agent that could not tell these
  // apart would restart a healthy dev server.
  it('exits 1 with a different code when the dev server has no app attached', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [] });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:eval', '1 + 1', '--dev-server-url', stub.url, '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(1);
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

  it('exits 1 when the dev server is up and nothing is attached', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [] });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:errors', '--dev-server-url', stub.url, '--fail-on-error', '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(1);
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
    // The stub lists a target and its inspector socket accepts the connection and then answers
    // nothing at all — which is exactly a runtime with no CDP debugger behind a listed page.
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });
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
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });
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
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });
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
