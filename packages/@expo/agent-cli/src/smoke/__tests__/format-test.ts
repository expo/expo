// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The two channels, over one run. The key set is asserted as an exact set, because that is the
// property the contract is: a caller reading `screenshot.ok` after a run that never reached a
// device branches on a value rather than on a missing key.

import { formatSmokeResult, smokeResultToJson } from '../format';
import { noScreenshot, type SmokeRun } from '../phases';
import type { SmokeOptions } from '../resolveOptions';

function options(overrides: Partial<SmokeOptions> = {}): SmokeOptions {
  return {
    route: null,
    platform: 'ios',
    cloud: 'fallback',
    bootstrap: false,
    windowMs: 3_000,
    timeoutMs: 60_000,
    screenshotPath: null,
    screenshot: true,
    devServerUrl: null,
    routeCheck: true,
    json: true,
    followups: false,
    ...overrides,
  };
}

function run(overrides: Partial<SmokeRun> = {}): SmokeRun {
  return {
    deviceBackend: null,
    outcome: 'passed',
    phases: [
      { id: 'dev-server', status: 'ok', ms: 12, reason: null },
      { id: 'bundler-ready', status: 'ok', ms: 4210, reason: null },
      { id: 'bundle', status: 'ok', ms: 48, reason: null },
      { id: 'app', status: 'ok', ms: 3, reason: null },
      { id: 'route', status: 'skipped', ms: 0, reason: 'no --route was given' },
      { id: 'runtime', status: 'ok', ms: 90, reason: null },
      { id: 'errors', status: 'ok', ms: 3000, reason: null },
      { id: 'screenshot', status: 'ok', ms: 400, reason: null },
    ],
    devServerUrl: 'http://127.0.0.1:8210',
    discovery: {
      reachable: true,
      targets: [],
      devServerUrl: 'http://127.0.0.1:8210',
      source: 'lock',
      discovered: true,
    },
    projectRootMatched: true,
    started: false,
    environment: { devServer: 'reused', device: 'reused', deviceChoice: null, cleanup: [] },
    appsConnected: 1,
    bundle: {
      outcome: 'ok',
      platform: 'ios',
      url: 'http://127.0.0.1:8210/index.bundle?platform=ios',
      error: null,
      waitedMs: 48,
    },
    route: null,
    routeCheck: null,
    deviceId: 'SIM-1',
    runtimeSupported: true,
    windowMs: 3_000,
    errors: [],
    screenshot: {
      path: '/project/.expo/agent-cli/smoke.png',
      ok: true,
      reason: null,
      platform: 'ios',
      deviceId: 'SIM-1',
      command: 'xcrun simctl io SIM-1 screenshot /project/.expo/agent-cli/smoke.png',
      bytes: 2048,
    },
    durationMs: 7800,
    ...overrides,
  };
}

describe(smokeResultToJson, () => {
  it(`prints one object with a stable set of keys`, () => {
    expect(Object.keys(smokeResultToJson(run(), options(), [])).sort()).toEqual([
      'appsConnected',
      'bundle',
      'devServerUrl',
      'deviceBackend',
      'deviceId',
      'durationMs',
      'environment',
      'errors',
      'followups',
      'ok',
      'outcome',
      'phases',
      'platform',
      'projectRootMatched',
      'route',
      'routeCheck',
      'runtimeSupported',
      'screenshot',
      'source',
      'started',
      'untrusted',
    ]);
  });

  it(`keeps the same key set for a run that reached nothing`, () => {
    const nothing = smokeResultToJson(
      run({
        outcome: 'failed',
        devServerUrl: 'http://127.0.0.1:8081',
        discovery: null,
        projectRootMatched: null,
        appsConnected: null,
        bundle: null,
        deviceId: null,
        runtimeSupported: null,
        windowMs: null,
        screenshot: noScreenshot('no dev server answered'),
      }),
      options(),
      []
    );

    expect(Object.keys(nothing).sort()).toEqual(
      Object.keys(smokeResultToJson(run(), options(), [])).sort()
    );
    expect(Object.keys(nothing.screenshot).sort()).toEqual([
      'bytes',
      'command',
      'deviceId',
      'ok',
      'path',
      'platform',
      'reason',
    ]);
  });

  it(`says ok exactly when the outcome passed`, () => {
    expect(smokeResultToJson(run(), options(), []).ok).toBe(true);
    expect(smokeResultToJson(run({ outcome: 'failed' }), options(), []).ok).toBe(false);
    expect(smokeResultToJson(run({ outcome: 'inconclusive' }), options(), []).ok).toBe(false);
  });

  // Zero errors and no window are opposite facts, and only one of them is evidence. Reporting a
  // window that never opened as `count: 0` is exactly the false green this command exists for.
  it(`reports a window that never opened as null, not as zero`, () => {
    const never = smokeResultToJson(run({ windowMs: null, errors: [] }), options(), []);

    expect(never.errors).toEqual({
      windowMs: null,
      count: null,
      failing: null,
      logs: null,
      records: [],
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate. Not `source`: React Native reports an
  // uncaught throw through the console path, so the second record below — a console record that
  // carried the error's own stack — is a crash and the third is a log.
  it(`counts what the gate fails on apart from what the app logged`, () => {
    const counted = smokeResultToJson(
      run({
        errors: [
          { source: 'exception', timestamp: 1, message: 'Error: BOOM', isError: true },
          { source: 'console', timestamp: 2, message: 'Error: THROWN', isError: true },
          { source: 'console', timestamp: 3, message: 'deprecated', isError: false },
        ],
      }),
      options(),
      []
    );

    expect(counted.errors).toMatchObject({ count: 3, failing: 2, logs: 1 });
  });

  // @ref llp/0008-guardrails.rfc.md — every string in the records came out of the app.
  it(`names the field that carries text the app produced`, () => {
    expect(smokeResultToJson(run(), options(), []).untrusted).toEqual(['errors.records']);
  });

  // The same object `dev:wait` and `runtime:reload` print, from the same function: one question
  // asked in three commands must not have three shapes.
  it(`prints the bundle in the shape dev:wait prints it`, () => {
    expect(Object.keys(smokeResultToJson(run(), options(), []).bundle).sort()).toEqual([
      'checked',
      'error',
      'ok',
      'platform',
      'reason',
      'url',
    ]);
  });

  it(`always has a route check object, even when no route was named`, () => {
    const report = smokeResultToJson(run(), options(), []);

    expect(report.routeCheck).toMatchObject({ checked: false, ok: null });
    expect(report.routeCheck.reason).toContain('no --route');
  });
});

describe(formatSmokeResult, () => {
  it(`leads with the verdict, then the dev server, then every phase`, () => {
    const lines = formatSmokeResult(run(), options()).split('\n');

    expect(lines[0]).toContain('passed');
    expect(lines[1]).toContain('http://127.0.0.1:8210');
    expect(lines[1]).toContain('via lock');
    expect(lines[2]).toContain('dev-server');
    expect(lines[2]).toContain('12ms');
  });

  it(`names every phase and what it answered`, () => {
    const printed = formatSmokeResult(run(), options());

    for (const id of [
      'dev-server',
      'bundler-ready',
      'bundle',
      'app',
      'route',
      'runtime',
      'errors',
      'screenshot',
    ]) {
      expect(printed).toContain(id);
    }
    expect(printed).toContain('skipped');
  });

  it(`says where the picture is when there is one, and nothing when there is not`, () => {
    expect(formatSmokeResult(run(), options())).toContain('/project/.expo/agent-cli/smoke.png');
    expect(
      formatSmokeResult(run({ screenshot: noScreenshot('no device') }), options())
    ).not.toContain('screenshot  /');
  });

  it(`says a dev server this run started, so the report is not read as an attach`, () => {
    expect(formatSmokeResult(run({ started: true }), options())).toContain('started by this run');
  });

  // @ref llp/0008-guardrails.rfc.md — an error message is a string the app wrote, and it is read
  // as data rather than as an instruction to whatever reads this report next.
  it(`fences what the app said in untrusted markers`, () => {
    const printed = formatSmokeResult(
      run({
        outcome: 'failed',
        errors: [
          {
            source: 'console',
            timestamp: 1,
            message: 'Error: BOOM',
            stack: 'at boom (a.tsx:1)',
            isError: true,
          },
        ],
      }),
      options()
    );

    expect(printed).toContain('BEGIN UNTRUSTED APP OUTPUT');
    expect(printed).toContain('Error: BOOM');
    expect(printed).toContain('END UNTRUSTED APP OUTPUT');
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment.
  describe('what the run did to the machine', () => {
    it(`names what it started and says it was put back`, () => {
      const printed = formatSmokeResult(
        run({
          started: true,
          deviceId: 'SIM-BOOTED',
          environment: {
            devServer: 'started',
            device: 'booted',
            deviceChoice: 'it has Expo Go installed',
            cleanup: [
              { resource: 'device', target: 'SIM-BOOTED', ok: true, reason: null, ms: 2100 },
              {
                resource: 'dev-server',
                target: 'http://127.0.0.1:8210',
                ok: true,
                reason: null,
                ms: 340,
              },
            ],
          },
        }),
        options()
      );

      expect(printed).toContain('environment');
      expect(printed).toContain('started the dev server');
      expect(printed).toContain('booted SIM-BOOTED');
      expect(printed).toContain('stopped again');
    });

    // The one line a reader must not miss, and the one the verdict deliberately does not carry:
    // the app is fine and there is a dev server on this machine that this run put there.
    it(`says what it left behind, on a run that passed`, () => {
      const printed = formatSmokeResult(
        run({
          started: true,
          environment: {
            devServer: 'started',
            device: 'reused',
            deviceChoice: null,
            cleanup: [
              {
                resource: 'dev-server',
                target: 'http://127.0.0.1:8210',
                ok: false,
                reason: 'SIGTERM was sent to 4242 and it was still running 10000ms later',
                ms: 10_000,
              },
            ],
          },
        }),
        options()
      );

      expect(printed).toContain('left behind');
      expect(printed).toContain('http://127.0.0.1:8210');
      expect(printed).toContain('still running');
    });

    // Most runs start nothing, and a line saying so every time would bury the runs that did.
    it(`says nothing at all when it started nothing`, () => {
      expect(formatSmokeResult(run(), options())).not.toContain('environment');
    });
  });
});
