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
import {
  cloudNeedsTunnelError,
  cloudVerbFailedError,
  openUrlOnCloudSimulatorAsync,
} from '../device/cloudSimulator';
import { event as cliEvent } from '../events';
import { readProjectNativeDirsAsync } from '../project/nativeCode';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import { readProjectRoutesAsync } from '../project/routes';
import { readConfiguredAppId, resolveAppId } from '../runtime/appId';
import { stopAppOnDeviceAsync } from '../runtime/appProcess';
import {
  discoverDevServerAsync,
  probeDevServerAsync,
  type DevServerSource,
} from '../runtime/devServer';
import {
  buildDeviceNameIndexAsync,
  buildDeviceNameIndexIfNeededAsync,
  scopeTargets,
} from '../runtime/targetPlatform';
import { CommandError } from '../utils/errors';
import { reverseLoopbackPortAsync, type ReverseResult } from './adbReverse';
import { buildConnectUrls, type ConnectUrl } from './connectUrl';
import {
  isFullUrlRoute,
  openUrlOnDeviceAsync,
  readProjectSchemeConfig,
  resolveDeepLinkUrl,
  type ProjectSchemeConfig,
} from './deepLink';
import {
  resolveDeviceAsync,
  type CloudPreference,
  type DeviceBackend,
  type NavigateDevice,
  type NavigatePlatform,
} from './device';
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
  /**
   * Where {@link devServerUrl} came from: the **caller's own flag**, or a step of this same run.
   *
   * The two are not the same question, and treating them as one is F96. The reach lookup below is
   * suppressed for a `flag`, because the caller named the host they want reached — but `smoke`
   * discovers this project's dev server in its first phase and hands the URL down to its route
   * phase, and that URL is a *finding of this run*, not a caller's instruction. Passed as `flag`,
   * it silenced the manifest lookup and the gate built `exp://127.0.0.1:<port>` while `navigate`,
   * three minutes earlier and against the same dev server, built the tunnel host from the manifest
   * [observed — live cloud, 2026-08-27, artifacts 003 and 007].
   *
   * Defaults to `flag`, which is the safe reading of a URL whose origin a caller did not say.
   *
   * @see llp/0021-honest-reports.rfc.md §One URL source, two callers
   */
  devServerUrlSource?: 'flag' | 'discovered';
  /** Check the route against the project's routes first, cleared by `--no-route-check`. */
  routeCheck: boolean;
  /**
   * The command a route failure suggests re-running.
   *
   * The `Try:` line is what a driving agent runs next, so it has to be the command the caller was
   * running rather than always `navigate` (friction run 5).
   */
  command?: RouteCommand;
  /**
   * How long to wait for an app on this platform to register a debugger target, in milliseconds.
   *
   * Zero — the default — opens the link and reports what the device tool said, which is what a
   * caller with a connection phase of its own (`smoke`) wants. `navigate` passes a budget, because
   * `am start` exiting 0 says only that the *intent* was delivered: the Android run this exists for
   * landed on Expo Go's error screen and reported success [friction run 6, F50].
   */
  confirmAttachMs?: number;
  /**
   * Stop the app and open the link again when the first one did not attach.
   *
   * Only reached on Android, and only once. Expo Go's `ErrorActivity` does not retry the manifest
   * fetch, so a second intent into a stuck instance changes nothing — the process has to go first.
   */
  recoverStuckApp?: boolean;
  /**
   * Whether an EAS Simulator session is on this run's device ladder, and how.
   *
   * Defaults to `off`, so a caller that says nothing keeps the two local backends exactly.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §The cloud simulator backend
   */
  cloud?: CloudPreference;
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
   * never disagree — a report that says `tunnel` over a `127.0.0.1` link reads as "open this
   * anywhere" [observed — live, 2026-08-25]. Null for a development build's `<scheme>://<route>`,
   * which carries no host at all: it reaches whatever dev server the app was launched against.
   */
  hostType: DevServerHostType | null;
  /**
   * How to point an app at this dev server, one entry per application that could be meant.
   *
   * A *different* URL from {@link url}: that one navigates an app already loaded against a dev
   * server, and these get it loaded. `exp://<host>` is the Expo Go form and
   * `<scheme>://expo-development-client/?url=…` the development build's, and they are not
   * interchangeable — so two entries appear when nothing established which application is running,
   * and none when there is no dev server to point at.
   *
   * @see ./connectUrl.ts
   */
  connect: ConnectUrl[];
  /** Whether the route was checked against the project's routes, and what the check said. */
  routeCheck: RouteCheckJson;
}

/** Everything one open amounts to, with nothing printed. */
export interface OpenRouteResult extends ResolvedRoute {
  /**
   * Which device layer acted: `local-ios`, `local-android`, or `cloud`.
   *
   * Reported next to {@link platform} rather than folded into it, because `ios` no longer says
   * where the device is — a cloud session runs iOS too. It is the fact that decides whether the
   * command a reader can repeat by hand is `xcrun`, `adb`, or `eas simulator:exec`.
   */
  deviceBackend: DeviceBackend;
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
  /** The `adb` binary that was run, so a follow-up names a command this machine can run (F49). */
  adbPath: string | null;
  /**
   * What `adb reverse` did before the link, or null on a platform that needs none.
   *
   * @see ./adbReverse — why an Android link to a dev server on this machine cannot work without it.
   */
  reverse: ReverseResult | null;
  /** Whether an app of this platform was seen to attach afterwards. */
  attach: AttachCheck;
}

/** Whether the app was seen to connect to the dev server after the link was opened. */
export interface AttachCheck {
  /** Whether this run looked at all. False when the caller asked for no wait. */
  checked: boolean;
  /**
   * An app on this platform holds a debugger target on this dev server.
   *
   * Null exactly when {@link checked} is false. **Never assumed**: a link that was delivered and an
   * app that is running are different facts, and reporting the first as the second is F50.
   */
  confirmed: boolean | null;
  /** How long the wait took, in milliseconds. */
  waitedMs: number;
  /** How many debugger targets this platform had when the wait ended. */
  targets: number;
  /** Whether the app was stopped and the link opened a second time. */
  recovered: boolean;
  /** Why it is not confirmed, or null when it is. */
  reason: string | null;
}

/**
 * Resolve a deep link for a route and open it on a device.
 *
 * @throws {CommandError} `ROUTE_NOT_FOUND` for a route the project has not got, checked before
 * anything is opened; `DEEP_LINK_UNRESOLVED` for a named dev server that does not answer or a
 * project with no resolvable scheme; and whatever {@link resolveDeviceAsync} throws when there is
 * no device.
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
    // Not asked when `--dev-server-url` **named** one: the caller named the host they want reached,
    // and substituting this project's tunnel host for it would quietly answer a different question —
    // the flag may well name a dev server that is not this project's at all. A URL a *step of this
    // run* found is not that (F96, `devServerUrlSource`), so it is asked for.
    isCallerNamedDevServer(options) ? namedDevServerReach() : resolveDevServerReachAsync(projectRoot),
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
  // failure was not acted on. Attributed to the *caller* rather than to discovery's own label: a
  // URL a phase of this run found reaches discovery as `flag` too, and blaming a flag nobody passed
  // sends a reader to check an argument they never wrote (F96).
  if (devServer.source === 'flag' && isCallerNamedDevServer(options) && !devServer.reachable) {
    throw unreachableNamedDevServerError(devServerUrl, devServer.reason);
  }

  const usesDevClient = await isInstalledDependencyAsync(
    projectRoot,
    listDependencyNames(packageJson),
    'expo-dev-client'
  );

  // Scoped to the platform that was named, for the reason every other reading command is (F51):
  // a dev server with an iOS simulator already attached would otherwise decide an `--android` run's
  // target app from the simulator's registration. Nothing on the named platform leaves the decision
  // to the project's own shape, which is the honest fallback. The index costs no subprocess unless
  // a target cannot be placed by its app id, which Expo Go always can.
  const decisionTargets = platform
    ? scopeTargets(
        devServer.targets,
        platform,
        await buildDeviceNameIndexIfNeededAsync(devServer.targets)
      ).matched
    : devServer.targets;

  const target = decideExpoGoTarget({
    appIdOverride: appId,
    targetAppIds: decisionTargets.map((item) => item.appId).filter(Boolean),
    hasNativeDirs: nativeDirs.ios || nativeDirs.android,
    usesDevClient,
  });
  debugEvent('target_decided', target);

  // Only a tunnel that is *current* changes the URL: a host read out of a log whose dev server has
  // since stopped is worse than the LAN address, because it looks like it should work.
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
    // Built from the host a *device* uses — the tunnel's when there is one — rather than from the
    // route URL, because a development build's route URL carries no host at all.
    connect: buildConnectUrls({
      host: devServer.reachable ? (tunnelHost ?? hostnameWithPort(devServerUrl)) : null,
      hostType: tunnelHost ? 'tunnel' : hostTypeOfDevServer(devServerUrl),
      scheme: devBuildScheme(scheme, config),
      isExpoGo: target.isExpoGo,
      certain: target.certain,
    }),
    routeCheck,
  };
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
  const { platform, appId } = options;
  const resolved = await resolveRouteUrlAsync(projectRoot, options);
  const devServerUrl = resolved.devServerUrl;

  // The URL is known by now, so a machine with no device is told what to do with it rather than
  // only that it has none: an agent driving a cloud simulator has somewhere else to open it.
  const device = await resolveDeviceAsync(platform, {
    url: resolved.url,
    devServerRunning: resolved.devServerReachable,
    cloud: options.cloud,
    projectRoot,
  });

  // @ref src/device/cloudSimulator.ts §cloudNeedsTunnelError — refused before anything is opened.
  // A cloud simulator is on EAS's network, so a `127.0.0.1` or LAN host in the link resolves to
  // something that is not this machine, exactly as it does on an Android emulator (F50) — and
  // unlike the emulator there is no `adb reverse` to fix it. Checked here rather than inside the
  // URL resolver, because it is a fact about the *device*, and the same URL is perfectly good for
  // the simulator on this desk.
  if (
    device.backend === 'cloud' &&
    (resolved.hostType === 'localhost' || resolved.hostType === 'lan')
  ) {
    throw cloudNeedsTunnelError(resolved.url, resolved.hostType);
  }

  // @ref ./adbReverse — before the link, never after. `exp://127.0.0.1:<port>` means the *device's*
  // loopback, so an emulator resolves it to a port nothing listens on and Expo Go lands on its
  // error screen with `am start` having exited 0 (F50).
  const reverse =
    device.platform === 'android' && device.adb != null
      ? await reverseLoopbackPortAsync({
          adb: device.adb,
          deviceId: device.deviceId,
          url: resolved.url,
        })
      : null;
  if (reverse?.ok === false) {
    debugEvent('adb_reverse_failed', { reason: reverse.reason ?? '' });
  }

  const result = await openUrlOnBackendAsync(device, {
    projectRoot,
    url: resolved.url,
    appId,
  });

  const attach = await confirmAttachAsync({
    projectRoot,
    options,
    device,
    devServerUrl,
    url: resolved.url,
    openedOk: result.exitCode === 0,
  });

  cliEvent('navigate', {
    route: resolved.route,
    url: resolved.url,
    devServerUrl,
    devServerSource: resolved.devServerSource,
    deviceBackend: device.backend,
    platform: device.platform,
    deviceId: device.deviceId,
    exitCode: result.exitCode,
    reversedPort: reverse?.port ?? null,
    attached: attach.confirmed,
  });

  return {
    ...resolved,
    reverse,
    attach,
    adbPath: device.adb?.bin ?? null,
    deviceBackend: device.backend,
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

/**
 * Open the URL on whichever backend resolved, and report it the same way for all three.
 *
 * The two local backends and the cloud one differ in what a non-zero exit *means*, which is why
 * they are not simply two commands behind one call. `xcrun simctl openurl` exiting non-zero is the
 * device refusing the link — a fact about the app on it, which `navigate` reports and exits `1`
 * for. `eas simulator:exec` exiting non-zero is any of: a session that ended mid-run, a signed-out
 * account, a controller flag this CLI got wrong, or a binary that was never the EAS CLI. None of
 * those is "the device refused", and reporting them as that would send a reader to reinstall Expo
 * Go. So the cloud path raises the tool failure instead, with what the tool printed and — for a
 * signed-out account — the needs-human handoff that makes it exit `7` (llp/0010).
 */
async function openUrlOnBackendAsync(
  device: NavigateDevice,
  { projectRoot, url, appId }: { projectRoot: string; url: string; appId?: string }
): Promise<{ command: string; stdout: string; stderr: string; exitCode: number | null }> {
  if (device.backend !== 'cloud') {
    return await openUrlOnDeviceAsync({
      platform: device.platform,
      deviceId: device.deviceId,
      url,
      appId,
      adb: device.adb,
    });
  }

  const result = await openUrlOnCloudSimulatorAsync({
    projectRoot,
    url,
    platform: device.platform,
  });
  if (result.spawnError || result.exitCode !== 0) {
    throw cloudVerbFailedError(result, {
      what: `${url} was not opened on the cloud simulator.`,
      how: `Check the session is still running with "npx eas simulator:list --status in-progress" — a session can end between the moment it was listed and the moment a verb reaches it. Start a new one if it has.`,
    });
  }
  return {
    command: result.command,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

/**
 * Whether the dev server URL in these options is the **caller's** rather than this run's finding.
 *
 * Pure and exported for the table, because it is the whole of F96 in one expression: a URL and its
 * provenance are two facts, and a run that keeps only the first cannot tell "the caller pinned this
 * host" from "an earlier phase of mine found this host".
 */
export function isCallerNamedDevServer(options: {
  devServerUrl: string | null;
  devServerUrlSource?: 'flag' | 'discovered';
}): boolean {
  return options.devServerUrl != null && options.devServerUrlSource !== 'discovered';
}

/** The reach of a dev server the caller named: their host, and nothing this project knows. */
async function namedDevServerReach(): Promise<DevServerReach> {
  return {
    advertised: null,
    running: false,
    reason: '--dev-server-url named the dev server, so its host is the one that was used',
  };
}

/**
 * The scheme a development build of this project registers.
 *
 * The same precedence the deep link itself uses: `--scheme` wins, then the `scheme` field of the
 * app config, then the `exp+<slug>` default a managed development build registers. Null when the
 * project declares none of them, and then no development-build URL is offered rather than one with
 * a hole in it.
 */
function devBuildScheme(
  schemeOverride: string | undefined,
  config: ProjectSchemeConfig
): string | null {
  const override = schemeOverride?.trim();
  if (override) {
    return override.replace(/:\/*$/, '');
  }
  if (config.scheme) {
    return config.scheme;
  }
  return config.slug ? `exp+${config.slug}` : null;
}

/** `host[:port]` of a dev server origin, or null when it cannot be parsed. */
function hostnameWithPort(devServerUrl: string): string | null {
  try {
    return new URL(devServerUrl).host || null;
  } catch {
    return null;
  }
}

/** How a device off this machine reaches a dev server origin. */
function hostTypeOfDevServer(devServerUrl: string): DevServerHostType | null {
  try {
    return classifyDevServerHost(new URL(devServerUrl).hostname);
  } catch {
    return null;
  }
}

/** The name part of a `host[:port]`, which is what a host classification is about. */
function hostnameOf(host: string): string {
  const lastColon = host.lastIndexOf(':');
  // An IPv6 literal is bracketed, so its colons are inside the brackets and never the port's.
  return lastColon > 0 && !host.includes(']') ? host.slice(0, lastColon) : host;
}

/** How often the debugger target list is re-read while the attach wait runs. */
const ATTACH_POLL_MS = 500;

/**
 * Wait for an app on this platform to hold a debugger target, and recover a stuck one once.
 *
 * "The device took the intent" and "the app is running this project" are different facts, and the
 * whole of F50 is the first having been reported as the second. What proves the second is a
 * debugger target **on this platform** — scoped, because a dev server with an iOS simulator already
 * attached would otherwise confirm an Android link from the simulator's target
 * (`src/runtime/targetPlatform.ts`).
 *
 * The recovery is one force-stop and one fresh link, and only on Android: Expo Go's error screen
 * keeps the process alive and does not retry the manifest fetch, so a second intent into it changes
 * nothing. Automatic rather than suggested, because the state it clears is one this command caused.
 */
async function confirmAttachAsync({
  projectRoot,
  options,
  device,
  devServerUrl,
  url,
  openedOk,
}: {
  projectRoot: string;
  options: OpenRouteOptions;
  device: NavigateDevice;
  devServerUrl: string;
  url: string;
  openedOk: boolean;
}): Promise<AttachCheck> {
  const budgetMs = options.confirmAttachMs ?? 0;
  if (budgetMs <= 0) {
    return {
      checked: false,
      confirmed: null,
      waitedMs: 0,
      targets: 0,
      recovered: false,
      reason: 'this run did not wait for the app to attach',
    };
  }
  if (!openedOk) {
    return {
      checked: false,
      confirmed: null,
      waitedMs: 0,
      targets: 0,
      recovered: false,
      reason: 'the device refused the deep link, so nothing was opened to wait for',
    };
  }

  const startedAt = Date.now();
  const index = await buildDeviceNameIndexAsync();
  const countAsync = async (): Promise<number> => {
    const probe = await probeDevServerAsync(devServerUrl);
    return probe.reachable ? scopeTargets(probe.targets, device.platform, index).matched.length : 0;
  };
  const waitAsync = async (deadline: number): Promise<number> => {
    for (;;) {
      const count = await countAsync();
      if (count > 0 || Date.now() >= deadline) {
        return count;
      }
      await new Promise((resolve) => setTimeout(resolve, ATTACH_POLL_MS));
    }
  };

  let targets = await waitAsync(startedAt + budgetMs);
  let recovered = false;

  // The gate is the **platform**, not the machine. It used to be `local-android`, because the
  // recovery is a force-stop and the first cut of the cloud backend believed the controller had no
  // verb for one. `agent-device close <app-id>` is that verb, so an Android session recovers
  // exactly as an Android emulator does (llp/0005 §What the cloud backend can and cannot do). It
  // stays Android-only: this is the Android-specific stuck-app shape of llp/0005 §Android, and
  // running it on iOS would restart an app that is merely slow.
  const canRecover = device.platform === 'android' && device.backend !== 'local-ios';
  if (targets === 0 && canRecover && options.recoverStuckApp !== false) {
    const appId = await resolveStuckAppIdAsync(projectRoot, devServerUrl, device, options.appId);
    const stopped = await stopAppOnDeviceAsync({
      platform: device.platform,
      deviceId: device.deviceId,
      appId,
      adb: device.adb,
      backend: device.backend,
      projectRoot,
    });
    debugEvent('attach_recovery', { appId, stopped: stopped.ok });
    if (stopped.ok) {
      recovered = true;
      const again = await openUrlOnDeviceAsync({
        platform: device.platform,
        deviceId: device.deviceId,
        url,
        appId: options.appId,
        adb: device.adb,
        backend: device.backend,
        projectRoot,
      });
      if (again.exitCode === 0) {
        targets = await waitAsync(Date.now() + budgetMs);
      }
    }
  }

  const waitedMs = Date.now() - startedAt;
  return {
    checked: true,
    confirmed: targets > 0,
    waitedMs,
    targets,
    recovered,
    reason:
      targets > 0
        ? null
        : `no ${device.platform} app registered a debugger target on ${devServerUrl} within ${waitedMs}ms${
            recovered ? ', including after the app was stopped and the link opened again' : ''
          }`,
  };
}

/** The application id to force-stop, resolved the way `runtime:stop` resolves it. */
async function resolveStuckAppIdAsync(
  projectRoot: string,
  devServerUrl: string,
  device: NavigateDevice,
  appIdOverride?: string
): Promise<string> {
  const probe = await probeDevServerAsync(devServerUrl);
  return resolveAppId({
    platform: device.platform,
    appIdOverride,
    targetAppIds: probe.targets.map((target) => target.appId).filter(Boolean),
    configured: readConfiguredAppId(projectRoot, device.platform),
  }).appId;
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
  error.suggestedCommand = 'npx exagent dev --detach --wait-ready';
  return error;
}
