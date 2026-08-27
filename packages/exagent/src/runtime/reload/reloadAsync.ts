// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// @ref llp/0010-agent-conventions.rfc.md §The fourth: `reload`
// Put the running app back on the code that is on disk, and prove that it went.
//
// The friction this exists for [observed — friction run 3, F31, 2026-08-23]: a component threw
// while rendering. The file on disk was fixed, the served bundle was clean, and `dev:wait` exited
// 0 — while the simulator showed a blank screen and `runtime:errors --fail-on-error` kept exiting
// 20 for the *old* error. Every gate in the CLI was asking about the dev server; nothing could see
// the app's own session. The only recovery was `xcrun simctl terminate` by hand.
//
// Reproduced live [observed — 2026-08-23, SDK 57 in Expo Go on iOS] with one correction worth
// carrying: on that SDK Fast Refresh *did* recover the screen, and the error report did not.
// `runtime:errors --duration 3s` returned the same pre-fix error three times in a row against a
// healthy screen, so the debugger replays what the app reported to every new connection. The trap
// is therefore not only stale code — an error window is a property of the app's session, and the
// session outlives the fix. A reload cleared it: `count: 0`, twice.

import chalk from 'chalk';

import { AGENT_DEVICE_SPEC } from '../../device/cloudSimulator';
import { event as cliEvent } from '../../events';
import { buildReloadFollowUps, followUpsEnabled, reportFollowUps, type FollowUp } from '../../followups';
import * as Log from '../../log';
import {
  isFullUrlRoute,
  openUrlOnDeviceAsync,
  readProjectSchemeConfig,
  resolveDeepLinkUrl,
} from '../../navigate/deepLink';
import { resolveDeviceAsync, type NavigateDevice } from '../../navigate/device';
import { checkRoute, routeNotFoundError, type RouteCheckJson } from '../../navigate/routeCheck';
import { decideExpoGoTarget } from '../../navigate/target';
import { readProjectNativeDirsAsync } from '../../project/nativeCode';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../../project/nodeModules';
import { readProjectRoutesAsync } from '../../project/routes';

import {
  bundleToJson,
  checkEntryBundleAsync,
  resolveBundleCheckPlatformsAsync,
  type BundleCheckJson,
  type BundleCheckResult,
  type BundlePlatformSource,
} from '../bundleCheck';
import {
  discoverDevServerAsync,
  howToNameTheDevServer,
  probeDevServerAsync,
  type DevServerSource,
} from '../devServer';
import {
  connectMessageSocketAsync,
  peersChanged,
  type DevServerMessageSocket,
  type MessageSocketPeers,
} from '../messageSocket';
import { waitForFreshAppConnectionAsync } from '../waitReady';
import { CommandError } from '../../utils/errors';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../../exitCodes';
import { readConfiguredAppId, resolveAppId } from '../appId';
import { stopAppOnDeviceAsync } from '../appProcess';
import { debugEvent, event } from './events';
import type { ReloadOptions } from './resolveOptions';

/**
 * How long the app's message socket has to come back before the broadcast is judged to have done
 * nothing.
 *
 * Live it takes under a second [observed — 2026-08-23: the app's peer id changed within 500 ms of
 * the broadcast], so this is generous rather than tight. It is separate from `--timeout`, which
 * covers the slower thing: the JavaScript loading and the debugger target re-registering.
 */
const PEER_CHURN_TIMEOUT_MS = 8000;

/** How often the peers are read while waiting for the app to reconnect. */
const PEER_POLL_INTERVAL_MS = 250;

/** One way of reloading, and what it did. */
export interface ReloadAttempt {
  method: 'dev-server' | 'runtime' | 'device';
  /** The app was reloaded by this method. */
  ok: boolean;
  /** Why it did not work, or what it did. Never null: an attempt always has something to say. */
  reason: string;
  /**
   * The application id this attempt stopped and could not start again, or null.
   *
   * The device method is a force-stop and a relaunch, so a relaunch that is refused leaves the app
   * **closed** — a state this command produced and used to say nothing about [live staging, S12: a
   * cloud session was left with no app running, and the report said only "The app was not
   * reloaded"]. Null for every attempt that stopped nothing, including a stop that itself failed.
   */
  leftAppStopped: string | null;
}

/**
 * Machine shape of `exagent runtime:reload --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout,
 * every key always present, and a fact the run does not have is null.
 */
export interface ReloadResultJson {
  /** The app was reloaded, and the reload was observed rather than assumed. */
  reloaded: boolean;
  /** Which method reloaded it, or null when none did. */
  method: 'dev-server' | 'runtime' | 'device' | null;
  /**
   * What proved the reload.
   *
   * `message-socket-peers` — the app's connection to the dev server's command socket was replaced,
   * which the dev server's own never-reused socket ids make unambiguous. `app-relaunch` — the app
   * was stopped on the device and started again, so there was nothing left to keep running.
   * `fresh-debugger-target` — the reload was asked for **through the debugger**, which has no peer
   * list to churn, so the only proof is the one {@link appsReconnected} carries: a JavaScript
   * runtime registering under a page id the dev server had never used.
   */
  verifiedBy: 'message-socket-peers' | 'fresh-debugger-target' | 'app-relaunch' | null;
  devServerUrl: string;
  devServerSource: DevServerSource;
  /** Debugger targets the dev server reported after the reload: apps with a live JS runtime. */
  appsConnected: number;
  /**
   * How many of those targets the dev server had *not* listed before the reload.
   *
   * The number success is decided on, and the reason it is reported next to
   * {@link appsConnected} rather than instead of it. A reloading app's previous target stays in
   * `/json/list` for about half a second [observed — 2026-08-23, live], so one connected and zero
   * reconnected is an app that has not come back — which is the false success friction run 4
   * recorded as F45, and the flake it recorded as F39.
   */
  appsReconnected: number;
  /**
   * What building this project's entry bundle answered, before anything was reloaded.
   *
   * The same object `dev:wait` prints under the same key, because it is the same check
   * (llp/0010 §The reload gate). `ok: false` is the one answer that stops the command.
   */
  bundle: BundleCheckJson;
  /** Every platform whose entry bundle was built, in the order they were. */
  bundlePlatforms: string[];
  /**
   * Where those platforms came from: a flag, the connected apps, or this command's default.
   *
   * @ref ../bundleCheck — friction run 6, F53. The reason it is reported: `for ios` printed by a
   * run that had never asked which app it was reloading read exactly like an answer.
   */
  bundlePlatformSource: BundlePlatformSource;
  /** Route the app was sent to afterwards, or null when none was asked for. */
  route: string | null;
  /** Whether that route was checked against the project's routes. */
  routeCheck: RouteCheckJson;
  /** The deep link that was opened for {@link route}, or null when no route was asked for. */
  url: string | null;
  platform: string | null;
  deviceId: string | null;
  /** Every method that was tried, in order, and what each one did. */
  attempts: ReloadAttempt[];
  /** How long the whole reload took, in milliseconds. */
  waitedMs: number;
  followups: FollowUp[];
}

/**
 * Reload the app and report what happened.
 *
 * @returns the exit code: `0` reloaded and reconnected, `20` not reloaded, `22` reloaded but the
 * app had not reconnected when the budget ran out (llp/0010 §Exit codes).
 */
export async function reloadAsync(projectRoot: string, options: ReloadOptions): Promise<number> {
  const startedAt = Date.now();
  const { route, json, followups: wantFollowUps } = options;

  const [devServer, routeTable] = await Promise.all([
    discoverDevServerAsync(options.devServerUrl ?? undefined, { projectRoot }),
    readProjectRoutesAsync(projectRoot),
  ]);
  const devServerUrl = devServer.devServerUrl;

  // A reload puts the app back on the *served* bundle, so a dev server that does not answer leaves
  // nothing to reload onto: stopping the app there would replace a stale screen with no screen.
  if (!devServer.reachable) {
    const error = new CommandError(
      'NO_DEV_SERVER',
      [
        `No Expo dev server answered at ${devServerUrl}, so there is nothing to reload the app onto.`,
        `Why: the request for its debugger target list failed (${devServer.reason ?? 'no answer'}). A reload makes the app fetch its bundle again, and without a dev server that fetch has nowhere to go — the app would be left on a loading screen rather than on the fixed code.`,
        `How: start the dev server ("npx exagent dev --yes"), then run this command again. ${howToNameTheDevServer(options.devServerUrl != null)}`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent dev --detach --wait-ready';
    throw error;
  }

  // Before anything is reloaded: a `--route` the project has not got would land the reloaded app
  // on the "Unmatched Route" screen, which is the second failure this command's own friction run
  // reported (llp/0005 §Verifying the route).
  const routeCheck = checkRoute({
    route: route ?? '/',
    table: routeTable,
    enabled: options.routeCheck && route != null,
    // Without `--route` there is no route to check; the reason must not name a flag the caller
    // never passed (friction run 4 follow-up).
    disabledReason:
      route == null ? 'no --route was named, so there was no route to check' : undefined,
    isFullUrl: route != null && isFullUrlRoute(route),
  });
  if (routeCheck.ok === false && route != null) {
    // Named, so the `Try:` line keeps the reload the caller asked for rather than replacing it
    // with a bare `navigate` (friction run 5).
    throw routeNotFoundError(route, routeTable, {
      platform: options.platform,
      command: 'runtime:reload',
    });
  }

  // @ref llp/0010-agent-conventions.rfc.md §The reload gate — friction run 4, F38.
  // The gate that has to come *before* the broadcast. A reload makes the app fetch the served
  // bundle again, so reloading onto a bundle that does not compile puts the app back on the red
  // screen it is already showing — and the old command reported `Reloaded yes` for exactly that.
  const remainingMs = () => Math.max(0, options.timeoutMs - (Date.now() - startedAt));

  // @ref llp/0005-runtime-loop-tools.rfc.md §Android — friction run 6, F53. Which platform to build
  // for is a question about the app being reloaded, and this used to answer it with a host-free
  // default: with an Android-only break and both apps attached, a `runtime:reload` with no flag
  // checked the **iOS** bundle, passed, and reloaded the Android app onto the broken one.
  const { platforms: bundlePlatforms, source: bundlePlatformSource } =
    await resolveBundleCheckPlatformsAsync(options.platform ?? null, devServer.targets);
  const bundles: BundleCheckResult[] = [];
  if (options.bundleCheck) {
    for (const platform of bundlePlatforms) {
      bundles.push(
        await checkEntryBundleAsync(devServerUrl, {
          platform,
          timeoutMs: remainingMs(),
          projectRoot,
        })
      );
    }
  }
  // A broken bundle decides the reload whichever platform it was found on: reloading onto it is
  // exactly what this gate exists to stop.
  const bundle =
    bundles.find((entry) => entry.outcome === 'broken') ??
    bundles.find((entry) => entry.outcome === 'timeout') ??
    bundles[0] ??
    null;
  // `unknown` passes, the way it does for `dev:wait`: a dev server that answered nothing this CLI
  // understands has not shown the project to be broken, and a refusal there would stop a reload
  // that would have worked and name no fix.
  const refusal: 'bundle-broken' | 'bundle-timeout' | null =
    bundle?.outcome === 'broken'
      ? 'bundle-broken'
      : bundle?.outcome === 'timeout'
        ? 'bundle-timeout'
        : null;

  const attempts: ReloadAttempt[] = [];
  let method: ReloadResultJson['method'] = null;
  let verifiedBy: ReloadResultJson['verifiedBy'] = null;
  let device: NavigateDevice | null = null;
  let knownTargetIds: string[] = [];
  // The last count anybody actually read, for the runs where no wait happens. Reporting a flat 0
  // for a refusal would be this command inventing "no app is connected" out of a step it skipped,
  // which is the same shape of claim as the ones it exists to remove.
  let observedApps = devServer.targets.length;

  if (refusal == null) {
    // Read as late as possible, and always again rather than reusing the discovery probe: these
    // ids are what "the app came back" is measured against, and anything that reloaded the app in
    // the meantime — a save the watcher picked up — would otherwise be credited to this command.
    const before = await probeDevServerAsync(devServerUrl);
    knownTargetIds = before.targets.map((target) => target.id);
    observedApps = before.targets.length;

    if (options.method === 'auto' || options.method === 'dev-server') {
      // The count from `/json/list`, so the broadcast's "is anyone there" and the rest of this CLI
      // read one list (K2, below).
      const attempt = await reloadOverDevServerAsync(devServerUrl, {
        connectedApps: observedApps,
      });
      attempts.push(attempt);
      if (attempt.ok) {
        method = 'dev-server';
        verifiedBy = 'message-socket-peers';
      }
    }

    // @ref llp/0005-runtime-loop-tools.rfc.md §Two lists, one question — Kudo's cloud loop, K2.
    // **Never in `auto`**, and that is a live finding rather than caution: on Expo Go this call
    // takes the app off the screen and nothing re-registers [observed — Expo Go SDK 57, iOS 26.5
    // simulator, 2026-08-27: `runtime:eval "expo.reloadAppAsync()"` left `/json/list` empty and the
    // device on its home screen, 13 s later]. It reloaded a cloud app for Kudo, so the mechanism is
    // real and runtime-dependent — which makes it a method a caller chooses, not one this command
    // reaches for on its own. Putting it in `auto` would have traded the device method's cost for a
    // less predictable one.
    if (method == null && options.method === 'runtime') {
      const attempt = await reloadOverRuntimeAsync(devServerUrl, options, observedApps);
      attempts.push(attempt);
      if (attempt.ok) {
        method = 'runtime';
        // Nothing here proves the reload on its own: the debugger has no peer list to churn, so
        // the claim is "the call was made" and the proof is the wait below.
        verifiedBy = 'fresh-debugger-target';
      }
    }

    // The device method force-stops the app, so `auto` reaches it only when there is no app to
    // stop: with a runtime connected, the two mechanisms above are the ones that keep it running,
    // and stopping a connected app is a decision the caller makes with --method device (K2). It is
    // also what *starts* an app that is not running at all, which is the case it is here for.
    if (method == null && (options.method === 'auto' || options.method === 'device')) {
      if (options.method === 'auto' && observedApps > 0) {
        attempts.push({
          method: 'device',
          ok: false,
          reason: `not tried: ${observedApps} app(s) are connected to the dev server, and this method force-stops the app — pass --method device to do that deliberately`,
          leftAppStopped: null,
        });
      } else {
        const attempt = await reloadOnDeviceAsync(projectRoot, options, devServerUrl);
        attempts.push(attempt.attempt);
        device = attempt.device;
        if (attempt.attempt.ok) {
          method = 'device';
          verifiedBy = 'app-relaunch';
        }
      }
    }
  }

  // The app has to come back with a JavaScript runtime the rest of the CLI can read, so the wait
  // is on the debugger target list rather than on the socket that proved the reload — and on a
  // target the dev server had *not* listed before, because the one it had is the runtime on its way
  // out. Peer churn proves the app acted on the broadcast; only a new target proves it came back.
  // The last read this wait makes is the re-read of the target list, so a success is never a peer
  // count: it is a runtime that was observed after the reload.
  const connection =
    method != null
      ? await waitForFreshAppConnectionAsync(devServerUrl, {
          timeoutMs: remainingMs(),
          knownTargetIds,
        })
      : { appsConnected: observedApps, freshTargets: 0, timedOut: false, waitedMs: 0 };

  // The route is opened after the app is back, not before: Expo Go reloads the URL it was launched
  // with [observed — 2026-08-23: an app deep-linked to `/notes` returns to `/notes` after a
  // reload], so a link sent first would be replaced by the reload rather than survive it.
  const landing =
    route != null && method != null && connection.freshTargets > 0
      ? await openRouteAsync(projectRoot, options, devServerUrl, device)
      : null;
  if (landing?.device) {
    device = landing.device;
  }

  // A bundle that does not compile is `20` and a bundle that was still building is `22`, for the
  // reason llp/0010 gives `dev:wait`: a file with a syntax error in it does not parse on the second
  // look, and a cold first build really is worth looking at again.
  const exitCode =
    refusal === 'bundle-broken'
      ? EXIT_OUTCOME_FAILED
      : refusal === 'bundle-timeout'
        ? EXIT_OUTCOME_TIMEOUT
        : method == null
          ? EXIT_OUTCOME_FAILED
          : connection.freshTargets === 0
            ? EXIT_OUTCOME_TIMEOUT
            : EXIT_OK;

  const followups =
    followUpsEnabled(wantFollowUps) && exitCode === EXIT_OK
      ? buildReloadFollowUps({
          // The session's platform when no device was resolved: the dev-server method never looks
          // for one, and a run told `--android` still has to hand back Android commands (F54).
          platform: device?.platform ?? options.platform ?? null,
          backend: device?.backend,
          deviceId: device?.deviceId ?? null,
          route,
          adbPath: device?.adb?.bin,
        })
      : [];

  const report: ReloadResultJson = {
    reloaded: method != null,
    method,
    verifiedBy,
    devServerUrl,
    devServerSource: devServer.source,
    appsConnected: connection.appsConnected,
    appsReconnected: connection.freshTargets,
    // The same flag as `dev:wait`'s, so the reason a null bundle carries is the same sentence
    // whichever command asked the question (llp/0010 §The reload gate).
    bundle: bundleToJson(bundle, { skippedByFlag: !options.bundleCheck }),
    bundlePlatforms: bundles.map((entry) => entry.platform),
    bundlePlatformSource,
    route,
    routeCheck,
    url: landing?.url ?? null,
    platform: device?.platform ?? null,
    deviceId: device?.deviceId ?? null,
    attempts,
    waitedMs: Date.now() - startedAt,
    followups,
  };

  event('done', {
    reloaded: report.reloaded,
    method: report.method,
    appsConnected: report.appsConnected,
    appsReconnected: report.appsReconnected,
    route: report.route,
  });
  cliEvent('runtime_reload', {
    reloaded: report.reloaded,
    method: report.method,
    appsConnected: report.appsConnected,
    appsReconnected: report.appsReconnected,
  });

  if (json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report, options);
  }

  if (exitCode !== EXIT_OK) {
    Log.error(explainReloadFailure(report, options));
  }

  reportFollowUps('runtime:reload', followups, { json });
  return exitCode;
}

/**
 * Reload by broadcasting on the dev server's client command socket.
 *
 * Three steps, and the middle one is the reason this can be trusted. `getpeers` is asked first: it
 * names the clients that are connected *and* proves the dev server speaks this client's protocol
 * version, because a version it does not speak is dropped without an answer. The broadcast is then
 * sent, and the peers are read again until they change — the dev server's socket ids come from a
 * counter that never reuses a value, so a changed id is the app's connection having been replaced.
 */
export async function reloadOverDevServerAsync(
  devServerUrl: string,
  {
    connect = connectMessageSocketAsync,
    churnTimeoutMs = PEER_CHURN_TIMEOUT_MS,
    connectedApps = 0,
  }: {
    connect?: typeof connectMessageSocketAsync;
    churnTimeoutMs?: number;
    /**
     * How many apps `/json/list` named, which is the list the rest of this CLI uses.
     *
     * @ref llp/0005-runtime-loop-tools.rfc.md §Two lists, one question — K2. An empty peer list is
     * only "no app is connected" when *this* is zero too. Otherwise the app is there and the
     * command socket cannot see it, which is a different sentence and a different next step.
     */
    connectedApps?: number;
  } = {}
): Promise<ReloadAttempt> {
  const failed = (reason: string): ReloadAttempt => ({
    method: 'dev-server',
    ok: false,
    reason,
    leftAppStopped: null,
  });

  let socket: DevServerMessageSocket;
  try {
    socket = await connect(devServerUrl);
  } catch (error: unknown) {
    return failed(
      `could not open the dev server's command socket: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  try {
    const before = await socket.getPeersAsync();
    debugEvent('peers_read', { count: before ? Object.keys(before).length : null, when: 'before' });

    if (before == null) {
      return failed(
        `the dev server did not answer on its command socket, so it does not speak this protocol version and would have dropped the reload silently${
          connectedApps > 0
            ? ` — while its debugger target list names ${connectedApps} connected app(s), which is the list the debugger method below uses`
            : ''
        }`
      );
    }
    if (Object.keys(before).length === 0) {
      // The claim "nothing is connected" is only true when both lists say so. With a debugger
      // target and no peer, the app is running and this socket is the wrong way to reach it — which
      // is what a cloud app over a tunnel was, and what the old wording read as an empty device
      // (K2).
      return failed(
        connectedApps > 0
          ? `no client is registered on the dev server's command socket, while its debugger target list names ${connectedApps} connected app(s) — so the app is running and a broadcast here would reach nobody`
          : 'no app is connected to the dev server, so there is nothing to reload'
      );
    }

    socket.broadcastReload();
    debugEvent('broadcast_sent', { devServerUrl });

    const churned = await waitForPeerChurnAsync(socket, before, churnTimeoutMs);
    if (!churned) {
      return failed(
        `the reload was broadcast, but no client reconnected within ${churnTimeoutMs}ms, so the app did not act on it`
      );
    }
    return {
      method: 'dev-server',
      ok: true,
      reason: `the dev server broadcast the reload and the app reconnected to its command socket`,
      leftAppStopped: null,
    };
  } finally {
    socket.close();
  }
}

/** The first line of a message, for a reason that has to fit on one. */
function firstLine(text: string): string {
  return text.split('\n')[0]!.trim();
}

/** Poll the peers until they are not the ones that were there before, or the budget runs out. */
async function waitForPeerChurnAsync(
  socket: DevServerMessageSocket,
  before: MessageSocketPeers,
  timeoutMs: number
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, PEER_POLL_INTERVAL_MS));
    const after = await socket.getPeersAsync({ timeoutMs: PEER_POLL_INTERVAL_MS * 4 });
    debugEvent('peers_read', { count: after ? Object.keys(after).length : null, when: 'after' });
    if (peersChanged(before, after) === true) {
      return true;
    }
    if (Date.now() >= deadline) {
      return false;
    }
  }
}

/**
 * Whether the app's `expo` global can reload it, asked before anything is asked of it.
 *
 * The diagnostic strings it answers with are also what makes the two expressions distinguishable in
 * a test double — not the `typeof` in it, which the promise-settling wrapper adds to every
 * expression this CLI sends (`src/runtime/promiseSettling.ts`).
 */
const RELOAD_PROBE_EXPRESSION = `(function () {
  var e = globalThis.expo;
  if (e == null) return 'no-expo-global';
  return typeof e.reloadAppAsync === 'function' ? 'ready' : 'no-reload-function';
})()`;

/** The reload itself. Returns before the runtime tears itself down, or never returns at all. */
const RELOAD_CALL_EXPRESSION = `(function () {
  globalThis.expo.reloadAppAsync();
  return 'sent';
})()`;

/**
 * How long the reload call is given to answer before the silence is read as the runtime going away.
 *
 * Short on purpose. `expo.reloadAppAsync()` tears down the JavaScript context that is answering the
 * request, so an answer is the *unusual* outcome and a long wait here would only delay the wait that
 * actually proves something — the debugger target registering again.
 */
const RUNTIME_RELOAD_ANSWER_MS = 4000;

/**
 * Reload by asking the app's own `expo` global to reload it, over the debugger.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §Two lists, one question — Kudo's cloud loop, K2 and K3.
 *
 * The mechanism a caller chooses, and never one `auto` reaches for. It goes over the same CDP socket
 * `runtime:eval` uses, at the same target the same `/json/list` names, so an app this CLI can read
 * is an app this can ask — which is exactly the case the command socket could not serve: a cloud
 * app over a tunnel was in the target list and had no peer on `/message`, and this reloaded it.
 *
 * **On Expo Go the same call closes the app** [observed — Expo Go SDK 57, iOS 26.5 simulator,
 * 2026-08-27: the app left the screen and `/json/list` was still empty 13 s later]. That is the
 * whole reason this is opt-in: one runtime reloads and another quits, the difference is not
 * something this command can read in advance, and a mechanism that sometimes closes the app is not
 * one to run on a caller's behalf.
 *
 * It is `expo.reloadAppAsync()` because that is what a Hermes runtime has. There is no `require` and
 * no `import()` in it, so `DevSettings.reload()` is unreachable from an expression; the `expo`
 * global is the one door, and it was found by dumping `Object.keys(expo)`
 * [observed — Kudo, cloud simulator, 2026-08-27]. `runtime:eval --help` documents the same idiom,
 * so that a caller who needs to do this by hand does not have to rediscover it.
 *
 * **Nothing here claims a reload.** The probe says the function exists, the call says it was sent,
 * and the proof is the caller's own wait for a debugger target the dev server had not listed before.
 * An app whose runtime stops answering mid-call is the expected shape of success, so a timeout on
 * the call is reported as "sent" rather than as a failure.
 */
async function reloadOverRuntimeAsync(
  devServerUrl: string,
  options: ReloadOptions,
  connectedApps: number
): Promise<ReloadAttempt> {
  const failed = (reason: string): ReloadAttempt => ({
    method: 'runtime',
    ok: false,
    reason,
    leftAppStopped: null,
  });

  if (connectedApps === 0) {
    return failed(
      `no app is connected to the dev server, so there is no runtime to ask — this method reloads an app through its debugger and cannot start one`
    );
  }

  const { CdpClient, isMethodNotFoundError } =
    require('../cdpClient') as typeof import('../cdpClient');
  const { buildDeviceNameIndexIfNeededAsync } =
    require('../targetPlatform') as typeof import('../targetPlatform');

  let client: import('../cdpClient').CdpClient;
  try {
    const deviceIndex =
      options.platform == null
        ? undefined
        : await buildDeviceNameIndexIfNeededAsync((await probeDevServerAsync(devServerUrl)).targets);
    client = new CdpClient({ metroUrl: devServerUrl, platform: options.platform, deviceIndex });
  } catch (error: unknown) {
    return failed(
      `could not open a debugger connection to the app: ${error instanceof Error ? firstLine(error.message) : String(error)}`
    );
  }

  let probe: string;
  try {
    const answer = await client.evaluateAsync(RELOAD_PROBE_EXPRESSION, {
      awaitPromise: false,
      timeoutMs: RUNTIME_RELOAD_ANSWER_MS,
    });
    if (answer.exceptionText) {
      return failed(`the app threw while it was asked whether it can reload itself: ${answer.exceptionText}`);
    }
    probe = String(answer.value ?? 'no-answer');
  } catch (error: unknown) {
    return failed(
      isMethodNotFoundError(error)
        ? `the app's runtime has no debugger to ask: it answered "method not found" to Runtime.evaluate, which is what Expo Go for Android does`
        : `the app did not answer over the debugger: ${error instanceof Error ? firstLine(error.message) : String(error)}`
    );
  }

  if (probe !== 'ready') {
    return failed(
      probe === 'no-expo-global'
        ? `the app has no "expo" global, so there is nothing on it to reload with — this needs an app built on the expo package`
        : probe === 'no-reload-function'
          ? `the app's "expo" global has no reloadAppAsync, so this runtime cannot be asked to reload itself — a newer expo package has it`
          : `the app answered the reload probe with "${probe}", which this command cannot read`
    );
  }

  try {
    await client.evaluateAsync(RELOAD_CALL_EXPRESSION, {
      awaitPromise: false,
      timeoutMs: RUNTIME_RELOAD_ANSWER_MS,
    });
  } catch {
    // A runtime that stops answering is what a reload looks like from here, so this is not a
    // failure — and it is not a success either. The wait for a fresh target decides.
    return {
      method: 'runtime',
      ok: true,
      reason: `expo.reloadAppAsync() was called over the debugger and the runtime stopped answering, which is what a reload looks like from here`,
      leftAppStopped: null,
    };
  }

  return {
    method: 'runtime',
    ok: true,
    reason: `expo.reloadAppAsync() was called over the debugger`,
    leftAppStopped: null,
  };
}

/** Reload by stopping the app on the device and opening it again. */
async function reloadOnDeviceAsync(
  projectRoot: string,
  options: ReloadOptions,
  devServerUrl: string
): Promise<{ attempt: ReloadAttempt; device: NavigateDevice | null }> {
  let device: NavigateDevice;
  try {
    // @ref llp/0005-runtime-loop-tools.rfc.md §What the cloud backend can and cannot do.
    // `required` and never `fallback`: only `--cloud` sends this to a device that bills by the
    // minute, and a machine with nothing booted is told it has nothing.
    device = await resolveDeviceAsync(options.platform, {
      cloud: options.cloud ? 'required' : 'off',
      projectRoot,
    });
  } catch (error: unknown) {
    return {
      attempt: {
        method: 'device',
        ok: false,
        reason: error instanceof Error ? error.message.split('\n')[0]! : String(error),
        leftAppStopped: null,
      },
      device: null,
    };
  }

  const appId = await resolveAppIdAsync(projectRoot, devServerUrl, device, options.appId);
  const stopped = await stopAppOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    appId,
    adb: device.adb,
    backend: device.backend,
    projectRoot,
  });
  if (!stopped.ok) {
    return {
      attempt: {
        method: 'device',
        ok: false,
        reason: `${stopped.command} failed: ${stopped.reason}`,
        // The stop is what failed, so the app is where it was.
        leftAppStopped: null,
      },
      device,
    };
  }

  // Starting it again is the deep link, which is the same step `navigate` runs — so a run with a
  // `--route` opens the route directly and a run without one opens the root.
  const opened = await openRouteAsync(projectRoot, options, devServerUrl, device);
  if (opened == null || opened.exitCode !== 0) {
    return {
      attempt: {
        method: 'device',
        ok: false,
        reason: `the app was stopped, but the device refused the link that would start it again (${opened?.command ?? 'no command ran'})`,
        // Stopped and not started: the app is off the screen because of this run.
        leftAppStopped: appId,
      },
      device,
    };
  }

  return {
    attempt: {
      method: 'device',
      ok: true,
      reason: `${stopped.command}, then ${opened.command}`,
      leftAppStopped: null,
    },
    device,
  };
}

/** Open the route (or the root) on a device, building the URL exactly as `navigate` does. */
async function openRouteAsync(
  projectRoot: string,
  options: ReloadOptions,
  devServerUrl: string,
  known: NavigateDevice | null
): Promise<{ url: string; command: string; exitCode: number | null; device: NavigateDevice } | null> {
  const [config, nativeDirs, packageJson] = await Promise.all([
    Promise.resolve(readProjectSchemeConfig(projectRoot)),
    readProjectNativeDirsAsync(projectRoot),
    readProjectPackageJsonAsync(projectRoot),
  ]);
  const usesDevClient = await isInstalledDependencyAsync(
    projectRoot,
    listDependencyNames(packageJson),
    'expo-dev-client'
  );
  const target = decideExpoGoTarget({
    appIdOverride: options.appId,
    targetAppIds: [],
    hasNativeDirs: nativeDirs.ios || nativeDirs.android,
    usesDevClient,
  });

  const resolved = resolveDeepLinkUrl({
    route: options.route ?? '/',
    schemeOverride: options.scheme,
    config,
    isExpoGo: target.isExpoGo,
    devServerUrl,
  });
  if (!resolved.ok) {
    return null;
  }

  const device =
    known ??
    (await resolveDeviceAsync(options.platform, {
      cloud: options.cloud ? 'required' : 'off',
      projectRoot,
    }));
  const result = await openUrlOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    url: resolved.url,
    appId: options.appId,
    adb: device.adb,
    backend: device.backend,
    projectRoot,
  });
  return { url: resolved.url, command: result.command, exitCode: result.exitCode, device };
}

/**
 * The application id to stop, resolved the way `runtime:stop` resolves it.
 *
 * @see ../appId — the dev server outranks the app config, because the config says what a build of
 * this project would be called and the dev server says what is running.
 */
async function resolveAppIdAsync(
  projectRoot: string,
  devServerUrl: string,
  device: NavigateDevice,
  appIdOverride?: string
): Promise<string> {
  const { probeDevServerAsync } = require('../devServer') as typeof import('../devServer');
  const probe = await probeDevServerAsync(devServerUrl);
  return resolveAppId({
    platform: device.platform,
    appIdOverride,
    targetAppIds: probe.targets.map((target) => target.appId).filter(Boolean),
    configured: readConfiguredAppId(projectRoot, device.platform),
  }).appId;
}

/** What each method is, in the words of the thing it acted on rather than its flag value. */
const METHOD_PHRASE: { [method: string]: string } = {
  'dev-server': "the dev server's client command socket",
  runtime: "the app's own expo.reloadAppAsync, over the debugger",
  device: 'stopping the app on the device and opening it again',
};

function printHumanReport(report: ReloadResultJson, options: ReloadOptions): void {
  const lines = [
    chalk`{bold Reloaded} ${report.reloaded ? chalk.green('yes') : chalk.red('no')}${
      report.method
        ? chalk`{dim  · via ${METHOD_PHRASE[report.method] ?? report.method}}`
        : ''
    }`,
  ];
  if (report.verifiedBy) {
    lines.push(chalk`{dim  verified by ${report.verifiedBy}}`);
  }
  lines.push(
    chalk`{bold Dev server} ${report.devServerUrl}{dim  · via ${report.devServerSource}}`,
    // Both numbers whenever a reload happened: the second is what the reload was judged on, and
    // printing only the first is what let "Apps connected 1" describe a runtime that was on its
    // way out (F45). When no reload happened there is nothing to count reconnections *against*,
    // and "0 reconnected after the reload" read as an app that failed to come back from one
    // [friction run 5, F48-6] — so the clause says which of the two this is instead.
    chalk`{bold Apps connected} ${report.appsConnected}{dim  · ${
      report.reloaded
        ? `${report.appsReconnected} reconnected after the reload`
        : 'no reload happened, so nothing had reason to reconnect'
    }}`
  );
  // Always a line, whatever the check did. Printing one only for an answered check made the
  // *absence* of a line the only signal that a gate had been skipped [observed — friction run 5,
  // F48-7: `runtime:reload --no-bundle-check` printed no Bundle line at all, while a checked run
  // printed `Bundle compiles · for ios`]. A reader cannot notice a line that is not there.
  if (report.bundle.ok != null) {
    // Which platforms, and where they came from: a run that checked a default it was never told to
    // use has to say so, or `for ios` reads as a fact about the app it just reloaded (F53).
    const others = report.bundlePlatforms.filter((name) => name !== report.bundle.platform);
    lines.push(
      chalk`{bold Bundle} ${report.bundle.ok ? chalk.green('compiles') : chalk.red('does not compile')}${
        report.bundle.platform ? chalk`{dim  · for ${report.bundle.platform}}` : ''
      }${others.length ? chalk`{dim  · also checked ${others.join(', ')}}` : ''}${
        report.bundlePlatformSource === 'connected-app'
          ? chalk`{dim  · the platform the connected app is on}`
          : report.bundlePlatformSource === 'default'
            ? chalk`{dim  · a default, because nothing named a platform and no connected app could be placed}`
            : ''
      }`
    );
  } else if (!options.bundleCheck) {
    lines.push(chalk`{bold Bundle} ${chalk.dim('skipped (--no-bundle-check)')}`);
  } else {
    lines.push(
      chalk`{bold Bundle} ${chalk.dim(`not checked${report.bundle.reason ? ` · ${report.bundle.reason}` : ''}`)}`
    );
  }
  if (report.route != null) {
    lines.push(chalk`{bold Route} ${report.route}${report.url ? chalk`{dim  · ${report.url}}` : ''}`);
  }
  for (const attempt of report.attempts) {
    lines.push(chalk`{dim  ${attempt.method}: ${attempt.reason}}`);
  }
  lines.push(chalk`{bold Took} ${report.waitedMs}ms`);
  Log.log(lines.join('\n'));
}

/**
 * What this run left behind, when the fallback stopped the app and could not start it again.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §What the cloud backend can and cannot do — live
 * staging, S12.
 *
 * Said out loud because it is a state the command *produced*: the app is not on the screen, and on a
 * cloud session the reopen this command would use is the one that just failed — so the recovery is a
 * command a person runs, and the fallback is not redesigned here. Empty for a run that stopped
 * nothing.
 */
function explainStrandedApp(report: ReloadResultJson, options: ReloadOptions): string[] {
  const appId = report.attempts.find((attempt) => attempt.leftAppStopped != null)?.leftAppStopped;
  if (appId == null) {
    return [];
  }
  return [
    options.cloud
      ? `The app was left closed: the device fallback stopped ${appId} on the cloud session and the relaunch was refused, so the session is still billing with nothing running on it, and this command cannot put it back — the reopen it would use is the one that just failed.`
      : `The app was left closed: the device fallback stopped ${appId} and the relaunch was refused, so nothing is running on the device now.`,
    options.cloud
      ? `To reopen it by hand, run "npx eas simulator:exec npx ${AGENT_DEVICE_SPEC} open ${appId}" — opening the application id rather than a deep link avoids the "Open in Expo Go?" dialog that nothing can answer on a cloud device. "npx eas simulator:stop" ends the session and its billing.`
      : `Run "npx exagent navigate /" to open it again.`,
  ];
}

/** The what / why / how for a reload that did not end where it was supposed to. */
export function explainReloadFailure(report: ReloadResultJson, options: ReloadOptions): string {
  // The refusal comes first, because nothing was attempted: an attempts list that is empty for
  // this reason must not read as "no method worked" (friction run 4, F38).
  if (report.bundle.ok === false) {
    const error = report.bundle.error;
    const where = [error?.filename, error?.lineNumber, error?.column]
      .filter((part) => part != null)
      .join(':');
    return [
      chalk.red(`This project's entry bundle does not compile, so the app was not reloaded.`),
      `Why: a reload makes the app fetch the served bundle again, and that bundle is the one the bundler stopped on${where ? ` at ${where}` : ''} — ${error?.message ?? 'the bundler reported an error'}. Reloading would have replaced the screen the app is on with the same failure, and reported success for it.`,
      `How: fix ${where || 'the file the bundler named'} and run this command again; the dev server rebuilds on save, so no restart is needed. Pass --no-bundle-check to reload without asking, which is only useful when you mean to reload onto a bundle you know is broken.`,
      ...(error?.snippet ? [error.snippet] : []),
    ].join('\n');
  }
  if (report.bundle.reason != null && report.bundle.ok == null && options.bundleCheck &&
      report.method == null && report.attempts.length === 0) {
    return [
      chalk.red(
        `The bundler was still building this project's entry bundle after ${options.timeoutMs}ms, so the app was not reloaded.`
      ),
      `Why: ${report.bundle.reason}. Until that build finishes it is not known whether a reload would fetch working code, and nothing was attempted rather than reload onto an answer nobody has.`,
      `How: run this command again with a longer --timeout — a first build of a large app takes tens of seconds — or run "npx exagent smoke" first and reload once it is green.`,
    ].join('\n');
  }
  if (!report.reloaded) {
    return [
      chalk.red(`The app was not reloaded.`),
      `Why: ${report.attempts.map((attempt) => `${attempt.method} — ${attempt.reason}`).join('; ') || 'no method was tried'}.`,
      ...explainStrandedApp(report, options),
      // @ref llp/0005 §Two lists, one question — K2 and K3. Two different dead ends, and the old
      // text described only the second: "open the app first" is advice for a caller whose app is
      // *not* running, and printing it for a connected app is how a reader was sent to start a
      // second copy of an app this command could see all along.
      report.appsConnected > 0
        ? `How: the app is connected — ${report.devServerUrl}/json/list names ${report.appsConnected === 1 ? 'it' : `${report.appsConnected} of them`} — so this is not a missing app, it is a runtime the broadcast could not reach. Editing a file the app has loaded is the cheapest way in: the dev server pushes that on its own. The two deliberate methods are "npx exagent runtime:reload --method runtime", which asks the app's own expo.reloadAppAsync to do it and on Expo Go closes the app instead, and "npx exagent runtime:reload --method device", which force-stops the app and opens it again — that always works and costs the app's state${options.cloud ? ', and on a cloud session leaves the app closed if the relaunch is refused' : ''}.`
        : `How: open the app on a device or simulator first ("npx exagent navigate /"), then run this command again. A reload needs an app that is already running: it replaces the JavaScript in one, it does not start one.`,
    ].join('\n');
  }
  // Two shapes of "not back", and they are told apart by what the target list says. An empty list
  // is an app that went and did not return; a list holding only the runtime that was there before
  // the reload is an app that never re-registered. Reporting either as a success is F45.
  if (report.appsConnected === 0) {
    return [
      chalk.red(
        `The app reloaded, but it had not reconnected to the dev server ${options.timeoutMs}ms later.`
      ),
      `Why: its debugger target list (${report.devServerUrl}/json/list) was empty, so no app is running this project's JavaScript — the app either closed or is still loading a cold bundle, which can take longer than this wait.`,
      `How: run "npx exagent smoke" to wait for the bundle and the app together, or run this command again with a longer --timeout. If the app is not on screen, "npx exagent navigate /" opens it. Nothing is known to be wrong; the wait ran out first.`,
    ].join('\n');
  }
  return [
    chalk.red(
      `The app reloaded, but its JavaScript had not registered again ${options.timeoutMs}ms later.`
    ),
    `Why: ${report.devServerUrl}/json/list still names ${report.appsConnected === 1 ? 'the same debugger target' : `only the same ${report.appsConnected} debugger targets`} it named before the reload, and the dev server never reuses a target id — so the runtime that answers now is the one from before, not a reloaded one. Its errors and its state describe the run this reload was meant to replace.`,
    `How: run this command again with a longer --timeout, or run "npx exagent smoke" and read the app after it. Do not believe "npx exagent runtime:errors" until a reload reports a reconnected app.`,
  ].join('\n');
}
