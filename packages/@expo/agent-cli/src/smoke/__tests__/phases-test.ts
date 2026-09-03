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
import {
  APP_ATTACH_TIMEOUT_MS,
  APP_SETTLE_MS,
  FIRST_BUNDLE_TIMEOUT_MS,
  runSmokePhasesAsync,
  smokeExitCode,
  type SmokeDeps,
  type SmokeRun,
} from '../phases';
import type { SmokeOptions } from '../resolveOptions';
import type { SmokePhaseId, SmokePhaseStatus } from '../types';

function options(overrides: Partial<SmokeOptions> = {}): SmokeOptions {
  return {
    route: null,
    platform: 'ios',
    cloud: 'fallback',
    // Off by default *in this table*, and on by default in the command: almost every case below is
    // about a machine that already has a dev server and a device, and a helper that bootstrapped
    // would make each of them assert the absence of a start it never needed.
    bootstrap: false,
    windowMs: 3_000,
    timeoutMs: 60_000,
    screenshotPath: null,
    screenshot: true,
    devServerUrl: null,
    routeCheck: true,
    // On by default here *and* in the command, unlike `bootstrap` above: this is the flag that
    // decides whether the four phases below the `app` one are about the code on disk, so a table
    // that defaulted it off would be a table of the bug it was added to remove.
    reload: true,
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
    deviceBackend: 'local-ios',
    hostType: 'localhost',
    connect: [{ target: 'expo-go', label: 'Expo Go', url: 'exp://127.0.0.1:8081' }],
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
    appAttached: false,
    // `smoke` has an app-connection phase of its own, so its opens never wait for one — and the
    // launcher-first ladder of F123 needs a budget to wait with, so it never fires here either.
    launch: null,
    adbPath: null,
    reverse: null,
    attach: {
      checked: false,
      confirmed: null,
      waitedMs: 0,
      targets: 0,
      recovered: false,
      alert: null,
      reason: 'this run did not wait for the app to attach',
    },
    ...overrides,
  };
}

function screenshot(overrides: Partial<ScreenshotResult> = {}): ScreenshotResult {
  return {
    path: '/project/.expo/agent-cli/smoke.png',
    ok: true,
    reason: null,
    platform: 'ios',
    deviceId: 'SIM-1',
    command: 'xcrun simctl io SIM-1 screenshot /project/.expo/agent-cli/smoke.png',
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
    stopDevServer: async () => ({ ok: true, target: 'http://127.0.0.1:8081', reason: null }),
    bootDevice: async (register) => {
      register({ deviceId: 'SIM-BOOTED', backend: 'local-ios' });
      return { ok: true, deviceId: 'SIM-BOOTED', backend: 'local-ios' as const, reason: null };
    },
    // Nothing to install by default: the device this run settled on already has the app.
    installNeededOnDevice: async () => false,
    installApp: async () => ({ ok: true, version: null, replaced: null, reason: null }),
    shutdownDevice: async (deviceId) => ({ ok: true, target: deviceId, reason: null }),
    // Settled by default: the wait before the picture has its own cases (F57).
    waitForStableTargets: async () => ({ stable: true }),
    waitForBundlerReady: async () => ({
      ready: true,
      projectRootMatched: true,
      reportedProjectRoot: '/project',
      timedOut: false,
      waitedMs: 5,
    }),
    checkEntryBundle: async () => bundle(),
    waitForAppConnection: async () => ({ appsConnected: 1, timedOut: false, waitedMs: 3 }),
    probeDevice: async () => ({ deviceId: 'SIM-1', backend: 'local-ios' as const, reason: null }),
    openRoute: async (route) => opened({ route }),
    // The ordinary case: the app that answered is one this project can run, with nothing to note.
    checkAppFitsProject: async () => ({ mismatch: null, note: null }),
    // A reload the dev server's own command socket proved, which is the healthy local case.
    reloadApp: async () => ({
      ok: true,
      verifiedBy: 'message-socket-peers' as const,
      knownTargetIds: ['page-1'],
      freshTargets: 0,
      commandSocketReconnected: true,
      bundleServed: false,
      reason: null,
    }),
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
    // The app was already attached, so it was put back on the served bundle before it was read.
    expect(statusOf(run, 'reload')).toBe('ok');
    // No `--route`, so the route phase did not run — and says so rather than reading as a pass.
    expect(statusOf(run, 'route')).toBe('skipped');
    expect(statusOf(run, 'runtime')).toBe('ok');
    expect(statusOf(run, 'errors')).toBe('ok');
    expect(statusOf(run, 'screenshot')).toBe('ok');
    expect(run.screenshot.ok).toBe(true);
  });

  // @ref llp/0021-honest-reports.rfc.md §The rules — F98,
  // the second live-cloud run.
  //
  // A healthy app opens nothing: the `app` phase finds it already connected and the `route` phase
  // is skipped, so the two steps that used to set these fields never run. The device was still
  // found and still photographed — the screenshot phase resolves one of its own — and a report that
  // left `deviceBackend` null said "no device was involved" over a run that had used a billed cloud
  // session for its picture [observed — live cloud, 2026-08-27: `deviceBackend: null` beside
  // `screenshot.command: "eas simulator:exec … screenshot"` and a 64 KB PNG].
  it(`names the device it photographed, even when it opened nothing`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        probeDevice: async () => ({
          deviceId: 'sess-live',
          backend: 'cloud' as const,
          reason: null,
        }),
        captureScreenshot: async () => screenshot({ deviceId: 'sess-live' }),
      }),
      options({ cloud: 'required' })
    );

    expect(statusOf(run, 'route')).toBe('skipped');
    expect(run.deviceBackend).toBe('cloud');
    expect(run.deviceId).toBe('sess-live');
  });

  // The other side of it: a run that found no device to photograph has no device to name, and
  // inventing one would be worse than the null this keeps.
  it(`names no device when there was none to find`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        probeDevice: async () => ({ deviceId: null, backend: null, reason: 'no booted device' }),
      }),
      options()
    );

    expect(run.deviceBackend).toBeNull();
    expect(run.deviceId).toBeNull();
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

    expect(openRoute).toHaveBeenCalledWith('/notes', 'http://127.0.0.1:8210', expect.any(Number));
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
        'reload',
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

    it(`starts one by default, and reports that it did`, async () => {
      let reachable = false;
      const run = await runSmokePhasesAsync(
        deps({
          discoverDevServer: async () => {
            const found = discovery({ reachable });
            reachable = true;
            return found;
          },
        }),
        options({ bootstrap: true })
      );

      expect(run.outcome).toBe('passed');
      expect(run.started).toBe(true);
      expect(run.environment.devServer).toBe('started');
      expect(statusOf(run, 'start-dev-server')).toBe('ok');
      expect(statusOf(run, 'dev-server')).toBe('ok');
    });

    it(`fails when it could not start one, and says why`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          discoverDevServer: async () => discovery({ reachable: false }),
          startDevServer: async () => ({
            ok: false,
            devServerUrl: null,
            reason: 'port 8081 is taken',
          }),
        }),
        options({ bootstrap: true })
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'start-dev-server')).toBe('failed');
      expect(run.phases[0]!.reason).toContain('port 8081 is taken');
      expect(run.started).toBe(false);
      expect(run.environment.devServer).toBe('failed');
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment.
  // Start what is missing, stop only what this run started, and leave what was already there.
  describe('the environment this run brings', () => {
    /** A machine with nothing on it: no dev server, and no device. */
    function bareMachine(overrides: Partial<SmokeDeps> = {}): Partial<SmokeDeps> {
      let reachable = false;
      let device: { deviceId: string | null; backend: 'local-ios' | null } = {
        deviceId: null,
        backend: null,
      };
      return {
        discoverDevServer: async () => {
          const found = discovery({ reachable });
          reachable = true;
          return found;
        },
        probeDevice: async () => ({ ...device, reason: device.deviceId ? null : 'no simulator' }),
        bootDevice: async (register) => {
          register({ deviceId: 'SIM-BOOTED', backend: 'local-ios' });
          device = { deviceId: 'SIM-BOOTED', backend: 'local-ios' };
          return { ok: true, deviceId: 'SIM-BOOTED', backend: 'local-ios' as const, reason: null };
        },
        // Nothing is attached until the run opens the app on the simulator it booted.
        waitForAppConnection: async () => ({
          appsConnected: device.deviceId ? 1 : 0,
          timedOut: false,
          waitedMs: 3,
        }),
        ...overrides,
      };
    }

    it(`starts the dev server and boots a device, then puts both back`, async () => {
      const stopDevServer = jest.fn(async () => ({
        ok: true,
        target: 'http://127.0.0.1:8081',
        reason: null,
      }));
      const shutdownDevice = jest.fn(async (deviceId: string) => ({
        ok: true,
        target: deviceId,
        reason: null,
      }));

      const run = await runSmokePhasesAsync(
        deps({ ...bareMachine(), stopDevServer, shutdownDevice }),
        options({ bootstrap: true })
      );

      expect(run.environment.devServer).toBe('started');
      expect(run.environment.device).toBe('booted');
      expect(stopDevServer).toHaveBeenCalled();
      expect(shutdownDevice).toHaveBeenCalledWith('SIM-BOOTED', 'local-ios');
      // Newest first: the device this run booted goes before the dev server it started, so nothing
      // is left talking to a bundler that has gone.
      expect(run.environment.cleanup.map((entry) => entry.resource)).toEqual([
        'device',
        'dev-server',
      ]);
    });

    it(`leaves a dev server and a device it found, and cleans nothing up`, async () => {
      const stopDevServer = jest.fn();
      const shutdownDevice = jest.fn();

      const run = await runSmokePhasesAsync(
        deps({ stopDevServer, shutdownDevice }),
        options({ bootstrap: true })
      );

      expect(run.environment.devServer).toBe('reused');
      expect(run.environment.device).toBe('reused');
      expect(stopDevServer).not.toHaveBeenCalled();
      expect(shutdownDevice).not.toHaveBeenCalled();
      expect(run.environment.cleanup).toEqual([]);
      // Neither bootstrap phase happened, so neither is reported — a `skipped` row for a step
      // nothing needed reads as a step that was owed and not done.
      expect(statusOf(run, 'start-dev-server')).toBeUndefined();
      expect(statusOf(run, 'boot-device')).toBeUndefined();
    });

    it(`boots nothing when the caller named the cloud as the device`, async () => {
      const bootDevice = jest.fn();
      const run = await runSmokePhasesAsync(
        deps({
          ...bareMachine(),
          bootDevice,
          probeDevice: async () => ({
            deviceId: 'sess-live',
            backend: 'cloud' as const,
            reason: null,
          }),
          waitForAppConnection: async () => ({ appsConnected: 1, timedOut: false, waitedMs: 3 }),
        }),
        options({ bootstrap: true, cloud: 'required' })
      );

      expect(bootDevice).not.toHaveBeenCalled();
      expect(run.environment.device).toBe('reused');
    });

    // A phone on the same network is a device this machine's tools cannot see and a *connected app*
    // all the same. Booting a simulator for it would spend a minute and then photograph an empty
    // screen to answer for the app that is really running.
    it(`boots nothing when an app is already attached`, async () => {
      const bootDevice = jest.fn();
      const run = await runSmokePhasesAsync(
        deps({
          bootDevice,
          probeDevice: async () => ({ deviceId: null, backend: null, reason: 'no simulator' }),
          waitForAppConnection: async () => ({ appsConnected: 1, timedOut: false, waitedMs: 3 }),
        }),
        options({ bootstrap: true })
      );

      expect(bootDevice).not.toHaveBeenCalled();
      expect(run.environment.device).toBe('absent');
      expect(statusOf(run, 'boot-device')).toBeUndefined();
    });

    // @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app. A boot that could
    // not have opened the app is worse than no boot: it costs the minute *and* answers nothing.
    // Declining is the right outcome, and the report has to say that rather than describing a
    // simulator that would not start.
    it(`reports a declined boot as a machine with nowhere to run the app`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          ...bareMachine({
            bootDevice: async () => ({
              ok: false,
              deviceId: null,
              backend: null,
              refused: true,
              choice: null,
              reason: 'no iOS simulator has Expo Go installed, so booting one would open nothing',
            }),
          }),
        }),
        options({ bootstrap: true })
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'boot-device')).toBe('failed');
      expect(run.phases.find((phase) => phase.id === 'boot-device')?.reason).toContain(
        'would open nothing'
      );
      // Nothing was booted, so nothing is `failed` about the device: the machine is as it was.
      expect(run.environment.device).toBe('absent');
      expect(run.environment.cleanup.map((entry) => entry.resource)).toEqual(['dev-server']);
    });

    it(`says why it chose the device it booted`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          ...bareMachine({
            bootDevice: async (register) => {
              register({ deviceId: 'SIM-BOOTED', backend: 'local-ios' });
              return {
                ok: true,
                deviceId: 'SIM-BOOTED',
                backend: 'local-ios' as const,
                reason: null,
                refused: false,
                choice: 'it has Expo Go installed',
              };
            },
          }),
        }),
        options({ bootstrap: true })
      );

      expect(run.environment.deviceChoice).toBe('it has Expo Go installed');
      expect(run.phases.find((phase) => phase.id === 'boot-device')?.reason).toContain(
        'because it has Expo Go installed'
      );
    });

    it(`fails the boot phase when the device would not come up, and skips what needed it`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          ...bareMachine({
            bootDevice: async () => ({
              ok: false,
              deviceId: null,
              backend: null,
              reason: 'no iOS runtime is installed',
            }),
          }),
        }),
        options({ bootstrap: true })
      );

      expect(run.outcome).toBe('failed');
      expect(statusOf(run, 'boot-device')).toBe('failed');
      expect(run.environment.device).toBe('failed');
      for (const id of ['app', 'route', 'runtime', 'errors', 'screenshot'] as SmokePhaseId[]) {
        expect(statusOf(run, id)).toBe('skipped');
      }
      // The dev server this run started still goes back, on the failing path.
      expect(run.environment.cleanup.map((entry) => entry.resource)).toEqual(['dev-server']);
    });

    // Registered before the resource is started, so a start that half-worked — a child that
    // published its lock and then died in the readiness wait — is still cleaned up.
    it(`stops a dev server whose start it could not finish`, async () => {
      const stopDevServer = jest.fn(async () => ({ ok: true, target: null, reason: null }));
      await runSmokePhasesAsync(
        deps({
          discoverDevServer: async () => discovery({ reachable: false }),
          startDevServer: async () => ({
            ok: false,
            devServerUrl: 'http://127.0.0.1:8081',
            reason: 'its bundler never answered',
          }),
          stopDevServer,
        }),
        options({ bootstrap: true })
      );

      expect(stopDevServer).toHaveBeenCalled();
    });

    // Reported, never swallowed: a leaked dev server is the caller's problem the moment they run
    // anything else, and a run that hid it would have them debug a port they never started.
    it(`reports a cleanup that failed, and keeps the verdict about the app`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          ...bareMachine(),
          stopDevServer: async () => ({
            ok: false,
            target: 'http://127.0.0.1:8081',
            reason: 'SIGTERM was sent to 4242 and it was still running',
          }),
        }),
        options({ bootstrap: true })
      );

      expect(run.outcome).toBe('passed');
      expect(run.environment.cleanup).toContainEqual(
        expect.objectContaining({
          resource: 'dev-server',
          ok: false,
          reason: expect.stringContaining('still running'),
        })
      );
    });

    // `--no-start` is the run this command used to be, and it has to stay reachable: a caller
    // verifying the dev server *they* started must not have one started for them.
    it(`starts and boots nothing with --no-start`, async () => {
      const startDevServer = jest.fn();
      const bootDevice = jest.fn();
      const run = await runSmokePhasesAsync(
        deps({ ...bareMachine(), startDevServer, bootDevice }),
        options({ bootstrap: false })
      );

      expect(run.outcome).toBe('failed');
      expect(startDevServer).not.toHaveBeenCalled();
      expect(bootDevice).not.toHaveBeenCalled();
      expect(run.environment).toMatchObject({ devServer: 'absent', device: 'absent', cleanup: [] });
    });

    // The bootstrap is not charged to `--timeout`: a cold simulator takes a minute to boot, and a
    // budget that paid for it would leave the phases the budget is *about* with nothing.
    it(`spends the bootstrap outside the run's budget`, async () => {
      let clock = 0;
      const budgets: number[] = [];
      let booted = false;
      const run = await runSmokePhasesAsync(
        deps({
          discoverDevServer: async () => discovery(),
          probeDevice: async () => ({
            deviceId: booted ? 'SIM-BOOTED' : null,
            backend: booted ? ('local-ios' as const) : null,
            reason: booted ? null : 'no simulator',
          }),
          // A boot that costs a minute of the clock this run reads.
          bootDevice: async (register) => {
            register({ deviceId: 'SIM-BOOTED', backend: 'local-ios' });
            clock += 60_000;
            booted = true;
            return {
              ok: true,
              deviceId: 'SIM-BOOTED',
              backend: 'local-ios' as const,
              reason: null,
            };
          },
          waitForAppConnection: async (_url, timeoutMs) => {
            budgets.push(timeoutMs);
            // Nothing until the run opened the app on the device it booted.
            return { appsConnected: booted ? 1 : 0, timedOut: false, waitedMs: 3 };
          },
          now: () => (clock += 10),
        }),
        options({ bootstrap: true, timeoutMs: 60_000 })
      );

      expect(run.outcome).toBe('passed');
      expect(run.environment.device).toBe('booted');
      // The wait after the app was opened is the first one the boot could have eaten, and it still
      // has most of the minute the caller asked for.
      expect(budgets[1]).toBeGreaterThan(50_000);
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
  // (2026-08-30). Coming up is not reading. A run that starts a dev server pays
  // for that dev server's **first compile**, and a run that boots a simulator pays for the app's
  // **first launch** on it; neither is a measurement of the app, and charging them to the window
  // meant for measuring it leaves the measurement with nothing.
  describe('what a cold start costs', () => {
    /** The budget each dependency was given, so the accounting is readable as a table. */
    function budgets() {
      const given: {
        bundlerReady: number[];
        bundle: number[];
        attach: number[];
        settle: number[];
      } = { bundlerReady: [], bundle: [], attach: [], settle: [] };
      return {
        given,
        deps: (clock: { ms: number }): Partial<SmokeDeps> => ({
          waitForBundlerReady: async (_url, timeoutMs) => {
            given.bundlerReady.push(timeoutMs);
            return {
              ready: true,
              projectRootMatched: true,
              reportedProjectRoot: '/project',
              timedOut: false,
              waitedMs: 5,
            };
          },
          checkEntryBundle: async (_url, timeoutMs) => {
            given.bundle.push(timeoutMs);
            // A cold first compile, on the clock this run reads.
            clock.ms += 100_000;
            return bundle();
          },
          waitForAppConnection: async (_url, timeoutMs) => {
            given.attach.push(timeoutMs);
            return { appsConnected: given.attach.length > 1 ? 1 : 0, timedOut: false, waitedMs: 3 };
          },
          waitForStableTargets: async (_url, timeoutMs) => {
            given.settle.push(timeoutMs);
            return { stable: true };
          },
        }),
      };
    }

    it(`gives the first compile of a dev server it started a budget of its own`, async () => {
      const clock = { ms: 0 };
      const { given, deps: budgeted } = budgets();
      let reachable = false;

      const run = await runSmokePhasesAsync(
        deps({
          ...budgeted(clock),
          discoverDevServer: async () => {
            const found = discovery({ reachable });
            reachable = true;
            return found;
          },
          probeDevice: async () => ({
            deviceId: 'SIM-1',
            backend: 'local-ios' as const,
            reason: null,
          }),
          now: () => (clock.ms += 10),
        }),
        options({ bootstrap: true, timeoutMs: 60_000 })
      );

      expect(run.environment.devServer).toBe('started');
      // Its own generous budget, like the boot — not the sixty seconds the caller gave the reads.
      expect(given.bundle[0]).toBe(FIRST_BUNDLE_TIMEOUT_MS);
      expect(given.bundlerReady[0]).toBe(FIRST_BUNDLE_TIMEOUT_MS);
      // …and the hundred seconds it spent are not taken off them: the run still passes, and the
      // settle wait after it still has a budget to wait with.
      expect(run.outcome).toBe('passed');
      expect(given.settle[0]).toBeGreaterThan(0);
    });

    // The other half. A dev server somebody else started has bundled already, or has not and that
    // is a fact about their dev server: this run is reading it, so `--timeout` is the right bound.
    it(`charges the compile of a dev server it found to the reading window`, async () => {
      const clock = { ms: 0 };
      const { given, deps: budgeted } = budgets();

      await runSmokePhasesAsync(
        deps({ ...budgeted(clock), now: () => (clock.ms += 10) }),
        options({ bootstrap: true, timeoutMs: 60_000 })
      );

      // What is left of the minute, rather than a minute: the phases before it spent a little.
      expect(given.bundle[0]).toBeGreaterThan(50_000);
      expect(given.bundle[0]).toBeLessThanOrEqual(60_000);
    });

    it(`gives the first launch onto a device it booted a budget of its own`, async () => {
      const clock = { ms: 0 };
      const { given, deps: budgeted } = budgets();
      let booted = false;

      const run = await runSmokePhasesAsync(
        deps({
          ...budgeted(clock),
          probeDevice: async () => ({
            deviceId: booted ? 'SIM-BOOTED' : null,
            backend: booted ? ('local-ios' as const) : null,
            reason: booted ? null : 'no simulator',
          }),
          bootDevice: async (register) => {
            register({ deviceId: 'SIM-BOOTED', backend: 'local-ios' });
            // A cold boot, on the clock.
            clock.ms += 60_000;
            booted = true;
            return {
              ok: true,
              deviceId: 'SIM-BOOTED',
              backend: 'local-ios' as const,
              reason: null,
            };
          },
          now: () => (clock.ms += 10),
        }),
        options({ bootstrap: true, timeoutMs: 60_000 })
      );

      expect(run.environment.device).toBe('booted');
      // The wait after the deep link, which is the app's first launch on a simulator that has just
      // come up. The probe before it is the short look, unchanged — and what is left of the cold
      // budget, because the open before it shares the same one.
      expect(given.attach[1]).toBeGreaterThan(APP_ATTACH_TIMEOUT_MS - 1_000);
      expect(given.attach[1]).toBeLessThanOrEqual(APP_ATTACH_TIMEOUT_MS);
      expect(run.outcome).toBe('passed');
    });

    // An app that is slow to attach to a dev server and a device that were both already there is
    // this run *reading* a slow app, and that is what the caller's budget is for.
    it(`charges the attach to the reading window when nothing was cold`, async () => {
      const clock = { ms: 0 };
      const { given, deps: budgeted } = budgets();

      await runSmokePhasesAsync(
        deps({
          ...budgeted(clock),
          // A warm dev server, so its compile is a lookup rather than the hundred seconds the
          // shared fake spends: the point of this case is what the *attach* is given.
          checkEntryBundle: async (_url, timeoutMs) => {
            given.bundle.push(timeoutMs);
            return bundle();
          },
          probeDevice: async () => ({
            deviceId: 'SIM-1',
            backend: 'local-ios' as const,
            reason: null,
          }),
          now: () => (clock.ms += 10),
        }),
        options({ bootstrap: true, timeoutMs: 60_000 })
      );

      expect(given.attach[1]).toBeLessThanOrEqual(60_000);
      expect(given.attach[1]).toBeGreaterThan(50_000);
    });

    // The whole point of the accounting, stated as the property rather than as a budget: after a
    // cold start *and* a cold boot, the phases that read the app still have the window the caller
    // asked for.
    it(`leaves the reading window intact after a cold start and a cold boot`, async () => {
      const clock = { ms: 0 };
      const { given, deps: budgeted } = budgets();
      let reachable = false;
      let booted = false;

      const run = await runSmokePhasesAsync(
        deps({
          ...budgeted(clock),
          discoverDevServer: async () => {
            const found = discovery({ reachable });
            reachable = true;
            return found;
          },
          startDevServer: async () => {
            clock.ms += 20_000;
            return { ok: true, devServerUrl: 'http://127.0.0.1:8081', reason: null };
          },
          probeDevice: async () => ({
            deviceId: booted ? 'SIM-BOOTED' : null,
            backend: booted ? ('local-ios' as const) : null,
            reason: booted ? null : 'no simulator',
          }),
          bootDevice: async (register) => {
            register({ deviceId: 'SIM-BOOTED', backend: 'local-ios' });
            clock.ms += 60_000;
            booted = true;
            return {
              ok: true,
              deviceId: 'SIM-BOOTED',
              backend: 'local-ios' as const,
              reason: null,
            };
          },
          now: () => (clock.ms += 10),
        }),
        options({ bootstrap: true, timeoutMs: 60_000 })
      );

      // Three minutes of coming up — a start, a compile and a boot — against a one-minute window.
      expect(run.outcome).toBe('passed');
      expect(given.settle[0]).toBe(APP_SETTLE_MS);
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment. The
  // deep link is a request, not a result: `simctl openurl` exits 0 as soon as the URL is handed
  // over, and on a simulator this run has just booted the app behind it may be a minute from
  // registering a debugger target — or may never register one, because it is not installed.
  describe('what counts as an app being there', () => {
    it(`never passes on the deep link alone: a target has to appear`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          probeDevice: async () => ({
            deviceId: 'SIM-BOOTED',
            backend: 'local-ios' as const,
            reason: null,
          }),
          // The open succeeds — exit code 0, a URL handed to the device — and nothing ever
          // attaches. This is Expo Go missing from a simulator, exactly.
          waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 1 }),
        }),
        options({ bootstrap: true })
      );

      expect(statusOf(run, 'app')).toBe('inconclusive');
      expect(run.outcome).toBe('inconclusive');
      expect(run.appsConnected).toBe(0);
      // And nothing after it claims to have read anything.
      for (const id of ['route', 'runtime', 'errors'] as SmokePhaseId[]) {
        expect(statusOf(run, id)).toBe('skipped');
      }
    });

    it(`passes only once the target list answers, and reports what opened it`, async () => {
      const seen: number[] = [];
      const run = await runSmokePhasesAsync(
        deps({
          probeDevice: async () => ({
            deviceId: 'SIM-BOOTED',
            backend: 'local-ios' as const,
            reason: null,
          }),
          waitForAppConnection: async () => {
            seen.push(seen.length);
            // Nothing on the first look; one target once the deep link has been opened.
            return { appsConnected: seen.length > 1 ? 1 : 0, timedOut: false, waitedMs: 3 };
          },
        }),
        options({ bootstrap: true })
      );

      expect(statusOf(run, 'app')).toBe('ok');
      expect(run.phases.find((phase) => phase.id === 'app')?.reason).toContain('to connect one');
      expect(run.appsConnected).toBe(1);
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment.
  // A cold Expo Go attaches to the dev server, *then* downloads and runs the bundle — and the
  // debugger target it registered on the way in goes away and comes back when the JS runtime is
  // created. A single read landing in that gap answers "No target found" about an app that is
  // running perfectly well.
  describe('the runtime of an app this run opened', () => {
    /** Deps for a run that opens the app itself, with an evaluate that answers on the nth try. */
    function readableOnAttempt(attempt: number, overrides: Partial<SmokeDeps> = {}) {
      let tries = 0;
      const seen = { tries: () => tries };
      return {
        seen,
        deps: deps({
          probeDevice: async () => ({
            deviceId: 'SIM-BOOTED',
            backend: 'local-ios' as const,
            reason: null,
          }),
          waitForAppConnection: jest
            .fn()
            .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
            .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 1 }),
          evaluate: async () => {
            tries += 1;
            return tries >= attempt
              ? { ok: true, unsupported: false, reason: null }
              : { ok: false, unsupported: false, reason: 'No target found.' };
          },
          ...overrides,
        }),
      };
    }

    it(`waits for the runtime to answer rather than deciding on one read`, async () => {
      const { seen, deps: fakes } = readableOnAttempt(3);

      const run = await runSmokePhasesAsync(fakes, options({ bootstrap: true }));

      expect(seen.tries()).toBe(3);
      expect(statusOf(run, 'runtime')).toBe('ok');
      expect(run.outcome).toBe('passed');
      expect(run.runtimeSupported).toBe(true);
    });

    // The limit stays: a wait that never answers is still `inconclusive`, and the reason is the
    // runtime's own rather than a sentence about waiting.
    it(`still reports a runtime that never answers, with its own reason`, async () => {
      // A clock that runs a minute per read, so the budget is spent in two of them rather than in
      // sixty real seconds of this suite's time.
      let clock = 0;
      const { deps: fakes } = readableOnAttempt(Number.MAX_SAFE_INTEGER, {
        now: () => (clock += 60_000),
      });

      const run = await runSmokePhasesAsync(fakes, options({ bootstrap: true }));

      expect(statusOf(run, 'runtime')).toBe('inconclusive');
      expect(run.phases.find((phase) => phase.id === 'runtime')?.reason).toContain(
        'No target found.'
      );
    });

    // @ref llp/0005-runtime-loop-tools.rfc.md §Android. A runtime with no debugger has *decided*, and asking it again
    // for thirty seconds would turn the one case this command exists to report into a hang.
    it(`asks a runtime with no debugger exactly once`, async () => {
      let tries = 0;
      const run = await runSmokePhasesAsync(
        deps({
          probeDevice: async () => ({
            deviceId: 'SIM-BOOTED',
            backend: 'local-ios' as const,
            reason: null,
          }),
          waitForAppConnection: jest
            .fn()
            .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
            .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 1 }),
          evaluate: async () => {
            tries += 1;
            return { ok: false, unsupported: true, reason: 'method not found' };
          },
        }),
        options({ bootstrap: true })
      );

      expect(tries).toBe(1);
      expect(run.runtimeSupported).toBe(false);
    });

    // An app that was already attached when this run arrived **and was not reloaded** is not one
    // this run is waiting on. Reading it once and reporting the answer is right, and `--no-reload`
    // is what puts the run in that state now: a reload leaves the app coming back, and an app that
    // is coming back gets the poll (@ref ./phases §RUNTIME_READY_TIMEOUT_MS).
    it(`asks once when the app was already there and nothing moved it`, async () => {
      let tries = 0;
      await runSmokePhasesAsync(
        deps({
          evaluate: async () => {
            tries += 1;
            return { ok: false, unsupported: false, reason: 'No target found.' };
          },
        }),
        options({ bootstrap: true, reload: false })
      );

      expect(tries).toBe(1);
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Loading the app is not navigating it —
  // 2026-09-01. `<scheme>://<route>` navigates an app that is already running against a
  // dev server; `<scheme>://expo-development-client/?url=<origin>` is what *loads* it. F123 built
  // that ladder into `openRouteAsync` and gated it on an attach budget — and `smoke` passed none,
  // so a cold development build got the link only a loaded app understands and sat on the dev
  // launcher's own screen.
  describe('loading the app rather than navigating it', () => {
    it(`gives the open a budget, so the loading link is opened first`, async () => {
      const budgets: number[] = [];
      let booted = false;

      await runSmokePhasesAsync(
        deps({
          discoverDevServer: async () => discovery(),
          probeDevice: async () => ({
            deviceId: booted ? 'SIM-BOOTED' : null,
            backend: booted ? ('local-ios' as const) : null,
            reason: booted ? null : 'no simulator',
          }),
          bootDevice: async (register) => {
            register({ deviceId: 'SIM-BOOTED', backend: 'local-ios' });
            booted = true;
            return {
              ok: true,
              deviceId: 'SIM-BOOTED',
              backend: 'local-ios' as const,
              reason: null,
            };
          },
          waitForAppConnection: async () => ({
            appsConnected: booted ? 1 : 0,
            timedOut: false,
            waitedMs: 3,
          }),
          openRoute: async (route, _url, attachBudgetMs) => {
            budgets.push(attachBudgetMs);
            return opened({ route });
          },
        }),
        options({ bootstrap: true })
      );

      // A device this run booted is a cold launch, so the open gets the cold budget rather than
      // whatever is left of the caller's reading window.
      // The cold budget, minus the tick the deadline was read on.
      expect(budgets).toHaveLength(1);
      expect(budgets[0]).toBeGreaterThan(APP_ATTACH_TIMEOUT_MS - 1_000);
      expect(budgets[0]).toBeLessThanOrEqual(APP_ATTACH_TIMEOUT_MS);
    });

    // A warm app on a warm device is this run *reading* something, so the caller's budget bounds
    // the open exactly as it bounds everything else it reads.
    it(`bounds the open by the reading window when nothing was cold`, async () => {
      const budgets: number[] = [];

      await runSmokePhasesAsync(
        deps({
          waitForAppConnection: jest
            .fn()
            .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
            .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 1 }),
          openRoute: async (route, _url, attachBudgetMs) => {
            budgets.push(attachBudgetMs);
            return opened({ route });
          },
        }),
        options({ bootstrap: true, timeoutMs: 60_000 })
      );

      expect(budgets).toHaveLength(1);
      expect(budgets[0]).toBeGreaterThan(50_000);
      expect(budgets[0]).toBeLessThanOrEqual(60_000);
    });

    // The guard for the false-green class the round went looking for. Measured on a real
    // development build: with the dev launcher on the screen the dev server lists **no debugger
    // target at all** — the launcher's own runtime registers none [observed — 2026-09-01,
    // `wave29-devclient/dcapp`]. So there is no launcher runtime for this gate to read by mistake,
    // and this pins the consequence rather than the cause: nothing green is reachable without a
    // target, whatever is on the screen.
    it(`reaches no green verdict while nothing is attached, however the open went`, async () => {
      const evaluate = jest.fn();
      const collectErrors = jest.fn();

      const run = await runSmokePhasesAsync(
        deps({
          probeDevice: async () => ({
            deviceId: 'SIM-1',
            backend: 'local-ios' as const,
            reason: null,
          }),
          // The open succeeded — the launcher took the link and showed its own screen — and the
          // project never loaded, so nothing registered a target.
          openRoute: async (route) => opened({ route, launch: null }),
          waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 1 }),
          evaluate,
          collectErrors,
        }),
        options({ bootstrap: true })
      );

      expect(run.outcome).not.toBe('passed');
      expect(run.runtimeSupported).toBeNull();
      // And neither reading phase was even asked: there was nothing to ask.
      expect(evaluate).not.toHaveBeenCalled();
      expect(collectErrors).not.toHaveBeenCalled();
    });
  });

  describe('the bundler', () => {
    // Decided rather than pending: no amount of looking again turns another project's dev server
    // into this one's, so it is `failed` and never `inconclusive` (llp/0010 §Other gates, in brief).
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

      expect(openRoute).toHaveBeenCalledWith('/', 'http://127.0.0.1:8081', expect.any(Number));
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
      expect(openRoute).toHaveBeenCalledWith('/notes', 'http://127.0.0.1:8081', expect.any(Number));
      expect(statusOf(run, 'route')).toBe('ok');
      expect(run.routeCheck).toMatchObject({ ok: true });
    });

    it(`is inconclusive when nothing is attached and there is no device to open one on`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 2 }),
          probeDevice: async () => ({
            backend: null,
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

      expect(openRoute).toHaveBeenCalledWith('/notes', 'http://127.0.0.1:8081', expect.any(Number));
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

    // @ref llp/0005-runtime-loop-tools.rfc.md §Android. Expo Go for Android acknowledges
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

    // `reload: false` so this stays a test of the *verdict*: a run that reloaded the app polls the
    // runtime for `RUNTIME_READY_TIMEOUT_MS` before it gives up, which is its own case above, and
    // spending that wait here would measure the poll rather than what the poll's answer decides.
    it(`is inconclusive when the runtime did not answer for another reason`, async () => {
      const run = await runSmokePhasesAsync(
        deps({
          evaluate: async () => ({ ok: false, unsupported: false, reason: 'socket hang up' }),
        }),
        options({ reload: false })
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
      const probeDevice = jest.fn(async () => ({
        deviceId: 'SIM-9',
        backend: 'local-ios' as const,
        reason: null,
      }));
      const captureScreenshot = jest.fn(async () => screenshot({ deviceId: 'SIM-9' }));
      const run = await runSmokePhasesAsync(deps({ probeDevice, captureScreenshot }), options());

      // The backend travels with the device: the picture is taken through a different tool for
      // each, and the phase that takes it must not guess.
      expect(captureScreenshot).toHaveBeenCalledWith('SIM-9', 'local-ios');
      // And it travels back out. This used to assert `null` — the device the screenshot phase found
      // was reported nowhere but inside the screenshot — and live that read as "no device was
      // involved" over a run that had driven a billed cloud session (F98).
      expect(run.deviceId).toBe('SIM-9');
      expect(run.deviceBackend).toBe('local-ios');
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
    [{ evaluate: async () => ({ ok: false, unsupported: true, reason: 'method not found' }) }, 22],
    [{ checkEntryBundle: async () => bundle({ outcome: 'timeout' }) }, 22],
    [
      {
        waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 1 }),
        probeDevice: async () => ({ deviceId: null, backend: null, reason: 'no simulator' }),
      },
      22,
    ],
  ])(`exits %#, which is code %i`, async (overrides, code) => {
    const run = await runSmokePhasesAsync(deps(overrides as Partial<SmokeDeps>), options());
    expect(smokeExitCode(run.outcome)).toBe(code);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app. A picture is the one
// piece of evidence a reader believes without checking, and a home screen looks exactly like an app
// that failed to render — so an `ok` on a run whose app never connected has to say what it is a
// picture of.
describe(`${runSmokePhasesAsync.name} and what the picture shows`, () => {
  it(`says the app was not connected, on a run where it was not`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 1 }),
        probeDevice: async () => ({
          deviceId: 'SIM-1',
          backend: 'local-ios' as const,
          reason: null,
        }),
      }),
      options()
    );

    const shot = run.phases.find((phase) => phase.id === 'screenshot');
    expect(shot?.status).toBe('ok');
    expect(shot?.reason).toContain('no app of this project was connected');
  });

  // The third case, and the one a screenshot captured: the loading link was opened, the app did
  // not finish loading, and what a development build shows then is **the dev launcher's own
  // screen**. Saying "no app was connected" is true and leaves the reader to wonder what they are
  // looking at; naming the launcher is the whole difference.
  it(`names the dev launcher when the loading link was opened and nothing loaded`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        probeDevice: async () => ({
          deviceId: 'SIM-1',
          backend: 'local-ios' as const,
          reason: null,
        }),
        openRoute: async (route) =>
          opened({
            route,
            isExpoGo: false,
            launch: {
              url: 'dcapp://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081',
              command: 'xcrun simctl openurl SIM-1 dcapp://expo-development-client/?url=…',
              exitCode: 0,
              attached: false,
              waitedMs: 20_000,
            },
          }),
        waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 1 }),
      }),
      options({ bootstrap: true })
    );

    const shot = run.phases.find((phase) => phase.id === 'screenshot');
    expect(shot?.status).toBe('ok');
    expect(shot?.reason).toContain('dev launcher');
  });

  it(`says nothing extra when the app was there`, async () => {
    const run = await runSmokePhasesAsync(deps(), options());

    expect(run.phases.find((phase) => phase.id === 'screenshot')).toMatchObject({
      status: 'ok',
      reason: null,
    });
  });
});

// @ref ../phases §APP_SETTLE_MS — friction run 6, F57. A run that opened the app itself
// photographed it while it was still loading, so the picture the gate hands back — the half of
// "does it work" that no exit code answers — was of a splash screen.
describe(`${runSmokePhasesAsync.name} and the app it opened`, () => {
  it(`waits for the app to stop re-registering when this run opened it`, async () => {
    const waits: number[] = [];
    await runSmokePhasesAsync(
      deps({
        // Nothing attached at first, so the run opens the app itself.
        waitForAppConnection: jest
          .fn()
          .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
          .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 1 }),
        waitForStableTargets: async (_url, timeoutMs) => {
          waits.push(timeoutMs);
          return { stable: true };
        },
      }),
      options()
    );

    // Once for the whole run, however many phases need it: it is one fact about one app.
    expect(waits).toHaveLength(1);
    expect(waits[0]).toBeGreaterThan(0);
  });

  // @ref ../phases §APP_SETTLE_MS — observed 2026-08-30, a cold-start run. The `app` phase
  // answered `ok` and the `runtime` phase two seconds later got `No target found`, so a run whose
  // own picture shows the app rendered reported `22`. The debugger target list is still churning
  // while an app boots, and the wait that was buying an honest picture has to come first.
  it(`waits before it reads the runtime, not only before the picture`, async () => {
    const order: string[] = [];
    await runSmokePhasesAsync(
      deps({
        waitForAppConnection: jest
          .fn()
          .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
          .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 1 }),
        waitForStableTargets: async () => {
          order.push('settle');
          return { stable: true };
        },
        evaluate: async () => {
          order.push('evaluate');
          return { ok: true, unsupported: false, reason: null };
        },
        captureScreenshot: async () => {
          order.push('screenshot');
          return screenshot();
        },
      }),
      options()
    );

    expect(order).toEqual(['settle', 'evaluate', 'screenshot']);
  });

  // `--no-reload`, because that is now the only way a run reads an app it did not move: an app it
  // reloaded is re-registering and owes the wait for the same reason a cold launch does.
  it(`does not spend the wait on an app that was already attached and not reloaded`, async () => {
    const waitForStableTargets = jest.fn(async () => ({ stable: true }));

    await runSmokePhasesAsync(deps({ waitForStableTargets }), options({ reload: false }));

    expect(waitForStableTargets).not.toHaveBeenCalled();
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
//
// The false green this phase was added to remove, and the one this command exists to prevent.
// Every phase below `app` reads the *running app*, and an app that was already attached when the
// run arrived is running whatever it last loaded. At the moment `smoke` is for — after an edit,
// before saying "done" — that is the bundle from before the edit.
//
// Observed on a plain Expo Go project [iOS 26.5 simulator, Expo Go SDK 57, 2026-09-03]: with a
// bare `throw new Error(...)` at the top of the entry component, `smoke --platform ios --no-start`
// reported `smoke passed` with `errors ok` at 3.1 s and exited 0, and its own screenshot showed
// the *previous* screen. Killing the app first made the identical run fail with the throw in the
// error window, which is what proved it was staleness and not the error reader.
describe(`${runSmokePhasesAsync.name} and the code on disk`, () => {
  it(`reloads an app that was already attached, before it reads it`, async () => {
    const reloadApp = jest.fn(async () => ({
      ok: true,
      verifiedBy: 'message-socket-peers' as const,
      knownTargetIds: ['page-1'],
      freshTargets: 0,
      commandSocketReconnected: true,
      bundleServed: false,
      reason: null,
    }));
    const run = await runSmokePhasesAsync(
      deps({
        discoverDevServer: async () => discovery({ devServerUrl: 'http://127.0.0.1:8210' }),
        reloadApp,
      }),
      options()
    );

    // On the dev server this run settled on, like every other phase.
    expect(reloadApp).toHaveBeenCalledWith('http://127.0.0.1:8210', expect.any(Number));
    expect(statusOf(run, 'reload')).toBe('ok');
    expect(run.reload.disposition).toBe('reloaded');
    expect(run.reload.verifiedBy).toBe('message-socket-peers');
    expect(run.outcome).toBe('passed');
  });

  // The reload has to come *before* the error window, or the window is of the session the reload
  // replaced and the whole phase buys nothing.
  it(`opens the error window after the reload, not before it`, async () => {
    const order: string[] = [];
    await runSmokePhasesAsync(
      deps({
        reloadApp: async () => {
          order.push('reload');
          return {
            ok: true,
            verifiedBy: 'message-socket-peers' as const,
            knownTargetIds: [],
            freshTargets: 0,
            commandSocketReconnected: true,
            bundleServed: false,
            reason: null,
          };
        },
        collectErrors: async () => {
          order.push('errors');
          return { ok: true, records: [], reason: null };
        },
      }),
      options()
    );

    expect(order).toEqual(['reload', 'errors']);
  });

  // And before the route, because a reload sends the app back to its initial route: reloading
  // after the open would throw away the screen the caller asked for.
  it(`reloads before it opens the route`, async () => {
    const order: string[] = [];
    await runSmokePhasesAsync(
      deps({
        reloadApp: async () => {
          order.push('reload');
          return {
            ok: true,
            verifiedBy: 'message-socket-peers' as const,
            knownTargetIds: [],
            freshTargets: 0,
            commandSocketReconnected: true,
            bundleServed: false,
            reason: null,
          };
        },
        openRoute: async (route) => {
          order.push('route');
          return opened({ route });
        },
      }),
      options({ route: '/notes' })
    );

    expect(order).toEqual(['reload', 'route']);
  });

  // An app this run opened fetched the served bundle on its way up, so there is no stale session
  // to replace and a reload would cost a second load to reach the state the run is already in.
  it(`does not reload an app it opened itself`, async () => {
    const reloadApp = jest.fn();
    const run = await runSmokePhasesAsync(
      deps({
        waitForAppConnection: jest
          .fn<Promise<{ appsConnected: number; timedOut: boolean; waitedMs: number }>, []>()
          .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
          .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 2 }),
        reloadApp,
      }),
      options()
    );

    expect(reloadApp).not.toHaveBeenCalled();
    expect(statusOf(run, 'reload')).toBe('skipped');
    expect(run.reload.disposition).toBe('not-needed');
    expect(run.outcome).toBe('passed');
  });

  // @ref llp/0021-honest-reports.rfc.md §The rules band. The whole point: a reload nothing was
  // seen to come of leaves the run unable to say which session the window below is of, and a gate
  // that cannot say that must not report that the app is fine. `inconclusive` rather than
  // `failed` — nothing has been shown to be *wrong*, and the next action is to look again.
  it(`will not pass a run whose reload was never proved`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        reloadApp: async () => ({
          ok: false,
          verifiedBy: null,
          knownTargetIds: ['page-1'],
          freshTargets: 0,
          commandSocketReconnected: false,
          bundleServed: false,
          reason: 'no client reconnected',
        }),
      }),
      options()
    );

    expect(statusOf(run, 'reload')).toBe('inconclusive');
    expect(run.reload.disposition).toBe('unproved');
    expect(run.reload.verifiedBy).toBeNull();
    expect(run.outcome).toBe('inconclusive');
    expect(smokeExitCode(run.outcome)).toBe(22);
  });

  // A real error still decides the run, whatever the reload did: an app that threw has been shown
  // to be broken, and "which session" is no longer the open question.
  it(`still fails on an error, even when the reload was not proved`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        reloadApp: async () => ({
          ok: false,
          verifiedBy: null,
          knownTargetIds: [],
          freshTargets: 0,
          commandSocketReconnected: false,
          bundleServed: false,
          reason: 'nothing came of it',
        }),
        collectErrors: async () => ({ ok: true, records: [record()], reason: null }),
      }),
      options()
    );

    expect(run.outcome).toBe('failed');
    expect(smokeExitCode(run.outcome)).toBe(20);
  });

  // `--no-reload`. The one question a reload destroys is "is the app throwing right now, where I
  // navigated it to by hand", so the caller has to be able to say no — and the row then says which
  // of the two questions the run answered rather than reading as a step that was owed.
  it(`reads the app where it is when --no-reload says to`, async () => {
    const reloadApp = jest.fn();
    const run = await runSmokePhasesAsync(deps({ reloadApp }), options({ reload: false }));

    expect(reloadApp).not.toHaveBeenCalled();
    expect(statusOf(run, 'reload')).toBe('skipped');
    expect(run.reload.disposition).toBe('declined');
    expect(run.phases.find((phase) => phase.id === 'reload')?.reason).toContain('--no-reload');
    // Still a pass: the caller asked about the session that is running, and it was read.
    expect(run.outcome).toBe('passed');
  });

  // The proof is carried, not summarized. A label with nothing behind it is the shape llp/0021
  // exists to remove, so what the run reports is the evidence the label rests on.
  it(`carries the evidence the reload label rests on`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        reloadApp: async () => ({
          ok: true,
          verifiedBy: 'fresh-debugger-target' as const,
          knownTargetIds: ['page-1', 'page-2'],
          freshTargets: 1,
          commandSocketReconnected: false,
          bundleServed: false,
          reason: null,
        }),
      }),
      options()
    );

    expect(run.reload.verifiedBy).toBe('fresh-debugger-target');
    expect(run.reload.freshTargets).toBe(1);
    expect(run.reload.knownTargetIds).toEqual(['page-1', 'page-2']);
  });

  // A proved reload leaves the app re-registering exactly the way a cold launch does, so it owes
  // the same settle and the same runtime-ready poll — a single read landing in that gap answers
  // "No target found" about an app that is coming back fine (@ref ./phases §APP_SETTLE_MS).
  it(`waits for the app to settle after a reload it proved`, async () => {
    const waitForStableTargets = jest.fn(async () => ({ stable: true }));
    await runSmokePhasesAsync(deps({ waitForStableTargets }), options());

    expect(waitForStableTargets).toHaveBeenCalled();
  });

  // And does not wait on one it did not: an app that never acted is not coming up, so the wait
  // would spend the caller's budget proving nothing.
  it(`does not wait on a reload that was never proved`, async () => {
    const waitForStableTargets = jest.fn(async () => ({ stable: true }));
    await runSmokePhasesAsync(
      deps({
        waitForStableTargets,
        reloadApp: async () => ({
          ok: false,
          verifiedBy: null,
          knownTargetIds: [],
          freshTargets: 0,
          commandSocketReconnected: false,
          bundleServed: false,
          reason: 'nothing came of it',
        }),
      }),
      options()
    );

    expect(waitForStableTargets).not.toHaveBeenCalled();
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
//
// The other half of that section. Not opening Expo Go stops this gate *choosing* the wrong app; it
// does nothing about an Expo Go that is already attached, which is the state `expo start --ios`
// leaves behind and the one an agent is most likely to inherit. Reading that runtime answers about
// Expo Go, not about a project whose native code Expo Go does not contain.
//
// Live: with Expo Go opened by hand against an Expo-Go-incompatible project, every phase answered
// and the gate reported `passed` at exit 0 [observed — iOS 26.5 simulator, 2026-09-03].
describe(`${runSmokePhasesAsync.name} and whether the app fits the project`, () => {
  const MISMATCH =
    'the app that answered is Expo Go, and this project cannot run in Expo Go — its native code is not in that runtime';

  it(`will not pass a run whose runtime is an app the project cannot run`, async () => {
    const run = await runSmokePhasesAsync(
      deps({ checkAppFitsProject: async () => ({ mismatch: MISMATCH, note: null }) }),
      options()
    );

    expect(statusOf(run, 'app')).toBe('inconclusive');
    expect(run.phases.find((phase) => phase.id === 'app')?.reason).toBe(MISMATCH);
    expect(run.outcome).toBe('inconclusive');
    expect(smokeExitCode(run.outcome)).toBe(22);
  });

  // The window is still opened and still reported, exactly as it is for a runtime with no debugger:
  // an empty window costs one wait and the report is more useful with it. What it must not do is
  // decide the verdict.
  it(`still reads the app it found, and still photographs it`, async () => {
    const run = await runSmokePhasesAsync(
      deps({ checkAppFitsProject: async () => ({ mismatch: MISMATCH, note: null }) }),
      options()
    );

    expect(statusOf(run, 'errors')).toBe('ok');
    expect(statusOf(run, 'screenshot')).toBe('ok');
    expect(run.screenshot.ok).toBe(true);
  });

  // An error is an error. Expo Go threw while running this project's bundle, which is a fact about
  // the code whichever app was holding it — so `failed` outranks the mismatch.
  it(`still fails on an error the wrong app reported`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        checkAppFitsProject: async () => ({ mismatch: MISMATCH, note: null }),
        collectErrors: async () => ({ ok: true, records: [record()], reason: null }),
      }),
      options()
    );

    expect(run.outcome).toBe('failed');
    expect(smokeExitCode(run.outcome)).toBe(20);
  });

  // An app this run opened itself is asked the same question: the open picks the target from the
  // same decision, so a mismatch there would mean this gate had opened the wrong app.
  it(`asks the question for an app it opened as well as one it found`, async () => {
    const checkAppFitsProject = jest.fn(async () => ({ mismatch: null, note: null }));
    await runSmokePhasesAsync(
      deps({
        checkAppFitsProject,
        waitForAppConnection: jest
          .fn<Promise<{ appsConnected: number; timedOut: boolean; waitedMs: number }>, []>()
          .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
          .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 2 }),
      }),
      options()
    );

    expect(checkAppFitsProject).toHaveBeenCalled();
  });

  // And a run with no app at all never asks: there is no runtime to be about.
  it(`does not ask when nothing is connected`, async () => {
    const checkAppFitsProject = jest.fn(async () => ({ mismatch: null, note: null }));
    await runSmokePhasesAsync(
      deps({
        checkAppFitsProject,
        waitForAppConnection: async () => ({ appsConnected: 0, timedOut: true, waitedMs: 1 }),
        openRoute: async (route) => opened({ route, exitCode: 115 }),
      }),
      options()
    );

    expect(checkAppFitsProject).not.toHaveBeenCalled();
  });
});

// @ref ./phases §SmokeDeps.checkAppFitsProject
//
// The dep answers two things, and this is the one that decides nothing: a finding worth printing on
// the row it is about, which leaves the verdict alone. Nothing produces one today — the version
// mismatch that used to became an install instead (§The Expo Go on the device is not the Expo Go the
// SDK wants) — so this covers the mechanism rather than a caller of it, and the next finding that
// needs to be said without being fatal has somewhere to go.
describe(`${runSmokePhasesAsync.name} and a note about the app it read`, () => {
  const NOTE = 'something worth saying that decides nothing';

  it(`keeps the phase ok and still passes the run`, async () => {
    const run = await runSmokePhasesAsync(
      deps({ checkAppFitsProject: async () => ({ mismatch: null, note: NOTE }) }),
      options()
    );

    expect(statusOf(run, 'app')).toBe('ok');
    expect(run.outcome).toBe('passed');
  });

  // Said out loud on the row it is about, because a fact nobody prints is a fact nobody has.
  it(`says it on the app phase`, async () => {
    const run = await runSmokePhasesAsync(
      deps({ checkAppFitsProject: async () => ({ mismatch: null, note: NOTE }) }),
      options()
    );

    expect(run.phases.find((phase) => phase.id === 'app')?.reason).toBe(NOTE);
  });

  // A mismatch outranks a note: there is no use telling someone their Expo Go is a patch behind
  // when the real answer is that it cannot run their project at all.
  it(`prefers the mismatch when there is one`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        checkAppFitsProject: async () => ({ mismatch: 'cannot run this project', note: NOTE }),
      }),
      options()
    );

    expect(statusOf(run, 'app')).toBe('inconclusive');
    expect(run.phases.find((phase) => phase.id === 'app')?.reason).toBe('cannot run this project');
    expect(run.outcome).toBe('inconclusive');
  });

  // And a note never overwrites the sentence the phase already had, which says how the app got
  // there — that is the fact the row exists for.
  it(`does not lose the phase's own reason`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        checkAppFitsProject: async () => ({ mismatch: null, note: NOTE }),
        waitForAppConnection: jest
          .fn<Promise<{ appsConnected: number; timedOut: boolean; waitedMs: number }>, []>()
          .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
          .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 2 }),
      }),
      options()
    );

    const reason = run.phases.find((phase) => phase.id === 'app')?.reason ?? '';
    expect(reason).toContain('to connect one');
    expect(reason).toContain(NOTE);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
//
// The gate used to refuse a machine with no Expo Go and name `npx expo start --ios`. Correct, and a
// dead end for the caller this CLI is for: an agent cannot take that instruction without leaving
// its loop. So the app is installed — and because installing is an *act* rather than a question,
// the phase is conditional like the start and the boot, and it is reported only by a run that did
// it (llp/0005 §The run brings its own environment).
describe(`${runSmokePhasesAsync.name} and installing the app`, () => {
  /** A device this run settled on that has not got the app. */
  const missingApp = { installNeededOnDevice: async () => true };

  /**
   * A run that has to boot: nothing attached, and no device found by the probe.
   *
   * A factory rather than a shared object, because `clearMocks` wipes a `jest.fn`'s queued
   * implementations between tests — a shared one answers `undefined` from the second test on, and
   * silently skips the phase under test.
   */
  const needsBoot = () => ({
    bootstrap: true,
    probeDevice: async () => ({ deviceId: null, backend: null, reason: 'nothing booted' }),
    waitForAppConnection: jest
      .fn<Promise<{ appsConnected: number; timedOut: boolean; waitedMs: number }>, []>()
      .mockResolvedValueOnce({ appsConnected: 0, timedOut: true, waitedMs: 1 })
      .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 2 }),
  });

  it(`installs the app onto a device that was booted without it`, async () => {
    const installApp = jest.fn(async () => ({ ok: true, version: '57.0.9', reason: null }));
    const run = await runSmokePhasesAsync(
      deps({ ...needsBoot(), ...missingApp, installApp }),
      options({ bootstrap: true })
    );

    // Onto the device this run settled on, and no other.
    expect(installApp).toHaveBeenCalledWith('SIM-BOOTED');
    expect(statusOf(run, 'install-app')).toBe('ok');
    expect(run.outcome).toBe('passed');
  });

  // Conditional, like the start and the boot: a machine that already had the app did not *skip* an
  // install, it never had one to do, and a `skipped` row there reads as work that was owed.
  it(`says nothing at all on a run that had no install to do`, async () => {
    const run = await runSmokePhasesAsync(deps(), options());

    expect(run.phases.some((phase) => phase.id === 'install-app')).toBe(false);
  });

  it(`does not install when the device already has the app`, async () => {
    const installApp = jest.fn(async () => ({ ok: true, version: null, reason: null }));
    await runSmokePhasesAsync(deps({ ...needsBoot(), installApp }), options({ bootstrap: true }));

    expect(installApp).not.toHaveBeenCalled();
  });

  // An install that failed leaves nothing to open, so the run stops there rather than deep-linking
  // into a device it has just been told has no app.
  it(`stops when the install failed, and says why`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        ...needsBoot(),
        ...missingApp,
        installApp: async () => ({ ok: false, version: null, reason: 'the download timed out' }),
      }),
      options({ bootstrap: true })
    );

    expect(statusOf(run, 'install-app')).toBe('failed');
    expect(run.phases.find((phase) => phase.id === 'install-app')?.reason).toContain(
      'the download timed out'
    );
    expect(run.outcome).toBe('failed');
    expect(statusOf(run, 'app')).toBe('skipped');
  });

  // The version that was installed is worth naming: it is the answer to "which Expo Go am I
  // testing against", which is the question the version check exists for.
  it(`names the version it installed`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        ...needsBoot(),
        ...missingApp,
        installApp: async () => ({ ok: true, version: '57.0.9', reason: null }),
      }),
      options({ bootstrap: true })
    );

    expect(run.phases.find((phase) => phase.id === 'install-app')?.reason).toContain('57.0.9');
  });

  // The install is bootstrap, like the boot that preceded it: a 423 MB download is this run paying
  // for cold it caused, and charging it to `--timeout` would leave the error window with nothing.
  it(`does not charge the install to the reading budget`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        ...needsBoot(),
        ...missingApp,
        installApp: async () => ({ ok: true, version: '57.0.9', reason: null }),
        collectErrors: async (_url, windowMs) => {
          expect(windowMs).toBe(3_000);
          return { ok: true, records: [], reason: null };
        },
      }),
      options({ bootstrap: true, timeoutMs: 20_000 })
    );

    expect(run.outcome).toBe('passed');
  });
});

// @ref ./phases §SmokeInstallResult.replaced — an addition and a replacement are different things
// to do to somebody's machine, and the row has to say which.
describe(`${runSmokePhasesAsync.name} and what the install replaced`, () => {
  const needsInstall = {
    installNeededOnDevice: async () => true,
    probeDevice: async () => ({ deviceId: 'SIM-1', backend: 'local-ios' as const, reason: null }),
  };

  it(`names the version it replaced`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        ...needsInstall,
        installApp: async () => ({
          ok: true,
          version: '57.0.9',
          replaced: '56.0.4',
          reason: null,
        }),
      }),
      options({ bootstrap: true })
    );

    expect(run.phases.find((phase) => phase.id === 'install-app')?.reason).toContain(
      'replacing 56.0.4'
    );
  });

  it(`says nothing about replacing when there was nothing there`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        ...needsInstall,
        installApp: async () => ({ ok: true, version: '57.0.9', replaced: null, reason: null }),
      }),
      options({ bootstrap: true })
    );

    expect(run.phases.find((phase) => phase.id === 'install-app')?.reason).not.toContain(
      'replacing'
    );
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
//
// The install invalidates the probe that came before it. `simctl install` over a running app
// replaces the bundle and takes the process with it, so an app that was attached a moment earlier
// is gone — and the dev server's target list does not forget it that quickly.
//
// Live, that produced a run whose phases argued with each other [observed, Kudo, 2026-09-03]:
//
//   ok       install-app 4.8s · installed 57.0.9 …, replacing 54.0.7, and left it there
//   ok       app
//   unknown  reload · no app is connected to the dev server, so there is nothing to broadcast to
//   unknown  runtime · No app connected to the dev server could be shown to be running on ios
//
// The `app` row is the tell: `ok` with no reason and no duration is the already-attached shortcut,
// which reused a count taken before the install. The run that followed it passed, because it found
// nothing attached and opened the app — which is what this one should have done.
describe(`${runSmokePhasesAsync.name} and the app the install replaced`, () => {
  /** Attached when the run starts, and gone by the time the install has finished. */
  const attachedThenReplaced = () => ({
    bootstrap: true,
    installNeededOnDevice: async () => true,
    probeDevice: async () => ({ deviceId: 'SIM-1', backend: 'local-ios' as const, reason: null }),
    installApp: async () => ({ ok: true, version: '57.0.9', replaced: '54.0.7', reason: null }),
  });

  it(`opens the app again after replacing it, rather than trusting the earlier probe`, async () => {
    const openRoute = jest.fn(async (route: string) => opened({ route }));
    const run = await runSmokePhasesAsync(
      deps({
        ...attachedThenReplaced(),
        // One app all along, which is the stale target the live run tripped over: the count says
        // yes both before the install and after it.
        waitForAppConnection: async () => ({ appsConnected: 1, timedOut: false, waitedMs: 1 }),
        openRoute,
      }),
      options({ bootstrap: true })
    );

    expect(openRoute).toHaveBeenCalled();
    expect(run.phases.find((phase) => phase.id === 'app')?.reason).toContain('to connect one');
    expect(run.outcome).toBe('passed');
  });

  // And the app it opened is one this run moved, so it owes the settle and the runtime poll — and
  // owes **no** reload, because it fetched the served bundle on its way up.
  it(`treats the reopened app as one this run opened`, async () => {
    const reloadApp = jest.fn();
    const run = await runSmokePhasesAsync(
      deps({
        ...attachedThenReplaced(),
        waitForAppConnection: async () => ({ appsConnected: 1, timedOut: false, waitedMs: 1 }),
        reloadApp,
      }),
      options({ bootstrap: true })
    );

    expect(reloadApp).not.toHaveBeenCalled();
    expect(statusOf(run, 'reload')).toBe('skipped');
    expect(run.reload.disposition).toBe('not-needed');
  });

  // A run that installed nothing keeps the shortcut: re-opening an app that is already there costs
  // a launch and answers nothing new.
  it(`still trusts the probe when nothing was installed`, async () => {
    const openRoute = jest.fn(async (route: string) => opened({ route }));
    await runSmokePhasesAsync(
      deps({ installNeededOnDevice: async () => false, openRoute }),
      options({ bootstrap: true })
    );

    expect(openRoute).not.toHaveBeenCalled();
  });

  // An install that **failed** never gets here — the run stops at the phase — but the flag must not
  // be set by the attempt either, or a failed install would send the run looking for an app it
  // never put there.
  it(`does not reopen after an install that failed`, async () => {
    const run = await runSmokePhasesAsync(
      deps({
        ...attachedThenReplaced(),
        installApp: async () => ({ ok: false, version: null, replaced: null, reason: 'no space' }),
      }),
      options({ bootstrap: true })
    );

    expect(statusOf(run, 'install-app')).toBe('failed');
    expect(statusOf(run, 'app')).toBe('skipped');
  });
});
