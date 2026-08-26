// @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route
// Opening a route on a device, with none of the reporting.
//
// This is `exagent navigate` with its output removed, extracted so `exagent smoke` can perform the
// same act as part of a larger answer. The alternative was for `smoke` to compose the same six
// steps itself — the route check, the scheme resolution, the Expo Go decision, the device probe,
// the deep link, the exit code — and a second composition of those steps is a second place for the
// findings of llp/0005 to be forgotten: the `/--/?` marker the root route needs, the route table
// that has to be consulted *before* the link, the dev server that is found rather than assumed.
//
// So the composition lives here and both callers use it. `navigateAsync` is this function plus the
// event, the follow-ups and the two output channels; `smoke` is this function inside a phase.

import {
  classifyDevServerHost,
  isTunnelCurrent,
  resolveDevServerReachAsync,
  type DevServerHostType,
  type DevServerReach,
} from '../dev/advertisedUrl';
import { event as cliEvent } from '../events';
import { readProjectNativeDirsAsync } from '../project/nativeCode';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import { readProjectRoutesAsync } from '../project/routes';
import { discoverDevServerAsync, type DevServerSource } from '../runtime/devServer';
import { CommandError } from '../utils/errors';
import {
  isFullUrlRoute,
  openUrlOnDeviceAsync,
  readProjectSchemeConfig,
  resolveDeepLinkUrl,
} from './deepLink';
import { resolveDeviceAsync, type NavigatePlatform } from './device';
import { debugEvent } from './events';
import {
  checkRoute,
  routeNotFoundError,
  type RouteCheckJson,
  type RouteCommand,
} from './routeCheck';
import { decideExpoGoTarget } from './target';

export interface OpenRouteOptions {
  /** Route as the caller wrote it. */
  route: string;
  /** Platform to open on, or undefined for whichever device is booted. */
  platform?: NavigatePlatform;
  /** URL scheme, instead of the one read from the project's config. */
  scheme?: string;
  /** Application id, for scoping the Android intent. */
  appId?: string;
  /** The `--dev-server-url` the caller named, or null when it is still to be found. */
  devServerUrl: string | null;
  /** Check the route against the project's routes first, cleared by `--no-route-check`. */
  routeCheck: boolean;
  /**
   * The command a route failure suggests re-running.
   *
   * The `Try:` line is what a driving agent runs next, so it has to be the command the caller was
   * running rather than always `navigate` (friction run 5).
   */
  command?: RouteCommand;
}

/** Everything the URL alone amounts to: the answer of a run that opens nothing. */
export interface ResolvedRoute {
  route: string;
  /** URL a device opens to reach this route. */
  url: string;
  /** Where the dev server listens on this machine. */
  devServerUrl: string;
  devServerSource: DevServerSource;
  /** Whether that dev server answered. */
  devServerReachable: boolean;
  /** How the URL was derived. */
  resolution: string;
  /** Why the target app was decided to be Expo Go or a development build. */
  target: string;
  /** Whether the target app was decided to be Expo Go. */
  isExpoGo: boolean;
  /**
   * What kind of host **the URL above carries**: `tunnel`, `lan`, `localhost`, or null.
   *
   * Classified from the URL itself rather than from what the dev server advertised, so the two can
   * never disagree. They did: a run whose tunnel had died fell back to `exp://127.0.0.1:8081` and
   * still reported `tunnel`, which reads as "open this anywhere" under an address only this machine
   * can use [observed — live, 2026-08-25]. Null for a development build, whose `<scheme>://<route>`
   * carries no host at all — it reaches whatever dev server the app was launched against.
   */
  hostType: DevServerHostType | null;
  /**
   * The tunnel this run had is gone, so the URL above is the fallback rather than the address a
   * device should have been given.
   *
   * @see src/dev/advertisedUrl.ts §the `Waiting on` line is written once and never revised
   */
  tunnelExpired: boolean;
  /** Whether the route was checked against the project's routes, and what the check said. */
  routeCheck: RouteCheckJson;
}

/** Everything one open amounts to, with nothing printed. */
export interface OpenRouteResult extends ResolvedRoute {
  platform: NavigatePlatform;
  deviceId: string;
  /** Simulator name, when the platform tool reported one. */
  deviceName?: string;
  appId: string | null;
  /** The device command that was run, for reproducing the step by hand. */
  command: string;
  /** Exit code of that command: non-zero means the device refused the deep link. */
  exitCode: number | null;
  /** What the device tool wrote, for a caller that reports it. */
  stdout: string;
  stderr: string;
}

/**
 * Everything a deep link needs except the device: the route check, the dev server, the Expo Go
 * decision, and the URL itself.
 *
 * Split out from {@link openRouteAsync} for `navigate --print-url`, whose whole point is that the
 * device the app runs on may not be one this machine can drive — a cloud simulator, a phone, a
 * teammate. Extracting the half that needs no device is what lets the two modes answer *the same
 * URL*: a second composition of these steps is a second place for the findings of llp/0005 to be
 * forgotten, which is the reason this file exists at all.
 *
 * @throws {CommandError} `ROUTE_NOT_FOUND` for a route the project has not got, and
 * `DEEP_LINK_UNRESOLVED` for a named dev server that does not answer or a project with no
 * resolvable scheme.
 */
export async function resolveRouteUrlAsync(
  projectRoot: string,
  options: OpenRouteOptions
): Promise<ResolvedRoute> {
  const { route, platform, scheme, appId } = options;

  const [devServer, config, nativeDirs, packageJson, routeTable, reach] = await Promise.all([
    discoverDevServerAsync(options.devServerUrl ?? undefined, { projectRoot }),
    Promise.resolve(readProjectSchemeConfig(projectRoot)),
    readProjectNativeDirsAsync(projectRoot),
    readProjectPackageJsonAsync(projectRoot),
    readProjectRoutesAsync(projectRoot),
    // What the dev server said about where a device reaches it (`src/dev/advertisedUrl.ts`).
    //
    // Not asked when `--dev-server-url` named one: the caller named the host they want reached, and
    // substituting this project's tunnel host for it would quietly answer a different question —
    // the flag may well name a dev server that is not this project's at all.
    options.devServerUrl == null ? resolveDevServerReachAsync(projectRoot) : namedDevServerReach(),
  ]);
  const devServerUrl = devServer.devServerUrl;

  // Before anything is opened, and before the device is even looked for. A route the project has
  // not got is the caller's own argument being wrong, and the recovery — the list of routes it
  // does have — costs one directory walk and needs neither a dev server nor a device. Leaving it
  // until after the link is open would put the app on the "Unmatched Route" screen first, which is
  // the state this check exists to prevent (llp/0005 §Verifying the route).
  const routeCheck = checkRoute({
    route,
    table: routeTable,
    enabled: options.routeCheck,
    isFullUrl: isFullUrlRoute(route),
  });
  debugEvent('route_checked', routeCheck);
  if (routeCheck.ok === false) {
    throw routeNotFoundError(route, routeTable, { platform, command: options.command });
  }

  // A named dev server that does not answer is a mistake worth stopping on, and the only case where
  // this command could still build a URL from it: the scheme of a development build needs no dev
  // server, so a `--dev-server-url` typo used to deep-link the device into an app with no bundle to
  // load and report exit 0. Discovery already probes the URL — `flag` is the one source whose
  // failure was not acted on.
  if (devServer.source === 'flag' && !devServer.reachable) {
    throw unreachableNamedDevServerError(devServerUrl, devServer.reason);
  }

  const usesDevClient = await isInstalledDependencyAsync(
    projectRoot,
    listDependencyNames(packageJson),
    'expo-dev-client'
  );

  const target = decideExpoGoTarget({
    appIdOverride: appId,
    targetAppIds: devServer.targets.map((item) => item.appId).filter(Boolean),
    hasNativeDirs: nativeDirs.ios || nativeDirs.android,
    usesDevClient,
  });
  debugEvent('target_decided', target);

  // Only a tunnel that is *current* changes the URL: a host read out of a log whose tunnel has
  // since died is worse than the LAN address, because it looks like it should work.
  const tunnelHost = isTunnelCurrent(reach) ? (reach.advertised?.host ?? null) : null;

  const resolved = resolveDeepLinkUrl({
    route,
    schemeOverride: scheme,
    config,
    isExpoGo: target.isExpoGo,
    devServerUrl: devServer.reachable ? devServerUrl : null,
    reachHost: tunnelHost,
  });
  if (!resolved.ok) {
    const error = new CommandError('DEEP_LINK_UNRESOLVED', resolved.error);
    // Decided where the diagnosis was, so the last line of the failure is a command that can be
    // run: one `Try:` for all three ways this fails was a line with two placeholders in it
    // [observed — friction run 5].
    error.suggestedCommand = resolved.suggestedCommand;
    throw error;
  }
  debugEvent('url_resolved', { url: resolved.url, resolution: resolved.resolution });

  return {
    route,
    url: resolved.url,
    devServerUrl,
    devServerSource: devServer.source,
    devServerReachable: devServer.reachable,
    resolution: resolved.resolution,
    target: target.reason,
    isExpoGo: target.isExpoGo,
    hostType: resolved.host ? classifyDevServerHost(hostnameOf(resolved.host)) : null,
    // Only when the run *had* a tunnel: a project that never asked for one has no tunnel to have
    // lost, and saying so would be an alarm about something that was never there.
    tunnelExpired: reach.advertised?.hostType === 'tunnel' && reach.tunnelFailure != null,
    routeCheck,
  };
}

/** The name part of a `host[:port]`, which is what a host classification is about. */
function hostnameOf(host: string): string {
  const lastColon = host.lastIndexOf(':');
  // An IPv6 literal is bracketed, so its colons are inside the brackets and never the port's.
  return lastColon > 0 && !host.includes(']') ? host.slice(0, lastColon) : host;
}

/**
 * Resolve a deep link for a route and open it on a device.
 *
 * @throws {CommandError} whatever {@link resolveRouteUrlAsync} throws, and whatever
 * {@link resolveDeviceAsync} throws when this machine has no device to open the link on.
 */
export async function openRouteAsync(
  projectRoot: string,
  options: OpenRouteOptions
): Promise<OpenRouteResult> {
  const { appId, platform } = options;
  const resolved = await resolveRouteUrlAsync(projectRoot, options);

  // The URL is known by now, so a machine with no device is told what to do with it rather than
  // only that it has none: an agent driving a cloud simulator has somewhere else to open it.
  const device = await resolveDeviceAsync(platform, {
    url: resolved.url,
    devServerRunning: resolved.devServerReachable,
  });
  const result = await openUrlOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    url: resolved.url,
    appId,
  });

  cliEvent('navigate', {
    route: resolved.route,
    url: resolved.url,
    devServerUrl: resolved.devServerUrl,
    devServerSource: resolved.devServerSource,
    platform: device.platform,
    deviceId: device.deviceId,
    exitCode: result.exitCode,
  });

  return {
    ...resolved,
    platform: device.platform,
    deviceId: device.deviceId,
    deviceName: device.name,
    appId: appId ?? null,
    command: result.command,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/** The reach of a dev server the caller named: their host, and nothing this project knows. */
async function namedDevServerReach(): Promise<DevServerReach> {
  return {
    advertised: null,
    tunnelFailure: null,
    running: false,
    reason: '--dev-server-url named the dev server, so its host is the one that was used',
  };
}

/** The failure for a `--dev-server-url` that named a dev server nothing answers on. */
function unreachableNamedDevServerError(
  devServerUrl: string,
  reason: string | undefined
): CommandError {
  const error = new CommandError(
    'DEEP_LINK_UNRESOLVED',
    [
      `No Expo dev server answered at ${devServerUrl}, which --dev-server-url named, so nothing was opened.`,
      `Why: the request for its debugger target list failed (${reason ?? 'no answer'}). Opening a route against a dev server that is not running loads the app onto the device with nothing to bundle for it, which looks like a crash rather than like a wrong URL.`,
      `How: start the dev server ("npx exagent dev --detach"), or drop --dev-server-url and let this command find the project's own — it asks the dev-server lock first, then the port the project last logged.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev:wait';
  return error;
}
