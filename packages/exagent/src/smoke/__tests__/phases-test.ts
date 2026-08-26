// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
//
// The outcome table. This is the half of `smoke` that can be wrong in a way nothing else notices:
// every phase is a function that is already tested where it lives, and what is decided *here* is
// which combination of their answers is a pass, a failure and an "I could not tell" — plus which
// phases stop the run and which are only reported.
//
// The dependencies are fakes rather than mocks of the real modules, which is what makes the table
// readable: a case is a set of answers and the verdict they add up to.

import type { ScreenshotResult } from '../../device/screenshot';
import type { OpenRouteResult } from '../../navigate/openRoute';
import type { BundleCheckResult } from '../../runtime/bundleCheck';
import type { DevServerDiscovery } from '../../runtime/devServer';
import type { RuntimeErrorRecord } from '../../runtime/runtimeErrorCollector';
import { runSmokePhasesAsync, smokeExitCode, type SmokeDeps, type SmokeRun } from '../phases';
import type { SmokeOptions } from '../resolveOptions';
import type { SmokePhaseId, SmokePhaseStatus } from '../types';

function options(overrides: Partial<SmokeOptions> = {}): SmokeOptions {
  return {
    route: null,
    platform: 'ios',
    start: false,
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

function discovery(overrides: Partial<DevServerDiscovery> = {}): DevServerDiscovery {
  return {
    reachable: true,
    targets: [],
    devServerUrl: 'http://127.0.0.1:8081',
    source: 'lock',
    discovered: true,
    ...overrides,
  };
}

function bundle(overrides: Partial<BundleCheckResult> = {}): BundleCheckResult {
  return {
    outcome: 'ok',
    platform: 'ios',
    url: 'http://127.0.0.1:8081/index.bundle?platform=ios',
    error: null,
    waitedMs: 12,
    ...overrides,
  };
}

function opened(overrides: Partial<OpenRouteResult> = {}): OpenRouteResult {
  return {
    route: '/',
    url: 'exp://127.0.0.1:8081/--/?',
    devServerUrl: 'http://127.0.0.1:8081',
    devServerSource: 'lock',
    devServerReachable: true,
    hostType: 'localhost',
    resolution: 'target app is Expo Go',
    target: 'expo go',
    platform: 'ios',
    deviceId: 'SIM-1',
    appId: null,
    command: 'xcrun simctl openurl SIM-1 exp://127.0.0.1:8081/--/?',
    exitCode: 0,
    stdout: '',
    stderr: '',
    routeCheck: { checked: true, ok: true, matched: '/', routeCount: 4, reason: null },
    isExpoGo: true,
    ...overrides,
  };
}

function screenshot(overrides: Partial<ScreenshotResult> = {}): ScreenshotResult {
  return {
    path: '/project/.expo/exagent/smoke.png',
    ok: true,
    reason: null,
    platform: 'ios',
    deviceId: 'SIM-1',
    command: 'xcrun simctl io SIM-1 screenshot /project/.expo/exagent/smoke.png',
    bytes: 1024,
    ...overrides,
  };
}

/**
 * One record the gate fails on.
 *
 * `source: 'console'` on purpose, and that is the finding this whole file turns on: React Native
 * does not deliver an uncaught throw as `Runtime.exceptionThrown`, it reports it through the
 * console path [observed — 2026-08-24, live]. A fixture that used `source: 'exception'` would be
 * a fixture of a runtime this command never talks to, and every assertion below would pass for a
 * gate that lets real crashes through.
 */
function record(overrides: Partial<RuntimeErrorRecord> = {}): RuntimeErrorRecord {
  return {
    source: 'console',
    timestamp: 1,
    message: 'Error: BOOM',
    stack: '  at boom (src/app/index.tsx:12:3)',
    isError: true,
    ...overrides,
  };
}

/** Every dependency answering the way a healthy project answers. */
function deps(overrides: Partial<SmokeDeps> = {}): SmokeDeps {
  let clock = 0;
  return {
    discoverDevServer: async () => discovery(),
    startDevServer: async () => ({ ok: true, devServerUrl: 'http://127.0.0.1:8081', reason: null }),
    waitForBundlerReady: async () => ({
      ready: true,
      projectRootMatched: true,
      reportedProjectRoot: '/project',
      timedOut: false,
      waitedMs: 5,
    }),
    checkEntryBundle: async () => bundle(),
    waitForAppConnection: async () => ({ appsConnected: 1, timedOut: false, waitedMs: 3 }),
    probeDevice: async () => ({ deviceId: 'SIM-1', reason: null }),
    openRoute: async (route) => opened({ route }),
    evaluate: async () => ({ ok: true, unsupported: false, reason: null }),
    collectErrors: async () => ({ ok: true, records: [], reason: null }),
    captureScreenshot: async () => screenshot(),
    // Monotonic and coarse, so every phase reports a duration a test can assert on.
    now: () => (clock += 10),
    ...overrides,
  };
}

/** One phase's status, by id, so a case reads as a table row. */
function statusOf(run: SmokeRun, id: SmokePhaseId): SmokePhaseStatus | undefined {
  return run.phases.find((phase) => phase.id === id)?.status;
}

describe(runSmokePhasesAsync, () => {
  it(`passes a healthy app, with every phase answered`, async () => {
    const run = await runSmokePhasesAsync(deps(), options());

    expect(run.outcome).toBe('passed');
    expect(statusOf(run, 'dev-server')).toBe('ok');
    expect(statusOf(run, 'bundler-ready')).toBe('ok');
    expect(statusOf(run, 'bundle')).toBe('ok');
    expect(statusOf(run, 'app')).toBe('ok');
    // No `--route`, so the route phase did not run — and says so rather than reading as a pass.
    expect(statusOf(run, 'route')).toBe('skipped');
    expect(statusOf(run, 'runtime')).toBe('ok');
    expect(statusOf(run, 'errors')).toBe('ok');
    expect(statusOf(run, 'screenshot')).toBe('ok');
    expect(run.screenshot.ok).toBe(true);
  });

  // The property that makes the phase list readable at all.
  // @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate — observed live, 2026-08-24. Every
  // phase has to be about the *same* dev server. `navigate` finds its own, so a run that had
  // settled on one in phase 1 went looking again in phase 4, found nothing, and exited 1 from a
  // run whose first three phases had all answered.
  it(`opens the route on the dev server this run settled on`, async () => {
    const openRoute = jest.fn(async (route: string) => opened({ route }));
    await runSmokePhasesAsync(
      deps({
        discoverDevServer: async () => discovery({ devServerUrl: 'http://127.0.0.1:8210' }),
        openRoute,
      }),
      options({ route: '/notes' })
    );

    expect(openRoute).toHaveBeenCalledWith('/notes', 'http://127.0.0.1:8210');
  });

  it(`reports every phase exactly once, in order, whatever happened`, async () => {
    const runs = await Promise.all([
      runSmokePhasesAsync(deps(), options()),
      runSmokePhasesAsync(
        deps({ discoverDevServer: async () => discovery({ reachable: false }) }),
        options()
      ),
      runSmokePhasesAsync(
        deps({ checkEntryBundle: async () => bundle({ outcome: 'broken' }) }),
        options()
      ),
      runSmokePhasesAsync(
        deps({
          waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 1 }),
        }),
        options()
      ),
    ]);

    for (const run of runs) {
      expect(run.phases.map((phase) => phase.id)).toEqual([
        'dev-server',
        'bundler-ready',
        'bundle',
        'app',
        'route',
        'runtime',
        'errors',
        'screenshot',
      ]);
    }
  });

  describe('the dev server', () => {
    it(`fails attach-only when none answers, and starts nothing`, async () => {
      const startDevServer = jest.fn();
      const run = await runSmokePhasesAsync(
        deps({
          discoverDevServer: async () => discovery({ reachable: false, reason: 'ECONNREFUSED' }),
          startDevServer,
        }),
        options()
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'dev-server')).toBe('failed');
      expect(startDevServer).not.toHaveBeenCalled();
      expect(run.started).toBe(false);
    });

    it(`starts one with --start, and reports that it did`, async () => {
      let reachable = false;
      const run = await runSmokePhasesAsync(
        deps({
          discoverDevServer: async () => {
            const found = discovery({ reachable });
            reachable = true;
            return found;
          },
        }),
        options({ start: true })
      );

      expect(run.outcome).toBe('passed');
      expect(run.started).toBe(true);
      expect(run.phases[0]!.reason).toContain('started for this run');
    });

    it(`fails when --start could not start one, and says why`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          discoverDevServer: async () => discovery({ reachable: false }),
          startDevServer: async () => ({
            ok: false,
            devServerUrl: null,
            reason: 'port 8081 is taken',
          }),
        }),
        options({ start: true })
      );

      expect(run.outcome).toBe('failed');
      expect(run.phases[0]!.reason).toContain('port 8081 is taken');
      expect(run.started).toBe(false);
    });
  });

  describe('the bundler', () => {
    // Decided rather than pending: no amount of looking again turns another project's dev server
    // into this one's, so it is `failed` and never `inconclusive` (llp/0010 §The second).
    it(`fails for another project's dev server, and reads nothing of its app`, async () => {
      const waitForAppConnection = jest.fn();
      const run = await runSmokePhasesAsync(
        deps({
          waitForBundlerReady: async () => ({
            ready: true,
            projectRootMatched: false,
            reportedProjectRoot: '/other',
            timedOut: false,
            waitedMs: 4,
          }),
          waitForAppConnection,
        }),
        options()
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'bundler-ready')).toBe('failed');
      expect(statusOf(run, 'bundle')).toBe('skipped');
      expect(waitForAppConnection).not.toHaveBeenCalled();
    });

    // `null` is not `false`: a dev server that named no project root has not been shown to be the
    // wrong one, and failing on undecidable would fail every dev server too old to send the header.
    it(`carries on when the project root could not be decided`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          waitForBundlerReady: async () => ({
            ready: true,
            projectRootMatched: null,
            reportedProjectRoot: null,
            timedOut: false,
            waitedMs: 4,
          }),
        }),
        options()
      );

      expect(run.outcome).toBe('passed');
      expect(run.projectRootMatched).toBeNull();
    });

    it(`is inconclusive when the wait expired, and failed when something else answered`, async () => {
      const expired = await runSmokePhasesAsync(
        deps({
          waitForBundlerReady: async () => ({
            ready: false,
            projectRootMatched: null,
            reportedProjectRoot: null,
            timedOut: true,
            waitedMs: 60_000,
            reason: 'still bundling',
          }),
        }),
        options()
      );
      const stranger = await runSmokePhasesAsync(
        deps({
          waitForBundlerReady: async () => ({
            ready: false,
            projectRootMatched: null,
            reportedProjectRoot: null,
            timedOut: false,
            waitedMs: 8,
            reason: 'answered "<!DOCTYPE html>" instead',
          }),
        }),
        options()
      );

      expect(expired.outcome).toBe('inconclusive');
      expect(stranger.outcome).toBe('failed');
    });
  });

  describe('the entry bundle', () => {
    // The gate's whole reason for existing. An app cannot be running code that does not compile,
    // so nothing after this is worth asking.
    it(`fails a bundle that does not compile, and reads no app afterwards`, async () => {
      const waitForAppConnection = jest.fn();
      const run = await runSmokePhasesAsync(
        deps({
          checkEntryBundle: async () =>
            bundle({
              outcome: 'broken',
              error: {
                type: 'TransformError',
                filename: 'src/app/notes.tsx',
                lineNumber: 77,
                column: 4,
                message: "SyntaxError: Unexpected keyword 'const'",
                snippet: null,
              },
            }),
          waitForAppConnection,
        }),
        options()
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'bundle')).toBe('failed');
      expect(run.phases.find((phase) => phase.id === 'bundle')!.reason).toContain(
        'src/app/notes.tsx:77:4'
      );
      expect(statusOf(run, 'app')).toBe('skipped');
      expect(waitForAppConnection).not.toHaveBeenCalled();
    });

    // Fail-open, unchanged from `dev:wait`: a dev server that answered nothing this CLI
    // understands has not shown the project to be broken. It does not *pass* either, because
    // nothing was proved.
    it(`is inconclusive for a bundle the dev server said nothing about`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          checkEntryBundle: async () =>
            bundle({ outcome: 'unknown', url: null, reason: 'no launchAsset.url' }),
        }),
        options()
      );

      expect(statusOf(run, 'bundle')).toBe('inconclusive');
      // The run went on: an unknown bundle is not a reason to stop reading the app.
      expect(statusOf(run, 'runtime')).toBe('ok');
      expect(run.outcome).toBe('passed');
    });

    it(`is inconclusive for a first build that was still running`, async () => {
      const run = await runSmokePhasesAsync(
        deps({ checkEntryBundle: async () => bundle({ outcome: 'timeout' }) }),
        options()
      );

      expect(run.outcome).toBe('inconclusive');
      expect(statusOf(run, 'app')).toBe('skipped');
    });
  });

  describe('the app', () => {
    // Friction run 1's F4, absorbed: a wait for an app cannot succeed while nothing is opening
    // one, so the gate opens one rather than spending its budget on a state it can change.
    it(`opens an app when none is attached, and passes once one is`, async () => {
      let connected = 0;
      const openRoute = jest.fn(async () => {
        connected = 1;
        return opened();
      });
      const run = await runSmokePhasesAsync(
        deps({
          waitForAppConnection: async () => ({
            appsConnected: connected,
            timedOut: connected === 0,
            waitedMs: 2,
          }),
          openRoute,
        }),
        options()
      );

      expect(openRoute).toHaveBeenCalledWith('/', 'http://127.0.0.1:8081');
      expect(run.outcome).toBe('passed');
      expect(run.appsConnected).toBe(1);
      expect(run.phases.find((phase) => phase.id === 'app')!.reason).toContain('to connect one');
    });

    it(`opens the route that was asked for, rather than the root, when connecting one`, async () => {
      let connected = 0;
      const openRoute = jest.fn(async (route: string) => {
        connected = 1;
        return opened({ route });
      });
      const run = await runSmokePhasesAsync(
        deps({
          waitForAppConnection: async () => ({
            appsConnected: connected,
            timedOut: false,
            waitedMs: 2,
          }),
          openRoute,
        }),
        options({ route: '/notes' })
      );

      expect(openRoute).toHaveBeenCalledTimes(1);
      expect(openRoute).toHaveBeenCalledWith('/notes', 'http://127.0.0.1:8081');
      expect(statusOf(run, 'route')).toBe('ok');
      expect(run.routeCheck).toMatchObject({ ok: true });
    });

    it(`is inconclusive when nothing is attached and there is no device to open one on`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 2 }),
          probeDevice: async () => ({
            deviceId: null,
            reason: 'no booted iOS simulator was found',
          }),
        }),
        options()
      );

      expect(run.outcome).toBe('inconclusive');
      expect(statusOf(run, 'app')).toBe('inconclusive');
      expect(statusOf(run, 'runtime')).toBe('skipped');
      expect(run.screenshot.ok).toBe(false);
      expect(run.screenshot.reason).toContain('no booted iOS simulator');
    });

    it(`fails when the device refused the link that would have opened one`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 2 }),
          openRoute: async () => opened({ exitCode: 4 }),
        }),
        options()
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'app')).toBe('failed');
    });

    // A device is still there, so the most useful thing left is a picture of what is on it.
    it(`still photographs the device when no app attached`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 2 }),
          openRoute: async () => opened(),
        }),
        options()
      );

      expect(run.outcome).toBe('inconclusive');
      expect(run.screenshot.ok).toBe(true);
      expect(statusOf(run, 'screenshot')).toBe('ok');
    });
  });

  describe('the route', () => {
    it(`opens it when an app is already attached`, async () => {
      const openRoute = jest.fn(async (route: string) => opened({ route }));
      const run = await runSmokePhasesAsync(deps({ openRoute }), options({ route: '/notes' }));

      expect(openRoute).toHaveBeenCalledWith('/notes', 'http://127.0.0.1:8081');
      expect(statusOf(run, 'route')).toBe('ok');
      expect(run.outcome).toBe('passed');
    });

    it(`fails when the device refused it, and reads nothing afterwards`, async () => {
      const evaluate = jest.fn();
      const run = await runSmokePhasesAsync(
        deps({ openRoute: async () => opened({ exitCode: 1 }), evaluate }),
        options({ route: '/notes' })
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'route')).toBe('failed');
      expect(statusOf(run, 'runtime')).toBe('skipped');
      expect(evaluate).not.toHaveBeenCalled();
      // The screen is still worth photographing: it says where the app actually is.
      expect(run.screenshot.ok).toBe(true);
    });

    // A route the project has not got is the caller's own argument being wrong, which is exit 1
    // and not a verdict on the project — so it leaves this function as an exception.
    it(`lets a route the project has not got out as a tool error`, async () => {
      await expect(
        runSmokePhasesAsync(
          deps({
            openRoute: async () => {
              throw new Error('ROUTE_NOT_FOUND');
            },
          }),
          options({ route: '/nope' })
        )
      ).rejects.toThrow('ROUTE_NOT_FOUND');
    });
  });

  describe('the runtime and the window', () => {
    // @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate. The regression this exists for,
    // measured live on 2026-08-24: an uncaught `throw` arrives as `source: 'console'`, because
    // React Native catches it and reports it through the console path rather than as
    // `Runtime.exceptionThrown`. A gate reading `source` passed seventeen crashes in one window.
    it(`fails on a throw React Native reported through the console path`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          collectErrors: async () => ({
            ok: true,
            records: [
              {
                source: 'console',
                timestamp: 1,
                message: 'Error: WAVE6_UNCAUGHT',
                stack: '  at setTimeout$argument_0 (src/app/index.tsx:112:18)',
                isError: true,
              },
            ],
            reason: null,
          }),
        }),
        options()
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'errors')).toBe('failed');
    });

    // The other channel is still read, because a runtime that uses it exists — a gate that only
    // watched the console path would be the same mistake pointed the other way.
    it(`fails on an uncaught exception in the window`, async () => {
      const run = await runSmokePhasesAsync(
        deps({ collectErrors: async () => ({ ok: true, records: [record()], reason: null }) }),
        options()
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'errors')).toBe('failed');
      expect(run.errors).toHaveLength(1);
    });

    // A project that logs one on purpose would otherwise never pass, and a `console.error` is
    // something the app chose to report rather than a crash.
    it(`passes a window holding only console.error calls, and counts them`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          collectErrors: async () => ({
            ok: true,
            records: [record({ message: 'deprecated', stack: undefined, isError: false })],
            reason: null,
          }),
        }),
        options()
      );

      expect(run.outcome).toBe('passed');
      expect(statusOf(run, 'errors')).toBe('ok');
      expect(run.errors).toHaveLength(1);
    });

    // @ref llp/0005-runtime-loop-tools.rfc.md §Android pass. Expo Go for Android acknowledges
    // `Runtime.enable` and reports nothing, so an empty window there is silence and not health.
    // This is the case that must never be a pass, whatever the window says.
    it(`never passes a runtime with no debugger, however empty the window`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          evaluate: async () => ({
            ok: false,
            unsupported: true,
            reason: 'the runtime answered Runtime.evaluate with "method not found"',
          }),
          collectErrors: async () => ({ ok: true, records: [], reason: null }),
        }),
        options({ platform: 'android' })
      );

      expect(run.outcome).toBe('inconclusive');
      expect(run.runtimeSupported).toBe(false);
      expect(statusOf(run, 'runtime')).toBe('inconclusive');
      expect(statusOf(run, 'errors')).toBe('inconclusive');
    });

    // The other half of the same rule: a runtime that cannot be read is still read *for
    // exceptions*, and one that arrives is a failure — that is a fact, not an absence.
    it(`still fails an unreadable runtime that did report an exception`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          evaluate: async () => ({ ok: false, unsupported: true, reason: 'method not found' }),
          collectErrors: async () => ({ ok: true, records: [record()], reason: null }),
        }),
        options()
      );

      expect(run.outcome).toBe('failed');
    });

    it(`is inconclusive when the window could not be opened at all`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          collectErrors: async () => ({ ok: false, records: [], reason: 'no target found' }),
        }),
        options()
      );

      expect(run.outcome).toBe('inconclusive');
      expect(statusOf(run, 'errors')).toBe('inconclusive');
    });

    it(`is inconclusive when the runtime did not answer for another reason`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          evaluate: async () => ({ ok: false, unsupported: false, reason: 'socket hang up' }),
        }),
        options()
      );

      expect(run.outcome).toBe('inconclusive');
      expect(run.runtimeSupported).toBeNull();
    });
  });

  describe('the screenshot', () => {
    // It is evidence attached to an answer, not the answer. A run that could not take one has
    // still established whether the app throws.
    it(`never decides the outcome`, async () => {
      const failed = await runSmokePhasesAsync(
        deps({ captureScreenshot: async () => screenshot({ ok: false, reason: 'xcrun refused' }) }),
        options()
      );

      expect(failed.outcome).toBe('passed');
      expect(statusOf(failed, 'screenshot')).toBe('skipped');
      expect(failed.screenshot.reason).toBe('xcrun refused');
    });

    it(`is skipped, with the flag named, for --no-screenshot`, async () => {
      const captureScreenshot = jest.fn();
      const run = await runSmokePhasesAsync(
        deps({ captureScreenshot }),
        options({ screenshot: false })
      );

      expect(captureScreenshot).not.toHaveBeenCalled();
      expect(statusOf(run, 'screenshot')).toBe('skipped');
      expect(run.screenshot.reason).toContain('--no-screenshot');
      expect(run.outcome).toBe('passed');
    });

    it(`looks for a device when no phase before it drove one`, async () => {
      const probeDevice = jest.fn(async () => ({ deviceId: 'SIM-9', reason: null }));
      const captureScreenshot = jest.fn(async () => screenshot({ deviceId: 'SIM-9' }));
      const run = await runSmokePhasesAsync(deps({ probeDevice, captureScreenshot }), options());

      expect(captureScreenshot).toHaveBeenCalledWith('SIM-9');
      expect(run.deviceId).toBeNull();
      expect(run.screenshot.deviceId).toBe('SIM-9');
    });
  });

  it(`times every phase and the run`, async () => {
    const run = await runSmokePhasesAsync(deps(), options());

    expect(run.durationMs).toBeGreaterThan(0);
    for (const phase of run.phases.filter((entry) => entry.status !== 'skipped')) {
      expect(phase.ms).toBeGreaterThanOrEqual(0);
    }
  });

  it(`gives every phase that did not run a reason`, async () => {
    const run = await runSmokePhasesAsync(
      deps({ discoverDevServer: async () => discovery({ reachable: false }) }),
      options()
    );

    for (const phase of run.phases.filter((entry) => entry.status === 'skipped')) {
      expect(phase.reason).toEqual(expect.any(String));
      expect(phase.reason).not.toBe('');
    }
  });
});

// @ref llp/0010-agent-conventions.rfc.md §Exit codes. Three answers, three codes, and the split
// between the last two is the whole reason the band exists: after `20` the next action is to fix
// something, and after `22` it is to look again. One test asserting "some non-zero code" would
// pass while the distinction was broken.
describe(smokeExitCode, () => {
  it.each([
    ['passed', 0],
    ['failed', 20],
    ['inconclusive', 22],
  ] as const)(`answers %s with %i`, (outcome, code) => {
    expect(smokeExitCode(outcome)).toBe(code);
  });

  it(`never answers 1, which is reserved for the command itself being wrong`, () => {
    for (const outcome of ['passed', 'failed', 'inconclusive'] as const) {
      expect(smokeExitCode(outcome)).not.toBe(1);
    }
  });

  // The end-to-end binding: a run's verdict and the code it leaves with are one decision.
  it.each([
    [{}, 0],
    [{ collectErrors: async () => ({ ok: true, records: [record()], reason: null }) }, 20],
    [{ checkEntryBundle: async () => bundle({ outcome: 'broken' }) }, 20],
    [{ discoverDevServer: async () => discovery({ reachable: false }) }, 20],
    [
      {
        evaluate: async () => ({ ok: false, unsupported: true, reason: 'method not found' }),
      },
      22,
    ],
    [{ checkEntryBundle: async () => bundle({ outcome: 'timeout' }) }, 22],
    [
      {
        waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 1 }),
        probeDevice: async () => ({ deviceId: null, reason: 'no simulator' }),
      },
      22,
    ],
  ])(`exits %#, which is code %i`, async (overrides, code) => {
    const run = await runSmokePhasesAsync(deps(overrides as Partial<SmokeDeps>), options());
    expect(smokeExitCode(run.outcome)).toBe(code);
  });
});
