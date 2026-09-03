// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The gate itself: nine phases, one verdict — and two more that only some runs perform.
//
// Every phase is a question one existing command already answers, asked here through the same
// function rather than by running that command again. That is the whole design constraint. A
// `smoke` built out of subprocesses of itself would have nine processes, nine dev-server
// discoveries, and nine chances for the answers to disagree — and it would hand back a chain of
// exit codes rather than one.
//
// The phases and where each one comes from:
//
// | phase              | the command whose question it is | the function                |
// | ------------------ | -------------------------------- | --------------------------- |
// | `start-dev-server` | `dev --detach` (conditional)     | `devDetachAsync`            |
// | `dev-server`       | every runtime command            | `discoverDevServerAsync`    |
// | `bundler-ready`    | this command only                | `waitForBundlerReadyAsync`  |
// | `bundle`           | this command, `runtime:reload`   | `checkEntryBundleAsync`     |
// | `boot-device`      | (new, conditional)               | `bootDeviceAsync`           |
// | `install-app`      | (new, conditional)               | `installExpoGoAsync`        |
// | `app`              | this command only                | `waitForAppConnectionAsync` |
// | `reload`           | `runtime:reload`                 | `reloadOverDevServerAsync`  |
// | `route`            | `navigate`                       | `openRouteAsync`            |
// | `runtime`          | `runtime:eval`                   | `CdpClient.evaluateAsync`   |
// | `errors`           | `runtime:errors`                 | `CdpRuntimeErrorCollector`  |
// | `screenshot`       | (new)                            | `captureScreenshotAsync`    |
//
// The `bundler-ready`/`bundle`/`app` rows used to be `dev:wait`'s, which the v1 narrowing deferred
// (llp/0016). The library functions they call are unchanged and still live in `src/runtime/`; only
// the second command that called them is gone.
//
// **The three conditional phases are acts rather than questions**, and that shapes three things
// (llp/0005 §The run brings its own environment): they are reported only by a run that performed
// them, they are never charged to `--timeout`, and each one registers the way to undo itself
// *before* it does anything. `runSmokePhasesAsync` is the wrapper that runs those undos, newest
// first, on every path out of the walk.
//
// The dependencies are injected rather than imported, so the outcome table below — which is the
// part that can be wrong in a way no type checker sees — is testable against fakes, with no dev
// server, no device and no clock.

import type { ScreenshotResult } from '../device/screenshot';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import type { DeviceBackend } from '../navigate/device';
import type { OpenRouteResult } from '../navigate/openRoute';
import type { RouteCheckJson } from '../navigate/routeCheck';
import type { BundleCheckResult } from '../runtime/bundleCheck';
import type { DevServerDiscovery } from '../runtime/devServer';
import type { RuntimeErrorRecord } from '../runtime/runtimeErrorCollector';
import type { AppConnectionResult, BundlerReadyResult } from '../runtime/waitReady';
import type { SmokeOptions } from './resolveOptions';
import type {
  SmokeCleanupJson,
  SmokeEnvironmentJson,
  SmokeOutcome,
  SmokePhase,
  SmokePhaseId,
  SmokePhaseStatus,
  SmokeReloadJson,
  SmokeResource,
} from './types';

/** What starting a dev server amounted to. */
export interface SmokeStartResult {
  ok: boolean;
  /** Origin it came up on, when it did. */
  devServerUrl: string | null;
  /** Why it did not. Null exactly when {@link ok} is true. */
  reason: string | null;
  /**
   * The plan this start ran **compiled** something.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §It builds what the app needs, and says so first
   * Reported whether the start succeeded or failed, because what it changes — the cheapest way to
   * find out why — is most useful exactly when it failed.
   */
  built?: boolean;
}

/** What booting a simulator or an emulator amounted to. */
export interface SmokeBootResult {
  ok: boolean;
  /** The device that came up. Null exactly when {@link ok} is false. */
  deviceId: string | null;
  backend: DeviceBackend | null;
  /** Why none came up. Null exactly when {@link ok} is true. */
  reason: string | null;
  /**
   * Nothing was booted **on purpose**: no device on this machine could have opened the app.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app
   * Reported apart from an ordinary boot failure because the two need different sentences and
   * different next actions: one is a simulator that would not start, and this one is a machine
   * that has nowhere to run this app yet.
   */
  refused?: boolean;
  /** Why this device rather than another, for the report. Null when none was chosen. */
  choice?: string | null;
  /**
   * The device came up **without** the app, so the caller has an install to do.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
   */
  installNeeded?: boolean;
}

/**
 * Told the moment the boot has a device to name, and before the device is touched.
 *
 * This is what makes "stop only what you started" hold through a boot that fails halfway: the
 * cleanup is registered from here, so a simulator that was asked to boot and then hung is still
 * shut down. A boot that registered its cleanup on the way *out* would leak exactly the device
 * that went wrong (llp/0005 §The run brings its own environment).
 */
export type SmokeBootRegister = (device: { deviceId: string; backend: DeviceBackend }) => void;

/** What putting the app on a device amounted to. Never a throw: a failed install is a result. */
export interface SmokeInstallResult {
  ok: boolean;
  /** The version that was installed, when the installer could name one. */
  version: string | null;
  /**
   * The version that was there before, when this replaced one rather than adding it.
   *
   * Two different things to do to somebody's machine, and the row says which (llp/0021 §The rules).
   */
  replaced?: string | null;
  /** Why it was not. Null exactly when {@link ok} is true. */
  reason: string | null;
}

/** What putting one thing back amounted to. Never a throw: a cleanup that failed is a result. */
export interface SmokeReleaseResult {
  ok: boolean;
  /** What was released, for the report. */
  target: string | null;
  /** Why it was not. Null exactly when {@link ok} is true. */
  reason: string | null;
}

/** What asking the runtime to evaluate `1` amounted to. */
export interface SmokeEvaluateResult {
  /** The runtime answered, whatever it answered with. */
  ok: boolean;
  /**
   * The runtime has no `Runtime.evaluate` handler at all.
   *
   * The Expo Go Android case (llp/0005-runtime-loop-tools.rfc.md §Android), and the reason it is a field of its own: a
   * runtime that cannot be evaluated also reports an *empty error window*, so the window that
   * follows proves nothing and the run must never pass on it.
   */
  unsupported: boolean;
  /** What went wrong, for the report. Null when it answered. */
  reason: string | null;
}

/**
 * What putting an already-attached app back on the served bundle amounted to.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
 * Never a throw: a reload that could not be performed is a fact this gate reports, not a tool
 * failure — the run still has a picture and an error window to hand back, and the phase's job is to
 * say which session they are of.
 */
export interface SmokeReloadResult {
  /** The reload mechanism ran and was **observed** to have reloaded the app. */
  ok: boolean;
  /**
   * What proved it. Null exactly when {@link ok} is false.
   *
   * Under llp/0021's rule: named only when this result's own evidence field for it is non-empty, so
   * `ok` and a label with nothing behind it cannot be reported together.
   */
  verifiedBy: 'message-socket-peers' | 'fresh-debugger-target' | 'dev-server-bundle' | null;
  /** The targets listed before the broadcast, which is what makes a later one "fresh". */
  knownTargetIds: string[];
  /** Targets seen afterwards under an id that was not in that list. */
  freshTargets: number;
  /** Whether the app's client on the command socket was replaced. */
  commandSocketReconnected: boolean;
  /** Whether the dev server was seen to serve a bundle after this run acted. */
  bundleServed: boolean;
  /** Why nothing was proved. Null exactly when {@link ok} is true. */
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
  /**
   * Stop the dev server this run started. Only ever called for one this run started.
   *
   * Never throws, and answers `ok` for a dev server that is already gone: the question a cleanup
   * asks is "is it not running now", and a start that died on its own has answered it.
   */
  stopDevServer(): Promise<SmokeReleaseResult>;
  /** Boot a device for this run's platform, telling {@link SmokeBootRegister} the id first. */
  bootDevice(register: SmokeBootRegister): Promise<SmokeBootResult>;
  /** Shut down the device this run booted. Only ever called for one this run booted. */
  shutdownDevice(deviceId: string, backend: DeviceBackend): Promise<SmokeReleaseResult>;
  /**
   * Put the app on the device this run booted, when the boot said it has not got it.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
   * Only ever called for a boot whose {@link SmokeBootResult.installNeeded} is true, and only
   * after that boot: the device has to be up for `simctl install` to reach it.
   *
   * **Registers no cleanup, deliberately.** "Stop only what you started" is about resources this
   * run is *holding* — a dev server, a booted simulator. An installed app is not held, it is
   * given: uninstalling Expo Go on the way out would take away what the next run needs and make
   * it download 423 MB again.
   */
  installApp(deviceId: string): Promise<SmokeInstallResult>;
  /**
   * Whether this run has an app to put on that device before it can open anything.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
   * True only when the app is one this run may install *and* the device has not got it. The policy
   * half lives with the caller, so this file stays a walk over phases rather than a second opinion
   * about which apps may be installed.
   *
   * Asked of the device this run settled on, however it got there — **not** only of one this run
   * booted. A simulator someone left running without Expo Go is the ordinary case, and the first
   * version of this phase missed it by hanging the question off the boot [observed, 2026-09-03].
   */
  installNeededOnDevice(deviceId: string, backend: DeviceBackend | null): Promise<boolean>;
  waitForBundlerReady(devServerUrl: string, timeoutMs: number): Promise<BundlerReadyResult>;
  checkEntryBundle(devServerUrl: string, timeoutMs: number): Promise<BundleCheckResult>;
  waitForAppConnection(devServerUrl: string, timeoutMs: number): Promise<AppConnectionResult>;
  /**
   * Look for a device without failing when there is none: no device is an answer.
   *
   * Answers the *backend* too, because the picture is taken through a different tool for each and
   * the phase that takes it must not guess. Null when nothing was found.
   */
  probeDevice(): Promise<{
    deviceId: string | null;
    backend: DeviceBackend | null;
    reason: string | null;
  }>;
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
  openRoute(
    route: string,
    devServerUrl: string,
    /**
     * How long the open may wait for the app to register a debugger target.
     *
     * @ref llp/0005-runtime-loop-tools.rfc.md §Loading the app is not navigating it
     * Not decoration: `openRouteAsync`'s launcher-first ladder (F123) is **gated on this budget**,
     * because loading a development build means opening the launcher URL first and waiting for the
     * bundle it fetches. A run that passed none — which `smoke` did — handed a cold app the link
     * only a loaded app understands and landed on the launcher's own screen.
     */
    attachBudgetMs: number
  ): Promise<OpenRouteResult>;
  /**
   * Whether the app that answered is one this project can actually run.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
   * @ref llp/0005-runtime-loop-tools.rfc.md §The Expo Go on the device is not the Expo Go the SDK wants
   *
   * Two answers, because the findings are not the same weight. A `mismatch` is an app that cannot
   * run this project — Expo Go holding a project whose native code its fixed runtime does not
   * contain, or an Expo Go from another SDK release line — and the gate must not report a pass on
   * a reading taken through it. A `note` is a finding worth printing that decides nothing, such as
   * an Expo Go an update behind on the same release line, which will usually run the app.
   *
   * Both null is the ordinary answer, and so is both null when nothing could be decided: a check
   * that could not run must not become a refusal.
   */
  checkAppFitsProject(
    devServerUrl: string
  ): Promise<{ mismatch: string | null; note: string | null }>;
  /**
   * Put an app that was already attached back on the bundle the dev server is serving.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
   * `runtime:reload`'s rung 1 and its proofs, asked here through the same functions. Only rung 1:
   * the rungs above it stop the app and start it again, and a gate is not allowed to take the
   * caller's app away to answer a question about it.
   */
  reloadApp(devServerUrl: string, timeoutMs: number): Promise<SmokeReloadResult>;
  evaluate(devServerUrl: string): Promise<SmokeEvaluateResult>;
  collectErrors(devServerUrl: string, windowMs: number): Promise<SmokeErrorsResult>;
  captureScreenshot(deviceId: string, backend: DeviceBackend | null): Promise<ScreenshotResult>;
  /**
   * Wait until the dev server lists the same debugger targets twice, or the budget runs out.
   *
   * The picture is evidence, and a picture of a splash screen is evidence of nothing
   * [observed — friction run 6 (Android), 2026-08-24, `and-05-settled-after-smoke.png`: the run
   * opened the app itself and photographed it mid-load]. Nothing over this protocol says
   * "rendered", so what is waited for is the honest neighbouring fact — the app has stopped
   * re-registering, which is what a still-loading relaunch does.
   */
  waitForStableTargets(devServerUrl: string, timeoutMs: number): Promise<{ stable: boolean }>;
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
  /** What this run found on the machine, what it started, and what it put back. */
  environment: SmokeEnvironmentJson;
  appsConnected: number | null;
  bundle: BundleCheckResult | null;
  route: string | null;
  routeCheck: RouteCheckJson | null;
  deviceId: string | null;
  deviceBackend: DeviceBackend | null;
  runtimeSupported: boolean | null;
  /**
   * Whether the app the later phases read was the code on disk.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
   * Its default says the truth for a run that never reached the phase: nothing replaced the
   * session, because there was no session to replace.
   */
  reload: SmokeReloadJson;
  /**
   * Why the app that answered cannot run this project, or null when it can.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
   * Reported as a fact rather than only as the `app` phase's sentence, because the follow-ups and
   * the explanation both branch on it and neither may do that by matching English
   * (llp/0005 §One preflight for the runtime family, on `error.data`).
   */
  appMismatch: string | null;
  /**
   * The start phase ran a plan that **compiled**.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §It builds what the app needs, and says so first
   * Read by the follow-ups, which offer a different cheapest-next-step for a start that took
   * minutes than for one that took seconds.
   */
  buildAttempted: boolean;
  windowMs: number | null;
  errors: RuntimeErrorRecord[];
  screenshot: ScreenshotResult;
  durationMs: number;
}

/**
 * What the `reload` phase amounts to for a run that never got there.
 *
 * A fresh object each call: this is handed out as the run's own mutable record, and a shared
 * literal would let one run's phase write into the next one's report.
 */
export function noReload(): SmokeReloadJson {
  return {
    disposition: 'not-needed',
    verifiedBy: null,
    knownTargetIds: [],
    freshTargets: null,
    commandSocketReconnected: null,
    bundleServed: null,
  };
}

/** The route opened when nothing was named and there is no app to read. */
const ROOT_ROUTE = '/';

/** How long the first look for an attached app gets before the run opens one itself. */
const APP_PROBE_MS = 2_000;

/**
 * How long the app gets to stop re-registering before anything is read from it.
 *
 * Only spent by a run that opened the app itself: a run that attached to an app already on screen
 * has nothing to settle, and the wait would be dead time in the common case.
 *
 * **Before the runtime read, not only before the picture** — and that is the correction this wave
 * made [observed — 2026-08-30, a cold-start run of the shape §The run brings its own environment
 * exists for: dev server started, simulator booted, Expo Go launched from nothing]. The `app` phase
 * answered `ok` at 7.4 s and the `runtime` phase two seconds later got `No target found`, so a run
 * whose app was on the screen and working reported `22`. Its own picture shows the app rendered.
 *
 * It is the same finding as F57, one phase earlier. F57 was about the *picture* being of a splash
 * screen; this is about the *debugger target list* still churning while the app boots, and the
 * bootstrap is what made that window common — before it, the app was nearly always opened onto a
 * simulator that was already warm.
 */
export const APP_SETTLE_MS = 4_000;

/**
 * How long the **first** compile of a dev server this run started gets, out of a budget of its own.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
 * Coming up is not reading, and this is the phase where the difference is largest: a dev server
 * that has never bundled has to transform the whole dependency graph, which is minutes on a real
 * app and milliseconds on the second run. Charging that to `--timeout` — the window meant for
 * measuring the app — is the same mistake as charging it the simulator boot, and it fails in the
 * same way: the measurement gets what the setup left over, which on a cold machine is nothing.
 *
 * Only for a dev server **this run started**. One somebody else started has either bundled
 * already or has not, and either way this run is reading their dev server rather than warming its
 * own — so `--timeout` is the honest bound there.
 */
export const FIRST_BUNDLE_TIMEOUT_MS = 180_000;

/**
 * How long an app this run opened onto a cold environment gets to attach, out of its own budget.
 *
 * The same rule one phase later. `simctl openurl` exits 0 as soon as the URL is handed over, so
 * the wait that follows is the app *launching* — and on a simulator this run booted a moment ago
 * that is a cold Expo Go start, a manifest fetch and the first bundle download before anything
 * registers a debugger target.
 *
 * Only when this run made the environment cold, by starting the dev server or booting the device.
 * An app that is slow to attach to a dev server and a device that were both already there is a
 * slow app, which is exactly what the caller's budget is for.
 */
export const APP_ATTACH_TIMEOUT_MS = 120_000;

/**
 * How long an app this run opened gets to become *readable*, after it has attached.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
 * The third window of a cold launch, and the one nothing was waiting for. Expo Go attaches to the
 * dev server, and *then* downloads and runs the bundle — so the debugger target it registered on
 * the way in goes away and comes back when the JS runtime is created. A single read landing in
 * that gap answers `No target found` about an app that is running perfectly well, which is what a
 * cold run of a real app did: `app` `ok` at 4.2 s, `runtime` `No target found` two seconds later,
 * and the run's own screenshot showing the app on screen [observed — 2026-08-30, `friction/run7/
 * tapapp` on a simulator this run booted].
 *
 * Waiting is not a softer verdict. The question the phase asks is "can this runtime be read at
 * all", and a runtime that answers at eight seconds *can* be. What does not change: a runtime with
 * no debugger has **decided** and is asked once, and a wait that ends with no answer reports the
 * runtime's own reason exactly as it did before.
 */
export const RUNTIME_READY_TIMEOUT_MS = 15_000;

/**
 * How long the reload gets to be proved, before the run reports that it was not.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
 * `runtime:reload`'s own default is 30 s and covers a ladder that can stop and start the app. This
 * covers one broadcast on a socket that is already open, and the app fetching a bundle the dev
 * server has already built — the `bundle` phase two rows above just proved that it compiles, which
 * is the slow part. Ten seconds is the reconnect, not the compile.
 *
 * Charged to `--timeout` rather than to the bootstrap: the caller's app was already running, so
 * nothing here is this run paying for cold it caused.
 */
export const RELOAD_TIMEOUT_MS = 10_000;

/** How often the runtime is asked again while that wait runs. */
const RUNTIME_READY_POLL_MS = 500;

/**
 * How long the run gives a dev server to come up, out of a budget of its own.
 *
 * Not out of `--timeout`, and that is the rule for both bootstrap budgets: a cold start contains a
 * first bundle, and charging it to the budget meant for the phases that read the app would leave
 * a run that had to start its own dev server with nothing left to read it with.
 *
 * The number is the detach path's own default, because it is the same wait: `dev --detach
 * --wait-ready` is what this phase runs.
 */
export const START_DEV_SERVER_TIMEOUT_MS = 120_000;

/**
 * How long the start phase gets when the plan it runs **builds** first.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §It builds what the app needs, and says so first
 *
 * Thirty minutes, and the number is the shape of the work rather than a measurement: a cold
 * `expo run:ios` is a pod install and a full native compile, and a machine doing it for the first
 * time on a cold Xcode cache is the slow end of that. The cost of a bound that is too short is the
 * worst kind of failure this command has — twenty minutes spent and then a timeout reported for a
 * build that was going fine.
 *
 * Bootstrap, like every other act: what the build spends is not taken out of the budget the error
 * window and the runtime read live on.
 */
export const BUILD_DEV_SERVER_TIMEOUT_MS = 1_800_000;

/**
 * How long the run gives a device to boot, per platform, out of a budget of its own.
 *
 * Both are measured rather than chosen. A cold iOS simulator on this machine takes roughly a
 * minute; an Android emulator takes several, which is why the live tier waits four
 * (`e2e-live/utils.ts` §bootEmulatorAsync). Generous, because the cost of a bound that is too
 * short is a run that reports a boot failure for a device that was coming up fine.
 */
export const BOOT_DEVICE_TIMEOUT_MS: Record<'ios' | 'android', number> = {
  ios: 120_000,
  android: 240_000,
};

/** Every phase, in the order they are reported. */
const PHASE_ORDER: SmokePhaseId[] = [
  'start-dev-server',
  'dev-server',
  'bundler-ready',
  'bundle',
  'boot-device',
  // @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it.
  // After the boot and not before it: `simctl install` answers `Unable to lookup in current state:
  // Shutdown` for a device that is not up [observed, 2026-09-03].
  'install-app',
  'app',
  // @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk. Before
  // `route` rather than after it: a reload sends the app back to its initial route, so a run that
  // opened the route first would reload out of the screen it had just asked for.
  'reload',
  'route',
  'runtime',
  'errors',
  'screenshot',
];

/**
 * The phases that are reported only by a run that performed them.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
 * Every other phase is a question of every run, so a run that did not reach one owes the reader a
 * `skipped` row saying why. These two are not questions; they are *acts*, and a machine that
 * already had a dev server and a simulator did not skip them — there was nothing there to do. A
 * `skipped start dev server` on a healthy run reads as work that was owed and not done. The same
 * holds for the install: a machine that already had the app never had one to do.
 */
const CONDITIONAL_PHASES = new Set<SmokePhaseId>([
  'start-dev-server',
  'boot-device',
  'install-app',
]);

/**
 * A screenshot that was never attempted, so the report has the same keys either way.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract.
 */
export function noScreenshot(reason: string): ScreenshotResult {
  return {
    path: '',
    ok: false,
    reason,
    platform: null,
    deviceId: null,
    command: null,
    bytes: null,
  };
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
  const cleanups: RegisteredCleanup[] = [];
  const environment: SmokeEnvironmentJson = {
    devServer: 'absent',
    device: 'absent',
    deviceChoice: null,
    cleanup: [],
  };

  // The cleanup runs on both paths, and neither of them is a `finally` that swallows anything: a
  // tool error still propagates, and it still leaves the machine as it found it. `durationMs` is
  // recomputed afterwards because the caller waited for the cleanup too, and a run that reported
  // `4.2s` while spending eight seconds shutting a simulator down would be describing a moment
  // that had passed (llp/0021 §The rules).
  try {
    const run = await runPhasesAsync(deps, options, { startedAt, cleanups, environment });
    // Whether a device was *reused* is read off the run rather than probed for, and that is what
    // keeps a healthy run free of device tools: the phase that decides about a boot only asks
    // about a device when no app is connected, so on the ordinary run nothing has asked yet when
    // it goes past. The screenshot resolves one anyway (F98), and that is the answer.
    if (environment.device === 'absent' && run.deviceId != null) {
      environment.device = 'reused';
    }
    environment.cleanup = await releaseAsync(deps, cleanups);
    return { ...run, environment, durationMs: deps.now() - startedAt };
  } catch (error: unknown) {
    environment.cleanup = await releaseAsync(deps, cleanups);
    throw error;
  }
}

/** One resource this run started, and the call that puts it back. */
interface RegisteredCleanup {
  resource: SmokeResource;
  /** What it is, for a report written even when the release call answers nothing. */
  target: string | null;
  release(): Promise<SmokeReleaseResult>;
}

/**
 * Put back everything this run started, newest first, and report each one.
 *
 * Newest first because the two are ordered: the dev server was started before the device was
 * booted, and an app left talking to a bundler that has gone is a worse state to leave a machine in
 * than the reverse.
 *
 * Nothing here throws. A cleanup that fails is a **fact of the run**, and it is reported rather
 * than folded into the verdict: whether a dev server would stop says nothing about whether the app
 * boots, and a gate that failed on it would report a broken app to a caller whose app is fine.
 */
async function releaseAsync(
  deps: SmokeDeps,
  cleanups: RegisteredCleanup[]
): Promise<SmokeCleanupJson[]> {
  const released: SmokeCleanupJson[] = [];
  for (const cleanup of [...cleanups].reverse()) {
    const at = deps.now();
    try {
      const result = await cleanup.release();
      released.push({
        resource: cleanup.resource,
        target: result.target ?? cleanup.target,
        ok: result.ok,
        reason: result.ok ? null : (result.reason ?? 'no reason was given'),
        ms: deps.now() - at,
      });
    } catch (error: unknown) {
      released.push({
        resource: cleanup.resource,
        target: cleanup.target,
        ok: false,
        reason: `the cleanup itself failed: ${error instanceof Error ? firstLine(error.message) : String(error)}`,
        ms: deps.now() - at,
      });
    }
  }
  return released;
}

/** What {@link runSmokePhasesAsync} hands the phase walk, so the walk owns none of it. */
interface SmokeRunContext {
  startedAt: number;
  /** Appended to as resources are started, and read back by the cleanup. */
  cleanups: RegisteredCleanup[];
  /** Filled in as the run learns what it found and what it started. */
  environment: SmokeEnvironmentJson;
}

/** The phases themselves. Everything it starts is registered with the context first. */
async function runPhasesAsync(
  deps: SmokeDeps,
  options: SmokeOptions,
  { startedAt, cleanups, environment }: SmokeRunContext
): Promise<SmokeRun> {
  const phases: SmokePhase[] = [];
  /**
   * How much of the clock the bootstrap spent, which `--timeout` is not charged for.
   *
   * A cold simulator takes a minute to come up. A budget that paid for it would leave a run that
   * had to boot one with seconds for the bundle, the app and the error window — so the boot's
   * minute is subtracted here and the phases that read the app get the budget the caller named.
   */
  let bootstrapMs = 0;
  const remaining = () => Math.max(0, options.timeoutMs - (deps.now() - startedAt - bootstrapMs));

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

  /** Take the phase that was just recorded off the reading budget rather than out of it. */
  const chargeToBootstrap = (): void => {
    bootstrapMs += phases[phases.length - 1]!.ms;
  };

  /** The same, for a phase that is always bootstrap. */
  const recordBootstrap: typeof record = async (id, run) => {
    const value = await record(id, run);
    chargeToBootstrap();
    return value;
  };

  /**
   * Everything from `from` onwards did not run, for the reason given.
   *
   * `stopBefore` is for the two exits that still take a picture: a phase must appear exactly once,
   * and a `screenshot` marked skipped here and then attempted below would appear twice.
   *
   * The conditional phases are never filled in here: a run that stopped at the bundle did not skip
   * a device boot, it had no device boot to do (@ref ./phases §CONDITIONAL_PHASES).
   */
  const skipRest = (from: SmokePhaseId, reason: string, stopBefore?: SmokePhaseId): void => {
    const end = stopBefore == null ? PHASE_ORDER.length : PHASE_ORDER.indexOf(stopBefore);
    for (const id of PHASE_ORDER.slice(PHASE_ORDER.indexOf(from), end)) {
      if (!CONDITIONAL_PHASES.has(id) && !phases.some((phase) => phase.id === id)) {
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
    environment,
    appsConnected: null,
    bundle: null,
    route: options.route,
    routeCheck: null,
    deviceId: null,
    deviceBackend: null,
    runtimeSupported: null,
    reload: noReload(),
    appMismatch: null,
    buildAttempted: false,
    windowMs: null,
    errors: [],
    screenshot: noScreenshot('nothing was photographed'),
    durationMs: deps.now() - startedAt,
    ...run,
  });

  // ---- Phase 1: is there a dev server, and does this run start one? -------------------------
  //
  // The look comes first and is not a phase of its own: it is the question "is one running", and
  // its answer decides whether there is a start to report at all. Its time belongs to the
  // `dev-server` phase, which is the phase about finding one, so it is counted there by hand.

  let started = false;
  /**
   * The start phase ran a plan that compiled (@ref ./phases §BUILD_DEV_SERVER_TIMEOUT_MS).
   *
   * Kept for the follow-ups, and set whether the start succeeded or failed: a build that failed is
   * exactly the case where the cheapest next step differs from the ordinary one.
   */
  let buildAttempted = false;
  let devServerMs = 0;
  const lookAt = deps.now();
  let discovery = await deps.discoverDevServer(options.devServerUrl);
  devServerMs += deps.now() - lookAt;

  if (discovery.reachable) {
    environment.devServer = 'reused';
  } else if (options.bootstrap) {
    // @ref ./phases §RegisteredCleanup — registered **before** the start, so a start that got
    // halfway is still put back: a detached child that published its lock and then died in the
    // readiness wait is a dev server this run is responsible for, and one it never saw succeed.
    cleanups.push({ resource: 'dev-server', target: null, release: () => deps.stopDevServer() });
    const start = await recordBootstrap('start-dev-server', async () => {
      const result = await deps.startDevServer();
      buildAttempted = result.built === true;
      return result.ok && result.devServerUrl != null
        ? {
            status: 'ok' as const,
            reason: `started for this run at ${result.devServerUrl}, and stopped again afterwards`,
            value: result,
          }
        : { status: 'failed' as const, reason: result.reason, value: result };
    });
    if (start.ok && start.devServerUrl != null) {
      started = true;
      environment.devServer = 'started';
      // Discovered the same way the first look was, rather than by naming the URL the start
      // reported: naming it would make `source` say `flag` for a run whose caller passed no flag,
      // and `source` is reported precisely because `lock` and `flag` prove different things
      // (llp/0005 §One preflight for the runtime family).
      const againAt = deps.now();
      discovery = await deps.discoverDevServer(options.devServerUrl);
      devServerMs += deps.now() - againAt;
    } else {
      environment.devServer = 'failed';
    }
  }

  phases.push({
    id: 'dev-server',
    status: discovery.reachable ? 'ok' : 'failed',
    ms: devServerMs,
    reason: discovery.reachable
      ? started
        ? 'the dev server started above answered'
        : null
      : started
        ? `a dev server was started and nothing answered at ${discovery.devServerUrl} afterwards`
        : environment.devServer === 'failed'
          ? `nothing answered at ${discovery.devServerUrl}, and the start above did not produce one`
          : `nothing answered at ${discovery.devServerUrl} (${discovery.reason ?? 'no answer'})`,
  });

  if (!discovery.reachable) {
    skipRest('bundler-ready', 'no dev server answered, so nothing could be read');
    return done('failed', {
      devServerUrl: discovery.devServerUrl,
      discovery,
      started,
      buildAttempted,
      screenshot: noScreenshot('no dev server answered, so nothing was opened to photograph'),
    });
  }

  const devServerUrl = discovery.devServerUrl;

  // ---- Phase 2: has its bundler finished, and is it this project's? -------------------------
  //
  // @ref ./phases §FIRST_BUNDLE_TIMEOUT_MS. On a dev server this run started, this and the phase
  // below are the dev server *coming up* rather than this run reading it, so they get the cold
  // budget and what they spend is not taken off the window the caller gave the reads.

  const warming = environment.devServer === 'started';
  const warmingBudget = () => (warming ? FIRST_BUNDLE_TIMEOUT_MS : remaining());

  const readiness = await record('bundler-ready', async () => {
    const result = await deps.waitForBundlerReady(devServerUrl, warmingBudget());
    // Checked before the timeout, because it is decided rather than pending: no amount of looking
    // again turns another project's dev server into this one's (llp/0010 §Other gates, in brief).
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
  if (warming) {
    chargeToBootstrap();
  }

  const base = {
    devServerUrl,
    discovery,
    started,
    buildAttempted,
    projectRootMatched: readiness.projectRootMatched,
  };

  if (readiness.projectRootMatched === false) {
    // Building *their* entry bundle answers nothing about this code, and reading *their* app is
    // worse: it would report on a stranger's runtime as though it were this project's.
    skipRest('bundle', 'the dev server serves another project, so nothing here is about this one');
    return done('failed', {
      ...base,
      screenshot: noScreenshot(
        'the dev server serves another project, so nothing was photographed'
      ),
    });
  }
  if (!readiness.ready) {
    skipRest(
      'bundle',
      'the bundler never answered, so there was no bundle to read the app through'
    );
    return done(readiness.timedOut ? 'inconclusive' : 'failed', {
      ...base,
      screenshot: noScreenshot('the bundler was not ready, so nothing was photographed'),
    });
  }

  // ---- Phase 3: does this project's own code compile? ---------------------------------------

  const bundle = await record('bundle', async () => {
    const result = await deps.checkEntryBundle(devServerUrl, warmingBudget());
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
        // understands has not shown the project to be broken (llp/0010 §An empty target list is inconclusive).
        return {
          status: 'inconclusive' as const,
          reason: result.reason ?? 'the bundler gave no answer about the entry bundle',
          value: result,
        };
    }
  });
  if (warming) {
    chargeToBootstrap();
  }

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

  // ---- Phase 4: is there a device, and does this run boot one? ------------------------------
  //
  // The probe is resolved here rather than inside the two phases that used to ask for one, so the
  // whole run is about one device (F98, pointed one step earlier). Cached, so an attach-only run
  // pays for it exactly where it used to: at the first phase that needs a device.

  let probed: {
    deviceId: string | null;
    backend: DeviceBackend | null;
    reason: string | null;
  } | null = null;
  const deviceAsync = async () => (probed ??= await deps.probeDevice());

  /**
   * The app probe the boot decision needed, kept for the `app` phase that asks the same question.
   *
   * Null on a run that never had to decide about a boot, which is every run with a device already.
   */
  let firstConnection: AppConnectionResult | null = null;
  /**
   * This run replaced the app on the device, so nothing that was attached before is still running.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
   * Read by the `app` phase, which must open rather than take the attached-app shortcut: a target
   * the dev server still lists is one the install has already killed.
   */
  let appReplaced = false;

  // `--cloud` named the device, and the device it named is not on this machine: booting a
  // simulator here would be answering a question about a session with a laptop (llp/0005 §Cloud simulator).
  if (options.bootstrap && options.cloud !== 'required') {
    // The **app** is asked about first, and the device only if nothing answers. Two reasons, and
    // they point the same way. An app attached to this dev server is the app under test whatever
    // it is running on — a phone on the same network is a device none of this machine's tools can
    // see — so a simulator booted beside it would cost a minute and then photograph an empty
    // screen to answer for the app that is really running. And it keeps the ordinary healthy run
    // spawning no device tool at all until the picture is taken, which is where it always did.
    firstConnection = await deps.waitForAppConnection(
      devServerUrl,
      Math.min(remaining(), APP_PROBE_MS)
    );
    if (firstConnection.appsConnected === 0) {
      const found = await deviceAsync();
      if (found.deviceId == null) {
        const boot = await recordBootstrap('boot-device', async () => {
          const result = await deps.bootDevice((booted) => {
            // @ref ./phases §SmokeBootRegister — before the device is touched, so a boot that
            // hangs halfway still leaves this run holding the thing it has to put back.
            cleanups.push({
              resource: 'device',
              target: booted.deviceId,
              release: () => deps.shutdownDevice(booted.deviceId, booted.backend),
            });
          });
          return result.ok && result.deviceId != null
            ? {
                status: 'ok' as const,
                reason: [
                  `booted ${result.deviceId} for this run`,
                  result.choice ? ` because ${result.choice}` : '',
                  `, and shut it down again afterwards`,
                ].join(''),
                value: result,
              }
            : {
                status: 'failed' as const,
                reason: result.reason ?? 'no device came up, and nothing said why',
                value: result,
              };
        });
        if (boot.ok && boot.deviceId != null) {
          environment.device = 'booted';
          environment.deviceChoice = boot.choice ?? null;
          probed = { deviceId: boot.deviceId, backend: boot.backend, reason: null };
        } else {
          // A boot that was **declined** left the machine exactly as it was, so the report must not
          // say a device failed to come up: nothing was asked to (llp/0005 §The device that can
          // open the app).
          environment.device = boot.refused ? 'absent' : 'failed';
          skipRest(
            'app',
            boot.refused
              ? 'no device on this machine has the app, so there was nothing to open it on'
              : 'no device could be booted, so there was nothing to open the app on and nothing to read'
          );
          return done('failed', {
            ...base,
            bundle,
            screenshot: noScreenshot(
              boot.refused
                ? 'no device has the app, so none was booted and nothing was photographed'
                : 'no device came up, so nothing was photographed'
            ),
          });
        }
      }
    }
  }

  // ---- Is there an app on that device to open at all? ---------------------------------------
  //
  // @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
  //
  // Conditional and an *act*, like the start and the boot: only a run that installed something
  // reports a row, because a machine that already had the app never had an install to do.
  //
  // Driven off the **device**, not off the boot. Hanging it on the boot was the first version and
  // it missed the ordinary case: a simulator somebody left running without Expo Go, where this run
  // boots nothing and the deep link comes back `115` [observed — iOS 26.5, 2026-09-03].
  //
  // Bootstrap, like the boot: a 423 MB download is cold this run caused, and charging it to
  // `--timeout` would leave the error window with nothing. Only for a run allowed to bring its own
  // environment — `--no-start` says read what is there, and installing an app is not reading.
  if (options.bootstrap) {
    const device = await deviceAsync();
    if (
      device.deviceId != null &&
      (await deps.installNeededOnDevice(device.deviceId, device.backend))
    ) {
      const installed = await recordBootstrap('install-app', async () => {
        const result = await deps.installApp(device.deviceId!);
        return result.ok
          ? {
              status: 'ok' as const,
              reason: [
                `installed ${result.version ?? 'the app'} on ${device.deviceId}`,
                result.replaced ? `, replacing ${result.replaced}` : '',
                `, and left it there`,
              ].join(''),
              value: result,
            }
          : {
              status: 'failed' as const,
              reason: result.reason ?? 'the install failed, and nothing said why',
              value: result,
            };
      });
      if (installed.ok) {
        // @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got
        // it. **The install invalidates every read of the app that came before it.** `simctl
        // install` over a running app replaces the bundle and takes the process with it, and the
        // dev server's target list does not forget that app as quickly as the install kills it.
        //
        // So the probe taken in the boot decision above is dropped. Without this, a run that
        // replaced a running Expo Go reported `app ok` off that stale count, opened nothing, and
        // then found no app to reload, read or watch — every phase after it arguing with the one
        // above [observed, Kudo, 2026-09-03]. The run after it passed, because it found nothing
        // attached and opened the app, which is what this run has to do.
        firstConnection = null;
        appReplaced = true;
      } else {
        // Nothing to open. Deep-linking into a device this run has just been told has no app would
        // spend the attach budget proving what this phase already said.
        skipRest('app', 'the app could not be installed, so there was nothing to open');
        return done('failed', {
          ...base,
          bundle,
          deviceId: device.deviceId,
          deviceBackend: device.backend,
          screenshot: noScreenshot(
            'the app could not be installed, so there was nothing to photograph it running'
          ),
        });
      }
    }
  }

  // ---- Phase 5: is an app attached, and can one be opened if not? ---------------------------

  let deviceId: string | null = null;
  let deviceBackend: DeviceBackend | null = null;
  let routeCheck: RouteCheckJson | null = null;
  let routeOpenedWhileConnecting = false;
  // Whether this run put the app on the screen. Not the same as `routeOpenedWhileConnecting`: a
  // run with no `--route` still opens the root route when nothing is attached.
  let appOpenedByThisRun = false;
  /**
   * Whether this run changed what the app is running, so it may still be coming up.
   *
   * Opened **or reloaded** (F57 plus the `reload` phase). The two waits below — the target settle
   * and the runtime-ready poll — exist for an app that is mid-load, and after wave 25 there are two
   * ways for this run to have put it there. Kept apart from `appOpenedByThisRun`, which still
   * answers a different question: whether the thing on the screen is something this run opened,
   * which is what the picture's caption rests on.
   */
  let appMovedByThisRun = false;
  /**
   * The launcher URL this run opened that never produced a loaded app, if any.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Loading the app is not navigating it. What a
   * development build shows in that state is the launcher's own screen, and a picture of it has to
   * say so — `openRouteAsync` reports the open it performed, so this is read rather than guessed.
   */
  let devLauncherLeftOnScreen = false;

  /**
   * Whether this run is the reason the thing it is now waiting for is cold.
   *
   * @ref ./phases §APP_ATTACH_TIMEOUT_MS. A dev server it started has never served this app's
   * bundle; a simulator it booted has never launched it. Either one makes the next wait a first
   * launch rather than a measurement.
   */
  const coldEnvironment = () =>
    environment.devServer === 'started' || environment.device === 'booted';

  /**
   * The budget the open gets to wait for the app it loads.
   *
   * @ref ./phases §APP_ATTACH_TIMEOUT_MS — the same rule as the attach wait that follows it, and
   * for the same reason: loading an app onto an environment this run made cold is this run's own
   * setup, and loading one onto a warm environment is this run reading a slow app.
   */
  const attachBudget = () => (coldEnvironment() ? APP_ATTACH_TIMEOUT_MS : remaining());

  /**
   * Wait for the app this run moved to stop re-registering. At most once, and never otherwise.
   *
   * @ref ./phases §APP_SETTLE_MS. Shared by the runtime read and the picture because it is one
   * fact about one app: a second wait would be a second budget spent proving what the first one
   * already proved.
   *
   * "Moved" rather than "opened": a proved reload leaves the app re-registering exactly the way a
   * cold launch does, so it owes this wait for the same reason.
   */
  let settled = false;
  const settleIfOpenedAsync = async (): Promise<void> => {
    if (!appMovedByThisRun || settled) {
      return;
    }
    settled = true;
    await deps.waitForStableTargets(
      devServerUrl,
      Math.min(APP_SETTLE_MS, Math.max(0, remaining()))
    );
  };

  const connection = await record('app', async () => {
    // Reused when the boot decision above already asked. It answered "nothing is attached", which
    // is still true of a simulator that has only just finished booting — and asking again would
    // spend a second wait on a fact this run established one phase ago.
    const first =
      firstConnection ??
      (await deps.waitForAppConnection(devServerUrl, Math.min(remaining(), APP_PROBE_MS)));
    // `!appReplaced` is the whole of the fix above: an install replaced the app, so a count that
    // says one is attached is describing the process the install ended.
    if (!appReplaced && first.appsConnected > 0) {
      return { status: 'ok' as const, value: first };
    }

    // Nothing is attached. `navigate` is what puts an app in that list, so the gate opens one
    // rather than waiting out its budget on a state it could have changed itself. This is friction
    // run 1's F4 absorbed into the gate, and the same reasoning F48-8 gave `status.next`: a wait
    // for an app cannot succeed while nothing is opening one.
    const device = await deviceAsync();
    if (device.deviceId == null) {
      return {
        status: 'inconclusive' as const,
        reason: `no app is connected to the dev server, and ${device.reason ?? 'no device was found to open one on'}`,
        value: first,
      };
    }

    // **One budget, spent across the open and the wait after it.** The open now waits for the app
    // it loads (F123's ladder is gated on that), and the wait below asks the same question — so a
    // budget handed to each would be two of them: a cold run whose app never arrives would spend
    // four minutes to report what it knew after two.
    const attachDeadline = deps.now() + attachBudget();
    const opened = await deps.openRoute(
      options.route ?? ROOT_ROUTE,
      devServerUrl,
      Math.max(0, attachDeadline - deps.now())
    );
    appOpenedByThisRun = true;
    appMovedByThisRun = true;
    devLauncherLeftOnScreen = opened.launch != null && !opened.launch.attached;
    deviceId = opened.deviceId;
    deviceBackend = opened.deviceBackend;
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

    // @ref ./phases §APP_ATTACH_TIMEOUT_MS. The deep link is a request and not a result: the open
    // exited 0 above, and what is waited for here is a **debugger target appearing** — the app
    // launching, fetching the manifest and downloading its bundle. On an environment this run made
    // cold that is its own cost and gets its own budget; on a warm one it is a slow app, which is
    // what the caller's `--timeout` is for.
    const second = await deps.waitForAppConnection(
      devServerUrl,
      Math.max(0, attachDeadline - deps.now())
    );
    return second.appsConnected > 0
      ? { status: 'ok' as const, reason: `opened ${opened.url} to connect one`, value: second }
      : {
          status: 'inconclusive' as const,
          reason: `${opened.url} was opened on the device and no app had attached when the budget ran out`,
          value: second,
        };
  });
  // The whole phase, because on this path almost all of it is the wait above.
  if (appOpenedByThisRun && coldEnvironment()) {
    chargeToBootstrap();
  }

  const appsConnected = connection.appsConnected;
  const withApp = { ...base, bundle, appsConnected };

  if (appsConnected === 0) {
    const appPhase = phases[phases.length - 1]!;
    // No app, so no runtime and no window — but there may still be a device, and a picture of
    // whatever is on it is the most useful thing left to hand back.
    // From `reload` rather than from `route`: the reload phase sits between this one and the route
    // now, and a phase that is stepped over rather than filled in is a phase missing from the
    // report — which is the one property the phase list has (`reports every phase exactly once`).
    skipRest('reload', 'no app is connected, so there was nothing to read', 'screenshot');
    // The run opened the app in this phase, so whatever is on screen may still be loading.
    const captured = await captureIfPossible(deps, options, deviceId, deviceBackend, phases, {
      settleAsync: settleIfOpenedAsync,
      deviceAsync,
      showing: devLauncherLeftOnScreen ? 'dev-launcher' : 'device',
    });
    return done(appPhase.status === 'failed' ? 'failed' : 'inconclusive', {
      ...withApp,
      deviceId: captured.deviceId,
      deviceBackend: captured.deviceBackend,
      routeCheck,
      screenshot: captured.screenshot,
      durationMs: deps.now() - startedAt,
    });
  }

  // ---- Is the app that answered one this project can run at all? ---------------------------
  //
  // @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
  //
  // Not a phase of its own: it is the second half of the question the `app` phase asks. "Is an app
  // attached" and "is it *this project's* app" have one answer between them, and a run that split
  // them into two rows would report `app ok` above a row saying the app cannot run this project.
  //
  // Asked on both paths — an app this run found *and* one it opened — because the open picks its
  // target from the same decision, so a mismatch on that path would mean this gate had opened the
  // wrong app. Never asked when nothing is connected: there is no runtime for it to be about, and
  // that path returned above.
  //
  // Downgrades the phase rather than stopping the run. The phases below still read the app that is
  // there and still photograph it — the same rule llp/0005 §Android sets for a runtime with no
  // debugger, where an empty window costs one wait and the report is more useful with it. What
  // changes is that the verdict can no longer be `passed`.
  const appFit = await deps.checkAppFitsProject(devServerUrl);
  const appMismatch = appFit.mismatch;
  const appPhase = phases.find((phase) => phase.id === 'app');
  if (appPhase != null) {
    if (appMismatch != null) {
      // A mismatch outranks a note: there is no use telling a caller their Expo Go is a patch
      // behind when the answer is that it cannot run their project at all.
      appPhase.status = 'inconclusive';
      appPhase.reason = appMismatch;
    } else if (appFit.note != null) {
      // Appended rather than substituted. The sentence already there says how the app got where it
      // is — "opened … to connect one" — which is the fact the row exists for, and a note that
      // replaced it would trade a finding for a finding.
      appPhase.reason =
        appPhase.reason == null ? appFit.note : `${appPhase.reason} · ${appFit.note}`;
    }
  }

  // ---- Phase 6: is the app that answers the rest of this run the code on disk? --------------
  //
  // @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
  //
  // The phase that makes the three after it mean something. `runtime`, `errors` and `screenshot`
  // all read *the app*, and an app that was already attached when this run arrived is running
  // whatever it last loaded — which, at the moment this command is for, is the bundle from before
  // the edit the caller wants verified. Without this the gate reported `passed` over a `throw` at
  // the top of the entry component, with the *previous* screen in the screenshot [observed — iOS
  // 26.5 simulator, Expo Go SDK 57, 2026-09-03; `errors` ok at 3.1 s, exit 0].
  //
  // llp/0005 §Reloading the app had already written the rule this phase applies — "an error window
  // is a property of the app's session, and the session outlives the fix" — and named the command
  // that must not be believed without it. `smoke` reads that window and was not applying it.

  const reloadJson = noReload();

  if (appOpenedByThisRun) {
    // Nothing to replace: the app came up during the `app` phase, so it fetched the bundle the dev
    // server is serving now on its way in. A reload here would cost a relaunch to reach the state
    // the run is already in.
    phases.push({
      id: 'reload',
      status: 'skipped',
      ms: 0,
      reason: 'this run opened the app, so it already fetched the bundle the dev server is serving',
    });
  } else if (!options.reload) {
    // Asked for, so the row says which of the two questions this run is answering rather than
    // reading as a step that was owed and not done. The verdict is left alone: "is the app throwing
    // where I left it" is a real question, and it is the one this caller asked.
    reloadJson.disposition = 'declined';
    phases.push({
      id: 'reload',
      status: 'skipped',
      ms: 0,
      reason:
        '--no-reload was given, so the app was read on the bundle it already had, which may predate the code on disk',
    });
  } else {
    const reloaded = await record('reload', async () => {
      const result = await deps.reloadApp(devServerUrl, Math.min(RELOAD_TIMEOUT_MS, remaining()));
      reloadJson.knownTargetIds = result.knownTargetIds;
      reloadJson.freshTargets = result.freshTargets;
      reloadJson.commandSocketReconnected = result.commandSocketReconnected;
      reloadJson.bundleServed = result.bundleServed;
      if (result.ok) {
        reloadJson.disposition = 'reloaded';
        reloadJson.verifiedBy = result.verifiedBy;
        return {
          status: 'ok' as const,
          reason: `the app fetched the served bundle again (${result.verifiedBy})`,
          value: result,
        };
      }
      // @ref llp/0021-honest-reports.rfc.md §The rules band. Not `failed`: nothing has been shown
      // to be wrong with the app, and the next action is to look again rather than to fix
      // something. What is unknown is *which session* the phases below are about, and that is
      // exactly the band `inconclusive` exists for (llp/0010 §Exit codes).
      reloadJson.disposition = 'unproved';
      return {
        status: 'inconclusive' as const,
        reason: `${result.reason ?? 'nothing was observed to come of the reload'}, so what the phases below read may be the session from before the code on disk`,
        value: result,
      };
    });
    if (reloaded.ok) {
      // The app is coming back, so it owes the same waits a freshly opened one does: the settle
      // before the reads, and the runtime-ready poll rather than a single look
      // (@ref ./phases §APP_SETTLE_MS, §RUNTIME_READY_TIMEOUT_MS). A reload that was *not* proved
      // must not claim them — an app that never acted is not coming up, and waiting on it would
      // spend the caller's budget proving nothing.
      appMovedByThisRun = true;
    }
  }

  // ---- Phase 7: the route, unless the app phase already opened it -------------------------

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
      const result = await deps.openRoute(options.route!, devServerUrl, attachBudget());
      appOpenedByThisRun = true;
      appMovedByThisRun = true;
      devLauncherLeftOnScreen = result.launch != null && !result.launch.attached;
      deviceId = result.deviceId;
      deviceBackend = result.deviceBackend;
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
      const captured = await captureIfPossible(deps, options, deviceId, deviceBackend, phases, {
        settleAsync: settleIfOpenedAsync,
        deviceAsync,
        // The route was refused, so whatever is on screen is not the route under test.
        showing: devLauncherLeftOnScreen ? 'dev-launcher' : 'device',
      });
      return done('failed', {
        ...withApp,
        deviceId: captured.deviceId,
        deviceBackend: captured.deviceBackend,
        routeCheck,
        reload: reloadJson,
        screenshot: captured.screenshot,
        durationMs: deps.now() - startedAt,
      });
    }
  }

  // ---- Phase 8: can the runtime be read at all? ---------------------------------------------

  // @ref ./phases §APP_SETTLE_MS. Before the read rather than only before the picture: an app that
  // has just been launched onto a simulator this run booted is still registering, and asking a
  // debugger target list mid-churn answers "No target found" about an app that is running fine.
  await settleIfOpenedAsync();

  /**
   * Ask the runtime until it answers, for an app this run opened.
   *
   * @ref ./phases §RUNTIME_READY_TIMEOUT_MS. The settle above waits for the target *list* to stop
   * changing, which is a fact about registration and turned out to be too weak a proxy for "the
   * bundle has run": two reads of one id 500 ms apart are alike whether the app is ready or about
   * to reload. This asks the runtime itself, which is the thing the phase is about.
   *
   * An app that was already there when this run arrived **and was not reloaded** is asked once,
   * exactly as before: it is not coming up, so a second look would answer the same and cost the
   * caller a wait. One this run reloaded *is* coming up, and gets the same poll a cold launch does.
   */
  const evaluateUntilReadableAsync = async (): Promise<SmokeEvaluateResult> => {
    const deadline = deps.now() + (appMovedByThisRun ? RUNTIME_READY_TIMEOUT_MS : 0);
    for (;;) {
      const result = await deps.evaluate(devServerUrl);
      // Both of these are decided. `unsupported` is llp/0005-runtime-loop-tools.rfc.md §Android — a runtime with no
      // debugger will not grow one, and asking it again for thirty seconds would turn the one
      // case this command exists to report into a hang.
      if (result.ok || result.unsupported || deps.now() >= deadline) {
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, RUNTIME_READY_POLL_MS));
    }
  };

  const runtime = await record('runtime', async () => {
    const result = await evaluateUntilReadableAsync();
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

  // ---- Phase 9: what did the app report while it was watched? -------------------------------

  // Opened even for a runtime that cannot be evaluated, because an empty window costs one wait and
  // the report is more useful with it — but the *verdict* never rests on it. That is the rule
  // llp/0005-runtime-loop-tools.rfc.md §Android forces: Expo Go on Android acknowledges `Runtime.enable` and reports
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

  // ---- Phase 10: the picture ----------------------------------------------------------------

  // Already done before the runtime read on this path, so this call costs nothing: the wait
  // happens once per run, for a run that opened the app.
  const captured = await captureIfPossible(deps, options, deviceId, deviceBackend, phases, {
    settleAsync: settleIfOpenedAsync,
    deviceAsync,
    // An app is connected on this path — the run got past the `app` phase — so the picture is of
    // the project.
    showing: 'project',
  });

  // The verdict. `failed` needs something to have gone wrong; `passed` needs the runtime to have
  // answered, so a window nobody could have read is never a pass.
  //
  // **And it needs the window to be of the code on disk** (@ref ./phases, the `reload` phase). A
  // reload that was attempted and never observed leaves the run unable to say which of two
  // sessions the runtime read and the window are about, and `passed` is a claim about the app the
  // caller has on disk. `threw` still wins: an app that reported an error has been shown to be
  // broken, and which session it was is no longer the open question.
  const threw = collected.records.some(isFailingRecord);
  const sessionKnown = reloadJson.disposition !== 'unproved';
  // @ref llp/0005 §Expo Go is only a target for a project that fits in it. `threw` still outranks
  // it: Expo Go reporting an error while running this project's bundle is a fact about the code,
  // whichever app was holding it.
  const appFitsProject = appMismatch == null;
  return done(
    threw
      ? 'failed'
      : runtime.ok && collected.ok && sessionKnown && appFitsProject
        ? 'passed'
        : 'inconclusive',
    {
      ...withApp,
      routeCheck,
      deviceId: captured.deviceId,
      deviceBackend: captured.deviceBackend,
      runtimeSupported: runtime.unsupported ? false : runtime.ok ? true : null,
      reload: reloadJson,
      appMismatch,
      windowMs: options.windowMs,
      errors: collected.records,
      screenshot: captured.screenshot,
      durationMs: deps.now() - startedAt,
    }
  );
}

/**
 * The picture, and the device it was taken on.
 *
 * The device travels with it because the screenshot phase is the one step that resolves a device of
 * its own — every other phase either has one already or does not need one (F98).
 */
interface CaptureOutcome {
  screenshot: ScreenshotResult;
  deviceId: string | null;
  deviceBackend: DeviceBackend | null;
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
  deviceBackend: DeviceBackend | null,
  phases: SmokePhase[],
  settle: {
    /**
     * The run's settle wait, which is a no-op unless this run opened the app and has not waited
     * yet (@ref ./phases §APP_SETTLE_MS).
     */
    settleAsync: () => Promise<void>;
    /**
     * What the picture is a picture *of*, as far as this run can tell.
     *
     * @ref llp/0005-runtime-loop-tools.rfc.md §Loading the app is not navigating it
     * Three cases, because a reader believes a screenshot without checking it and all three look
     * plausible: the project's own screen, the **dev launcher's** screen — which is what a
     * development build shows when the loading link was opened and the bundle did not arrive — and
     * a device with neither on it.
     */
    showing: 'project' | 'dev-launcher' | 'device';
    /** The run's own device probe, cached, so this phase never resolves a second one (F98). */
    deviceAsync: () => Promise<{
      deviceId: string | null;
      backend: DeviceBackend | null;
      reason: string | null;
    }>;
  }
): Promise<CaptureOutcome> {
  const at = deps.now();
  const push = (status: SmokePhaseStatus, reason: string | null) =>
    phases.push({ id: 'screenshot', status, ms: deps.now() - at, reason });

  if (!options.screenshot) {
    const skipped = noScreenshot('no screenshot was taken (--no-screenshot)');
    push('skipped', skipped.reason);
    return { screenshot: skipped, deviceId, deviceBackend };
  }

  let device = deviceId;
  let backend = deviceBackend;
  if (device == null) {
    const probe = await settle.deviceAsync();
    backend = probe.backend;
    if (probe.deviceId == null) {
      const skipped = noScreenshot(
        `no screenshot was taken: ${probe.reason ?? 'no booted device was found to photograph'}`
      );
      push('skipped', skipped.reason);
      // Null, not the probe's backend: nothing was found, so there is no device for the run to name
      // and a backend on its own would say a device was used.
      return { screenshot: skipped, deviceId: null, deviceBackend: null };
    }
    device = probe.deviceId;
  }

  // @ref ./phases §APP_SETTLE_MS — friction run 6, F57. Usually already done: the runtime read
  // needs the same settle and asks for it first, on every path that reaches it.
  await settle.settleAsync();

  const result = await deps.captureScreenshot(device, backend);
  // @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app. A picture is the
  // one piece of evidence a reader believes without checking, and a home screen, a dev launcher
  // and an app that failed to render look equally plausible. An `ok` beside a run whose app never
  // connected has to say what it is a picture *of*.
  push(result.ok ? 'ok' : 'skipped', result.ok ? showingReason(settle.showing) : result.reason);
  // Handed back, and this is F98. A healthy app opens nothing — the `app` phase finds it already
  // connected and the `route` phase is skipped — so before this the two steps that set the run's
  // device fields never ran, and a run that had photographed a **billed cloud session** reported
  // `deviceBackend: null` next to the `eas simulator:exec … screenshot` that took the picture
  // [observed — live cloud, 2026-08-27]. The device a run used is a fact of the run, whichever phase
  // found it.
  return { screenshot: result, deviceId: device, deviceBackend: backend };
}

/** What an `ok` screenshot says it captured, or null when it is the app itself. */
function showingReason(showing: 'project' | 'dev-launcher' | 'device'): string | null {
  switch (showing) {
    case 'project':
      return null;
    case 'dev-launcher':
      return `the dev launcher's own screen — the loading link was opened and this project's bundle never ran, so this is not a picture of the app`;
    case 'device':
      return `the device's screen — no app of this project was connected, so this is not a picture of it running`;
  }
}

function firstLine(text: string): string {
  return text.split('\n')[0] ?? '';
}

/** The bundler's own error, as one sentence with the location in it. */
function bundleErrorSentence(bundle: BundleCheckResult): string {
  const where = [bundle.error?.filename, bundle.error?.lineNumber, bundle.error?.column]
    .filter((part) => part != null)
    .join(':');
  return `${where ? `${where}: ` : ''}${bundle.error?.message ?? 'the bundler reported an error'}`;
}
