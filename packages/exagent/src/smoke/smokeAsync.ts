// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// `exagent smoke`: the composite gate.
//
// This module is the wiring, and deliberately nothing else. The decisions are in `phases.ts`,
// which is given the functions below rather than importing them, so the outcome table can be
// tested against fakes. What is here is the real versions of those functions — every one of them
// the same function the command that owns the question already calls.

import { captureScreenshotAsync, defaultScreenshotPath } from '../device/screenshot';
import { devDetachAsync } from '../dev/detachAsync';
import { resolveDevOptions } from '../dev/resolveOptions';
import { event } from '../events';
import { buildSmokeFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { probeAndroidDeviceAsync, probeIosSimulatorAsync } from '../navigate/device';
import { openRouteAsync } from '../navigate/openRoute';
import { checkEntryBundleAsync } from '../runtime/bundleCheck';
import { CdpClient, isMethodNotFoundError } from '../runtime/cdpClient';
import { discoverDevServerAsync, probeDevServerAsync } from '../runtime/devServer';
import { CdpRuntimeErrorCollector } from '../runtime/runtimeErrorCollector';
import {
  buildDeviceNameIndexIfNeededAsync,
  type DeviceNameIndex,
} from '../runtime/targetPlatform';
import { waitForAppConnectionAsync, waitForBundlerReadyAsync } from '../runtime/waitReady';
import { formatSmokeResult, smokeResultToJson } from './format';
import {
  isFailingRecord,
  runSmokePhasesAsync,
  smokeExitCode,
  type SmokeDeps,
  type SmokeRun,
} from './phases';
import type { SmokeOptions } from './resolveOptions';

/** How long discovery may spend on each candidate port. Short: a dev server that is up answers. */
const DISCOVERY_TIMEOUT_MS = 800;

/**
 * The expression the runtime is asked to evaluate.
 *
 * `1` and nothing else. The question is only "does this runtime answer the debugger at all", and
 * anything that touched the app's own state would fail for reasons that are the app's rather than
 * the runtime's — which is the distinction this phase exists to draw.
 */
const LIVENESS_EXPRESSION = '1';

/** How long the liveness evaluation gets before it is called unanswered. */
const LIVENESS_TIMEOUT_MS = 5_000;

/** How often the target list is re-read while the run waits for the app to stop re-registering. */
const TARGET_SETTLE_POLL_MS = 500;

/**
 * The command line `--start` runs `exagent dev` with.
 *
 * **The platform flag is deliberately absent**, and that is a correction rather than an omission
 * [observed live — 2026-08-24, on a Mac that had granted no Automation permission]. `--ios` makes
 * the plan run `expo start --ios`, which drives Simulator.app through AppleScript; the Expo CLI
 * does not catch a refusal there and the dev server exits with it (llp/0010 §A failed plan step
 * reports a failure, and its upstream ask). This run watched exactly that: the first three phases
 * answered against a dev server that was already dying, and the fourth found nothing.
 *
 * The recovery llp/0004 records for it is the one this command performs anyway — start the dev
 * server without opening anything, then open the app with `navigate`, which deep-links through
 * `simctl openurl` and needs no Automation grant. So there is nothing for the platform flag to
 * add here, and one whole failure mode for it to remove.
 *
 * Exported for the test table, because that absence is invisible in a diff and expensive live.
 */
export const START_DEV_SERVER_ARGV: readonly string[] = ['--yes', '--detach', '--wait-ready'];

/**
 * The port `--start` asks the dev server for, out of the dev server this run was pointed at.
 *
 * A caller that passed `--port 8210` named the dev server it means, and `--start` has to start it
 * *there* — a dev server on 8081 would be a run that answered a question about a different port
 * than the one it was asked about. Only for a loopback URL: `--port` says where a dev server on
 * **this** machine listens, and there is nothing this command can start on another host.
 *
 * @param devServerUrl the `--dev-server-url`/`--port` value, or null when the caller named none.
 */
export function startPortArgs(devServerUrl: string | null): string[] {
  if (devServerUrl == null) {
    return [];
  }
  let parsed: URL;
  try {
    parsed = new URL(devServerUrl);
  } catch {
    return [];
  }
  const loopback = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname);
  return loopback && parsed.port ? ['--port', parsed.port] : [];
}

/**
 * Run the gate, report it, and answer with the exit code.
 *
 * @returns the exit code, per llp/0010 §Exit codes: `0` passed, `20` failed, `22` inconclusive.
 * A *tool* error — a route the project has not got, an unusable flag — is thrown instead, so it
 * gets the `1` and the envelope every other tool failure in this CLI gets.
 */
export async function smokeAsync(projectRoot: string, options: SmokeOptions): Promise<number> {
  const run = await runSmokePhasesAsync(buildSmokeDeps(projectRoot, options), options);

  event('smoke', {
    outcome: run.outcome,
    devServerUrl: run.devServerUrl,
    source: run.discovery?.source ?? null,
    started: run.started,
    appsConnected: run.appsConnected,
    bundle: run.bundle?.outcome ?? null,
    runtimeSupported: run.runtimeSupported,
    errorCount: run.windowMs == null ? null : run.errors.length,
    screenshot: run.screenshot.ok,
    durationMs: run.durationMs,
    phases: run.phases.map((phase) => ({ id: phase.id, status: phase.status, ms: phase.ms })),
  });

  const followups = followUpsEnabled(options.followups) ? buildFollowUps(run, options) : [];

  if (options.json) {
    Log.log(JSON.stringify(smokeResultToJson(run, options, followups), null, 2));
  } else {
    Log.log(formatSmokeResult(run, options));
  }
  reportFollowUps('smoke', followups, { json: options.json });

  if (run.outcome !== 'passed') {
    Log.error(explainOutcome(run));
  }
  return smokeExitCode(run.outcome);
}

/** The follow-ups of one run, from the facts it established. */
function buildFollowUps(run: SmokeRun, options: SmokeOptions) {
  return buildSmokeFollowUps({
    outcome: run.outcome,
    devServerFound: run.discovery?.reachable ?? false,
    start: options.start,
    foreignDevServer: run.projectRootMatched === false,
    bundleBroken: run.bundle?.outcome === 'broken',
    bundleFile: run.bundle?.error?.filename ?? null,
    appsConnected: run.appsConnected,
    runtimeSupported: run.runtimeSupported,
    failing: run.errors.filter(isFailingRecord).length,
    screenshotTaken: run.screenshot.ok,
    screenshotPath: run.screenshot.ok ? run.screenshot.path : null,
    route: options.route,
    platform: options.platform,
  });
}

/**
 * The what / why / how of a run that did not pass.
 *
 * Built from the first phase that was not `ok`, because that is the one the rest followed from:
 * a report that led with the last thing to happen would explain the silence of a runtime that was
 * never reached.
 */
function explainOutcome(run: SmokeRun): string {
  const culprit = run.phases.find((phase) => phase.status === 'failed' || phase.status === 'inconclusive');
  const what =
    run.outcome === 'failed'
      ? `The smoke gate failed at "${culprit?.id ?? 'an unknown phase'}".`
      : `The smoke gate could not decide, at "${culprit?.id ?? 'an unknown phase'}".`;
  const why = culprit?.reason ?? 'no phase reported a reason, which is a bug in this command.';
  const how =
    run.outcome === 'failed'
      ? `Read the phase list above: every phase before the one that failed did answer, so the failure is about what that phase asked and nothing later. The "Suggested next:" line is the command that acts on it.`
      : `Nothing was shown to be wrong and nothing was proved right, so this is not a failure to act on. ${
          run.runtimeSupported === false
            ? 'This runtime carries no debugger, so no window read from it will ever say anything — a development build, or iOS, is what answers.'
            : 'Looking again is the honest next step, with a longer --timeout when a first build was still running.'
        }`;
  return [what, `Why: ${why}`, `How: ${how}`].join('\n');
}

/**
 * The real dependencies: for each phase, the function the command that owns that question calls.
 *
 * Cited rather than reimplemented, and that is the point of the whole module — a second reading of
 * "is the bundle broken" or "which URL does this route deep-link to" is a second place for the
 * findings behind them to be forgotten.
 */
function buildSmokeDeps(projectRoot: string, options: SmokeOptions): SmokeDeps {
  // Built once and shared by every phase that reads a target, so no two phases can disagree about
  // which app this run is about (F51). Built lazily: a run that fails at the dev-server phase never
  // spawns a device tool for it.
  let deviceIndex: Promise<DeviceNameIndex> | null = null;
  const indexAsync = (devServerUrl: string) =>
    (deviceIndex ??= probeDevServerAsync(devServerUrl).then((probe) =>
      buildDeviceNameIndexIfNeededAsync(probe.targets)
    ));

  return {
    discoverDevServer: (explicitUrl) =>
      discoverDevServerAsync(explicitUrl ?? undefined, {
        timeoutMs: DISCOVERY_TIMEOUT_MS,
        projectRoot,
      }),

    // The detach path of `exagent dev`, with the readiness wait on: a foreground start would never
    // return, and this run has seven more phases to perform (llp/0004 §Daemonization).
    // The argv is `START_DEV_SERVER_ARGV`, whose documentation says why it carries no platform.
    startDevServer: async () => {
      const argv = [...START_DEV_SERVER_ARGV, ...startPortArgs(options.devServerUrl)];
      try {
        // `print: false`: the detached start is one phase of this run, and this run prints one
        // report. Its `cli:dev_detach` event is still emitted, so nothing about it is hidden.
        await devDetachAsync(projectRoot, resolveDevOptions(argv), { print: false });
      } catch (error: unknown) {
        return {
          ok: false,
          devServerUrl: null,
          reason: `a dev server could not be started (${error instanceof Error ? firstLine(error.message) : String(error)})`,
        };
      }
      // Discovery finds it through the lock the detached run publishes, which is the same way
      // every other command finds a dev server this CLI started.
      const found = await discoverDevServerAsync(undefined, {
        timeoutMs: DISCOVERY_TIMEOUT_MS,
        projectRoot,
      });
      return {
        ok: found.reachable,
        devServerUrl: found.devServerUrl,
        reason: found.reachable
          ? null
          : `a dev server was started and nothing answered at ${found.devServerUrl} afterwards (${found.reason ?? 'no answer'})`,
      };
    },

    waitForBundlerReady: (devServerUrl, timeoutMs) =>
      waitForBundlerReadyAsync(devServerUrl, { timeoutMs, projectRoot }),

    checkEntryBundle: (devServerUrl, timeoutMs) =>
      checkEntryBundleAsync(devServerUrl, {
        platform: options.platform,
        timeoutMs,
        projectRoot,
      }),

    // Scoped to this run's platform: a `smoke --android` that counted the iOS simulator already
    // attached to this dev server would go on to read that simulator's runtime, and report the
    // verdict as Android's [friction run 6, F51].
    waitForAppConnection: async (devServerUrl, timeoutMs) =>
      waitForAppConnectionAsync(devServerUrl, {
        timeoutMs,
        platform: options.platform,
        deviceIndex: await indexAsync(devServerUrl),
      }),

    probeDevice: async () => {
      const probe =
        options.platform === 'ios'
          ? await probeIosSimulatorAsync()
          : await probeAndroidDeviceAsync();
      return { deviceId: probe.device?.deviceId ?? null, reason: probe.reason ?? null };
    },

    // The dev server this run settled on, not the flag: a run that discovered one in its first
    // phase must not go looking for a second one in its fourth.
    openRoute: (route, devServerUrl) =>
      openRouteAsync(projectRoot, {
        route,
        platform: options.platform,
        devServerUrl,
        routeCheck: options.routeCheck,
        command: 'smoke',
      }),

    evaluate: async (devServerUrl) => {
      try {
        await new CdpClient({
          metroUrl: devServerUrl,
          platform: options.platform,
          deviceIndex: await indexAsync(devServerUrl),
        }).evaluateAsync(LIVENESS_EXPRESSION, {
          awaitPromise: false,
          timeoutMs: LIVENESS_TIMEOUT_MS,
        });
        return { ok: true, unsupported: false, reason: null };
      } catch (error: unknown) {
        // The Expo Go Android case: the engine was built without a CDP debugger, so nothing can be
        // evaluated *and* nothing will be reported in the window that follows.
        if (isMethodNotFoundError(error)) {
          return {
            ok: false,
            unsupported: true,
            reason: 'the runtime answered Runtime.evaluate with "method not found"',
          };
        }
        return {
          ok: false,
          unsupported: false,
          reason: error instanceof Error ? firstLine(error.message) : String(error),
        };
      }
    },

    collectErrors: async (devServerUrl, windowMs) => {
      try {
        const records = await new CdpRuntimeErrorCollector({
          metroUrl: devServerUrl,
          durationMs: windowMs,
          platform: options.platform,
          deviceIndex: await indexAsync(devServerUrl),
        }).collectAsync();
        return { ok: true, records, reason: null };
      } catch (error: unknown) {
        // An unreadable app is a result rather than a tool failure: the gate reports that it could
        // not watch, which is exactly what `inconclusive` is for.
        return {
          ok: false,
          records: [],
          reason: `the app could not be watched (${error instanceof Error ? firstLine(error.message) : String(error)})`,
        };
      }
    },

    // @ref ./phases §SCREENSHOT_SETTLE_MS — friction run 6, F57. Nothing over this protocol says
    // "rendered", so what is waited for is the app having stopped re-registering: two reads of the
    // dev server's target list that name the same ids. A relaunching app changes them.
    waitForStableTargets: async (devServerUrl, timeoutMs) => {
      const deadline = Date.now() + timeoutMs;
      let previous: string | null = null;
      for (;;) {
        const probe = await probeDevServerAsync(devServerUrl);
        const ids = probe.targets
          .map((target) => target.id)
          .sort()
          .join(',');
        if (previous != null && ids === previous && ids !== '') {
          return { stable: true };
        }
        previous = ids;
        if (Date.now() + TARGET_SETTLE_POLL_MS >= deadline) {
          return { stable: false };
        }
        await new Promise((resolve) => setTimeout(resolve, TARGET_SETTLE_POLL_MS));
      }
    },

    captureScreenshot: (deviceId) =>
      captureScreenshotAsync({
        platform: options.platform,
        deviceId,
        filePath: options.screenshotPath ?? defaultScreenshotPath(projectRoot),
      }),

    now: () => Date.now(),
  };
}

function firstLine(text: string): string {
  return text.split('\n')[0]!;
}
