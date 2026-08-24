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

import { event as cliEvent } from '../events';
import { buildReloadFollowUps, followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import {
  isFullUrlRoute,
  openUrlOnDeviceAsync,
  readProjectSchemeConfig,
  resolveDeepLinkUrl,
} from '../navigate/deepLink';
import { resolveDeviceAsync, type NavigateDevice } from '../navigate/device';
import { checkRoute, routeNotFoundError, type RouteCheckJson } from '../navigate/routeCheck';
import { decideExpoGoTarget } from '../navigate/target';
import { readProjectNativeDirsAsync } from '../project/nativeCode';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import { readProjectRoutesAsync } from '../project/routes';
import { discoverDevServerAsync, type DevServerSource } from '../runtime/devServer';
import {
  connectMessageSocketAsync,
  peersChanged,
  type DevServerMessageSocket,
  type MessageSocketPeers,
} from '../runtime/messageSocket';
import { waitForAppConnectionAsync } from '../runtime/waitReady';
import { CommandError } from '../utils/errors';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import { EXPO_GO_APP_ID, stopAppOnDeviceAsync } from './device';
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
 * Machine shape of `exagent reload --json`.
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
        `How: start the dev server ("npx exagent dev --yes"), then run this command again. Pass --dev-server-url to name a dev server on another host or port.`,
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
    isFullUrl: route != null && isFullUrlRoute(route),
  });
  if (routeCheck.ok === false && route != null) {
    throw routeNotFoundError(route, routeTable, { platform: options.platform });
  }

  const attempts: ReloadAttempt[] = [];
  let method: ReloadResultJson['method'] = null;
  let verifiedBy: ReloadResultJson['verifiedBy'] = null;
  let device: NavigateDevice | null = null;

  if (options.method === 'auto' || options.method === 'dev-server') {
    const attempt = await reloadOverDevServerAsync(devServerUrl);
    attempts.push(attempt);
    if (attempt.ok) {
      method = 'dev-server';
      verifiedBy = 'message-socket-peers';
    }
  }

  // The device method is also what starts an app that is not running at all, so `auto` reaches it
  // both when the broadcast did nothing and when there was nobody to broadcast to.
  if (method == null && (options.method === 'auto' || options.method === 'device')) {
    const attempt = await reloadOnDeviceAsync(projectRoot, options, devServerUrl);
    attempts.push(attempt.attempt);
    device = attempt.device;
    if (attempt.attempt.ok) {
      method = 'device';
      verifiedBy = 'app-relaunch';
    }
  }

  // The app has to come back with a JavaScript runtime the rest of the CLI can read, so the wait
  // is on the debugger target list rather than on the socket that proved the reload.
  const connection = method != null
    ? await waitForAppConnectionAsync(devServerUrl, { timeoutMs: options.timeoutMs })
    : { appsConnected: 0, timedOut: false, waitedMs: 0 };

  // The route is opened after the app is back, not before: Expo Go reloads the URL it was launched
  // with [observed — 2026-08-23: an app deep-linked to `/notes` returns to `/notes` after a
  // reload], so a link sent first would be replaced by the reload rather than survive it.
  const landing =
    route != null && method != null && connection.appsConnected > 0
      ? await openRouteAsync(projectRoot, options, devServerUrl, device)
      : null;
  if (landing?.device) {
    device = landing.device;
  }

  const exitCode =
    method == null
      ? EXIT_OUTCOME_FAILED
      : connection.appsConnected === 0
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
    route: report.route,
  });
  cliEvent('reload', {
    reloaded: report.reloaded,
    method: report.method,
    appsConnected: report.appsConnected,
  });

  if (json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  if (exitCode !== EXIT_OK) {
    Log.error(explainFailure(report, options));
  }

  reportFollowUps('reload', followups, { json });
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

  const appId = options.appId ?? (await resolveAppIdAsync(projectRoot, devServerUrl, device));
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
 * The application id to stop.
 *
 * The dev server names it: a debugger target carries the `appId` of the app that registered it, so
 * a development build is stopped under its own id without the project config being read. Expo Go
 * is the fallback, per platform, because that is the app an Expo Go project runs in and its id is
 * fixed.
 */
async function resolveAppIdAsync(
  projectRoot: string,
  devServerUrl: string,
  device: NavigateDevice
): Promise<string> {
  const { probeDevServerAsync } = require('../runtime/devServer') as typeof import('../runtime/devServer');
  const probe = await probeDevServerAsync(devServerUrl);
  const reported = probe.targets.map((target) => target.appId).find(Boolean);
  return reported ?? EXPO_GO_APP_ID[device.platform];
}

function printHumanReport(report: ReloadResultJson): void {
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
    chalk`{bold Apps connected} ${report.appsConnected}`
  );
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
  if (!report.reloaded) {
    return [
      chalk.red(`The app was not reloaded.`),
      `Why: ${report.attempts.map((attempt) => `${attempt.method} — ${attempt.reason}`).join('; ') || 'no method was tried'}.`,
      `How: open the app on a device or simulator first ("npx exagent navigate /"), then run this command again. A reload needs an app that is already running: it replaces the JavaScript in one, it does not start one.`,
    ].join('\n');
  }
  return [
    chalk.red(
      `The app reloaded, but it had not reconnected to the dev server ${options.timeoutMs}ms later.`
    ),
    `Why: its debugger target list (${report.devServerUrl}/json/list) was still empty, so the JavaScript had not finished loading — a cold bundle after a reload can take longer than this wait.`,
    `How: run "npx exagent dev:wait --require-app" to wait for it, or run this command again with a longer --timeout. Nothing is known to be wrong; the wait ran out first.`,
  ].join('\n');
}
