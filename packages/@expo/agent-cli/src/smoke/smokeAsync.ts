// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// `@expo/agent-cli smoke`: the composite gate.
//
// This module is the wiring, and deliberately nothing else. The decisions are in `phases.ts`,
// which is given the functions below rather than importing them, so the outcome table can be
// tested against fakes. What is here is the real versions of those functions — every one of them
// the same function the command that owns the question already calls.

import chalk from 'chalk';

import { devDetachAsync } from '../dev/detachAsync';
import { resolveDevOptions } from '../dev/resolveOptions';
import { resolveDevStopOptions } from '../dev/resolveStopOptions';
import { devStopAsync, type DevStopResultJson } from '../dev/stopAsync';
import { bootDeviceAsync, shutdownDeviceAsync } from '../device/bootDevice';
import { checkExpoGoVersionAsync } from '../device/expoGoVersion';
import { installExpoGoAsync } from '../device/installExpoGo';
import { simulatorDiskExistsAsync, simulatorHasAppAsync } from '../device/installedApps';
import { captureScreenshotAsync, defaultScreenshotPath } from '../device/screenshot';
import { event } from '../events';
import { EXIT_OK } from '../exitCodes';
import { buildSmokeFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { resolveDeviceAsync, type DeviceBackend } from '../navigate/device';
import { openRouteAsync } from '../navigate/openRoute';
import { EXPO_GO_APP_IDS } from '../navigate/target';
import { PROGRAM_PREFIX } from '../programName';
import { checkExpoGoCompatibilityAsync, decidesAgainstExpoGo } from '../project/expoGo';
import { readSdkVersionAsync } from '../project/nodeModules';
import type { StartPlan } from '../project/types';
import { checkEntryBundleAsync } from '../runtime/bundleCheck';
import { CdpClient, isMethodNotFoundError } from '../runtime/cdpClient';
import { discoverDevServerAsync, probeDevServerAsync } from '../runtime/devServer';
import { markBundleSignalSync } from '../runtime/reload/bundleSignal';
import {
  reloadOverDevServerAsync,
  waitForReloadEvidenceAsync,
  type CommandSocketChurn,
} from '../runtime/reload/reloadAsync';
import { CdpRuntimeErrorCollector } from '../runtime/runtimeErrorCollector';
import {
  buildDeviceNameIndexIfNeededAsync,
  scopeTargets,
  type DeviceNameIndex,
} from '../runtime/targetPlatform';
import { waitForAppConnectionAsync, waitForBundlerReadyAsync } from '../runtime/waitReady';
import { formatSmokeResult, smokeResultToJson } from './format';
import {
  BOOT_DEVICE_TIMEOUT_MS,
  isFailingRecord,
  runSmokePhasesAsync,
  smokeExitCode,
  BUILD_DEV_SERVER_TIMEOUT_MS,
  START_DEV_SERVER_TIMEOUT_MS,
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
 * The command line `--start` runs `@expo/agent-cli dev` with.
 *
 * **The platform flag is deliberately absent**, and that is a correction rather than an omission
 * [observed live — 2026-08-24, on a Mac that had granted no Automation permission]. `--ios` makes
 * the plan run `expo start --ios`, which drives Simulator.app through AppleScript; the Expo CLI
 * does not catch a refusal there and the dev server exits with it (llp/0010 §Forwarded codes, and the exception
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
    // What this run did to the machine, on the stream too: an agent watching events rather than
    // stdout has to be able to see that a dev server appeared and went again.
    devServer: run.environment.devServer,
    device: run.environment.device,
    leftBehind: run.environment.cleanup.filter((entry) => !entry.ok).map((entry) => entry.resource),
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
    bootstrap: options.bootstrap,
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
    reloadDisposition: run.reload.disposition,
    appMismatch: run.appMismatch,
    // The `start-dev-server` phase is only in the list for a run that performed one, and it is
    // charged as a build when the plan compiled (@ref ./phases §BUILD_DEV_SERVER_TIMEOUT_MS).
    buildAttempted: run.buildAttempted,
    // `required` is `--cloud`; `fallback` is a run that would only reach a session if this machine
    // had no device, and a ladder must not put a billed session on a line the caller never asked
    // for (llp/0005 §Cloud simulator).
    cloud: options.cloud === 'required',
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
  const culprit = run.phases.find(
    (phase) => phase.status === 'failed' || phase.status === 'inconclusive'
  );
  const what =
    run.outcome === 'failed'
      ? `The smoke gate failed at "${culprit?.id ?? 'an unknown phase'}".`
      : `The smoke gate could not decide, at "${culprit?.id ?? 'an unknown phase'}".`;
  const why = culprit?.reason ?? 'no phase reported a reason, which is a bug in this command.';
  const how =
    run.outcome === 'failed'
      ? `Read the phase list above: every phase before the one that failed did answer, so the failure is about what that phase asked and nothing later. The "Suggested next:" line is the command that acts on it.`
      : `Nothing was shown to be wrong and nothing was proved right, so this is not a failure to act on. ${
          run.appMismatch != null
            ? // @ref llp/0009 §the no-useless-re-run rule. The one inconclusive state looking again
              // cannot change: the same Expo Go will answer the same way for ever, so "look again"
              // here would send a caller round a loop with no exit.
              'The app that answered cannot run this project at all, so looking again reads the same wrong runtime — the development build is what has to exist first.'
            : run.runtimeSupported === false
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
  // Read once and shared by the start phase and the boot phase, which ask two halves of one
  // question: what is this run about to open, and does it exist yet.
  let target: Promise<SmokeTarget> | null = null;
  const targetAsync = () => (target ??= resolveSmokeTargetAsync(projectRoot, options));

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

    // The detach path of `@expo/agent-cli dev`, with the readiness wait on: a foreground start would never
    // return, and this run has seven more phases to perform (llp/0004 §Daemonization).
    // The argv is `START_DEV_SERVER_ARGV`, whose documentation says why it carries no platform.
    startDevServer: async () => {
      // @ref llp/0005-runtime-loop-tools.rfc.md §It builds what the app needs, and says so first
      //
      // This used to refuse. `--yes` on the detached child consents to whatever plan it makes, and
      // for a project whose development build is missing or stale that plan is a compiler — so the
      // gate named `dev` and stopped, which is a correct instruction and a dead end for a loop that
      // cannot leave itself to take it.
      //
      // It now runs the plan, and **says so before it starts**. A command that silently blocks for
      // twenty minutes is indistinguishable from one that has hung, so the one thing the caller
      // needs is the sentence that tells them which it is. On stderr, because stdout carries one
      // JSON object and nothing else (llp/0006 §Output contract), and as an event too so a reader
      // of the stream sees it without parsing English.
      const target = await targetAsync();
      if (target.buildLocation != null) {
        // `runsOn` is where it compiles: this machine, or EAS. Worth saying, because the two have
        // very different costs and the caller may not have chosen either on purpose.
        const where = target.buildLocation.runsOn;
        event('smoke_building', { platform: options.platform, where });
        Log.progress(
          chalk.dim(
            [
              `Building the ${options.platform} development build first, ${where === 'eas' ? 'on EAS' : 'on this machine'}.`,
              `This project has none for its current fingerprint, and a native build takes some minutes — nothing is stuck.`,
            ].join(' ')
          )
        );
      }
      const built = target.buildLocation != null;
      const argv = [...START_DEV_SERVER_ARGV, ...startPortArgs(options.devServerUrl)];
      try {
        // `print: false`: the detached start is one phase of this run, and this run prints one
        // report. Its `cli:dev_detach` event is still emitted, so nothing about it is hidden.
        //
        // The budget is this phase's own (@ref ./phases §START_DEV_SERVER_TIMEOUT_MS) rather than
        // `--timeout`, which bounds the phases that read the app and is not charged for the start.
        await devDetachAsync(
          projectRoot,
          {
            ...resolveDevOptions(argv),
            // A plan that compiles needs a budget the shape of a compile
            // (@ref ./phases §BUILD_DEV_SERVER_TIMEOUT_MS).
            detachTimeoutMs:
              target.buildLocation != null
                ? BUILD_DEV_SERVER_TIMEOUT_MS
                : START_DEV_SERVER_TIMEOUT_MS,
          },
          { print: false }
        );
      } catch (error: unknown) {
        return {
          ok: false,
          devServerUrl: null,
          built,
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
        built,
        reason: found.reachable
          ? null
          : `a dev server was started and nothing answered at ${found.devServerUrl} afterwards (${found.reason ?? 'no answer'})`,
      };
    },

    // `dev:stop`'s own act, through `dev:stop`'s own function, with its report suppressed: this
    // run prints one report and the stop is a line in it. Everything that makes the stop safe is
    // that command's — it signals the pid the project's lock names and refuses a dev server no
    // lock answers for, so a cleanup can never take down something this run did not start.
    stopDevServer: async () => {
      const captured: { report: DevStopResultJson | null } = { report: null };
      const code = await devStopAsync(projectRoot, resolveDevStopOptions(['--no-followups']), {
        print: false,
        onReport: (stopped) => {
          captured.report = stopped;
        },
      });
      const stopped = captured.report;
      return {
        ok: code === EXIT_OK,
        target: stopped?.url ?? (stopped?.port == null ? null : `port ${stopped.port}`),
        reason: code === EXIT_OK ? null : (stopped?.detail ?? 'the dev server did not stop'),
      };
    },

    // @ref src/device/bootDevice.ts. Local only, and that is not a gap: `--cloud` names a session
    // somebody else started and pays for, and the phase that calls this never runs for one.
    //
    // The app this run is about is handed over, so the boot picks a device that **has** it and
    // declines rather than booting one that could not open it (llp/0005 §The device that can open
    // the app).
    bootDevice: async (register) => {
      const target = await targetAsync();
      const result = await bootDeviceAsync(options.platform, {
        timeoutMs: BOOT_DEVICE_TIMEOUT_MS[options.platform],
        onBooting: register,
        appId: target.appId,
        appLabel: target.appLabel,
        installWith: target.installWith,
        // @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got
        // it. Only for the plan's Expo Go rule, which is exactly "this project fits in Expo Go and
        // nothing overrode it to a development build" — a development build is this project's own
        // artefact and putting one on a device is a compile, which `dev` owns.
        mayInstall: target.installable,
      });
      return {
        ok: result.ok,
        deviceId: result.deviceId,
        backend: result.backend,
        refused: result.refused,
        choice: result.choice,
        installNeeded: result.installNeeded,
        reason: result.ok ? null : `${result.reason}${result.name ? ` (${result.name})` : ''}`,
      };
    },

    // @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
    //
    // Both halves of the question, so the phase runner carries no policy: is this an app this run
    // may install, and has the device not got it. The first is the plan's `expo-go` rule, which
    // already means "the project fits in Expo Go and nothing overrode it to a development build".
    // The second is the same disk read the device choice makes (`installedApps.ts`).
    installNeededOnDevice: async (deviceId, backend) => {
      const target = await targetAsync();
      if (!target.installable || target.appId == null) {
        return false;
      }
      // Local simulators only, and the backend is the one the run already settled on rather than a
      // second resolution of its own: a cloud session's disk is not this machine's, and Android
      // installs through a different tool (llp/0005 §Cloud simulator, §Android).
      if (options.platform !== 'ios' || backend !== 'local-ios') {
        return false;
      }
      // @ref src/device/installedApps §simulatorDiskExistsAsync
      //
      // Asked **before** the app is looked for, because "no apps" and "could not look" are the same
      // answer from the read below and this action is a 423 MB download. A machine with no
      // CoreSimulator tree — the e2e tier's Linux runner, a udid nothing here has — would otherwise
      // read as "Expo Go is not installed" and reach for a real one [observed — tier0-linux,
      // 2026-09-03].
      if (!(await simulatorDiskExistsAsync(deviceId))) {
        return false;
      }
      if (!(await simulatorHasAppAsync(deviceId, target.appId))) {
        return true;
      }
      // @ref llp/0005-runtime-loop-tools.rfc.md §The Expo Go on the device is not the Expo Go the SDK wants
      //
      // Installed is not the same as right, and this is the half `@expo/cli` gets right and a first
      // cut here did not: `ExpoGoInstaller` compares with `semver.eq` and, when it cannot prompt,
      // installs the recommended release rather than reporting the difference — "better to have the
      // correct version than not have Expo Go work at all". An agent loop is exactly the caller
      // that cannot be prompted.
      //
      // `unknown` installs nothing: a machine that is offline, or one whose `Info.plist` would not
      // read, has shown no reason to spend 423 MB.
      const version = await checkExpoGoVersionAsync(
        deviceId,
        options.platform,
        await readSdkVersionAsync(projectRoot)
      );
      return version.verdict === 'mismatch';
    },

    // `expo-go download` for the binary and `simctl install` for the device, both as subprocesses.
    // Only reached for a boot that came up without the app, and only when the plan's rule is Expo
    // Go — so the SDK version is the one the project reports, and the release is the one that SDK
    // ships rather than whatever is newest.
    installApp: async (deviceId) =>
      await installExpoGoAsync(deviceId, options.platform, await readSdkVersionAsync(projectRoot)),

    shutdownDevice: async (deviceId, backend) => {
      const result = await shutdownDeviceAsync(deviceId, backend);
      return { ok: result.ok, target: deviceId, reason: result.reason };
    },

    waitForBundlerReady: (devServerUrl, timeoutMs) =>
      waitForBundlerReadyAsync(devServerUrl, { timeoutMs, projectRoot }),

    checkEntryBundle: (devServerUrl, timeoutMs) =>
      checkEntryBundleAsync(devServerUrl, { platform: options.platform, timeoutMs, projectRoot }),

    // Scoped to this run's platform: a `smoke --android` that counted the iOS simulator already
    // attached to this dev server would go on to read that simulator's runtime, and report the
    // verdict as Android's [friction run 6, F51].
    waitForAppConnection: async (devServerUrl, timeoutMs) =>
      waitForAppConnectionAsync(devServerUrl, {
        timeoutMs,
        platform: options.platform,
        deviceIndex: await indexAsync(devServerUrl),
      }),

    // The same ladder `navigate` walks, through the same function — local device first, then this
    // project's EAS Simulator session (llp/0005 §Cloud simulator). A second resolution
    // here would be a second place for the order to drift, and a gate whose `route` phase and
    // `screenshot` phase disagreed about the device would photograph one to answer for the other.
    //
    // It throws where the probes it replaced returned; caught, because no device is an answer this
    // gate reports rather than fails on.
    probeDevice: async () => {
      try {
        const device = await resolveDeviceAsync(options.platform, {
          cloud: options.cloud,
          projectRoot,
        });
        return { deviceId: device.deviceId, backend: device.backend, reason: null };
      } catch (error: unknown) {
        return {
          deviceId: null,
          backend: null,
          reason: error instanceof Error ? firstLine(error.message) : String(error),
        };
      }
    },

    // The dev server this run settled on, not the flag: a run that discovered one in its first
    // phase must not go looking for a second one in its fourth.
    //
    // **And its provenance with it** (F96). That URL is where the dev server *listens*, which is not
    // where a device *reaches* it: `openRouteAsync` asks the manifest for the second, and it skips
    // that lookup for a URL the caller pinned. Handing it a discovered URL with no label made the
    // gate refuse `exp://127.0.0.1:8500` as unreachable from a cloud simulator while `navigate`,
    // against the same dev server, opened the tunnel host the manifest carried
    // [observed — live cloud, 2026-08-27]. `flag` only when the caller really did name one.
    openRoute: (route, devServerUrl, attachBudgetMs) =>
      openRouteAsync(projectRoot, {
        route,
        platform: options.platform,
        devServerUrl,
        devServerUrlSource: options.devServerUrl == null ? 'discovered' : 'flag',
        routeCheck: options.routeCheck,
        command: 'smoke',
        cloud: options.cloud,
        // @ref llp/0005-runtime-loop-tools.rfc.md §Loading the app is not navigating it. The
        // budget is what turns this open into a *load*: F123's launcher-first ladder is gated on
        // it, so without one a cold development build was handed `<scheme>://<route>` — the link
        // only an app that is already running understands — and the run photographed the dev
        // launcher's own screen [observed, 2026-09-01]. The ladder lives in `openRouteAsync`
        // and is `navigate`'s; passing the budget is how this command joins it rather than building
        // a second URL of its own (F96).
        confirmAttachMs: attachBudgetMs,
      }),

    // @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
    //
    // The gate's own version of the question `decideExpoGoTarget` answers for the *link*. That
    // decision stops this command opening Expo Go for a project that cannot run there; it says
    // nothing about an Expo Go that was already attached when the run arrived, which is what
    // `expo start --ios` leaves behind and the state an agent is most likely to inherit.
    //
    // Scoped to this run's platform for the same reason every other read is (F51): an iOS Expo Go
    // attached to the same dev server must not decide an `--android` run's answer.
    checkAppFitsProject: async (devServerUrl) => {
      const nothing = { mismatch: null, note: null };
      const probe = await probeDevServerAsync(devServerUrl);
      // `matched` only, never `undetermined`: a target whose platform nothing decided must not earn
      // this run's verdict either way (@ref src/runtime/targetPlatform §scopeTargets). Erring that
      // way keeps the check from turning an unreadable target into a refusal.
      const scoped = scopeTargets(probe.targets, options.platform, await indexAsync(devServerUrl));
      const expoGo = scoped.matched
        .map((target) => target.appId)
        .find((appId): appId is string => appId != null && EXPO_GO_APP_IDS.includes(appId));
      // Everything below is about Expo Go. A development build is this project's own app and its
      // version is the project's own business, so there is nothing here to ask about it.
      if (expoGo == null) {
        return nothing;
      }

      // @ref llp/0005 §Expo Go is only a target for a project that fits in it. Only a project that
      // is **ruled out** is a mismatch. Unknown is not: a project this could not read is the
      // ordinary state of a fresh clone (@ref src/project/expoGo §RULES_OUT_EXPO_GO).
      if (decidesAgainstExpoGo(await checkExpoGoCompatibilityAsync(projectRoot)) === false) {
        return {
          mismatch: `the app that answered is Expo Go (${expoGo}), and this project cannot run in Expo Go — its native code is not in that runtime, so this window is about Expo Go rather than about this project. "${PROGRAM_PREFIX} dev --${options.platform} --yes" makes the development build that can run it`,
          note: null,
        };
      }

      // @ref llp/0005 §The Expo Go on the device is not the Expo Go the SDK wants
      //
      // The project fits in Expo Go — but the Expo Go on the device is a build of *some* SDK, and
      // only the one from this project's release line is the app under test. Asked only of a local
      // simulator: the check reads that simulator's own bundle, and a cloud session's disk is not
      // this machine's (llp/0005 §Cloud simulator).
      // The same resolution `probeDevice` performs, and for the same reason: the device this run is
      // about. Any failure to find one is nothing to check rather than something to report — the
      // app answered, so whatever it is running on is beyond this check's reach.
      let udid: string | null = null;
      try {
        const device = await resolveDeviceAsync(options.platform, {
          cloud: options.cloud,
          projectRoot,
        });
        udid = device.backend === 'local-ios' ? device.deviceId : null;
      } catch {
        udid = null;
      }
      if (udid == null) {
        return nothing;
      }
      const version = await checkExpoGoVersionAsync(
        udid,
        options.platform,
        await readSdkVersionAsync(projectRoot)
      );
      // `unknown` says nothing at all, and that is a decision rather than an oversight: a machine
      // with no route out would otherwise carry "the version could not be checked" on the `app` row
      // of every run it ever makes, which is chatter rather than a finding.
      if (version.verdict !== 'mismatch') {
        return nothing;
      }
      // A run that could install has already fixed this in the `install-app` phase, so what reaches
      // here is a run that could not — `--no-start`, which says change nothing. It blocks the pass
      // rather than noting it: the runtime that answered is not the release this SDK ships, so the
      // window is not about the app the caller would ship.
      return {
        mismatch: [
          version.reason,
          `— so this window is about an Expo Go this SDK does not ship.`,
          options.bootstrap
            ? `This run was allowed to install the right one and did not manage to.`
            : `--no-start told this run to change nothing; a run without it installs the right one.`,
        ].join(' '),
        note: null,
      };
    },

    // @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
    //
    // `runtime:reload`'s rung 1, and its proofs, through the same functions — the whole point of
    // this command being one process (llp/0005 §The smoke gate). Deliberately **only** rung 1: the
    // rungs above it stop the app and start it again, and a gate is not allowed to take the
    // caller's app away in order to answer a question about it. An app the broadcast cannot reach
    // is a fact this phase reports, not a licence to relaunch.
    //
    // The bundle mark is taken *before* the broadcast because that is what makes the log a proof:
    // `dev-server-bundle` says a bundle was served after this run acted, which is only readable
    // against a count from before it.
    reloadApp: async (devServerUrl, timeoutMs) => {
      const before = await probeDevServerAsync(devServerUrl);
      const knownTargetIds = before.targets.map((target) => target.id);
      const bundleMark = markBundleSignalSync(projectRoot);

      let churn: CommandSocketChurn | null = null;
      const attempt = await reloadOverDevServerAsync(devServerUrl, {
        connectedApps: before.targets.length,
        onChurn: (observed) => {
          churn = observed;
        },
      });
      // The churn out-parameter is written on every path through the rung, including the ones that
      // fail before the broadcast, so it is read whatever `attempt.ok` says.
      const reconnected = ((churn as CommandSocketChurn | null)?.reconnected ?? 0) > 0;

      if (!attempt.ok) {
        return {
          ok: false,
          verifiedBy: null,
          knownTargetIds,
          freshTargets: 0,
          commandSocketReconnected: reconnected,
          bundleServed: false,
          reason: attempt.reason,
        };
      }

      const evidence = await waitForReloadEvidenceAsync(devServerUrl, projectRoot, {
        timeoutMs,
        knownTargetIds,
        bundleMark,
        platform: options.platform,
      });

      // The same order of preference `runtime:reload` uses, for the same reason: the mechanism's
      // own observation is the strongest fact, a target the dev server had never listed is the
      // next, and a bundle line says something fetched a bundle without saying which client did.
      // Each label is named only where its own evidence in this result is non-empty (llp/0021).
      const verifiedBy = reconnected
        ? ('message-socket-peers' as const)
        : evidence.freshTargets > 0
          ? ('fresh-debugger-target' as const)
          : evidence.bundle.observed
            ? ('dev-server-bundle' as const)
            : null;

      return {
        ok: verifiedBy != null,
        verifiedBy,
        knownTargetIds,
        freshTargets: evidence.freshTargets,
        commandSocketReconnected: reconnected,
        bundleServed: evidence.bundle.observed,
        reason:
          verifiedBy != null
            ? null
            : 'the reload was delivered to the dev server and nothing was seen to come of it: no client reconnected, no debugger target appeared under a new id, and the dev server served no bundle',
      };
    },

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

    captureScreenshot: (deviceId, backend: DeviceBackend | null) =>
      captureScreenshotAsync({
        platform: options.platform,
        deviceId,
        backend: backend ?? undefined,
        projectRoot,
        filePath: options.screenshotPath ?? defaultScreenshotPath(projectRoot),
      }),

    now: () => Date.now(),
  };
}

/**
 * What this run would open, and whether it may start a dev server for it at all.
 *
 * One read of the project's plan, answering the two questions that are really the same one: which
 * app is this run about, and is it an app that exists yet.
 */
interface SmokeTarget {
  /**
   * Where this project's plan would build, or null when it builds nothing.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §It builds what the app needs, and says so first
   * `StartPlan.buildLocation`, the plan engine's own answer to "does this plan compile anything":
   * an Expo Go target and a development build already installed for this fingerprint both answer
   * null. It used to be the boundary this command refused at; it is now the fact that decides the
   * start phase's budget and the sentence printed before the wait.
   */
  buildLocation: StartPlan['buildLocation'];
  /**
   * The application id this run's deep link would open, or null when it could not be read.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app
   * The **plan's** rule decides it rather than the app config alone, and that distinction is the
   * whole value: an Expo Go project usually also declares an `ios.bundleIdentifier`, so a device
   * choice made from the config would go looking for an app this run is never going to open.
   */
  appId: string | null;
  /** What to call it in a sentence — `Expo Go` reads better than `host.exp.Exponent`. */
  appLabel: string | null;
  /** The command that puts that app on a simulator, for a machine where no device has it. */
  installWith: string | null;
  /**
   * This run may put the app on a device itself, rather than refusing a machine without it.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
   * True for exactly one plan rule: `expo-go`. That rule already *is* the two conditions this
   * turns on — the project fits in Expo Go, and nothing in `agentCli` config overrode it to a
   * development build (`src/plan/decide.ts`) — so this reads the plan's answer rather than
   * re-deciding it and risking a third opinion.
   *
   * False for every development build, and that is the boundary this key draws: Expo Go is a
   * published binary to *download onto a device*, and a development build is this project's own
   * artefact to *compile*. The compile is not refused — the start phase runs it and says so first
   * (§It builds what the app needs, and says so first) — it just is not an install, so it is not
   * this phase's.
   */
  installable: boolean;
}

/** Read the plan once, and answer both questions from it. Never throws. */
async function resolveSmokeTargetAsync(
  projectRoot: string,
  options: SmokeOptions
): Promise<SmokeTarget> {
  const { probeProjectStateAsync } =
    require('../project/probe') as typeof import('../project/probe');
  const { readLastBuildFingerprints } =
    require('../plan/lastBuild') as typeof import('../plan/lastBuild');
  const { resolveStartPlanAsync } =
    require('../plan/resolveAsync') as typeof import('../plan/resolveAsync');
  const { EXPO_GO_APP_ID, readConfiguredAppId } =
    require('../runtime/appId') as typeof import('../runtime/appId');

  const unknown: SmokeTarget = {
    buildLocation: null,
    appId: null,
    appLabel: null,
    installWith: null,
    // A plan this could not read is not one to act on: installing an app for a project whose rule
    // is unknown would be guessing at which app it even wants.
    installable: false,
  };

  let plan;
  try {
    const state = await probeProjectStateAsync(projectRoot);
    plan = await resolveStartPlanAsync(projectRoot, state, {
      platform: options.platform,
      lastBuild: readLastBuildFingerprints(projectRoot),
    });
  } catch {
    // The probe is a courtesy, not a gate: a project it could not read is one this knows nothing
    // about, and refusing or choosing a device on an unread plan would stop runs that would have
    // worked. Everything below degrades to the behaviour that was here before it.
    return unknown;
  }

  // `expo-go` is the one rule whose app is not this project's own build. Everything else — a
  // development build, a bare project, one that needs `expo-dev-client` — opens the app the
  // config names, whether or not it is installed anywhere yet.
  const expoGo = plan.rule === 'expo-go';
  const configured = expoGo ? null : readConfiguredAppId(projectRoot, options.platform);
  const appId = expoGo ? EXPO_GO_APP_ID[options.platform] : configured;

  return {
    buildLocation: plan.buildLocation,
    appId,
    appLabel: expoGo ? 'Expo Go' : appId,
    // Two different commands, because they put two different apps on the device. `expo start
    // --ios` is what installs Expo Go [observed — `@expo/cli` `openPlatforms.ts` →
    // `PlatformManager.openProjectInExpoGoAsync`, the same finding llp/0004 §Decision table
    // records for the plan's platform flag]; a development build is `dev`'s to make.
    installWith: expoGo
      ? `npx expo start --${options.platform}`
      : `${PROGRAM_PREFIX} dev --${options.platform} --yes`,
    installable: expoGo,
  };
}

function firstLine(text: string): string {
  return text.split('\n')[0]!;
}
