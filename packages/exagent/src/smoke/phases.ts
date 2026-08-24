// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The gate itself: eight phases, one verdict.
//
// Every phase is a question one existing command already answers, asked here through the same
// function rather than by running that command again. That is the whole design constraint. A
// `smoke` built out of subprocesses of itself would have eight processes, eight dev-server
// discoveries, and eight chances for the answers to disagree — and it would hand back a chain of
// exit codes rather than one.
//
// The phases and where each one comes from:
//
// | phase           | the command whose question it is | the function                |
// | --------------- | -------------------------------- | --------------------------- |
// | `dev-server`    | every runtime command            | `discoverDevServerAsync`    |
// | `bundler-ready` | `dev:wait`                       | `waitForBundlerReadyAsync`  |
// | `bundle`        | `dev:wait`, `runtime:reload`     | `checkEntryBundleAsync`     |
// | `app`           | `dev:wait --require-app`         | `waitForAppConnectionAsync` |
// | `route`         | `navigate`                       | `openRouteAsync`            |
// | `runtime`       | `runtime:eval`                   | `CdpClient.evaluateAsync`   |
// | `errors`        | `runtime:errors`                 | `CdpRuntimeErrorCollector`  |
// | `screenshot`    | (new)                            | `captureScreenshotAsync`    |
//
// The dependencies are injected rather than imported, so the outcome table below — which is the
// part that can be wrong in a way no type checker sees — is testable against fakes, with no dev
// server, no device and no clock.

import type { ScreenshotResult } from '../device/screenshot';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import type { OpenRouteResult } from '../navigate/openRoute';
import type { RouteCheckJson } from '../navigate/routeCheck';
import type { BundleCheckResult } from '../runtime/bundleCheck';
import type { DevServerDiscovery } from '../runtime/devServer';
import type { RuntimeErrorRecord } from '../runtime/runtimeErrorCollector';
import type { AppConnectionResult, BundlerReadyResult } from '../runtime/waitReady';
import type { SmokeOptions } from './resolveOptions';
import type { SmokeOutcome, SmokePhase, SmokePhaseId, SmokePhaseStatus } from './types';

/** What starting a dev server amounted to, when `--start` allowed one. */
export interface SmokeStartResult {
  ok: boolean;
  /** Origin it came up on, when it did. */
  devServerUrl: string | null;
  /** Why it did not. Null exactly when {@link ok} is true. */
  reason: string | null;
}

/** What asking the runtime to evaluate `1` amounted to. */
export interface SmokeEvaluateResult {
  /** The runtime answered, whatever it answered with. */
  ok: boolean;
  /**
   * The runtime has no `Runtime.evaluate` handler at all.
   *
   * The Expo Go Android case (llp/0005 §Android pass), and the reason it is a field of its own: a
   * runtime that cannot be evaluated also reports an *empty error window*, so the window that
   * follows proves nothing and the run must never pass on it.
   */
  unsupported: boolean;
  /** What went wrong, for the report. Null when it answered. */
  reason: string | null;
}

/** What the error window amounted to. Never a throw: an unreadable app is a result. */
export interface SmokeErrorsResult {
  ok: boolean;
  records: RuntimeErrorRecord[];
  /** Why the window could not be opened. Null when it was. */
  reason: string | null;
}

/** Everything the runner needs from the outside world, so none of it happens here. */
export interface SmokeDeps {
  discoverDevServer(explicitUrl: string | null): Promise<DevServerDiscovery>;
  startDevServer(): Promise<SmokeStartResult>;
  waitForBundlerReady(devServerUrl: string, timeoutMs: number): Promise<BundlerReadyResult>;
  checkEntryBundle(devServerUrl: string, timeoutMs: number): Promise<BundleCheckResult>;
  waitForAppConnection(devServerUrl: string, timeoutMs: number): Promise<AppConnectionResult>;
  /** Look for a booted device without failing when there is none: no device is an answer. */
  probeDevice(): Promise<{ deviceId: string | null; reason: string | null }>;
  /**
   * Open a route on the device, the way `navigate` does. Throws what `navigate` throws.
   *
   * The dev server is passed in rather than found again, and that is a fix rather than a tidy-up
   * [observed live — 2026-08-24]: `navigate` discovers its own dev server, so a run that had
   * settled on one in phase 1 went looking for it a second time in phase 4 and found nothing —
   * `Cannot build an Expo Go URL because the dev server URL is unknown`, exit 1, from a run whose
   * first three phases had all answered. A gate that talks to two dev servers is a gate whose
   * phases are about two different things.
   */
  openRoute(route: string, devServerUrl: string): Promise<OpenRouteResult>;
  evaluate(devServerUrl: string): Promise<SmokeEvaluateResult>;
  collectErrors(devServerUrl: string, windowMs: number): Promise<SmokeErrorsResult>;
  captureScreenshot(deviceId: string): Promise<ScreenshotResult>;
  /** The clock, so a test can pin the durations it reports. */
  now(): number;
}

/**
 * Whether one record is something the gate fails on. Exported so the report and the follow-ups
 * count the same thing this decides the verdict on.
 */
export function isFailingRecord(record: RuntimeErrorRecord): boolean {
  // Not `source === 'exception'` alone, which is what the design said and what the live round
  // disproved [observed — 2026-08-24, notesapp on SDK 57 in Expo Go, iOS 26.5 simulator]. An
  // uncaught `throw` never reached `Runtime.exceptionThrown` in any run: React Native caught it
  // and reported it through the console path, so a gate reading `source` passed **seventeen
  // crashes** in one window and called them `console.error` calls. `RuntimeErrorRecord.isError`
  // documents the three cases measured to settle it, and the limit it leaves — a deliberately
  // logged `Error` is the same bytes and fails too.
  //
  // `source === 'exception'` stays in the test rather than being dropped: a runtime that does use
  // that channel exists, and a gate reading only the console path would be the same mistake
  // pointed the other way.
  return record.isError === true || record.source === 'exception';
}

/** Everything one run of the phases established, before it is formatted or exited with. */
export interface SmokeRun {
  outcome: SmokeOutcome;
  phases: SmokePhase[];
  devServerUrl: string;
  discovery: DevServerDiscovery | null;
  projectRootMatched: boolean | null;
  started: boolean;
  appsConnected: number | null;
  bundle: BundleCheckResult | null;
  route: string | null;
  routeCheck: RouteCheckJson | null;
  deviceId: string | null;
  runtimeSupported: boolean | null;
  windowMs: number | null;
  errors: RuntimeErrorRecord[];
  screenshot: ScreenshotResult;
  durationMs: number;
}

/** The route opened when nothing was named and there is no app to read. */
const ROOT_ROUTE = '/';

/** How long the first look for an attached app gets before the run opens one itself. */
const APP_PROBE_MS = 2_000;

/** Every phase, in the order they are reported. */
const PHASE_ORDER: SmokePhaseId[] = [
  'dev-server',
  'bundler-ready',
  'bundle',
  'app',
  'route',
  'runtime',
  'errors',
  'screenshot',
];

/**
 * A screenshot that was never attempted, so the report has the same keys either way.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract.
 */
export function noScreenshot(reason: string): ScreenshotResult {
  return { path: '', ok: false, reason, platform: null, deviceId: null, command: null, bytes: null };
}

/**
 * The exit code one verdict deserves (llp/0010 §Exit codes).
 *
 * Three codes for three answers, and the split between the last two is what the band exists for:
 * after `20` the next action is to fix something, and after `22` it is to look again. Collapsing
 * them would send an agent to debug an app that is fine, or to re-run a gate that will fail the
 * same way until a file is edited.
 *
 * Kept next to the outcome it maps, and pure, so the table is testable as a table.
 */
export function smokeExitCode(outcome: SmokeOutcome): number {
  switch (outcome) {
    case 'passed':
      return EXIT_OK;
    case 'failed':
      return EXIT_OUTCOME_FAILED;
    default:
      return EXIT_OUTCOME_TIMEOUT;
  }
}

/**
 * Run the gate.
 *
 * Never throws for anything about the *app*: an app that crashes, a bundle that does not compile
 * and a runtime that cannot be read are all outcomes this reports. It does propagate a genuine
 * tool failure — a route the project has not got, a `--dev-server-url` typo — because those are
 * the caller's own command being wrong, which is exit `1` and not a verdict on the project
 * (llp/0010 §Exit codes).
 */
export async function runSmokePhasesAsync(
  deps: SmokeDeps,
  options: SmokeOptions
): Promise<SmokeRun> {
  const startedAt = deps.now();
  const phases: SmokePhase[] = [];
  const remaining = () => Math.max(0, options.timeoutMs - (deps.now() - startedAt));

  /** Record one phase and hand back what it produced. */
  const record = async <T>(
    id: SmokePhaseId,
    run: () => Promise<{ status: SmokePhaseStatus; reason?: string | null; value: T }>
  ): Promise<T> => {
    const at = deps.now();
    const { status, reason, value } = await run();
    phases.push({ id, status, ms: deps.now() - at, reason: reason ?? null });
    return value;
  };

  /**
   * Everything from `from` onwards did not run, for the reason given.
   *
   * `stopBefore` is for the two exits that still take a picture: a phase must appear exactly once,
   * and a `screenshot` marked skipped here and then attempted below would appear twice.
   */
  const skipRest = (from: SmokePhaseId, reason: string, stopBefore?: SmokePhaseId): void => {
    const end = stopBefore == null ? PHASE_ORDER.length : PHASE_ORDER.indexOf(stopBefore);
    for (const id of PHASE_ORDER.slice(PHASE_ORDER.indexOf(from), end)) {
      if (!phases.some((phase) => phase.id === id)) {
        phases.push({ id, status: 'skipped', ms: 0, reason });
      }
    }
  };

  const done = (outcome: SmokeOutcome, run: Partial<SmokeRun>): SmokeRun => ({
    outcome,
    phases,
    devServerUrl: '',
    discovery: null,
    projectRootMatched: null,
    started: false,
    appsConnected: null,
    bundle: null,
    route: options.route,
    routeCheck: null,
    deviceId: null,
    runtimeSupported: null,
    windowMs: null,
    errors: [],
    screenshot: noScreenshot('nothing was photographed'),
    durationMs: deps.now() - startedAt,
    ...run,
  });

  // ---- Phase 1: is there a dev server, and may this run start one? --------------------------

  let started = false;
  const discovery = await record('dev-server', async () => {
    const found = await deps.discoverDevServer(options.devServerUrl);
    if (found.reachable) {
      return { status: 'ok' as const, value: found };
    }
    // `--start` is opt-in on purpose: a verification gate that silently triggers a native build is
    // a surprise, and the default is to attach to what is already running.
    if (!options.start) {
      return {
        status: 'failed' as const,
        reason: `nothing answered at ${found.devServerUrl} (${found.reason ?? 'no answer'})`,
        value: found,
      };
    }
    const start = await deps.startDevServer();
    if (!start.ok || start.devServerUrl == null) {
      return { status: 'failed' as const, reason: start.reason, value: found };
    }
    started = true;
    // Discovered the same way the first look was, rather than by naming the URL the start
    // reported: naming it would make `source` say `flag` for a run whose caller passed no flag,
    // and `source` is reported precisely because `lock` and `flag` prove different things
    // (llp/0005 §`DevServerSource`).
    const again = await deps.discoverDevServer(options.devServerUrl);
    return again.reachable
      ? { status: 'ok' as const, reason: 'started for this run', value: again }
      : {
          status: 'failed' as const,
          reason: `a dev server was started at ${start.devServerUrl} and did not answer afterwards`,
          value: again,
        };
  });

  if (!discovery.reachable) {
    skipRest('bundler-ready', 'no dev server answered, so nothing could be read');
    return done('failed', {
      devServerUrl: discovery.devServerUrl,
      discovery,
      started,
      screenshot: noScreenshot('no dev server answered, so nothing was opened to photograph'),
    });
  }

  const devServerUrl = discovery.devServerUrl;

  // ---- Phase 2: has its bundler finished, and is it this project's? -------------------------

  const readiness = await record('bundler-ready', async () => {
    const result = await deps.waitForBundlerReady(devServerUrl, remaining());
    // Checked before the timeout, because it is decided rather than pending: no amount of looking
    // again turns another project's dev server into this one's (llp/0010 §The second).
    if (result.projectRootMatched === false) {
      return {
        status: 'failed' as const,
        reason: `it serves ${result.reportedProjectRoot ?? 'another project'}, not this one`,
        value: result,
      };
    }
    if (result.ready) {
      return { status: 'ok' as const, value: result };
    }
    return {
      status: result.timedOut ? ('inconclusive' as const) : ('failed' as const),
      reason: result.reason ?? 'the bundler did not answer',
      value: result,
    };
  });

  const base = {
    devServerUrl,
    discovery,
    started,
    projectRootMatched: readiness.projectRootMatched,
  };

  if (readiness.projectRootMatched === false) {
    // Building *their* entry bundle answers nothing about this code, and reading *their* app is
    // worse: it would report on a stranger's runtime as though it were this project's.
    skipRest('bundle', 'the dev server serves another project, so nothing here is about this one');
    return done('failed', {
      ...base,
      screenshot: noScreenshot('the dev server serves another project, so nothing was photographed'),
    });
  }
  if (!readiness.ready) {
    skipRest('bundle', 'the bundler never answered, so there was no bundle to read the app through');
    return done(readiness.timedOut ? 'inconclusive' : 'failed', {
      ...base,
      screenshot: noScreenshot('the bundler was not ready, so nothing was photographed'),
    });
  }

  // ---- Phase 3: does this project's own code compile? ---------------------------------------

  const bundle = await record('bundle', async () => {
    const result = await deps.checkEntryBundle(devServerUrl, remaining());
    switch (result.outcome) {
      case 'ok':
        return { status: 'ok' as const, value: result };
      case 'broken':
        return { status: 'failed' as const, reason: bundleErrorSentence(result), value: result };
      case 'timeout':
        return {
          status: 'inconclusive' as const,
          reason: 'the bundler was still building it when the budget ran out',
          value: result,
        };
      default:
        // Fail-open, unchanged from `dev:wait`: a dev server that answered nothing this CLI
        // understands has not shown the project to be broken (llp/0010 §The gate has to ask).
        return {
          status: 'inconclusive' as const,
          reason: result.reason ?? 'the bundler gave no answer about the entry bundle',
          value: result,
        };
    }
  });

  if (bundle.outcome === 'broken') {
    // Nothing after this is worth doing: the app cannot be running code that does not compile, and
    // an error window against the red screen would report the bundler's own error as the app's.
    skipRest('app', 'the entry bundle does not compile, so there is no working app to read');
    return done('failed', {
      ...base,
      bundle,
      screenshot: noScreenshot('the entry bundle does not compile, so nothing was photographed'),
    });
  }
  if (bundle.outcome === 'timeout') {
    skipRest('app', 'the entry bundle was still building, so nothing is known about the app yet');
    return done('inconclusive', {
      ...base,
      bundle,
      screenshot: noScreenshot('the entry bundle was still building, so nothing was photographed'),
    });
  }

  // ---- Phase 4: is an app attached, and can one be opened if not? ---------------------------

  let deviceId: string | null = null;
  let routeCheck: RouteCheckJson | null = null;
  let routeOpenedWhileConnecting = false;

  const connection = await record('app', async () => {
    const first = await deps.waitForAppConnection(devServerUrl, Math.min(remaining(), APP_PROBE_MS));
    if (first.appsConnected > 0) {
      return { status: 'ok' as const, value: first };
    }

    // Nothing is attached. `navigate` is what puts an app in that list, so the gate opens one
    // rather than waiting out its budget on a state it could have changed itself. This is friction
    // run 1's F4 absorbed into the gate, and the same reasoning F48-8 gave `status.next`: a wait
    // for an app cannot succeed while nothing is opening one.
    const device = await deps.probeDevice();
    if (device.deviceId == null) {
      return {
        status: 'inconclusive' as const,
        reason: `no app is connected to the dev server, and ${device.reason ?? 'no device was found to open one on'}`,
        value: first,
      };
    }

    const opened = await deps.openRoute(options.route ?? ROOT_ROUTE, devServerUrl);
    deviceId = opened.deviceId;
    if (options.route != null) {
      routeCheck = opened.routeCheck;
      routeOpenedWhileConnecting = true;
    }
    if (opened.exitCode !== 0) {
      return {
        status: 'failed' as const,
        reason: `no app was connected, and the device refused the deep link that would have opened one ("${opened.command}" exited ${opened.exitCode ?? 'on a signal'})`,
        value: first,
      };
    }

    const second = await deps.waitForAppConnection(devServerUrl, remaining());
    return second.appsConnected > 0
      ? { status: 'ok' as const, reason: `opened ${opened.url} to connect one`, value: second }
      : {
          status: 'inconclusive' as const,
          reason: `${opened.url} was opened on the device and no app had attached when the budget ran out`,
          value: second,
        };
  });

  const appsConnected = connection.appsConnected;
  const withApp = { ...base, bundle, appsConnected };

  if (appsConnected === 0) {
    const appPhase = phases[phases.length - 1]!;
    // No app, so no runtime and no window — but there may still be a device, and a picture of
    // whatever is on it is the most useful thing left to hand back.
    skipRest('route', 'no app is connected, so there was nothing to read', 'screenshot');
    const screenshot = await captureIfPossible(deps, options, deviceId, phases);
    return done(appPhase.status === 'failed' ? 'failed' : 'inconclusive', {
      ...withApp,
      deviceId,
      routeCheck,
      screenshot,
      durationMs: deps.now() - startedAt,
    });
  }

  // ---- Phase 5: the route, unless phase 4 already opened it ---------------------------------

  if (options.route == null) {
    phases.push({
      id: 'route',
      status: 'skipped',
      ms: 0,
      reason: 'no --route was given, so the app was read where it already was',
    });
  } else if (routeOpenedWhileConnecting) {
    phases.push({
      id: 'route',
      status: 'ok',
      ms: 0,
      reason: 'it was the route the app was opened on, above',
    });
  } else {
    const opened = await record('route', async () => {
      const result = await deps.openRoute(options.route!, devServerUrl);
      deviceId = result.deviceId;
      routeCheck = result.routeCheck;
      return result.exitCode === 0
        ? { status: 'ok' as const, reason: `opened ${result.url}`, value: result }
        : {
            status: 'failed' as const,
            reason: `the device refused the deep link ("${result.command}" exited ${result.exitCode ?? 'on a signal'})`,
            value: result,
          };
    });
    if (opened.exitCode !== 0) {
      skipRest(
        'runtime',
        'the route was not opened, so the app is not on the screen under test',
        'screenshot'
      );
      const screenshot = await captureIfPossible(deps, options, deviceId, phases);
      return done('failed', {
        ...withApp,
        deviceId,
        routeCheck,
        screenshot,
        durationMs: deps.now() - startedAt,
      });
    }
  }

  // ---- Phase 6: can the runtime be read at all? ---------------------------------------------

  const runtime = await record('runtime', async () => {
    const result = await deps.evaluate(devServerUrl);
    if (result.ok) {
      return { status: 'ok' as const, value: result };
    }
    return {
      // Both are "nothing was proved", and they differ only in whether looking again could help.
      status: 'inconclusive' as const,
      reason: result.unsupported
        ? 'this runtime has no debugger, so an error window from it would be empty whatever the app is doing'
        : (result.reason ?? 'the runtime did not answer'),
      value: result,
    };
  });

  // ---- Phase 7: what did the app report while it was watched? -------------------------------

  // Opened even for a runtime that cannot be evaluated, because an empty window costs one wait and
  // the report is more useful with it — but the *verdict* never rests on it. That is the rule
  // llp/0005 §Android pass forces: Expo Go on Android acknowledges `Runtime.enable` and reports
  // nothing, so an empty window there is silence and not health.
  const collected = await record('errors', async () => {
    const result = await deps.collectErrors(devServerUrl, options.windowMs);
    if (!result.ok) {
      return {
        status: 'inconclusive' as const,
        reason: result.reason ?? 'the error window could not be opened',
        value: result,
      };
    }
    const failing = result.records.filter(isFailingRecord);
    if (failing.length > 0) {
      return {
        status: 'failed' as const,
        reason: `${failing.length} ${failing.length === 1 ? 'error' : 'errors'} reported by the app: ${failing[0]!.message}`,
        value: result,
      };
    }
    if (!runtime.ok) {
      return {
        status: 'inconclusive' as const,
        reason: 'the window was empty, and this runtime reports nothing whatever the app does',
        value: result,
      };
    }
    return {
      status: 'ok' as const,
      reason:
        result.records.length > 0
          ? `${result.records.length} console.error ${result.records.length === 1 ? 'line' : 'lines'}, none of them an error the app reported`
          : null,
      value: result,
    };
  });

  // ---- Phase 8: the picture -----------------------------------------------------------------

  const screenshot = await captureIfPossible(deps, options, deviceId, phases);

  // The verdict. `failed` needs something to have gone wrong; `passed` needs the runtime to have
  // answered, so a window nobody could have read is never a pass.
  const threw = collected.records.some(isFailingRecord);
  return done(threw ? 'failed' : runtime.ok && collected.ok ? 'passed' : 'inconclusive', {
    ...withApp,
    routeCheck,
    deviceId,
    runtimeSupported: runtime.unsupported ? false : runtime.ok ? true : null,
    windowMs: options.windowMs,
    errors: collected.records,
    screenshot,
    durationMs: deps.now() - startedAt,
  });
}

/**
 * Take the picture, or record why there is none.
 *
 * Degrading rather than failing is the decision: a screenshot is evidence attached to an answer,
 * and a run on a machine with no simulator has still answered whether the app throws. Reporting
 * `ok: false` with a reason keeps that honest without spending the verdict on it — the outcome
 * never depends on this phase, in either direction.
 */
async function captureIfPossible(
  deps: SmokeDeps,
  options: SmokeOptions,
  deviceId: string | null,
  phases: SmokePhase[]
): Promise<ScreenshotResult> {
  const at = deps.now();
  const push = (status: SmokePhaseStatus, reason: string | null) =>
    phases.push({ id: 'screenshot', status, ms: deps.now() - at, reason });

  if (!options.screenshot) {
    const skipped = noScreenshot('no screenshot was taken (--no-screenshot)');
    push('skipped', skipped.reason);
    return skipped;
  }

  let device = deviceId;
  if (device == null) {
    const probe = await deps.probeDevice();
    if (probe.deviceId == null) {
      const skipped = noScreenshot(
        `no screenshot was taken: ${probe.reason ?? 'no booted device was found to photograph'}`
      );
      push('skipped', skipped.reason);
      return skipped;
    }
    device = probe.deviceId;
  }

  const result = await deps.captureScreenshot(device);
  push(result.ok ? 'ok' : 'skipped', result.ok ? null : result.reason);
  return result;
}

/** The bundler's own error, as one sentence with the location in it. */
function bundleErrorSentence(bundle: BundleCheckResult): string {
  const where = [bundle.error?.filename, bundle.error?.lineNumber, bundle.error?.column]
    .filter((part) => part != null)
    .join(':');
  return `${where ? `${where}: ` : ''}${bundle.error?.message ?? 'the bundler reported an error'}`;
}
