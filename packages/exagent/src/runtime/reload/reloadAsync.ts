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
import { bundleToJson, type DevWaitBundleJson } from '../../dev/waitFormat';
import { checkEntryBundleAsync, DEFAULT_BUNDLE_CHECK_PLATFORM } from '../bundleCheck';
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
  method: 'dev-server' | 'device';
  /** The app was reloaded by this method. */
  ok: boolean;
  /** Why it did not work, or what it did. Never null: an attempt always has something to say. */
  reason: string;
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
  method: 'dev-server' | 'device' | null;
  /**
   * What proved the reload.
   *
   * `message-socket-peers` — the app's connection to the dev server's command socket was replaced,
   * which the dev server's own never-reused socket ids make unambiguous. `app-relaunch` — the app
   * was stopped on the device and started again, so there was nothing left to keep running.
   */
  verifiedBy: 'message-socket-peers' | 'app-relaunch' | null;
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
  bundle: DevWaitBundleJson;
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
    error.suggestedCommand = 'npx exagent dev:wait';
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
  const bundle = options.bundleCheck
    ? await checkEntryBundleAsync(devServerUrl, {
        platform: options.platform ?? DEFAULT_BUNDLE_CHECK_PLATFORM,
        timeoutMs: remainingMs(),
        projectRoot,
      })
    : null;
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
      const attempt = await reloadOverDevServerAsync(devServerUrl);
      attempts.push(attempt);
      if (attempt.ok) {
        method = 'dev-server';
        verifiedBy = 'message-socket-peers';
      }
    }

    // The device method is also what starts an app that is not running at all, so `auto` reaches
    // it both when the broadcast did nothing and when there was nobody to broadcast to.
    if (method == null && (options.method === 'auto' || options.method === 'device')) {
      const attempt = await reloadOnDeviceAsync(projectRoot, options, devServerUrl);
      attempts.push(attempt.attempt);
      device = attempt.device;
      if (attempt.attempt.ok) {
        method = 'device';
        verifiedBy = 'app-relaunch';
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
          platform: device?.platform ?? null,
          deviceId: device?.deviceId ?? null,
          route,
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
    Log.error(explainFailure(report, options));
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
  }: {
    connect?: typeof connectMessageSocketAsync;
    churnTimeoutMs?: number;
  } = {}
): Promise<ReloadAttempt> {
  const failed = (reason: string): ReloadAttempt => ({ method: 'dev-server', ok: false, reason });

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
        `the dev server did not answer on its command socket, so it does not speak this protocol version and would have dropped the reload silently`
      );
    }
    if (Object.keys(before).length === 0) {
      return failed('no app is connected to the dev server, so there is nothing to reload');
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
    };
  } finally {
    socket.close();
  }
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

/** Reload by stopping the app on the device and opening it again. */
async function reloadOnDeviceAsync(
  projectRoot: string,
  options: ReloadOptions,
  devServerUrl: string
): Promise<{ attempt: ReloadAttempt; device: NavigateDevice | null }> {
  let device: NavigateDevice;
  try {
    device = await resolveDeviceAsync(options.platform);
  } catch (error: unknown) {
    return {
      attempt: {
        method: 'device',
        ok: false,
        reason: error instanceof Error ? error.message.split('\n')[0]! : String(error),
      },
      device: null,
    };
  }

  const appId = await resolveAppIdAsync(projectRoot, devServerUrl, device, options.appId);
  const stopped = await stopAppOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    appId,
  });
  if (!stopped.ok) {
    return {
      attempt: { method: 'device', ok: false, reason: `${stopped.command} failed: ${stopped.reason}` },
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
      },
      device,
    };
  }

  return {
    attempt: {
      method: 'device',
      ok: true,
      reason: `${stopped.command}, then ${opened.command}`,
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

  const device = known ?? (await resolveDeviceAsync(options.platform));
  const result = await openUrlOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    url: resolved.url,
    appId: options.appId,
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

function printHumanReport(report: ReloadResultJson, options: ReloadOptions): void {
  const lines = [
    chalk`{bold Reloaded} ${report.reloaded ? chalk.green('yes') : chalk.red('no')}${
      report.method ? chalk`{dim  · via ${report.method}}` : ''
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
    lines.push(
      chalk`{bold Bundle} ${report.bundle.ok ? chalk.green('compiles') : chalk.red('does not compile')}${
        report.bundle.platform ? chalk`{dim  · for ${report.bundle.platform}}` : ''
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

/** The what / why / how for a reload that did not end where it was supposed to. */
function explainFailure(report: ReloadResultJson, options: ReloadOptions): string {
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
      `How: run this command again with a longer --timeout — a first build of a large app takes tens of seconds — or run "npx exagent dev:wait" first and reload once it is green.`,
    ].join('\n');
  }
  if (!report.reloaded) {
    return [
      chalk.red(`The app was not reloaded.`),
      `Why: ${report.attempts.map((attempt) => `${attempt.method} — ${attempt.reason}`).join('; ') || 'no method was tried'}.`,
      `How: open the app on a device or simulator first ("npx exagent navigate /"), then run this command again. A reload needs an app that is already running: it replaces the JavaScript in one, it does not start one.`,
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
      `How: run "npx exagent dev:wait --require-app" to wait for it, or run this command again with a longer --timeout. If the app is not on screen, "npx exagent navigate /" opens it. Nothing is known to be wrong; the wait ran out first.`,
    ].join('\n');
  }
  return [
    chalk.red(
      `The app reloaded, but its JavaScript had not registered again ${options.timeoutMs}ms later.`
    ),
    `Why: ${report.devServerUrl}/json/list still names ${report.appsConnected === 1 ? 'the same debugger target' : `only the same ${report.appsConnected} debugger targets`} it named before the reload, and the dev server never reuses a target id — so the runtime that answers now is the one from before, not a reloaded one. Its errors and its state describe the run this reload was meant to replace.`,
    `How: run this command again with a longer --timeout, or run "npx exagent dev:wait --require-app" and read the app after it. Do not believe "npx exagent runtime:errors" until a reload reports a reconnected app.`,
  ].join('\n');
}
